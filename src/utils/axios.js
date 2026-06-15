import axios from "axios";
import useBmrStore from "../store/bmr_store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] || "") : null;
};

api.interceptors.request.use((config) => {
  const token = useBmrStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const csrfToken = getCookieValue("csrfToken");
  if (csrfToken) config.headers["x-csrf-token"] = csrfToken;
  return config;
});

let isRefreshing = false;
let queue = [];
let isSessionExpiredHandling = false;

const alertAndLogout = async () => {
  if (isSessionExpiredHandling) return;
  isSessionExpiredHandling = true;

  isRefreshing = false;
  queue = [];

  try {
    if (typeof window !== "undefined") {
      window.alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
  } catch (err) {
    console.warn("Session expiration alert failed", err);
  }

  await useBmrStore.getState().logout();
  isSessionExpiredHandling = false;
};

const isRefreshEndpoint = (config) => {
  const url = config?.url || "";
  return url.includes("/refresh-token");
};

api.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success === true && res.data.data !== undefined) {
      const originalData = res.data;
      res.data = originalData.data;
      res.meta = originalData.meta;
      res.message = originalData.message;
      res.success = true;
      res.ok = true; 
      return res;
    }
    return res;
  },
  async (error) => {
    const original = error.config;
    const data = error?.response?.data;
    
    if (data) {
      let extractedMessage = null;

      if (typeof data === 'object') {
        extractedMessage = data.message || data.msg || data.error || (data.error?.message);
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          extractedMessage = parsed.message || parsed.msg || parsed.error;
        } catch {
          // Not a JSON string
        }
      }

      if (extractedMessage) {
        if (typeof extractedMessage === 'string' && extractedMessage.trim().startsWith('{')) {
          try {
            const innerParsed = JSON.parse(extractedMessage);
            extractedMessage = innerParsed.message || innerParsed.msg || extractedMessage;
          } catch {
            // Keep the original extracted message.
          }
        }
        error.message = extractedMessage;
        error.userMessage = extractedMessage;
      }
    }

    if (!error.message) {
      error.message = error.response?.status ? "เกิดข้อผิดพลาด" : "เชื่อมต่อไม่ได้";
    }

    if (!original || isRefreshEndpoint(original)) {
      await alertAndLogout();
      return Promise.reject(error);
    }
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((newToken) => {
            if (!newToken) return reject(error);
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          (import.meta.env.VITE_API_URL || "") + "/api/refresh-token",
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        useBmrStore.getState().setAccessToken(newToken);

        queue.forEach((cb) => cb(newToken));
        queue = [];

        isRefreshing = false;

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        isRefreshing = false;
        queue = [];
        await alertAndLogout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

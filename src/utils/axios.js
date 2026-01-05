import axios from "axios";
import useBmrStore from "../store/bmr_store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true, // ✅ ให้ส่ง cookie refresh token ไปด้วย
});

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] || "") : null;
};

// ======================
//  REQUEST INTERCEPTOR
// ======================
api.interceptors.request.use((config) => {
  const token = useBmrStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const csrfToken = getCookieValue("csrfToken");
  if (csrfToken) config.headers["x-csrf-token"] = csrfToken;
  return config;
});

// ======================
//   RESPONSE INTERCEPTOR
// ======================
let isRefreshing = false;
let queue = [];
let isSessionExpiredHandling = false;

const alertAndLogout = async () => {
  if (isSessionExpiredHandling) return;
  isSessionExpiredHandling = true;

  // เคลียร์คิวที่ค้าง
  isRefreshing = false;
  queue = [];

  try {
    if (typeof window !== "undefined") {
      window.alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
  } catch {}

  await useBmrStore.getState().logout();
  isSessionExpiredHandling = false;
};

// กันชน refresh loop
const isRefreshEndpoint = (config) => {
  const url = config?.url || "";
  return url.includes("/refresh-token");
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // ถ้าไม่มี config หรือเป็น refresh เองแล้วพัง -> logout
    if (!original || isRefreshEndpoint(original)) {
      await alertAndLogout();
      return Promise.reject(error);
    }

    // เงื่อนไข refresh: 401 และยังไม่ retry
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;

      // ถ้ามีการ refresh อยู่แล้ว -> เข้าคิวรอ token ใหม่
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
        // ใช้ axios ตรง ๆ เพื่อไม่ให้ชน interceptor ของ api
        const res = await axios.post(
          (import.meta.env.VITE_API_URL || "") + "/api/refresh-token",
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        // เซ็ต token ใน store (memory)
        useBmrStore.getState().setAccessToken(newToken);

        // ปล่อยคิว
        queue.forEach((cb) => cb(newToken));
        queue = [];

        isRefreshing = false;

        // retry original
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

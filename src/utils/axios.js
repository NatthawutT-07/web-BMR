import axios from "axios";
import useBmrStore from "../store/bmr_store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// ======================
//  REQUEST INTERCEPTOR
// ======================
api.interceptors.request.use((config) => {
  const token = useBmrStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ======================
//   RESPONSE INTERCEPTOR
// ======================
let isRefreshing = false;
let queue = [];

// ✅ กัน alert/redirect ซ้ำ
let isSessionExpiredHandling = false;

const isAccessTokenExpired = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code || error?.response?.data?.error;
  const msg =
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.message;

  return (
    status === 401 &&
    (code === "ACCESS_TOKEN_EXPIRE" ||
      String(msg || "").includes("ACCESS_TOKEN_EXPIRE") ||
      String(msg || "").toLowerCase().includes("jwt expired"))
  );
};

const alertAndLogout = async () => {
  if (isSessionExpiredHandling) return;
  isSessionExpiredHandling = true;

  // เคลียร์คิว refresh ที่ค้างอยู่
  isRefreshing = false;
  queue = [];

  try {
    if (typeof window !== "undefined") {
      window.alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
  } catch {}

  // logout ของคุณมี window.location.replace("/") อยู่แล้ว
  await useBmrStore.getState().logout();
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // ✅ ถ้าเป็น ACCESS_TOKEN_EXPIRE → แจ้งเตือน + logout ทันที (ไม่ refresh)
    if (isAccessTokenExpired(error)) {
      await alertAndLogout();
      return Promise.reject(error);
    }

    // 401 อื่น ๆ → ยังใช้ระบบ refresh ได้
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // ใช้ axios ตรง ๆ เพื่อไม่ชน interceptor ของ api
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

          // refresh fail → แจ้งเตือน + logout
          await alertAndLogout();
          return Promise.reject(err);
        }
      }

      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;

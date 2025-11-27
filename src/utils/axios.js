import axios from "axios";
import useBmrStore from "../store/bmr_store";

// =======================
// Axios Instance
// =======================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true, // ต้องมี เพื่อส่ง cookie refresh token
});

// =======================
// Request Interceptor
// =======================
api.interceptors.request.use(
  (config) => {
    const store = useBmrStore.getState();

    // รองรับ token แบบเก่า
    const legacyToken = store.token;

    // รองรับ accessToken แบบใหม่
    const newToken = store.accessToken;

    // token ที่จะใช้จริง
    const finalToken = newToken || legacyToken;

    if (finalToken) {
      config.headers.Authorization = `Bearer ${finalToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =======================
// Response Interceptor (Auto Refresh Token)
// =======================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const store = useBmrStore.getState();

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        // sync ให้ token แบบเก่าใช้ค่าใหม่ด้วย (สำคัญมาก!)
        store.setAccessToken(newToken);
        store.setLegacyToken?.(newToken);

        processQueue(null, newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = "Bearer " + newToken;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        store.logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

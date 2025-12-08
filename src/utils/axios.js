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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // 401 = access token หมดอายุ
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const res = await axios.post(
            "/api/refresh-token",
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

          // refresh fail → logout ทุกหน้า
          useBmrStore.getState().logout();
          window.location.href = "/";
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

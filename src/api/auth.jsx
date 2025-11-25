import axios from "axios";
import useBmrStore from "../store/bmr_store"; // path ของ zustand store

// สร้าง axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// request interceptor ใส่ token อัตโนมัติ
axiosInstance.interceptors.request.use((config) => {
  const token = useBmrStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor ตรวจสอบ token หมดอายุ
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) { // token หมดอายุหรือไม่ถูกต้อง
      const { logout } = useBmrStore.getState();
      logout(); // clear store + localStorage + indexedDB
      window.location.href = "/"; // redirect ไปหน้า login
    }
    return Promise.reject(error);
  }
);

// ฟังก์ชันเรียก API
export const currentUser = async () => {
  return await axiosInstance.post("/api/current-user", {});
};

export const currentAdmin = async () => {
  return await axiosInstance.post("/api/current-admin", {});
};

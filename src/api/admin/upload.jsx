import api from "../../utils/axios";   // axios instance พร้อม interceptors
import axios from "axios";

const uploadApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_SERVICE + "/api",
  withCredentials: true,
});

// ฟังก์ชันอัปโหลดกลาง (ใช้ instance ที่ส่งเข้ามา)
const uploadXLSX = async (apiInstance, file, path, onProgress, jobId) => {
  const formData = new FormData();
  formData.append("file", file);

  return await apiInstance.post(path, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(jobId ? { "x-upload-job-id": jobId } : {}),
    },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total || 0;
      if (!total) return;
      const percent = Math.round((event.loaded / total) * 100);
      onProgress(percent);
    },
  });
};

// Withdraw 
export const uploadWithdrawXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-withdraw", onProgress, jobId);

// Stock (ใช้ uploadApi)
export const uploadStockXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-stock", onProgress, jobId);

// Template Shelf XLSX
export const uploadTemplateXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-template", onProgress, jobId);

// SKU XLSX
export const uploadItemSKUXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-sku", onProgress, jobId);

// ItemMinMax XLSX
export const uploadItemMinMaxXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-minmax", onProgress, jobId);

// Master Item
export const uploadMasterItemXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-masterItem", onProgress, jobId);

// Bill
export const uploadBillXLSX = (file, onProgress, jobId) =>
  uploadXLSX(api, file, "/upload-bill", onProgress, jobId);

export const getUploadStatus = (jobId) =>
  api.get("/upload-status", { params: { jobId } });

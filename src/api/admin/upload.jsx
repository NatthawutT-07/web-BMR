import api from "../../utils/axios";   // axios instance พร้อม interceptors

// ฟังก์ชันอัปโหลดกลาง
const uploadXLSX = async (file, path, onProgress, jobId) => {
  const formData = new FormData();
  formData.append("file", file);

  return await api.post(path, formData, {
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

// Sales XLSX
export const uploadSalesDayXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-sales", onProgress, jobId);

// Withdraw
export const uploadWithdrawXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-withdraw", onProgress, jobId);

// Stock
export const uploadStockXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-stock", onProgress, jobId);

// Template Shelf XLSX
export const uploadTemplateXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-template", onProgress, jobId);

// SKU XLSX
export const uploadItemSKUXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-sku", onProgress, jobId);

// Store / Station
export const uploadStationXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-station", onProgress, jobId);

// ItemMinMax XLSX
export const uploadItemMinMaxXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-minmax", onProgress, jobId);

// Master Item
export const uploadMasterItemXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-masterItem", onProgress, jobId);

// Bill
export const uploadBillXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-bill", onProgress, jobId);

export const uploadGourmetXLSX = (file, onProgress, jobId) =>
  uploadXLSX(file, "/upload-gourmets", onProgress, jobId);

export const getUploadStatus = (jobId) =>
  api.get("/upload-status", { params: { jobId } });

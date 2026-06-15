import api from "../../utils/axios";   // axios instance พร้อม interceptors
// ฟังก์ชันอัปโหลดกลาง (ใช้ instance ที่ส่งเข้ามา)
const uploadXLSX = async (apiInstance, file, path, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return await apiInstance.post(path, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
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
export const uploadWithdrawXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-withdraw", onProgress);

// Stock (ใช้ uploadApi)
export const uploadStockXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-stock", onProgress);

// ShelfTemplate Shelf XLSX
export const uploadTemplateXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-template", onProgress);

// SKU XLSX
export const uploadItemSKUXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-sku", onProgress);

// MinMaxAutoPO XLSX
export const uploadItemMinMaxXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-minmax", onProgress);

// Master Item
export const uploadMasterItemXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-masterItem", onProgress);

// BillHeader
export const uploadBillXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-bill", onProgress);

// Gourmet
export const uploadGourmetXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-gourmets", onProgress);

// Clear Stock
export const clearStock = async () => {
  const res = await api.delete("/clear-stock");
  return res.data;
};

// Clear SKU
export const clearSku = async () => {
  const res = await api.delete("/clear-sku");
  return res.data;
};

// Clear ShelfTemplate (Shelf)
export const clearTemplate = async () => {
  const res = await api.delete("/clear-template");
  return res.data;
};

// Clear MinMaxAutoPO
export const clearMinMax = async () => {
  const res = await api.delete("/clear-minmax");
  return res.data;
};

export const getSyncDates = async () => {
  const res = await api.get("/sync-dates");
  return res.data;
};

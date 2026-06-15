import api from "../../utils/axios"; 
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

export const uploadWithdrawXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-withdraw", onProgress);

export const uploadStockXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-stock", onProgress);

export const uploadTemplateXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/uploads/shelf-templates", onProgress);

export const uploadItemSKUXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/uploads/sku-positions", onProgress);

export const uploadItemMinMaxXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-minmax", onProgress);

export const uploadMasterItemXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/upload-masterItem", onProgress);

export const uploadBillXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/uploads/bills", onProgress);

export const uploadGourmetXLSX = (file, onProgress) =>
  uploadXLSX(api, file, "/uploads/gourmets", onProgress);

export const clearStock = async () => {
  const res = await api.delete("/system/clear/stock");
  return res.data;
};

export const clearSku = async () => {
  const res = await api.delete("/system/clear/sku-positions");
  return res.data;
};

export const clearTemplate = async () => {
  const res = await api.delete("/system/clear/shelf-templates");
  return res.data;
};

export const clearMinMax = async () => {
  const res = await api.delete("/system/clear/minmax");
  return res.data;
};

export const getSyncDates = async () => {
  const res = await api.get("/sync-dates");
  return res.data;
};

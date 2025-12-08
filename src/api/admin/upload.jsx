import api from "../../utils/axios";   // axios instance พร้อม interceptors

// ฟังก์ชันอัปโหลดกลาง
const uploadXLSX = async (file, path) => {
  const formData = new FormData();
  formData.append("file", file);

  return await api.post(path, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Sales XLSX
export const uploadSalesDayXLSX = (file) =>
  uploadXLSX(file, "/upload-sales");

// Withdraw
export const uploadWithdrawXLSX = (file) =>
  uploadXLSX(file, "/upload-withdraw");

// Stock
export const uploadStockXLSX = (file) =>
  uploadXLSX(file, "/upload-stock");

// Template Shelf XLSX
export const uploadTemplateXLSX = (file) =>
  uploadXLSX(file, "/upload-template");

// SKU XLSX
export const uploadItemSKUXLSX = (file) =>
  uploadXLSX(file, "/upload-sku");

// Store / Station
export const uploadStationXLSX = (file) =>
  uploadXLSX(file, "/upload-station");

// ItemMinMax XLSX
export const uploadItemMinMaxXLSX = (file) =>
  uploadXLSX(file, "/upload-minmax");

// Master Item
export const uploadMasterItemXLSX = (file) =>
  uploadXLSX(file, "/upload-masterItem");

// Bill
export const uploadBillXLSX = (file) =>
  uploadXLSX(file, "/upload-bill");

export const uploadGourmetXLSX = (file) =>
  uploadXLSX(file, "upload-gourmets");

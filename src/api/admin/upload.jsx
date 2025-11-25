import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// 🔧 อัปโหลดแบบมาตรฐานทุกไฟล์
const uploadXLSX = async (file, token, path) => {
  const formData = new FormData();
  formData.append("file", file); // สำคัญ! ต้องเป็น "file"

  return await axios.post(
    `${API_URL}${path}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Sales XLSX
export const uploadSalesDayXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-sales");

// Withdraw
export const uploadWithdrawXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-withdraw");

// Stock
export const uploadStockXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-stock");

// Template Shelf XLSX
export const uploadTemplateXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-template");

// SKU XLSX
export const uploadItemSKUXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-sku");

// Store / Station
export const uploadStationXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-station");

// ItemMinMax XLSX
export const uploadItemMinMaxXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-minmax");

// Master Item
export const uploadMasterItemXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-masterItem");

// Bill
export const uploadBillXLSX = (file, token) =>
  uploadXLSX(file, token, "/api/upload-bill");

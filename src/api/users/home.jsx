// src/api/users/home.jsx
import api from "../../utils/axios";

/**
 * ✅ NEW backend:
 * POST -> { branchCode }
 * return -> { branchCode, branchName, items: [...] }
 */
export const getTemplateAndProduct = async (branchCode) => {
  try {
    const res = await api.post("/template-item", { branchCode });
    return res.data; // { branchCode, branchName, items }
  } catch (error) {
    console.error("getTemplateAndProduct error:", error);
    throw error;
  }
};

/**
 * ✅ NEW backend:
 * GET -> return { updatedAt, rowCount }
 * updatedAt เป็น ISO ที่มี +07:00 แล้ว
 */
export const getStockLastUpdate = async () => {
  try {
    const res = await api.get("/stock-last-update");
    return res.data; // { updatedAt, rowCount }
  } catch (error) {
    console.error("getStockLastUpdate error:", error);
    throw error;
  }
};

// src/api/users/home.jsx
import api from "../../utils/axios";

/**
 * NEW backend:
 * POST -> { branch_code }
 * return -> { branch_code, branchName, items: [...] }
 */
export const getTemplateAndProduct = async (branch_code) => {
  try {
    const res = await api.post("/shelf-templates/items", { branch_code });
    return res.data; // { branch_code, branchName, items }
  } catch (error) {
    console.error("getTemplateAndProduct error:", error);
    throw error;
  }
};

/**
 * NEW backend:
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

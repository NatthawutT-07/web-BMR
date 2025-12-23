import api from "../../utils/axios";

export const getTemplateAndProduct = async (branchCode) => {
  const res = await api.post("/template-item", { branchCode });
  return res.data;
};

// ✅ NEW: สำหรับ MainNav โชว์เวลา stock ล่าสุด
export const getStockLastUpdate = async () => {
  const res = await api.get("/stock-last-update");
  return res.data; // { updatedAt, rowCount }
};

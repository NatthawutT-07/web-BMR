import api from "../../utils/axios";

export const getTemplateAndProduct = async (branch_code) => {
  try {
    const res = await api.post("/shelf-templates/items", { branch_code });
    return res.data;
  } catch (error) {
    console.error("getTemplateAndProduct error:", error);
    throw error;
  }
};

export const getStockLastUpdate = async () => {
  try {
    const res = await api.get("/stock-last-update");
    return res.data; 
  } catch (error) {
    console.error("getStockLastUpdate error:", error);
    throw error;
  }
};

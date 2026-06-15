import api from "../../utils/axios";

export const downloadTemplate = async (params) => {
  try {
    const res = await api.get("/downloads/shelf-templates", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching shelfTemplate:", error);
    throw error;
  }
};

export const downloadSKU = async (params) => {
  try {
    const res = await api.get("/downloads/sku-positions", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching SKU:", error);
    throw error;
  }
};

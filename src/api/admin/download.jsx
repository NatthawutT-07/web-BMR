import api from "../../utils/axios";

export const downloadTemplate = async (params) => {
  try {
    const res = await api.get("/download-template", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
};

export const downloadSKU = async (params) => {
  try {
    const res = await api.get("/download-sku", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching SKU:", error);
    throw error;
  }
};

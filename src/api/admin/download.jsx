import api from "../../utils/axios";   // axios instance พร้อม token + refresh-auto

export const downloadTemplate = async () => {
  try {
    const res = await api.get("/download-template");
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching template:", error);
    throw error;
  }
};

export const downloadSKU = async () => {
  try {
    const res = await api.get("/download-sku");
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching SKU:", error);
    throw error;
  }
};

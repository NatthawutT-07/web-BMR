import axios from "axios";

export const downloadTemplate = async (token) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/download-template`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching template:", error);
    throw error;
  }
};

export const downloadSKU = async (token) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/download-sku`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching template:", error);
    throw error;
  }
};

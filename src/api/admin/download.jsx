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

/**
 * ดึงข้อมูล stock รวม (ทุนคงเหลือ)
 * GET /api/stock-data
 * - ถ้าไม่ส่ง branchCode → ทุกสาขา
 * - ถ้าส่ง branchCode → เฉพาะสาขานั้น
 */
export const getStockData = async (branchCode) => {
  try {
    const response = await api.get("/stock-data", {
      params: branchCode ? { branchCode } : {},
    });
    return response.data; // array ของ { branchCode, codeProduct, quantity, nameProduct, nameBrand, purchasePriceExcVAT, salesPriceIncVAT }
  } catch (error) {
    console.error("Stock Data API Error:", error);
    throw error;
  }
};
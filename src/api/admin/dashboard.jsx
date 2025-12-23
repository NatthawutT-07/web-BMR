// src/api/admin/dashboard.jsx
import api from "../../utils/axios";

// ✅ normalize date ให้เหลือ YYYY-MM-DD เสมอ (กัน timezone -1 วัน)
const onlyISODate = (v) => {
  if (!v) return "";
  // ถ้าเป็น Date object
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // ถ้าเป็น string (YYYY-MM-DD หรือ ISO)
  return String(v).slice(0, 10);
};

// ดึง overview ยอดขายหลัก (ใช้สำหรับกราฟ + KPI)
export const getDashboard = async (start, end) => {
  try {
    const response = await api.get("/dashboard-data", {
      params: {
        start: onlyISODate(start),
        end: onlyISODate(end),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Dashboard API Error:", error);
    throw error;
  }
};

// ดึงรายการสินค้ารวมทั้งหมด (ใช้สำหรับ Dashboard สินค้า)
export const getDashboardProductList = async (start, end) => {
  try {
    const response = await api.get("/dashboard-product-list", {
      params: {
        start: onlyISODate(start),
        end: onlyISODate(end),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Dashboard Product List API Error:", error);
    throw error;
  }
};

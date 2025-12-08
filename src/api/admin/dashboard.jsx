// src/api/admin/dashboard.jsx
import api from "../../utils/axios";

// ดึง overview ยอดขายหลัก (ใช้สำหรับกราฟ + KPI)
export const getDashboard = async (start, end) => {
    try {
        const response = await api.get("/dashboard-data", {
            params: { start, end },
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
            params: { start, end },
        });
        return response.data;
    } catch (error) {
        console.error("Dashboard Product List API Error:", error);
        throw error;
    }
};

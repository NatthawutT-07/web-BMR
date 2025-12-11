import { create } from "zustand";

const getYesterdayISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // วันนี้ - 1 วัน
    return d.toISOString().split("T")[0];
};

const useDashboardSalesStore = create((set) => ({
    // filter UI ปัจจุบัน
    start: "2024-01-01",
    end: getYesterdayISO(), // ✅ ใช้เมื่อวานเป็นค่าเริ่มต้นเสมอ

    // data ปัจจุบันที่ใช้แสดงหน้า (หลังจาก filter แล้ว)
    data: null,

    // data ฐาน (โหลดจาก API ครั้งเดียว ช่วงวันที่ใหญ่สุด เช่น 1/1/2024 - เมื่อวาน)
    baseData: null,

    loading: false,
    buttonDisabled: false,
    dailyAvgSales: 0,

    // setters
    setStart: (val) => set({ start: val }),
    setEnd: (val) => set({ end: val }),
    setData: (val) => set({ data: val }),
    setBaseData: (val) => set({ baseData: val }),
    setLoading: (val) => set({ loading: val }),
    setButtonDisabled: (val) => set({ buttonDisabled: val }),
    setDailyAvgSales: (val) => set({ dailyAvgSales: val }),
}));

export default useDashboardSalesStore;

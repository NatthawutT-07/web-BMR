import { create } from "zustand";

const useDashboardSalesStore = create((set) => ({
    // filter UI ปัจจุบัน
    start: "2024-01-01",
    end: new Date().toISOString().split("T")[0],

    // data ปัจจุบันที่ใช้แสดงหน้า (หลังจาก filter แล้ว)
    data: null,

    // data ฐาน (โหลดจาก API ครั้งเดียว ช่วงวันที่ใหญ่สุด เช่น 1/1/2024 - วันนี้)
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

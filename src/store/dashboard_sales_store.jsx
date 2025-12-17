// src/store/useDashboardSalesStore.js
import { create } from "zustand";

const getYesterdayISO = () => {
  // ✅ ได้ YYYY-MM-DD ตามเวลาไทย (ไม่ติดเวลา และไม่เพี้ยนวัน)
  const todayBkk = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  const y = new Date(todayBkk);
  y.setDate(y.getDate() - 1);

  // en-CA จะได้รูปแบบ YYYY-MM-DD
  return y.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
};

const useDashboardSalesStore = create((set) => ({
  start: "2024-01-01",
  end: getYesterdayISO(),

  data: null,
  baseData: null,

  loading: false,
  buttonDisabled: false,
  dailyAvgSales: 0,

  setStart: (val) => set({ start: val }),
  setEnd: (val) => set({ end: val }),
  setData: (val) => set({ data: val }),
  setBaseData: (val) => set({ baseData: val }),
  setLoading: (val) => set({ loading: val }),
  setButtonDisabled: (val) => set({ buttonDisabled: val }),
  setDailyAvgSales: (val) => set({ dailyAvgSales: val }),
}));

export default useDashboardSalesStore;

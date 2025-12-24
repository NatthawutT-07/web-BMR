// src/store/stock_meta_store.jsx
import { create } from "zustand";
import { getStockLastUpdate } from "../api/users/home";

/**
 * ฟอร์แมตเวลาไทย: "23/12/2568 13:45"
 * - ใช้ th-TH + timeZone Asia/Bangkok
 */
export const fmtThaiDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const dd = get("day");
  const mm = get("month");
  const yyyy = get("year");
  const hh = get("hour");
  const mi = get("minute");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

const useStockMetaStore = create((set, get) => ({
  updatedAt: null, // ISO string หรือ Date string ที่ backend ส่งมา
  rowCount: null,
  status: "idle", // idle | loading | loaded | error
  error: null,

  // ✅ ยิงแค่ครั้งเดียวต่อ "การเปิดเว็บรอบนั้น" (จนกว่าจะ refresh)
  loadedOnce: false,

  // ✅ call หลัก
  loadOnce: async () => {
    const { loadedOnce, status } = get();
    if (loadedOnce || status === "loading") return;

    set({ status: "loading", error: null });

    try {
      const meta = await getStockLastUpdate(); // { updatedAt, rowCount }
      set({
        updatedAt: meta?.updatedAt ?? null,
        rowCount: meta?.rowCount ?? null,
        status: "loaded",
        loadedOnce: true,
      });
    } catch (e) {
      set({
        updatedAt: null,
        rowCount: null,
        status: "error",
        error: e,
        loadedOnce: true,
      });
    }
  },

  // ✅ เผื่อคุณอยาก “รีเฟรชจริง ๆ” จากปุ่ม/หน้า admin
  refresh: async () => {
    set({ status: "loading", error: null, loadedOnce: false });
    try {
      const meta = await getStockLastUpdate();
      set({
        updatedAt: meta?.updatedAt ?? null,
        rowCount: meta?.rowCount ?? null,
        status: "loaded",
        loadedOnce: true,
      });
    } catch (e) {
      set({
        updatedAt: null,
        rowCount: null,
        status: "error",
        error: e,
        loadedOnce: true,
      });
    }
  },

  // ✅ ใช้ได้ถ้าต้องการ reset ตอน logout
  reset: () =>
    set({
      updatedAt: null,
      rowCount: null,
      status: "idle",
      error: null,
      loadedOnce: false,
    }),
}));

export default useStockMetaStore;

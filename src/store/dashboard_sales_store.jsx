// src/store/dashboard_sales_store.jsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Dashboard Sales Store
 *
 * ✅ cache แบบ in-memory
 *    - อยู่จนกว่า reload tab
 *    - key = mode:start→end
 *
 * ✅ lastSelection (persist)
 *    - จำ mode / start / end ล่าสุด
 *    - reload หน้า / กลับมาหน้าเดิม → ค่าเดิมยังอยู่
 */

const useDashboardSalesStore = create(
  persist(
    (set, get) => ({
      /* =========================
         🔹 last selection (persist)
      ========================= */
      lastSelection: {
        mode: "diff_month",
        start: "",
        end: "",
      },

      setLastSelection: (mode, start, end) =>
        set({
          lastSelection: { mode, start, end },
        }),

      /* =========================
         🔹 in-memory cache
      ========================= */
      cache: null, // { key, primaryDash, compareDash, ts }

      getCache: (key) => {
        const c = get().cache;
        if (!c) return null;
        if (c.key !== key) return null;
        return c;
      },

      setCache: (key, primaryDash, compareDash) =>
        set({
          cache: {
            key,
            primaryDash,
            compareDash,
            ts: Date.now(),
          },
        }),

      clearCache: () => set({ cache: null }),
    }),
    {
      name: "dashboard-sales-store", // 🔐 localStorage key
      partialize: (state) => ({
        // ✅ persist เฉพาะค่าที่ต้องจำ
        lastSelection: state.lastSelection,
      }),
    }
  )
);

export default useDashboardSalesStore;

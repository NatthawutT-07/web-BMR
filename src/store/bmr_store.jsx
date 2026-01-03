// C:\BMR\bmr_data\edit\web-BMR\src\store\bmr_store.jsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../utils/axios";
import axios from "axios";

const BmrStore = (set, get) => ({
  user: null,

  // ✅ access token อยู่ใน memory เท่านั้น (ไม่ persist)
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  // ✅ กันหน้าเด้งตอน refresh
  hasHydrated: false, // persist โหลด user จาก localStorage เสร็จแล้วหรือยัง
  authReady: false, // เช็ค/รีเฟรช token เสร็จแล้วหรือยัง
  refreshing: false, // กำลังเรียก refresh-token อยู่ไหม
  authInitStarted: false,

  setHasHydrated: (v) => set({ hasHydrated: v }),
  setAuthReady: (v) => set({ authReady: v }),
  setRefreshing: (v) => set({ refreshing: v }),

  // ---------- LOGIN ----------
  actionLogin: async (form) => {
    const res = await api.post("/login", form, { withCredentials: true });

    const userData = {
      ...res.data.payload,
      storecode: form.name,
    };

    set({
      user: userData,
      accessToken: res.data.accessToken,
      authReady: true,
      refreshing: false,
      authInitStarted: false,
    });

    return res;
  },

  // ---------- REFRESH ACCESS TOKEN (ใช้ตอน reload หน้า) ----------
  refreshAccessToken: async () => {
    const res = await axios.post(
      (import.meta.env.VITE_API_URL || "") + "/api/refresh-token",
      {},
      { withCredentials: true }
    );

    const newToken = res.data.accessToken;

    set((state) => ({
      accessToken: newToken,
      user: {
        ...state.user,
        ...(res.data.payload || {}),
        storecode: state.user?.storecode || res.data.payload?.name,
      },
    }));

    return newToken;
  },

  // ---------- CURRENT USER ----------
  fetchCurrentUser: async () => {
    const res = await api.post("/current-user");
    const user = res.data.user;

    set((state) => ({
      user: {
        ...state.user,
        ...user,
        storecode: state.user?.storecode || user.name,
      },
    }));

    return res;
  },

  // ✅ INIT AUTH: เรียกตอนเปิดเว็บ/รีเฟรช เพื่อรอ refresh-token ให้เสร็จก่อนค่อยตัดสินใจ
  initAuth: async () => {
    const { authInitStarted, refreshing, authReady, accessToken, user } = get();

    if (authReady) return;
    if (authInitStarted || refreshing) return;

    set({ authInitStarted: true, refreshing: true });

    try {
      // ถ้ามี token อยู่แล้ว ถือว่า ready
      if (accessToken && user) {
        set({ authReady: true, refreshing: false });
        return;
      }

      // ถ้ามี user ที่ persist ไว้ → ลอง refresh-token
      if (user) {
        await get().refreshAccessToken();
        // ถ้าต้องการชัวร์มากขึ้นค่อยเปิดบรรทัดนี้
        // await get().fetchCurrentUser();

        set({ authReady: true, refreshing: false });
        return;
      }

      // ไม่มี user เลย → ไม่ต้อง refresh
      set({ authReady: true, refreshing: false });
    } catch (e) {
      // refresh ไม่ผ่าน → เคลียร์สถานะให้ไปหน้า login ได้แบบไม่กระพริบ
      set({
        user: null,
        accessToken: null,
        authReady: true,
        refreshing: false,
        authInitStarted: false,
      });
    }
  },

  // ---------- LOGOUT ----------
  logout: async () => {
    try {
      await api.post("/logout", {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout error:", e);
    }

    set({
      user: null,
      accessToken: null,
      authReady: true,
      refreshing: false,
      authInitStarted: false,
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("bmr-store");
      localStorage.removeItem("shelf-store");
      localStorage.removeItem("sales-store");
      localStorage.removeItem("dashboard-sales-store");


      const deleteRequest = indexedDB.deleteDatabase("dashboardDataDB");
      deleteRequest.onsuccess = () =>
        console.log("IndexedDB deleted successfully");

      window.location.replace("/");
    }
  },
});

const useBmrStore = create(
  persist(BmrStore, {
    name: "bmr-store",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      // ✅ เก็บแค่ user (ไม่เก็บ accessToken)
      user: state.user,
    }),
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error("rehydrate error:", error);
      }

      // ✅ hydrate เสร็จแล้วแน่นอน
      state?.setHasHydrated?.(true);
    },
  })
);

export default useBmrStore;

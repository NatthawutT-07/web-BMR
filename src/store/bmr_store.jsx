// C:\BMR\bmr_data\edit\web-BMR\src\store\bmr_store.jsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../utils/axios";
import axios from "axios";

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] || "") : null;
};

const ensureCsrfToken = async () => {
  const existing = getCookieValue("csrfToken");
  if (existing) return existing;
  try {
    await axios.get((import.meta.env.VITE_API_URL || "") + "/api/csrf-token", {
      withCredentials: true,
    });
  } catch (e) {
    console.error("CSRF token fetch failed:", e);
  }
  return getCookieValue("csrfToken");
};

const BmrStore = (set, get) => ({
  user: null,
  storecodeHint: null,

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
    await ensureCsrfToken();
    const res = await api.post("/login", form, { withCredentials: true });

    const userData = {
      ...res.data.payload,
      storecode: form.storecode || form.name,
    };

    set({
      user: userData,
      storecodeHint: form.storecode || form.name,
      accessToken: res.data.accessToken,
      authReady: true,
      refreshing: false,
      authInitStarted: false,
    });

    return res;
  },

  // ---------- REFRESH ACCESS TOKEN (ใช้ตอน reload หน้า) ----------
  refreshAccessToken: async () => {
    await ensureCsrfToken();
    const csrfToken = getCookieValue("csrfToken");
    const res = await axios.post(
      (import.meta.env.VITE_API_URL || "") + "/api/refresh-token",
      {},
      {
        withCredentials: true,
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
      }
    );

    const newToken = res.data.accessToken;

    set((state) => ({
      accessToken: newToken,
      user: {
        ...state.user,
        ...(res.data.payload || {}),
        storecode: state.storecodeHint || state.user?.storecode || res.data.payload?.name,
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

      // ลอง refresh-token เสมอ (ถ้ามี cookie จะผ่าน ถ้าไม่มีก็ 401 แล้วเคลียร์เอง)
      await get().refreshAccessToken();
      // ถ้าต้องการชัวร์มากขึ้นค่อยเปิดบรรทัดนี้
      // await get().fetchCurrentUser();

      set({ authReady: true, refreshing: false });
    } catch (e) {
      // refresh ไม่ผ่าน → เคลียร์สถานะให้ไปหน้า login ได้แบบไม่กระพริบ
      set({
        user: null,
        storecodeHint: null,
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
      await ensureCsrfToken();
      await api.post("/logout", {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout error:", e);
    }

    set({
      user: null,
      storecodeHint: null,
      accessToken: null,
      authReady: true,
      refreshing: false,
      authInitStarted: false,
    });

    if (typeof window !== "undefined") {
      localStorage.clear();

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
      // ✅ เก็บเฉพาะ storecode ที่จำเป็นต่อการผูกสาขา
      storecodeHint: state.storecodeHint,
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

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../utils/axios";
import axios from "axios";

const BmrStore = (set, get) => ({
  user: null,

  // ✅ access token อยู่ใน memory เท่านั้น (ไม่ persist)
  accessToken: null,

  setAccessToken: (token) => set({ accessToken: token }),

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
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("bmr-store");
      localStorage.removeItem("shelf-store");
      localStorage.removeItem("sales-store");

      const deleteRequest = indexedDB.deleteDatabase("dashboardDataDB");
      deleteRequest.onsuccess = () => console.log("IndexedDB deleted successfully");

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
  })
);

export default useBmrStore;

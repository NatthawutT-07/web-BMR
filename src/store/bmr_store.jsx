import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../utils/axios";

const BmrStore = (set, get) => ({
  user: null,

  // token แบบเก่า (หน้าเก่าที่ยังไม่ได้แก้จะใช้ตัวนี้)
  token: null,

  // token แบบใหม่ (สำหรับ refresh token system)
  accessToken: null,

  // setter สำหรับ accessToken
  setAccessToken: (token) => set({ accessToken: token }),

  // setter สำหรับ token แบบเก่า
  setLegacyToken: (token) => set({ token }),

  // ---------- LOGIN ----------
  actionLogin: async (form) => {
    const res = await api.post("/login", form);

    const userData = {
      ...res.data.payload,
      storecode: form.name,
    };

    const newToken = res.data.accessToken;

    // sync token ทั้งสองแบบ
    set({
      user: userData,
      accessToken: newToken,
      token: newToken, // ตัวนี้ทำให้หน้าเก่าใช้งานได้ทันที
    });

    return res;
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
      await api.post("/logout");
    } catch (e) {
      console.error("Logout error:", e);
    }

    set({
      user: null,
      accessToken: null,
      token: null,
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("bmr-store");
      localStorage.removeItem("shelf-store");
      localStorage.removeItem("sales-store");

      const deleteRequest = indexedDB.deleteDatabase("dashboardDataDB");

      deleteRequest.onsuccess = () => console.log("IndexedDB deleted successfully");
    }
  },
});

const useBmrStore = create(
  persist(BmrStore, {
    name: "bmr-store",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      accessToken: state.accessToken,
    }),
  })
);

export default useBmrStore;

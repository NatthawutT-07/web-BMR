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

const bmrStore = (set, get) => ({
  user: null,
  storecodeHint: null,

  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  hasHydrated: false,
  authReady: false,
  refreshing: false,
  authInitStarted: false,

  setHasHydrated: (v) => set({ hasHydrated: v }),
  setAuthReady: (v) => set({ authReady: v }),
  setRefreshing: (v) => set({ refreshing: v }),

  //  LOGIN 
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

  //  CURRENT USER 
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

  initAuth: async () => {
    const { authInitStarted, refreshing, authReady, accessToken, user } = get();

    if (authReady) return;
    if (authInitStarted || refreshing) return;

    set({ authInitStarted: true, refreshing: true });

    try {
      if (accessToken && user) {
        set({ authReady: true, refreshing: false });
        return;
      }

      await get().refreshAccessToken();

      set({ authReady: true, refreshing: false });
    } catch {
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

  //  LOGOUT 
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
        window.location.replace("/");
    }
  },
});

const useBmrStore = create(
  persist(bmrStore, {
    name: "bmr-store",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      storecodeHint: state.storecodeHint,
    }),
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error("rehydrate error:", error);
      }

      state?.setHasHydrated?.(true);
    },
  })
);

export default useBmrStore;

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const BmrStore = (set) => ({
  user: null,
  token: null,

  actionLogin: async (form) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, form);
      set({ user: res.data.payload, token: res.data.token });
      return res;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  },


  logout: () => {
    set({ user: null, token: null });

    if (typeof window !== 'undefined') {
      localStorage.removeItem('bmr-store');
      localStorage.removeItem('shelf-store');
      localStorage.removeItem('sales-store');

      const deleteRequest = indexedDB.deleteDatabase('dashboardDataDB');

      deleteRequest.onsuccess = () => {
        console.log('IndexedDB deleted successfully');
      };

      deleteRequest.onerror = () => {
        console.error('Failed to delete IndexedDB');
      };

      deleteRequest.onblocked = () => {
        console.warn('IndexedDB deletion blocked');
      };
    }
  }



});

const useBmrStore = create(
  persist(BmrStore, { name: 'bmr-store', storage: createJSONStorage(() => localStorage) })
);

export default useBmrStore;


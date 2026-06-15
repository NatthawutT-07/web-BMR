import { create } from "zustand";
import { getStockLastUpdate } from "../api/users/home";

export const fmtThaiDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
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
  updatedAt: null,
  rowCount: null,
  status: "idle", // idle | loading | loaded | error
  error: null,

  loadedOnce: false,

  _inFlight: false,

  loadOnce: async () => {
    const { loadedOnce, status, _inFlight } = get();
    if (loadedOnce || status === "loading" || _inFlight) return;

    set({ status: "loading", error: null, _inFlight: true });

    try {
      const meta = await getStockLastUpdate();
      set({
        updatedAt: meta?.updatedAt ?? null,
        rowCount: meta?.rowCount ?? null,
        status: "loaded",
        loadedOnce: true,
        _inFlight: false,
      });
    } catch (e) {
      set({
        updatedAt: null,
        rowCount: null,
        status: "error",
        error: e,
        loadedOnce: true,
        _inFlight: false,
      });
    }
  },

  refresh: async () => {
    set({ status: "loading", error: null, loadedOnce: false, _inFlight: true });

    try {
      const meta = await getStockLastUpdate();
      set({
        updatedAt: meta?.updatedAt ?? null,
        rowCount: meta?.rowCount ?? null,
        status: "loaded",
        loadedOnce: true,
        _inFlight: false,
      });
    } catch (e) {
      set({
        updatedAt: null,
        rowCount: null,
        status: "error",
        error: e,
        loadedOnce: true,
        _inFlight: false,
      });
    }
  },

  reset: () =>
    set({
      updatedAt: null,
      rowCount: null,
      status: "idle",
      error: null,
      loadedOnce: false,
      _inFlight: false,
    }),
}));

export default useStockMetaStore;

import { create } from "zustand";

const useDashboardShelfStore = create((set) => ({
  // State from ShelfDashboard
  rows: [],
  range: null,
  query: "",
  expandedBranch: null,
  shelfSalesByBranch: {},
  overallUniqueSkus: 0,
  missingSalesDates: [],
  hasLoadedInitialData: false,

  setRows: (rows) => set({ rows }),
  setRange: (range) => set({ range }),
  setQuery: (query) => set({ query }),
  setExpandedBranch: (expandedBranch) => set({ expandedBranch }),
  
  setShelfSalesByBranch: (updater) => set((state) => ({
    shelfSalesByBranch: typeof updater === 'function' 
      ? updater(state.shelfSalesByBranch) 
      : updater
  })),
  
  setOverallUniqueSkus: (overallUniqueSkus) => set({ overallUniqueSkus }),
  setMissingSalesDates: (missingSalesDates) => set({ missingSalesDates }),
  setHasLoadedInitialData: (hasLoadedInitialData) => set({ hasLoadedInitialData }),

  resetDashboardShelfStore: () => set({
    rows: [],
    range: null,
    query: "",
    expandedBranch: null,
    shelfSalesByBranch: {},
    overallUniqueSkus: 0,
    missingSalesDates: [],
    hasLoadedInitialData: false
  })
}));

export default useDashboardShelfStore;

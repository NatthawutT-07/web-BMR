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
  
  // Track if data has been initially loaded to avoid refetching on every mount
  hasLoadedInitialData: false,

  // Setters
  setRows: (rows) => set({ rows }),
  setRange: (range) => set({ range }),
  setQuery: (query) => set({ query }),
  setExpandedBranch: (expandedBranch) => set({ expandedBranch }),
  
  // For shelfSalesByBranch, we might want to update specific branches or the whole object
  setShelfSalesByBranch: (updater) => set((state) => ({
    shelfSalesByBranch: typeof updater === 'function' 
      ? updater(state.shelfSalesByBranch) 
      : updater
  })),
  
  setOverallUniqueSkus: (overallUniqueSkus) => set({ overallUniqueSkus }),
  setMissingSalesDates: (missingSalesDates) => set({ missingSalesDates }),
  setHasLoadedInitialData: (hasLoadedInitialData) => set({ hasLoadedInitialData }),

  // Reset store (useful for logout or manual refresh)
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

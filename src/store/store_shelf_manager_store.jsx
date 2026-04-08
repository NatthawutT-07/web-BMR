import { create } from "zustand";

const useStoreShelfManagerStore = create((set) => ({
  // State from ShelfManager
  selectedBranchCode: "",
  submittedBranchCode: "",
  selectedShelves: [],
  filteredTemplate: [],
  branchSummary: [],
  okLocked: false,
  searchText: "",
  searchResult: [],
  isFullscreenImage: false,
  
  // Track if data has been initially loaded to avoid refetching on every mount
  hasLoadedInitialData: false,

  // Setters
  setSelectedBranchCode: (selectedBranchCode) => set({ selectedBranchCode }),
  setSubmittedBranchCode: (submittedBranchCode) => set({ submittedBranchCode }),
  setSelectedShelves: (updater) => set((state) => ({
    selectedShelves: typeof updater === 'function' ? updater(state.selectedShelves) : updater
  })),
  setFilteredTemplate: (filteredTemplate) => set({ filteredTemplate }),
  setBranchSummary: (branchSummary) => set({ branchSummary }),
  setOkLocked: (okLocked) => set({ okLocked }),
  setSearchText: (searchText) => set({ searchText }),
  setSearchResult: (searchResult) => set({ searchResult }),
  setIsFullscreenImage: (isFullscreenImage) => set({ isFullscreenImage }),
  setHasLoadedInitialData: (hasLoadedInitialData) => set({ hasLoadedInitialData }),

  // Reset store (useful for logout or manual refresh)
  resetStoreShelfManagerStore: () => set({
    selectedBranchCode: "",
    submittedBranchCode: "",
    selectedShelves: [],
    filteredTemplate: [],
    branchSummary: [],
    okLocked: false,
    searchText: "",
    searchResult: [],
    isFullscreenImage: false,
    hasLoadedInitialData: false
  })
}));

export default useStoreShelfManagerStore;

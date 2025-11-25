import { create } from 'zustand';
import { fetchBranchListSales } from '../api/admin/sales';
import logger from '../utils/logger';
import useShelfStore from './shelf_store';

const useSalesStore = create((set, get) => ({
    branches: [],
    loading: false,

    // sales data
    selectedBranchCode: "",
    salesData: [],
    productMonthData: [],
    productDayData: [],
    showDay: [],
    showType: "",
    date: "",

    // setter functions
    setSelectedBranchCode: (val) => set({ selectedBranchCode: val }),
    setSalesData: (val) => set({ salesData: val }),
    setProductMonthData: (val) => set({ productMonthData: val }),
    setProductDayData: (val) => set({ productDayData: val }),
    setShowDay: (val) => set({ showDay: val }),
    setShowType: (val) => set({ showType: val }),
    setDate: (val) => set({ date: val }),

    fetchListBranches: async (token) => {
        const shelfStore = useShelfStore.getState();
        const { branches: shelfBranches } = shelfStore;

        if (shelfBranches && shelfBranches.length > 0) {
            set({ branches: shelfBranches });
            return;
        }

        if (!token) return;

        set({ loading: true });
        try {
            const res = await fetchBranchListSales(token);
            const branchList = Array.isArray(res) ? res : [];

            // update sales store and shelf store
            set({ branches: branchList });
            useShelfStore.setState({ branches: branchList });
        } catch (error) {
            logger.error("Fetch branches failed", error);
        } finally {
            set({ loading: false });
        }
    },
}));

export default useSalesStore;

import { create } from "zustand";
import { fetchBranchListSales } from "../api/admin/sales";
import logger from "../utils/logger";
import useShelfStore from "./shelf_store";
import useBmrStore from "./bmr_store";

const sortBranches = (list = []) => {
  const getWeight = (codeRaw) => {
    const code = String(codeRaw || "").toUpperCase().trim();

    // 1) เคส fix ลำดับชัดเจน
    if (code === "BT001") return 0;
    if (code === "BT002") return 1;

    // 2) ST000 ต้องไปท้ายสุดเสมอ
    if (code === "ST000") return 99999;

    // 3) STxxx อื่น ๆ เรียงตามเลข
    if (code.startsWith("ST")) {
      const num = parseInt(code.slice(2), 10) || 0;
      // เริ่มที่ 10 กันชนกับ BT
      return 10 + num;
    }

    // 4) สาขาอื่น ๆ ที่ไม่ได้ขึ้นต้น BT/ST → ดันไปหลัง ST ทั้งหมด
    return 50000;
  };

  return [...list].sort((a, b) => {
    const wa = getWeight(a.branch_code);
    const wb = getWeight(b.branch_code);

    if (wa !== wb) return wa - wb;

    // ถ้า weight เท่ากัน ให้เทียบ code ตรง ๆ กันอีกที
    const ca = String(a.branch_code || "");
    const cb = String(b.branch_code || "");
    return ca.localeCompare(cb);
  });
};


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

  // setters
  setSelectedBranchCode: (val) => set({ selectedBranchCode: val }),
  setSalesData: (val) => set({ salesData: val }),
  setProductMonthData: (val) => set({ productMonthData: val }),
  setProductDayData: (val) => set({ productDayData: val }),
  setShowDay: (val) => set({ showDay: val }),
  setShowType: (val) => set({ showType: val }),
  setDate: (val) => set({ date: val }),

  // -------------------------------
  //   ใช้ accessToken จาก store เดียว
  // -------------------------------
  fetchListBranches: async () => {
    const shelfStore = useShelfStore.getState();
    const { branches: shelfBranches } = shelfStore;

    // ใช้ข้อมูลเก่าจาก shelf_store (แต่จัดเรียงตาม rule ใหม่)
    if (shelfBranches && shelfBranches.length > 0) {
      const sorted = sortBranches(shelfBranches);
      set({ branches: sorted });
      return;
    }

    const accessToken = useBmrStore.getState().accessToken;

    if (!accessToken) {
      console.warn("No accessToken → cannot fetch branches");
      return;
    }

    set({ loading: true });

    try {
      // ⚡ ไม่ต้องส่ง token → axios interceptor จัดการให้แล้ว
      const res = await fetchBranchListSales();

      const branchList = Array.isArray(res) ? res : [];
      const sorted = sortBranches(branchList);

      // update ทั้งสอง store
      set({ branches: sorted });
      useShelfStore.setState({ branches: sorted });
    } catch (error) {
      logger.error("Fetch branches failed", error);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useSalesStore;

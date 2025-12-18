import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSKU, getTemplate, addTemplate, deleteTemplate, updateProducts } from "../api/admin/template";

import logger from "../utils/logger";
import { fetchBranchListSales } from "../api/admin/sales";
import useBmrStore from "./bmr_store";

// ใช้ id เป็นหลัก ถ้ามี (กัน index โยก)
const getDeleteKey = (p) => {
  if (p?.id != null) return `id:${p.id}`;
  return `cmp:${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}`;
};

const sameRow = (a, b) =>
  a.branchCode === b.branchCode && a.shelfCode === b.shelfCode && Number(a.rowNo) === Number(b.rowNo);

const useShelfStore = create(
  persist(
    (set, get) => ({
      // --- STATE ---
      branches: [],
      template: [],
      product: [],

      loading: false,
      actionLoading: false,

      // =====================================================
      // 📌 Branch List
      // =====================================================
      fetchBranches: async () => {
        const { branches } = get();
        if (branches.length > 0) return;

        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await fetchBranchListSales();
          set({ branches: Array.isArray(res) ? res : [] });
        } catch (error) {
          logger.error("Fetch branches failed", error);
        } finally {
          set({ loading: false });
        }
      },

      // =====================================================
      // 📌 Template
      // =====================================================
      fetchTemplate: async () => {
        const { template } = get();
        if (template.length > 0) return;

        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await getTemplate();
          set({ template: res });
        } catch (error) {
          logger.error("Fetch template failed", error);
        } finally {
          set({ loading: false });
        }
      },

      // =====================================================
      // 📌 Product by Branch
      // ✅ เปลี่ยนเป็น "replace ข้อมูลของสาขานั้น" กันของเก่าค้าง/ซ้อน
      // =====================================================
      fetchProduct: async (branchCode) => {
        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await getSKU(branchCode);
          const list = Array.isArray(res) ? res : [];

          set((state) => {
            const other = state.product.filter((p) => p.branchCode !== branchCode);
            return { product: [...other, ...list] };
          });
        } catch (error) {
          logger.error("Fetch product failed", error);
        } finally {
          set({ loading: false });
        }
      },

      refreshDataProduct: async (branchCode) => {
        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await getSKU(branchCode);
          const list = Array.isArray(res) ? res : [];

          set((state) => {
            const other = state.product.filter((p) => p.branchCode !== branchCode);
            return { product: [...other, ...list] };
          });
        } catch (error) {
          logger.error("refresh Data Product failed", error);
        } finally {
          set({ loading: false });
        }
      },

      // =====================================================
      // 📌 Add Product
      // =====================================================
      handleAddProduct: async (newItem) => {
        set({ actionLoading: true });

        try {
          const res = await addTemplate({ items: [newItem] });

          const updatedItem = {
            ...newItem,
            ...(typeof res === "object" ? res : {}),
            salesQuantity: newItem.salesQuantity ?? null,
            salesTotalPrice: newItem.salesTotalPrice ?? null,
            stockQuantity: newItem.stockQuantity ?? null,
            withdrawQuantity: newItem.withdrawQuantity ?? 0,
            withdrawValue: newItem.withdrawValue ?? 0,
          };

          set((state) => {
            // ถ้ามี id ก็กันซ้ำด้วย id
            if (updatedItem.id != null) {
              const exists = state.product.some((p) => p.id === updatedItem.id);
              if (exists) return state;
              return { product: [...state.product, updatedItem] };
            }

            // fallback กันซ้ำแบบเดิม
            const key = `${updatedItem.branchCode}-${updatedItem.shelfCode}-${updatedItem.rowNo}-${updatedItem.codeProduct}-${updatedItem.index}`;
            const exists = state.product.some(
              (p) =>
                `${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}` === key
            );
            if (exists) return state;
            return { product: [...state.product, updatedItem] };
          });
        } catch (error) {
          logger.error("Add product failed", error);
          alert("Error adding product");
        } finally {
          set({ actionLoading: false });
        }
      },

      // =====================================================
      // 📌 Delete Product
      // ✅ ลบด้วย id เป็นหลัก + reindex ใน state ให้ตรง backend ทันที
      // =====================================================
      handleDelete: async (productToDelete) => {
        set({ actionLoading: true });

        try {
          await deleteTemplate(productToDelete);

          set((state) => {
            const delKey = getDeleteKey(productToDelete);

            // 1) remove
            const kept = state.product.filter((p) => getDeleteKey(p) !== delKey);

            // 2) reindex เฉพาะ row เดียวกัน (ให้ index ใน state ตรงกับ backend ที่ reindex)
            const rowItems = kept
              .filter((p) => sameRow(p, productToDelete))
              .sort((a, b) => Number(a.index) - Number(b.index))
              .map((p, i) => ({ ...p, index: i + 1 }));

            const other = kept.filter((p) => !sameRow(p, productToDelete));

            return { product: [...other, ...rowItems] };
          });
        } catch (error) {
          logger.error("Delete product failed", error);
          alert("Error deleting product");
        } finally {
          set({ actionLoading: false });
        }
      },

      // =====================================================
      // 📌 Update Product
      // =====================================================
      handleUpdateProducts: async (updatedProducts) => {
        set({ actionLoading: true });

        try {
          const res = await updateProducts(updatedProducts);

          if (res.success) {
            set((state) => {
              const updatedMap = new Map(
                updatedProducts.map((p) => [`${p.branchCode}-${p.shelfCode}-${p.codeProduct}`, p])
              );

              const merged = state.product.map((p) => {
                const key = `${p.branchCode}-${p.shelfCode}-${p.codeProduct}`;
                return updatedMap.get(key) || p;
              });

              const unique = Array.from(
                new Map(merged.map((p) => [`${p.branchCode}-${p.shelfCode}-${p.codeProduct}`, p])).values()
              );

              return { product: unique };
            });
          } else {
            alert(res.message);
          }
        } catch (error) {
          logger.error("Update products failed", error);
        } finally {
          set({ actionLoading: false });
        }
      },
    }),
    {
      name: "shelf-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ branches: state.branches }), // ตัด state อื่นออกเพื่อป้องกันบวม
    }
  )
);

export default useShelfStore;

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSKU, getTemplate, addTemplate, deleteTemplate, updateProducts } from "../api/admin/template";
import { getSyncDates } from "../api/admin/upload";
import { getBranches } from "../api/admin/branch";

import logger from "../utils/logger";
import useBmrStore from "./bmr_store";

// ใช้ id เป็นหลัก ถ้ามี (กัน index โยก)
const getDeleteKey = (p) => {
  if (p?.id != null) return `id:${p.id}`;
  return `cmp:${p.branch_code}-${p.shelf_code}-${p.shelf_row_number}-${p.item_code}-${p.shelf_index_number}`;
};

const sameRow = (a, b) =>
  a.branch_code === b.branch_code && a.shelf_code === b.shelf_code && Number(a.shelf_row_number) === Number(b.shelf_row_number);

const useShelfStore = create(
  persist(
    (set, get) => ({
      // --- STATE ---
      branches: [],
      shelfTemplate: [],
      product: [],
      syncDates: null,

      loading: false,
      actionLoading: false,

      // =====================================================
      //  BranchMain List
      // =====================================================
      fetchBranches: async () => {
        const { branches } = get();
        if (branches.length > 0) return;

        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await getBranches();
          set({ branches: Array.isArray(res) ? res : [] });
        } catch (error) {
          logger.error("Fetch branches failed", error);
        } finally {
          set({ loading: false });
        }
      },

      // =====================================================
      //  Data Sync Dates
      // =====================================================
      fetchSyncDates: async () => {
        try {
          const res = await getSyncDates();
          set({ syncDates: res });
        } catch (error) {
          logger.error("Fetch sync dates failed", error);
        }
      },

      // =====================================================
      //  ShelfTemplate
      // =====================================================
      fetchTemplate: async () => {
        const { shelfTemplate } = get();
        if (shelfTemplate.length > 0) return;

        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await getTemplate();
          set({ shelfTemplate: res });
        } catch (error) {
          logger.error("Fetch shelfTemplate failed", error);
        } finally {
          set({ loading: false });
        }
      },

      // =====================================================
      //  Product by BranchMain
      // เปลี่ยนเป็น "replace ข้อมูลของสาขานั้น" กันของเก่าค้าง/ซ้อน
      // =====================================================
      fetchProduct: async (branch_code) => {
        const accessToken = useBmrStore.getState().accessToken;
        if (!accessToken) return;

        set({ loading: true });
        try {
          const res = await getSKU(branch_code);
          const list = Array.isArray(res) ? res : [];

          set((state) => {
            const other = state.product.filter((p) => p.branch_code !== branch_code);
            return { product: [...other, ...list] };
          });
        } catch (error) {
          logger.error("Fetch product failed", error);
        } finally {
          set({ loading: false });
        }
      },


      // =====================================================
      //  Add Product
      // =====================================================
      handleAddProduct: async (newItem) => {
        set({ actionLoading: true });

        try {
          const res = await addTemplate({ items: [newItem] });

          const updatedItem = {
            ...newItem,
            ...(typeof res === "object" ? res : {}),
            quantity_sale_bill: newItem.quantity_sale_bill ?? null,
            total_sales_rounding_no_end_discount: newItem.total_sales_rounding_no_end_discount ?? null,
            quantity_stock: newItem.quantity_stock ?? null,
            quantity_withdraw: newItem.quantity_withdraw ?? 0,
            value_withdraw: newItem.value_withdraw ?? 0,
          };

          set((state) => {
            // ถ้ามี id ก็กันซ้ำด้วย id
            if (updatedItem.id != null) {
              const exists = state.product.some((p) => p.id === updatedItem.id);
              if (exists) return state;
              return { product: [...state.product, updatedItem] };
            }

            // fallback กันซ้ำแบบเดิม
            const key = `${updatedItem.branch_code}-${updatedItem.shelf_code}-${updatedItem.shelf_row_number}-${updatedItem.item_code}-${updatedItem.shelf_index_number}`;
            const exists = state.product.some(
              (p) =>
                `${p.branch_code}-${p.shelf_code}-${p.shelf_row_number}-${p.item_code}-${p.shelf_index_number}` === key
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
      //  Delete Product
      // ลบด้วย id เป็นหลัก + reindex ใน state ให้ตรง backend ทันที
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
              .sort((a, b) => Number(a.shelf_index_number) - Number(b.shelf_index_number))
              .map((p, i) => ({ ...p, shelf_index_number: i + 1 }));

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
      //  Update Product
      // =====================================================
      handleUpdateProducts: async (updatedProducts) => {
        set({ actionLoading: true });

        try {
          const res = await updateProducts(updatedProducts);

          if (res.success) {
            set((state) => {
              const updatedMap = new Map(
                updatedProducts.map((p) => [`${p.branch_code}-${p.shelf_code}-${p.item_code}`, p])
              );

              const merged = state.product.map((p) => {
                const key = `${p.branch_code}-${p.shelf_code}-${p.item_code}`;
                return updatedMap.get(key) || p;
              });

              const unique = Array.from(
                new Map(merged.map((p) => [`${p.branch_code}-${p.shelf_code}-${p.item_code}`, p])).values()
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
      // =====================================================
      //  UI STATE (Merged from store_shelf_manager_store)
      // =====================================================
      selectedbranch_code: "",
      submittedbranch_code: "",
      selectedShelves: [],
      filteredTemplate: [],
      okLocked: false,
      searchText: "",
      searchResult: [],
      isFullscreenImage: false,
      hasLoadedInitialData: false,

      // Setters
      setSelectedbranch_code: (val) => set({ selectedbranch_code: val }),
      setSubmittedbranch_code: (val) => set({ submittedbranch_code: val }),
      setSelectedShelves: (updater) => set((state) => ({
        selectedShelves: typeof updater === "function" ? updater(state.selectedShelves) : updater
      })),
      setFilteredTemplate: (val) => set({ filteredTemplate: val }),
      setOkLocked: (val) => set({ okLocked: val }),
      setSearchText: (val) => set({ searchText: val }),
      setSearchResult: (val) => set({ searchResult: val }),
      setIsFullscreenImage: (val) => set({ isFullscreenImage: val }),
      setHasLoadedInitialData: (val) => set({ hasLoadedInitialData: val }),

      resetShelfUI: () => set({
        selectedbranch_code: "",
        submittedbranch_code: "",
        selectedShelves: [],
        filteredTemplate: [],
        okLocked: false,
        searchText: "",
        searchResult: [],
        isFullscreenImage: false,
        hasLoadedInitialData: false
      }),
    }),
    {
      name: "shelf-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ branches: state.branches }), // ตัด UI state ออก ไม่ต้องจำ
    }
  )
);

export default useShelfStore;

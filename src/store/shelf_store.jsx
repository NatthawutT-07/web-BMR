import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";
import {
    getSKU,
    getTemplate,
    addTemplate,
    deleteTemplate,
    updateProducts
} from "../api/admin/template";

import logger from "../utils/logger";
import { fetchBranchListSales } from '../api/admin/sales';
import useBmrStore from './bmr_store';

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
            // 📌 Branch List (ใช้จาก axios interceptor → ไม่ต้องใช้ token)
            // =====================================================
            fetchBranches: async () => {
                const { branches } = get();
                if (branches.length > 0) return;

                const accessToken = useBmrStore.getState().accessToken;
                if (!accessToken) return; // ถ้า token ไม่มี → axios จะ logout ให้อยู่ดี

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
            // =====================================================
            fetchProduct: async (branchCode) => {
                const accessToken = useBmrStore.getState().accessToken;
                if (!accessToken) return;

                set({ loading: true });
                try {
                    const res = await getSKU(branchCode);

                    set((state) => {
                        const other = state.product.filter(p => p.branchCode !== branchCode);
                        const merged = [...other, ...res];

                        const unique = Array.from(new Map(
                            merged.map(p =>
                                [`${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}`, p]
                            )
                        ).values());

                        return { product: unique };
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

                    set((state) => {
                        const other = state.product.filter(p => p.branchCode !== branchCode);
                        const merged = [...other, ...res];

                        const unique = Array.from(new Map(
                            merged.map(p =>
                                [`${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}`, p]
                            )
                        ).values());

                        return { product: unique };
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
                        ...res,
                        salesQuantity: newItem.salesQuantity ?? null,
                        salesTotalPrice: newItem.salesTotalPrice ?? null,
                        stockQuantity: newItem.stockQuantity ?? null,
                        withdrawQuantity: newItem.withdrawQuantity ?? 0,
                        withdrawValue: newItem.withdrawValue ?? 0,
                    };

                    set((state) => {
                        const key = `${updatedItem.branchCode}-${updatedItem.shelfCode}-${updatedItem.rowNo}-${updatedItem.codeProduct}-${updatedItem.index}`;

                        const exists = state.product.some(p =>
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
            // =====================================================
            handleDelete: async (productToDelete) => {
                set({ actionLoading: true });

                try {
                    await deleteTemplate(productToDelete);

                    set((state) => ({
                        product: state.product.filter((p) =>
                            !(
                                p.branchCode === productToDelete.branchCode &&
                                p.shelfCode === productToDelete.shelfCode &&
                                p.rowNo === productToDelete.rowNo &&
                                p.codeProduct === productToDelete.codeProduct &&
                                p.index === productToDelete.index
                            )
                        )
                    }));

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
                                updatedProducts.map(p =>
                                    [`${p.branchCode}-${p.shelfCode}-${p.codeProduct}`, p]
                                )
                            );

                            const merged = state.product.map(p => {
                                const key = `${p.branchCode}-${p.shelfCode}-${p.codeProduct}`;
                                return updatedMap.get(key) || p;
                            });

                            const unique = Array.from(new Map(
                                merged.map(p =>
                                    [`${p.branchCode}-${p.shelfCode}-${p.codeProduct}`, p]
                                )
                            ).values());

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
            name: 'shelf-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ branches: state.branches }) // ตัด state อื่นออกเพื่อป้องกันบวม
        }
    )
);

export default useShelfStore;

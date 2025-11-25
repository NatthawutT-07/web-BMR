import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";
import { getSKU, getTemplate, addTemplate, deleteTemplate, updateProducts } from "../api/admin/template";
import logger from "../utils/logger";
import { fetchBranchListSales } from '../api/admin/sales';

const useShelfStore = create(
    persist(
        (set, get) => ({
            token: null,
            branches: [],
            template: [],
            product: [],

            loading: false,
            actionLoading: false,

            setToken: (token) => set({ token }),

            downloadTemplate: async (branchCode) => {
                const { refreshDataProduct, product } = get();
                // await refreshDataProduct(branchCode);

                const filteredProducts = product.filter(p => p.branchCode === branchCode);

                if (filteredProducts.length === 0) {
                    toast.error("not found branch.");
                    return;
                }

                const escapeCsv = (value) => {
                    if (value == null) return "";
                    const str = value.toString();
                    return `"${str.replace(/"/g, '""')}"`;
                };

                const headers = [
                    "Branch Code", "Code Shelf", "row", "Index", "Code Product", "Name Product", "Name Brand",
                    "shelfLife", "Sales Price Inc VAT", "Sales Quantity", "Withdraw Quantity",
                    "Min", "Max", "Stock Quantity", "Purchase Price Exc VAT", "Stock Cost",
                    "Sales Value", "Withdraw Value"
                ];

                const rows = filteredProducts.map(obj => {
                    const stockQuantity = obj.stockQuantity ?? "";
                    const purchasePriceExcVAT = obj.purchasePriceExcVAT ?? "";
                    const stockCost = (stockQuantity * purchasePriceExcVAT).toFixed(2);
                    const formattedBranchCode = 'ST' + obj.branchCode.slice(2).padStart(4, '0');

                    // ✅ ทำให้ codeProduct เป็น 5 หลัก
                    const formattedCodeProduct = obj.codeProduct != null
                        ? obj.codeProduct.toString().padStart(5, '0')
                        : "";

                    return [
                        formattedBranchCode,
                        obj.shelfCode ?? "",
                        obj.rowNo ?? "",
                        obj.index ?? "",
                        formattedCodeProduct, // ใช้ตัวนี้แทน obj.codeProduct เดิม
                        obj.nameProduct ?? "",
                        obj.nameBrand ?? "",
                        obj.shelfLife ?? "",
                        obj.salesPriceIncVAT ?? "",
                        obj.salesQuantity ?? "",
                        obj.withdrawQuantity ?? "",
                        obj.minStore ?? "",
                        obj.maxStore ?? "",
                        stockQuantity,
                        purchasePriceExcVAT,
                        stockCost,
                        obj.salesTotalPrice ?? "",
                        obj.withdrawValue ?? ""
                    ].map(escapeCsv).join(",");
                });

                const csvContent = [headers.join(","), ...rows].join("\n");
                const bom = '\uFEFF';
                const blob = new Blob([bom + csvContent], { type: "text/csv; charset=UTF-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Template ${branchCode}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            },

            fetchBranches: async () => {
                const { branches, token } = get();
                if (branches.length > 0) return;
                if (!token) return;

                set({ loading: true });
                try {
                    const res = await fetchBranchListSales(token);
                    set({ branches: Array.isArray(res) ? res : [] });
                } catch (error) {
                    logger.error("Fetch branches failed", error);
                } finally {
                    set({ loading: false });
                }
            },

            fetchTemplate: async () => {
                const { template, token } = get();
                if (template.length > 0) return;
                if (!token) return;

                set({ loading: true });
                try {
                    const res = await getTemplate(token);
                    set({ template: res });
                } catch (error) {
                    logger.error("Fetch template failed", error);
                } finally {
                    set({ loading: false });
                }
            },

            fetchProduct: async (branchCode) => {
                const { token } = get();
                if (!token) return;

                set({ loading: true });
                try {
                    const res = await getSKU(token, branchCode);
                    set((state) => {
                        // ลบ product เดิมของ branch นั้นก่อน
                        const otherProducts = state.product.filter(p => p.branchCode !== branchCode);
                        // merge แบบ unique
                        const merged = [...otherProducts, ...res];
                        const unique = Array.from(new Map(
                            merged.map(p => [`${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}`, p])
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
                const { token } = get();
                if (!token) return;
                set({ loading: true });
                try {
                    const res = await getSKU(token, branchCode);
                    set((state) => {
                        const otherProducts = state.product.filter(p => p.branchCode !== branchCode);
                        const merged = [...otherProducts, ...res];
                        const unique = Array.from(new Map(
                            merged.map(p => [`${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}`, p])
                        ).values());
                        return { product: unique };
                    });
                } catch (error) {
                    logger.error("refresh Data Product failed", error);
                } finally {
                    set({ loading: false });
                }
            },

            handleAddProduct: async (newItem) => {
                const { token } = get();
                set({ actionLoading: true });
                try {
                    const res = await addTemplate(token, { items: [newItem] });
                    const updatedProduct = {
                        ...newItem,
                        ...res,
                        salesQuantity: newItem.salesQuantity ?? null,
                        salesTotalPrice: newItem.salesTotalPrice ?? null,
                        stockQuantity: newItem.stockQuantity ?? null,
                        withdrawQuantity: newItem.withdrawQuantity ?? 0,
                        withdrawValue: newItem.withdrawValue ?? 0,
                    };
                    console.log(updatedProduct)

                    set((state) => {
                        const key = `${updatedProduct.branchCode}-${updatedProduct.shelfCode}-${updatedProduct.rowNo}-${updatedProduct.codeProduct}-${updatedProduct.index}`;
                        const exists = state.product.some(p =>
                            `${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}` === key
                        );
                        if (exists) return state;
                        return { product: [...state.product, updatedProduct] };
                    });
                } catch (error) {
                    logger.error("Add product failed", error);
                    alert("Error adding product");
                } finally {
                    set({ actionLoading: false });
                }
            },

            handleDelete: async (productToDelete) => {
                const { token } = get();
                set({ actionLoading: true });
                try {
                    await deleteTemplate(token, productToDelete);
                    set((state) => ({
                        product: state.product.filter(p =>
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

            handleUpdateProducts: async (updatedProducts) => {
                const { token } = get();
                set({ actionLoading: true });
                try {
                    const res = await updateProducts(token, updatedProducts);

                    if (res.success) {
                        set((state) => {
                            // map สำหรับ product ที่อัปเดต
                            const updatedMap = new Map(
                                updatedProducts.map(p =>
                                    [`${p.branchCode}-${p.shelfCode}-${p.codeProduct}`, p]
                                )
                            );

                            // อัปเดต product ใน state
                            const merged = state.product.map(p => {
                                const key = `${p.branchCode}-${p.shelfCode}-${p.codeProduct}`;
                                // หาก item นี้ถูกแก้ → ดึงค่าที่แก้ไปแทน
                                return updatedMap.get(key) || p;
                            });

                            // ลบซ้ำ (กัน key ซ้ำ)
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
            }
            ,

        }),
        {
            name: 'shelf-store',
            storage: createJSONStorage(() => localStorage), // persist แค่ token, branches, template
            partialize: (state) => ({ branches: state.branches })
        }
    )
);

export default useShelfStore;

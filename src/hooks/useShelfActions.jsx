import { useState } from "react";
import { addTemplate, deleteTemplate, updateProducts } from "../api/admin/template";

export default function useShelfActions(token, fetchProduct, setProduct) {
    const [actionLoading, setActionLoading] = useState(false);

    const handleAddProduct = async (branchCode, newItem) => {
        try {
            // console.log("Adding product:", newItem);
            const newItemArray = [newItem]; // แปลงเป็น array
            const res = await addTemplate(token, { items: newItemArray });

            const updatedProduct = {
                ...newItem,
                ...res,
                salesQuantity: newItem.salesQuantity ?? null,
                salesTotalPrice: newItem.salesTotalPrice ?? null,
                stockQuantity: newItem.stockQuantity ?? null,
                withdrawQuantity: newItem.withdrawQuantity ?? 0,
                withdrawValue: newItem.withdrawValue ?? 0,
            };

            setProduct(prev => [...prev, updatedProduct]);
        } catch (error) {
            console.error("Add failed:", error);
            alert("Error adding data");
        } finally {
            setActionLoading(false);
        }
    };



    const handleDelete = async (branchCode, productToDelete) => {
        try {
            await deleteTemplate(token, productToDelete);

            setProduct(prev =>
                prev.filter(p =>
                    !(
                        p.branchCode === productToDelete.branchCode &&
                        p.shelfCode === productToDelete.shelfCode &&
                        p.codeProduct === productToDelete.codeProduct
                    )
                )
            );
        } catch (error) {
            console.error("Delete failed:", error);
            alert("error delete data");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateProducts = async (branchCode, updatedProducts) => {
        try {
            const res = await updateProducts(token, updatedProducts);
            if (res.success) {
                setProduct(prev => {
                    const updatedMap = new Map(
                        updatedProducts.map(p => [`${p.shelfCode}-${p.codeProduct}`, p])
                    );
                    return prev.map(p => {
                        const key = `${p.shelfCode}-${p.codeProduct}`;
                        return updatedMap.has(key) ? updatedMap.get(key) : p;
                    });
                });
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    return {
        handleAddProduct,
        handleDelete,
        handleUpdateProducts,
        actionLoading,
    };
}

import { useState } from "react";
import { addTemplate, deleteTemplate, updateProducts } from "../api/admin/template";

export default function useShelfActions(token, fetchProduct) {
    const [actionLoading, setActionLoading] = useState(false); // ✅ เพิ่ม state

    const handleAddProduct = async (branchCode, newItem) => {
        setActionLoading(true);
        try {
            await addTemplate(token, newItem);
            await fetchProduct(branchCode);
        } catch (error) {
            console.error("Add failed:", error);
            alert("error add data");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (branchCode, product) => {
        setActionLoading(true);
        try {
            await deleteTemplate(token, product);
            await fetchProduct(branchCode);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("error delete data");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateProducts = async (branchCode, updatedProducts) => {
        setActionLoading(true);
        try {
            const res = await updateProducts(token, updatedProducts);
            if (res.success) {
                console.log("✅ Update success:", res.message);
                await fetchProduct(branchCode);
            } else {
                console.error("❌ Update failed:", res.message);
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

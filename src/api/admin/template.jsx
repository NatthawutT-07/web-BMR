import api from "../../utils/axios";   // IMPORTANT: ใช้ axios instance เท่านั้น

// ------------------------------------------------------------
// GET: Template
// ------------------------------------------------------------
export const getTemplate = async () => {
    try {
        const response = await api.get("/shelf-template");
        return response.data;
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------------------
// POST: SKU (สินค้าตาม branch)
// ------------------------------------------------------------
export const getSKU = async (branchCode) => {
    try {
        const response = await api.post("/shelf-sku", { branchCode });
        return response.data;
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------------------
// POST: Add a new item
// ------------------------------------------------------------
export const addTemplate = async (newItem) => {
    try {
        const response = await api.post("/shelf-add", newItem);
        return response.data;
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------------------
// DELETE: Delete product
// ------------------------------------------------------------
export const deleteTemplate = async (product) => {
    try {
        await api.delete("/shelf-delete", {
            data: {
                branchCode: product.branchCode,
                shelfCode: product.shelfCode,
                rowNo: product.rowNo,
                codeProduct: product.codeProduct,
                index: product.index,
            },
        });
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------------------
// PUT: Update products
// ------------------------------------------------------------
export const updateProducts = async (data) => {
    try {
        const response = await api.put("/shelf-update", data);
        return response.data;
    } catch (error) {
        return error;
    }
};

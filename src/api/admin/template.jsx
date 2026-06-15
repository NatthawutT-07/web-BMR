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
export const getSKU = async (branch_code) => {
    try {
        const response = await api.post("/shelf-sku", { branch_code });
        return response.data;
    } catch (error) {
        return error;
    }
};

// POST: Add a new item
export const addTemplate = async (newItem) => {
    try {
        const response = await api.post("/shelf-add", newItem);
        return {
            success: response.success,
            data: response.data,
            message: response.message
        };
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
                branch_code: product.branch_code,
                shelf_code: product.shelf_code,
                shelf_row_number: product.shelf_row_number,
                item_code: product.item_code,
                shelf_index_number: product.shelf_index_number,
            },
        });
    } catch (error) {
        return error;
    }
};

// PUT: Update products
export const updateProducts = async (data) => {
    try {
        const response = await api.put("/shelf-update", data);
        return {
            success: response.success,
            data: response.data,
            message: response.message
        };
    } catch (error) {
        return error;
    }
};


// ------------------------------------------------------------
// GET: Master items by barcode/name/item_code
// ------------------------------------------------------------
export const getMasterItem = async (q) => {
    try {
        const response = await api.get("/shelf-getMasterItem", { params: { q } });
        return response.data; // { items: [...] }
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------------------
// GET: Shelf dashboard summary (all branches)
// ------------------------------------------------------------
export const getShelfDashboardSummary = async () => {
    try {
        const response = await api.get("/shelf-dashboard-summary");
        return {
            rows: response.data,
            ...response.meta
        };
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------------------
// GET: Shelf dashboard shelf sales (per branch)
// ------------------------------------------------------------
export const getShelfDashboardShelfSales = async (branch_code) => {
    try {
        const response = await api.get("/shelf-dashboard-shelf-sales", {
            params: { branch_code },
        });
        return response.data;
    } catch (error) {
        return error;
    }
};

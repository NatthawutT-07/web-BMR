import api from "../../utils/axios";

export const getTemplate = async () => {
    try {
        const response = await api.get("/shelf-templates");
        return response.data;
    } catch (error) {
        return error;
    }
};

export const getSKU = async (branch_code) => {
    try {
        const response = await api.get("/sku-positions", { params: { branch_code } });
        return response.data;
    } catch (error) {
        return error;
    }
};

export const addTemplate = async (newItem) => {
    try {
        const response = await api.post("/sku-positions", newItem);
        return {
            success: response.success,
            data: response.data,
            message: response.message
        };
    } catch (error) {
        return error;
    }
};

export const deleteTemplate = async (product) => {
    try {
        await api.delete("/sku-positions", {
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

export const updateProducts = async (data) => {
    try {
        const response = await api.put("/sku-positions/bulk", data);
        return {
            success: response.success,
            data: response.data,
            message: response.message
        };
    } catch (error) {
        return error;
    }
};


export const getMasterItem = async (q) => {
    try {
        const response = await api.get("/master-items", { params: { q } });
        return response.data; 
    } catch (error) {
        return error;
    }
};

export const getShelfDashboardSummary = async () => {
    try {
        const response = await api.get("/dashboards/shelf-summary");
        return {
            rows: response.data,
            ...response.meta
        };
    } catch (error) {
        return error;
    }
};

export const getShelfDashboardShelfSales = async (branch_code) => {
    try {
        const response = await api.get("/dashboards/shelf-sales", {
            params: { branch_code },
        });
        return response.data;
    } catch (error) {
        return error;
    }
};

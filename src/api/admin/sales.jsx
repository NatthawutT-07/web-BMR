
// ------------------------------------------------
// GET: รายการสาขา

import api from "../../utils/axios";

// ------------------------------------------------
export const fetchBranchListSales = async () => {
    try {
        const response = await api.get("/sales-list-branch");
        return response.data;
    } catch (error) {
        return error;
    }
};

// ------------------------------------------------
// POST: Sales Summary by Branch
// ------------------------------------------------
export const fetchBranchSales = async (branchCode) => {
    try {
        const res = await api.post("/sales-search-branch", {
            branch_code: branchCode,
        });

        return res.data;
    } catch (error) {
        throw error;
    }
};

// ------------------------------------------------
// POST: Sales per Day
// ------------------------------------------------
export const fetchBranchSalesDay = async (branchCode, date) => {
    try {
        const res = await api.post("/sales-search-branch-day", {
            branch_code: branchCode,
            date,
        });

        return res.data;
    } catch (error) {
        throw error;
    }
};

// ------------------------------------------------
// POST: Month → Products Summary
// ------------------------------------------------
export const fetchBranchSalesMonthProduct = async (branchCode, date) => {
    try {
        const res = await api.post("/sales-search-branch-monthproduct", {
            branch_code: branchCode,
            date,
        });

        return res.data;
    } catch (error) {
        throw error;
    }
};

// ------------------------------------------------
// POST: Day → Products Summary
// ------------------------------------------------
export const fetchBranchSalesDayProduct = async (branchCode, date) => {
    try {
        const res = await api.post("/sales-search-branch-dayproduct", {
            branch_code: branchCode,
            date,
        });

        return res.data;
    } catch (error) {
        throw error;
    }
};


// ------------------------------------------------
// GET: Search product (by name/code/brand)
// ------------------------------------------------
export const searchSalesProduct = async (keyword) => {
    try {
        const res = await api.get("/sales-product", {
            params: { q: keyword },
        });
        return res.data; // { total, items: [...] }
    } catch (error) {
        throw error;
    }
};

// ------------------------------------------------
// POST: Product sales detail (single product)
// ------------------------------------------------
export const fetchSalesProductDetail = async ({ productId, start, end }) => {
    try {
        const res = await api.post("/sales-product-detail", {
            productId,
            start,
            end,
        });
        return res.data; // { product, range, rows }
    } catch (error) {
        throw error;
    }
};


// ------------------------------------------------
// POST: Member sales summary / detail
// - ถ้าส่ง customerId => detail mode
// - ถ้าไม่ส่ง => summary mode
// ------------------------------------------------
export const fetchSalesMember = async ({ start, end, customerId }) => {
    try {
        const res = await api.post("/sales-member", {
            startDate: start,
            endDate: end,
            ...(customerId ? { customerId } : {}),
        });
        return res.data;
    } catch (error) {
        throw error;
    }
};

// ------------------------------------------------
// GET: Bill Items (รายการสินค้าในบิล)
// ------------------------------------------------
export const fetchBillItems = async (billId) => {
    try {
        const res = await api.get(`/sales-bill-items/${billId}`);
        return res.data;
    } catch (error) {
        throw error;
    }
};
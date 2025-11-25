import axios from "axios";


export const fetchBranchListSales = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales-list-branch`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        // console.error("❌ Error fetching detail station:", error);
        return error;
    }
};

export const fetchBranchSales = async (token, branchCode) => {
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/sales-search-branch`,
            { branch_code: branchCode },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        // console.error("❌ Error fetching branch sales:", error);
        throw error;
    }
};

export const fetchBranchSalesDay = async (token, branchCode, date) => {
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/sales-search-branch-day`,
            {
                branch_code: branchCode,
                date
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        // console.error("❌ Error fetching branch sales:", error);
        throw error;
    }
};

export const fetchBranchSalesMonthProduct = async (token, branchCode, date) => {
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/sales-search-branch-monthproduct`,
            {
                branch_code: branchCode,
                date
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        // console.error("❌ Error fetching branch sales:", error);
        throw error;
    }
};

export const fetchBranchSalesDayProduct = async (token, branchCode, date) => {
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/sales-search-branch-dayproduct`,
            {
                branch_code: branchCode,
                date
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        // console.error("❌ Error fetching branch sales:", error);
        throw error;
    }
};

import axios from 'axios';

export const getTemplate = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shelf-Template`, {
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

export const getSKU = async (token, branchCode) => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/shelf-sku`,
            { branchCode },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        // console.error('❌ Error fetching shelf detail:', error);
        return error;
    }
};


// ✅ Add Template
export const addTemplate = async (token, newItem) => {
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/shelf-add`,
            newItem,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        // console.error("❌ Error adding product:", error);
        return error;
    }
};

// ✅ Delete Template
export const deleteTemplate = async (token, product) => {
    try {
        await axios.delete(
            `${import.meta.env.VITE_API_URL}/api/shelf-delete`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                data: {
                    branchCode: product.branchCode,
                    shelfCode: product.shelfCode,
                    rowNo: product.rowNo,
                    codeProduct: product.codeProduct,
                    index: product.index,
                },
            }
        );
    } catch (error) {
        // console.error("❌ Error deleting product:", error);
        return error;
    }
};

export const updateProducts = async (token, data) => {
    try {
        const res = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/shelf-update`,
            data, 
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return res.data;
    } catch (error) {
        // console.error("❌ Error updating shelf:", error);
        return error;
    }
};

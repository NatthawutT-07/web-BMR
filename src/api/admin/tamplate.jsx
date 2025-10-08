import axios from 'axios';

export const getTamplate = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shelf-tamplate`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching detail station:", error);
        throw error;
    }
};

export const getItemSearch = async (token, branchCode) => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/shelf-itemsearch`,
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
        console.error('❌ Error fetching shelf detail:', error);
        throw error;
    }
};

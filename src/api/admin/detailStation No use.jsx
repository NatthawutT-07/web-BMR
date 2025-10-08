import axios from 'axios';

export const getShelfRow = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shelf-row`, {
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

export const getShelfDetail = async (token, branchCode) => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/shelf-detail`,
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

// Add new detail station
export const addShelfProduct = async (token, payload) => {
    try {
        return axios.post(`${import.meta.env.VITE_API_URL}/api/shelf-create`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

    } catch (error) {
        console.error("❌ Error adding detail station:", error);
        throw error;
    }
};





// Delete detail station by id
export const deleteDetailStation = async (token, id) => {
    try {
        axios.delete(`${import.meta.env.VITE_API_URL}/api/detail-delete/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

    } catch (error) {
        console.error("❌ Error deleting detail station:", error);
        throw error;
    }
};

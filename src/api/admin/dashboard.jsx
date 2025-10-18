import axios from 'axios';

export const getData = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard-data`, {
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

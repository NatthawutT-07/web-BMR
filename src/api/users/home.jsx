import axios from 'axios';


export const listStation = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/station-list`, {
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


export const callsta = async () => {
  return axios.get(`${import.meta.env.VITE_API_URL}/api/detailuser`);
};




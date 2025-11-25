import axios from 'axios';


export const getTemplateAndProduct = async (token, branchCode) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/template-item`,
            { branchCode },
            {
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




import axios from "axios";

// ✅ Delete station by ID
export const deleteStation = async (token, id) => {
    try {
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/station-delete/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("❌ Error deleting station:", error);
        throw error;
    }
};

// ✅ Add new station
export const addStation = async (token, value) => {
    try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/station-add`, value, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("❌ Error adding station:", error);
        throw error;
    }
};


export const updateStation = async (token, station) => {
    try {
        const res = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/station-update/${station.id}`,
            {
                id: station.id,
                codeSAP: station.codeSAP,
                codeADA: station.codeADA,
                codeBMX: station.codeBMX,
                adaStore: station.adaStore,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        console.error("❌ Error updating station:", error);
        throw error;
    }
};



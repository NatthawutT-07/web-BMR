import axios from "axios";

export const fetchStationsData = async (token) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/post`, {
            headers: {
                'Authorization': `Bearer ${token}`, // เพิ่ม token ใน header
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching stations:', error);
        throw new Error('Failed to fetch station data');
    }
};


export const uploadStationCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-stations`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading Station CSV:', error);
        throw new Error('Failed to upload Station CSV');
    }
};


export const uploadItemCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-itemminmax`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading ItemMinMax CSV:', error);
        throw new Error('Failed to upload ItemMinMax CSV');
    }
};

export const uploadPartnersCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-partners`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading ItemMinMax CSV:', error);
        throw new Error('Failed to upload ItemMinMax CSV');
    }

}; export const uploadMasterItemCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-masteritem`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading MasterItem CSV:', error);
        throw new Error('Failed to upload MasterItem CSV');
    }
};


export const uploadSalesCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-sales`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading MasterItem CSV:', error);
        throw new Error('Failed to upload MasterItem CSV');
    }
};

export const uploadStockCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-stock`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading MasterItem CSV:', error);
        throw new Error('Failed to upload MasterItem CSV');
    }
};

export const uploadWithdrawCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-withdraw`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading MasterItem CSV:', error);
        throw new Error('Failed to upload MasterItem CSV');
    }
};

export const uploadTamplateCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-tamplate`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading MasterItem CSV:', error);
        throw new Error('Failed to upload MasterItem CSV');
    }
};

export const uploadItemSearchCSV = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-itemsearch`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading MasterItem CSV:', error);
        throw new Error('Failed to upload MasterItem CSV');
    }
};
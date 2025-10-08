import axios from "axios";

export const getPartner = async (token) => {
  return axios.get(`${import.meta.env.VITE_API_URL}/api/partner`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
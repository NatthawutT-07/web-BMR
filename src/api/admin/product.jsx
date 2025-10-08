import axios from "axios";

export const getProduct = async (token) => {
  return axios.get(`${import.meta.env.VITE_API_URL}/api/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
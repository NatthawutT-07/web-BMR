import axios from "axios";

export const getManageUser = async (token) => {
  return axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeUserStatus = async (token, value) => {
  return axios.post(`${import.meta.env.VITE_API_URL}/api/change-status`, value, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeUserRole = async (token, value) => {
  return axios.post(`${import.meta.env.VITE_API_URL}/api/change-role`, value, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

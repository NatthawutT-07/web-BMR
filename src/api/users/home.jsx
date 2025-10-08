import axios from 'axios';

export const listStation = async () => {
  return axios.get(`${import.meta.env.VITE_API_URL}/api/post`);
};

export const callsta = async () => {
  return axios.get(`${import.meta.env.VITE_API_URL}/api/detailuser`);
};




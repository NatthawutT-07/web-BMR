import axios from "axios";

export const currentUser = async (token) =>
  await axios.post(
    `http://localhost:5001/api/current-user`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

export const currentAdmin = async (token) =>
  await axios.post(
    `http://localhost:5001/api/current-admin`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // ${import.meta.env.VITE_API_URL}

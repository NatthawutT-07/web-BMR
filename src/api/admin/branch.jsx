import api from "../../utils/axios";

export const getBranches = async () => {
  const res = await api.get("/branches");
  return res.data;
};

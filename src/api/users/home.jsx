import api from "../../utils/axios";

export const getTemplateAndProduct = async (branchCode) => {
  const res = await api.post("/template-item", { branchCode });
  return res.data;
};

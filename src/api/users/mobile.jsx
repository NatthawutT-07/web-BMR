import api from "../../utils/axios";

export const lookupByBarcode = async (branch_code, barcode) => {
  const res = await api.get("/lookup", { params: { branch_code, barcode } });
  return res.data; 
};

export const getShelfBlocks = async (branch_code, shelf_code) => {
  const res = await api.get("/shelf-blocks", { params: { branch_code, shelf_code } });
  return res.data; 
};

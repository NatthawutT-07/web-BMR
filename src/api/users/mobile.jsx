// src/api/users/mobile.jsx
import api from "../../utils/axios";

export const lookupByBarcode = async (branch_code, barcode) => {
  const res = await api.get("/lookup", { params: { branch_code, barcode } });
  return res.data; // { found, product, locations, reason }
};

export const getShelfBlocks = async (branch_code, shelfCode) => {
  const res = await api.get("/shelf-blocks", { params: { branch_code, shelfCode } });
  return res.data; // { shelf, rows: [{rowNo, items:[]}] }
};

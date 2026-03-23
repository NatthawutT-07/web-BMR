// src/api/users/mobile.jsx
import api from "../../utils/axios";

export const lookupByBarcode = async (branchCode, barcode) => {
  const res = await api.get("/lookup", { params: { branchCode, barcode } });
  return res.data; // { found, product, locations, reason }
};

export const getShelfBlocks = async (branchCode, shelfCode) => {
  const res = await api.get("/shelf-blocks", { params: { branchCode, shelfCode } });
  return res.data; // { shelf, rows: [{rowNo, items:[]}] }
};

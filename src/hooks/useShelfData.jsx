import { useEffect, useState } from "react";
import { listStation } from "../api/users/home";
import { getItemSearch, getTamplate } from "../api/admin/tamplate";

export default function useShelfData(token) {
  const [branches, setBranches] = useState([]);
  const [tamplate, setTamplate] = useState([]);
  const [product, setProduct] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      listStation().then((res) => setBranches(res.data));
      fetchTamplate();
    }
  }, [token]);

  const fetchTamplate = async () => {
    setLoading(true);
    try {
      const res = await getTamplate(token);
      setTamplate(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async (branchCode) => {
    setLoading(true);
    try {
      const res = await getItemSearch(token, branchCode);
      setProduct(res);
    } finally {
      setLoading(false);
    }
  };

  return {
    branches,
    tamplate,
    product,
    loading,
    fetchProduct
  };
}

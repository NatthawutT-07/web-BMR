import { useEffect, useState } from "react";
import { listStation } from "../api/users/home";
import { getSKU, getTemplate } from "../api/admin/template";

export default function useShelfData(token) {
  const [branches, setBranches] = useState([]);
  const [template, setTemplate] = useState([]);
  const [product, setProduct] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      listStation(token).then(res => {
        //  console.log("API response:", res); 
        setBranches(Array.isArray(res) ? res : []);
      });

      fetchTemplate();
    }
  }, [token]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await getTemplate(token);
      setTemplate(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async (branchCode) => {
    setLoading(true);
    try {
      const res = await getSKU(token, branchCode);
      setProduct(res);
    } finally {
      setLoading(false);
    }
  };

  return {
    branches,
    template,
    product,
    loading,
    fetchProduct
  };
}

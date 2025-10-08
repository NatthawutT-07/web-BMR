import React, { useState, useEffect } from "react";
import useBmrStore from "../../store/bmr_store";
import { getProduct } from "../../api/admin/product";

const ListItemHold = () => {
  const token = useBmrStore((state) => state.token);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (token) {
      handleGetProducts(token);
    }
  }, [token]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, statusFilter, items]);

  const handleGetProducts = async (token) => {
    setLoading(true);
    try {
      const res = await getProduct(token);
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    if (statusFilter !== "All") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        `${item.codeProduct} ${item.nameProduct} `.toLowerCase().includes(q)
      // `${item.codeProduct} ${item.nameProduct} ${item.barcode}`
      );
    }

    setFilteredItems(filtered);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans text-gray-800">
      <h2 className="text-2xl font-semibold mb-6">List Item</h2>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 gap-4">
        <input
          type="text"
          placeholder="🔍 Search Code Product / Name Product  "
          className="flex-grow border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="border border-gray-300 rounded px-4 py-2 w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">ALL</option>
          <option value="Hold">Hold</option>
          <option value="Active">Active</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-600">Loading...</div>
      ) : (
        <div className="overflow-y-auto max-h-[600px] border border-gray-300 rounded shadow-sm">
          <table className="min-w-full table-auto text-xs border-collapse">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="border px-2 py-1 text-center w-10">#</th>
                <th className="border px-2 py-1 text-center w-24">Code</th>
                <th className="border px-2 py-1 w-[500px] text-center whitespace-nowrap">NameItem</th>
                <th className="border px-2 py-1 text-center w-40">GroupItem</th>
                <th className="border px-2 py-1 text-center w-24">Status</th>
                <th className="border px-2 py-1 w-[500px] text-center whitespace-nowrap">Barcode</th>
                <th className="border px-2 py-1 w-[500px] text-center whitespace-nowrap">NameBrand</th>
                <th className="border px-2 py-1 w-[500px] text-center whitespace-nowrap">ConsingItem</th>
                <th className="border px-2 py-1 text-center w-32">PurchasePriceExcVAT</th>
                <th className="border px-2 py-1 text-center w-32">SalesPriceIncVAT</th>
                <th className="border px-2 py-1 text-center w-32">PreferredVandorCode</th>
                <th className="border px-2 py-1 text-center w-40">PreferredVandorName</th>
                <th className="border px-2 py-1 text-center w-20">GP</th>
                <th className="border px-2 py-1 text-center w-20">ShelfLife</th>
                <th className="border px-2 py-1 text-center w-32">ProductionDate</th>
                <th className="border px-2 py-1 text-center w-32">VatGroupPu</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="16" className="text-center py-6 text-gray-500">
                    Not Found Data
                  </td>
                </tr>
              ) : (
                filteredItems.slice(0, 50).map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-100 even:bg-gray-50 text-[13px]"
                  >
                    <td className="border px-2 py-1">{index + 1}</td>
                    <td className="border px-2 py-1 text-center">{item.codeProduct}</td>
                    <td className="border px-2 py-1 text-left whitespace-nowrap">{item.nameProduct}</td>
                    <td className="border px-2 py-1">{item.groupName}</td>
                    <td className="border px-2 py-1 text-center">{item.status}</td>
                    <td className="border px-2 py-1 text-left whitespace-nowrap">{item.barcode}</td>
                    <td className="border px-2 py-1 text-left whitespace-nowrap">{item.nameBrand}</td>
                    <td className="border px-2 py-1 text-left whitespace-nowrap">{item.consingItem}</td>
                    <td className="border px-2 py-1 text-center">{item.purchasePriceExcVAT}</td>
                    <td className="border px-2 py-1 text-center">{item.salesPriceIncVAT}</td>
                    <td className="border px-2 py-1 text-center">{item.preferredVandorCode}</td>
                    <td className="border px-2 py-1">{item.preferredVandorName}</td>
                    <td className="border px-2 py-1 text-center">{item.GP}</td>
                    <td className="border px-2 py-1 text-center">{item.shelfLife}</td>
                    <td className="border px-2 py-1 text-center">{item.productionDate}</td>
                    <td className="border px-2 py-1 text-center">{item.vatGroupPu}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListItemHold;

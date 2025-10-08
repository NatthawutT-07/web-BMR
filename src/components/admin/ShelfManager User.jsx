import React, { useEffect, useState } from 'react';
import useBmrStore from '../../store/bmr_store';
import { listStation } from '../../api/users/home';
import { getItemSearch, getTamplate } from '../../api/admin/tamplate';

const ShelfManager = () => {
  const token = useBmrStore((state) => state.token);
  const [branches, setBranches] = useState([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [tamplate, setTamplate] = useState([]);
  const [filteredTamplate, setFilteredTamplate] = useState([]);
  const [product, setProduct] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShelves, setSelectedShelves] = useState([]); // ✅ shelfCode filter

  useEffect(() => {
    if (token) {
      fetchBranches();
      fetchTamplate(token);
    }
  }, [token]);

  const fetchBranches = () => {
    listStation()
      .then((res) => setBranches(res.data))
      .catch((err) => console.error('Error fetching branches:', err));
  };

  const fetchTamplate = async (token) => {
    setLoading(true);
    try {
      const res = await getTamplate(token);
      setTamplate(res);
    } catch (err) {
      console.error('❌ Error fetching shelf data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const matched = tamplate.filter(
      (item) => String(item.branchCode) === String(selectedBranchCode)
    );
    setFilteredTamplate(matched);

    if (!matched.length) {
      setProduct([]);
      setLoading(false);
      return;
    }

    try {
      const res = await getItemSearch(token, selectedBranchCode);
      setProduct(res);
    } catch (err) {
      console.error('❌ Error fetching shelf Detail:', err);
      setProduct([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleShelfFilter = (code) => {
    setSelectedShelves((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };
  const handleClearFilter = () => {
    setSelectedShelves([]);
  };


  // ✅ Apply shelf filter
  const displayedTemplates = selectedShelves.length
    ? filteredTamplate.filter((t) => selectedShelves.includes(t.shelfCode))
    : filteredTamplate;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Select Branch */}
      <form onSubmit={handleSubmit} className="mb-4">
        <label htmlFor="branches" className="block mb-2 font-medium text-gray-700">
          Select Branch
        </label>
        <div className="flex items-center space-x-2">
          <select
            id="branches"
            name="branches"
            value={selectedBranchCode}
            onChange={(e) => setSelectedBranchCode(e.target.value)}
            className="border border-gray-300 rounded p-2 w-200"
          >
            <option value="">-- Select Branch --</option>
            {branches.map((branch, id) => (
              <option key={branch.codeADA ?? id} value={branch.codeADA}>
                {id + 1}. {branch.adaStore} - {branch.codeSAP}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && <p className="text-center mt-4 text-gray-600">⏳ Loading data...</p>}

      {/* Filter by ShelfCode */}
      {filteredTamplate.length > 0 && (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">🗂 Filter by Shelf</label>

          <div className="flex flex-wrap gap-4 mb-2">
            {[...new Set(filteredTamplate.map(t => t.shelfCode))].map((shelfCode) => (
              <label key={shelfCode} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedShelves.includes(shelfCode)}
                  onChange={() => toggleShelfFilter(shelfCode)}
                />
                <span>{shelfCode}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleClearFilter}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
          >
            ❌ Clear Filter
          </button>
        </div>
      )}

      {/* Display Shelf Cards */}
      {displayedTemplates.map((template) => {
        const shelfProducts = product
          .filter((p) => p.shelfCode === template.shelfCode)
          .sort((a, b) => Number(a.index) - Number(b.index));

        let totalSalesShelf = 0;
        let totalWithdrawShelf = 0;

        return (
          <div key={template.id} className="border rounded shadow-md p-4 mb-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">
              Shelf: {template.shelfCode} - {template.fullName} ({template.rowQty} Rows)
            </h2>

            {shelfProducts.length > 0 ? (
              <table className="w-full text-left border text-gray-700 border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1 text-center">ID</th>
                    <th className="border px-2 py-1 text-center">Code</th>
                    <th className="border px-2 py-1 text-center">Name</th>
                    <th className="border px-2 py-1 text-center">Brand</th>
                    <th className="border px-2 py-1 text-center">ShelfLife</th>
                    <th className="border px-2 py-1 text-center">RSP</th>
                    <th className="border px-2 py-1 text-center">SalesQty</th>
                    <th className="border px-2 py-1 text-center">Wd Qty</th>
                    <th className="border px-2 py-1 text-center">MIN</th>
                    <th className="border px-2 py-1 text-center">MAX</th>
                    <th className="border px-2 py-1 text-center">StockQty</th>
                    <th className="border px-2 py-1 text-center">UnitCost</th>
                    <th className="border px-2 py-1 text-center">StockCost</th>
                    <th className="border px-2 py-1 text-center">SalesAmount</th>
                    <th className="border px-2 py-1 text-center">Wd Amount</th>
                    <th className="border px-2 py-1 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(template.rowQty)].map((_, rowIndex) => {
                    const rowNo = rowIndex + 1;
                    const rowProducts = shelfProducts.filter((p) => p.rowNo === rowNo);

                    let totalSalesRow = 0;
                    let totalWithdrawRow = 0;

                    return (
                      <React.Fragment key={rowNo}>
                        {/* Row header */}
                        <tr className="bg-blue-50">
                          <td className="p-2 border font-semibold italic text-gray-700" colSpan={16}>
                            ➤ Row: {rowNo}
                          </td>
                        </tr>

                        {/* ถ้ามี product ใน row */}
                        {rowProducts.length > 0 ? (
                          rowProducts.map((prod) => {
                            const sales = Number(prod?.salesTotalPrice ?? 0);
                            const withdraw = Number(prod?.withdrawValue ?? 0);
                            totalSalesRow += sales;
                            totalWithdrawRow += withdraw;

                            totalSalesShelf += sales;
                            totalWithdrawShelf += withdraw;

                            const stockCost = (prod?.stockQuantity && prod?.purchasePriceExcVAT)
                              ? prod.stockQuantity * prod.purchasePriceExcVAT
                              : 0;

                            return (
                              <tr key={prod.codeProduct}>
                                <td className="p-2 border text-center">{prod.index}</td>
                                <td className="p-2 border">{String(prod.codeProduct).padStart(5, '0')}</td>
                                <td className="p-2 border">{prod?.nameProduct ?? '-'}</td>
                                <td className="p-2 border">{prod?.nameBrand ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.shelfLife ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.salesPriceIncVAT ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.salesQuantity ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.withdrawQuantity ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.minStore ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.maxStore ?? '-'}</td>
                                <td className="p-2 border text-center">{prod?.stockQuantity ?? '-'}</td>
                                <td className="p-2 border text-right">{(prod?.purchasePriceExcVAT).toFixed(2) ?? '-'}</td>
                                <td className="p-2 border text-right">{stockCost ? stockCost.toFixed(2) : '-'}</td>
                                <td className="p-2 border text-right">{prod?.salesTotalPrice ?? '-'}</td>
                                <td className="p-2 border text-right">{prod?.withdrawValue ?? '-'}</td>
                                <td className="border px-2 text-center">
                                  <button className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="p-2 border text-center text-gray-500 italic" colSpan={16}>
                              No products in this Row
                            </td>
                          </tr>
                        )}

                        {/* Total per row */}
                        <tr className="bg-gray-100 font-semibold">
                          <td className="p-2 border" colSpan={11}></td>
                          <td className="p-2 border text-right" colSpan={2}>Total for Row {rowNo}</td>
                          <td className="p-2 border text-green-700  text-right">{totalSalesRow.toFixed(2)}</td>
                          <td className="p-2 border text-orange-600  text-right">{totalWithdrawRow.toFixed(2)}</td>
                          <td className="p-2 border" />
                        </tr>
                      </React.Fragment>
                    );
                  })}

                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">No products in this shelf.</p>
            )}

            {/* ✅ Total of shelf (bottom) */}
            <div className="text-right font-bold text-blue-700 mt-4 space-y-1">
              <p>💰 Total Sales Amount for Shelf: <span className="text-green-700">{totalSalesShelf.toFixed(2)}</span></p>
              <p>📦 Total Withdraw Amount for Shelf: <span className="text-orange-600">{totalWithdrawShelf.toFixed(2)}</span></p>
            </div>
          </div>
        );
      })}




    </div>
  );
};

export default ShelfManager;

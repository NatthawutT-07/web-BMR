import React, { useState, useEffect } from "react";
import { calcTotalSales, calcTotalStockCost, calcTotalWithdraw } from "../../../../../utils/shelfUtils";

// ================= Delete Confirm Modal =================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, productName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Delete <span className="font-semibold">"{productName}"</span>?
          <br />
          <span className="text-red-600 text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= Add Product Modal =================
const AddProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  nextIndex,
  branchCode,
  shelfCode,
  rowNo,
  shelfProducts = [],
}) => {
  const [codeProduct, setCodeProduct] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCodeProduct("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!codeProduct.trim()) {
      setError("กรุณากรอกรหัสสินค้า");
      return;
    }

    const codeNum = parseInt(codeProduct, 10);
    if (isNaN(codeNum)) {
      setError("กรุณากรอกรหัสสินค้าให้ถูกต้อง");
      return;
    }

    const isDuplicate = shelfProducts.some(
      (p) => parseInt(p.codeProduct, 10) === codeNum
    );

    if (isDuplicate) {
      setError("❌ รหัสสินค้านี้มีอยู่แล้วใน Shelf นี้");
      return;
    }

    onSubmit({
      codeProduct: codeNum,
      index: nextIndex,
      branchCode,
      rowNo,
      shelfCode,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">➕ New Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Product : xxxxx
            </label>
            <input
              type="number"
              value={codeProduct}
              onChange={(e) => setCodeProduct(e.target.value)}
              placeholder="Code Item"
              className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 focus:outline-none ${error ? "border-red-300" : ""}`}
            />
            {error && <span className="text-red-600 text-sm mt-1">{error}</span>}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>BranchCode: <span className="font-semibold">{branchCode}</span></p>
            <p>Index (Auto): <span className="font-semibold">{nextIndex}</span></p>
            <p>ShelfCode: <span className="font-semibold">{shelfCode}</span></p>
            <p>Row: <span className="font-semibold">{rowNo}</span></p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShelfTable = ({ rows, shelfProducts, onDelete, onAdd, shelfCode, branchCode }) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });
  const [addModal, setAddModal] = useState({ isOpen: false, rowNo: null });

  const handleAddClick = (rowNo) => {
    const rowProducts = shelfProducts.filter((p) => p.rowNo === rowNo);
    const maxIndexInRow = Math.max(0, ...rowProducts.map((p) => p.index ?? 0));
    setAddModal({ isOpen: true, rowNo, nextIndex: maxIndexInRow + 1 });
  };

  const handleAddSubmit = (newItem) => onAdd && onAdd(newItem);

  const handleDeleteClick = (product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.product && onDelete) {
      onDelete(deleteModal.product);
    }
    setDeleteModal({ isOpen: false, product: null });
  };

  // Calculate the total values for the whole table (sum across all rows)
  const totalSales = shelfProducts.reduce((sum, prod) => sum + (prod.salesTotalPrice || 0), 0);
  const totalWithdraw = shelfProducts.reduce((sum, prod) => sum + (prod.withdrawValue || 0), 0);
  const totalStockCost = shelfProducts.reduce(
    (sum, prod) => sum + ((prod.stockQuantity ?? 0) * (prod.purchasePriceExcVAT ?? 0)),
    0
  );

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString(); // ใช้ toLocaleString เพื่อให้มีเครื่องหมายคั่นหลักพัน
  };

  return (
    <>
      <AddProductModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ isOpen: false, rowNo: null })}
        onSubmit={handleAddSubmit}
        nextIndex={addModal.nextIndex}
        branchCode={branchCode}
        shelfCode={shelfCode}
        rowNo={addModal.rowNo}
        shelfProducts={shelfProducts}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleConfirmDelete}
        productName={deleteModal.product?.nameProduct || ""}
      />

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left border text-gray-700 border-gray-300 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">ID</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Barcode</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Code</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap w-40">Name</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap w-28">Brand</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">ShelfLife</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">RSP</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Sales Qty</th>
              <th className="border px-0.5 py-1 text-center w-10">Withdraw Qty</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">MIN</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">MAX</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Stock Qty</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Unit Cost</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Stock Cost</th>
              <th className="border px-0.5 py-1 text-center w-20">Sales Amount</th>
              <th className="border px-0.5 py-1 text-center w-20">Withdraw Amount</th>
              <th className="border px-0.5 py-1 text-center whitespace-nowrap">Delete</th>
            </tr>
          </thead>

          <tbody>
            {[...Array(Number(rows) || 0)].map((_, rowIndex) => {
              const rowNo = rowIndex + 1;
              const rowProducts = shelfProducts.filter((p) => p.rowNo === rowNo);
              const totalStockCostRow = calcTotalStockCost(rowProducts);
              const totalSalesRow = calcTotalSales(rowProducts);
              const totalWithdrawRow = calcTotalWithdraw(rowProducts);
              const zeroToDash = (v) => (v === 0 || v === "0" ? "-" : v ?? "-");

              return (
                <React.Fragment key={`row-${rowNo}`}>
                  {/* Row Header */}
                  <tr className="bg-blue-50">
                    <td colSpan={16} className="p-2 border font-semibold italic text-gray-700 whitespace-nowrap">
                      ➤ Row: {rowNo}
                    </td>
                    <td className="p-2 border text-center whitespace-nowrap">
                      <button
                        title="Add new Item"
                        onClick={() => handleAddClick(rowNo)}
                        className="px-3 py-1 bg-green-400 text-white rounded hover:bg-green-600 whitespace-nowrap"
                      >
                        ➕
                      </button>
                    </td>
                  </tr>

                  {rowProducts.length > 0 ? (
                    rowProducts.map((prod, i) => {
                      const rowKey = `prod-${prod.branchCode}-${prod.shelfCode}-${prod.rowNo}-${prod.codeProduct}-${prod.index}`;
                      const stockCost = (prod.stockQuantity ?? 0) * (prod.purchasePriceExcVAT ?? 0);
                      const zebra = i % 2 === 0 ? "bg-white" : "bg-gray-50";

                      return (
                        <tr key={rowKey} className={zebra}>
                          <td className="p-2 border text-center whitespace-nowrap">{prod.index}</td>
                          <td className="p-2 border text-center whitespace-nowrap">{prod.barcode}</td>
                          <td className="p-2 border whitespace-nowrap">{String(prod.codeProduct).padStart(5, "0")}</td>
                          <td className="p-2 border whitespace-nowrap">{prod.nameProduct ?? "-"}</td>
                          <td className="p-2 border whitespace-nowrap">{prod.nameBrand ?? "-"}</td>
                          <td className="p-2 border text-center whitespace-nowrap">{prod.shelfLife ?? "-"}</td>
                          <td className="p-2 border text-center whitespace-nowrap">{prod.salesPriceIncVAT ?? "-"}</td>

                          <td className="p-2 border text-center text-green-600 whitespace-nowrap">
                            {prod.salesQuantity || "-"}
                          </td>

                          <td className="p-2 border text-center text-red-600 whitespace-nowrap">
                            {prod.withdrawQuantity || "-"}
                          </td>

                          <td className="p-2 border text-center whitespace-nowrap">{prod.minStore ?? "-"}</td>
                          <td className="p-2 border text-center whitespace-nowrap">{prod.maxStore ?? "-"}</td>

                          <td className="p-2 border text-center text-yellow-800 whitespace-nowrap">
                            {prod.stockQuantity ?? "-"}
                          </td>

                          <td className="p-2 border text-right whitespace-nowrap">
                            {/* {formatNumber(prod.purchasePriceExcVAT) ?? "-"} */}
                          </td>

                          <td className="p-2 border text-right text-yellow-500 whitespace-nowrap">
                            {/* {formatNumber(stockCost) ?? "-"} */}
                          </td>

                          <td className="p-2 border text-right text-green-600 whitespace-nowrap">
                            {prod.salesTotalPrice != null ? Number(prod.salesTotalPrice).toFixed(2) : "-"}
                          </td>
                          <td className="p-2 border text-right text-red-600 whitespace-nowrap">
                            {formatNumber(prod.withdrawValue) ?? "-"}
                          </td>

                          <td className="border px-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteClick(prod)}
                              className="text-red-600 hover:text-red-800 hover:underline transition whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={16} className="p-2 border text-center text-gray-500 italic whitespace-nowrap">
                        No products in this Row
                      </td>
                    </tr>
                  )}

                  {/* Row Total */}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={11} className="p-2 border whitespace-nowrap"></td>
                    <td colSpan={2} className="p-2 border text-right whitespace-nowrap">
                      Total for Row {rowNo}
                    </td>

                    <td className="p-2 border text-yellow-600 text-right whitespace-nowrap">
                      {formatNumber(totalStockCostRow)}
                    </td>

                    <td className="p-2 border text-green-700 text-right whitespace-nowrap">
                      {formatNumber(totalSalesRow)}
                    </td>

                    <td className="p-2 border text-orange-600 text-right whitespace-nowrap">
                      {formatNumber(totalWithdrawRow)}
                    </td>

                    <td className="p-2 border whitespace-nowrap"></td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* Total for all rows */}
            <tr className="bg-gray-200 font-semibold">
              <td colSpan={13} className="p-2 border text-right whitespace-nowrap">
                Total for All Rows
              </td>

              <td className="p-2 border text-yellow-600 text-right text-sm whitespace-nowrap">
                {formatNumber(totalStockCost)}
              </td>

              <td className="p-2 border text-green-700 text-right text-sm whitespace-nowrap">
                {formatNumber(totalSales)}
              </td>

              <td className="p-2 border text-orange-600 text-right text-sm whitespace-nowrap">
                {formatNumber(totalWithdraw)}
              </td>

              <td className="p-2 border whitespace-nowrap"></td>
            </tr>

          </tbody>
        </table>
      </div>

    </>
  );
};

export default ShelfTable;


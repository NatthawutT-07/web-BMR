import React, { useState, useEffect } from "react";
import { calcTotalSales, calcTotalWithdraw } from "../../../utils/shelfUtils";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, productName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Delete  <span className="font-semibold">" {productName} "</span> ???
          <br />
          <span className="text-red-600 text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


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

    // 🔍 ตรวจซ้ำเฉพาะรหัสสินค้าทั้ง shelf
    const isDuplicate = shelfProducts.some(
      (p) => parseInt(p.codeProduct, 10) === codeNum
    );

    if (isDuplicate) {
      setError("❌ รหัสสินค้านี้มีอยู่แล้วใน Shelf นี้");
      return;
    }

    // ✅ ถ้าไม่ซ้ำ และไม่ว่าง → ส่ง API ได้
    onSubmit({
      codeProduct: codeNum,
      index: nextIndex,
      branchCode,
      rowNo,
      shelfCode,
    });

    // ปิด modal และล้างค่า
    setCodeProduct("");
    setError("");
    onClose();
  };

  const handleChange = (e) => {
    setCodeProduct(e.target.value);
    if (error) setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">➕ New Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Product : xxxxx
            </label>
            <input
              type="number"
              value={codeProduct}
              onChange={handleChange}
              placeholder="Code Item"
              className={`w-full border rounded px-3 py-2 focus:ring focus:ring-green-100 focus:outline-none ${error ? "border-red-200" : ""
                }`}
              required
            />
            {error && <span className="text-red-600 text-sm mt-1">{error}</span>}
          </div>

          <div className="text-sm text-gray-600">
            <p>BranchCode: <span className="font-semibold">{branchCode}</span></p>
            <p>Index (Auto): <span className="font-semibold">{nextIndex}</span></p>
            <p>ShelfCode: <span className="font-semibold">{shelfCode}</span></p>
            <p>Row: <span className="font-semibold">{rowNo}</span></p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ShelfTable = ({ rows, shelfProducts, onDelete, onAdd, shelfCode }) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });
  const [addModal, setAddModal] = useState({ isOpen: false, rowNo: null });
  const [branchCode, setBranchCode] = useState("");

  if (!shelfProducts || shelfProducts.length === 0) {
    return <p className="text-gray-500 italic">No products in this shelf.</p>;
  }

  // 🆕 
  const handleAddClick = (rowNo) => {
    const branchFromPrev = shelfProducts?.[0]?.branchCode ?? "";
    const rowProducts = shelfProducts.filter((p) => p.rowNo === rowNo);
    const maxIndexInRow = Math.max(0, ...rowProducts.map((p) => p.index ?? 0));

    setBranchCode(branchFromPrev);
    setAddModal({
      isOpen: true,
      rowNo,
      nextIndex: maxIndexInRow + 1,
    });
  };

  const handleAddSubmit = (newItem) => {
    if (onAdd) onAdd(newItem);
  };

  const handleDeleteClick = (product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.product && onDelete) {
      const product = {
        branchCode: deleteModal.product.branchCode,
        codeProduct: deleteModal.product.codeProduct,
        shelfCode: deleteModal.product.shelfCode,
        rowNo: deleteModal.product.rowNo,
        index: deleteModal.product.index,
      };

      onDelete(product);
    }
    setDeleteModal({ isOpen: false, product: null });
  };

  const handleCloseModal = () => setDeleteModal({ isOpen: false, product: null });

  return (
    <>
      {/* Modal สำหรับ Add / Delete */}
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
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        productName={deleteModal.product?.nameProduct || ""}
      />

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left border text-gray-700 border-gray-300 text-xs">
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
            {[...Array(rows)].map((_, rowIndex) => {
              const rowNo = rowIndex + 1;
              const rowProducts = shelfProducts.filter((p) => p.rowNo === rowNo);
              const totalSalesRow = calcTotalSales(rowProducts);
              const totalWithdrawRow = calcTotalWithdraw(rowProducts);

              return (
                <React.Fragment key={rowNo}>
                  {/* Header per row */}
                  <tr className="bg-blue-50">
                    <td className="p-2 border font-semibold italic text-gray-700" colSpan={15}>
                      ➤ Row: {rowNo}
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        title="Add new Item"
                        onClick={() => handleAddClick(rowNo)}
                        className="px-3 py-1 bg-green-400 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        ➕
                      </button>
                    </td>
                  </tr>

                  {/* Product rows */}
                  {rowProducts.length > 0 ? (
                    rowProducts.map((prod) => {
                      const stockCost =
                        (prod?.stockQuantity != null && prod?.purchasePriceExcVAT != null)
                          ? prod.stockQuantity * prod.purchasePriceExcVAT
                          : 0;

                      return (
                        <tr key={prod.codeProduct}>
                          <td className="p-2 border text-center">{prod.index}</td>
                          <td className="p-2 border text-sm">
                            {String(prod.codeProduct).padStart(5, "0")}
                          </td>
                          <td className="p-2 border">{prod?.nameProduct ?? "-"}</td>
                          <td className="p-2 border">{prod?.nameBrand ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.shelfLife ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.salesPriceIncVAT ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.salesQuantity ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.withdrawQuantity ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.minStore ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.maxStore ?? "-"}</td>
                          <td className="p-2 border text-center">{prod?.stockQuantity ?? "-"}</td>
                          <td className="p-2 border text-right">
                            {prod?.purchasePriceExcVAT != null
                              ? prod.purchasePriceExcVAT.toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-2 border text-right">
                            {stockCost !== 0 ? stockCost.toFixed(2) : "-"}
                          </td>
                          <td className="p-2 border text-right">
                            {prod?.salesTotalPrice ?? "-"}
                          </td>
                          <td className="p-2 border text-right">
                            {prod?.withdrawValue ?? "-"}
                          </td>
                          <td className="border px-2 text-center">
                            <button
                              onClick={() => handleDeleteClick(prod)}
                              className="text-red-600 hover:text-red-800 hover:underline transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        className="p-2 border text-center text-gray-500 italic"
                        colSpan={16}
                      >
                        No products in this Row
                      </td>
                    </tr>
                  )}

                  {/* Row total */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="p-2 border" colSpan={11}></td>
                    <td className="p-2 border text-right" colSpan={2}>
                      Total for Row {rowNo}
                    </td>
                    <td className="p-2 border text-green-700 text-right">
                      {totalSalesRow.toFixed(2)}
                    </td>
                    <td className="p-2 border text-orange-600 text-right">
                      {totalWithdrawRow.toFixed(2)}
                    </td>
                    <td className="p-2 border" />
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ShelfTable;

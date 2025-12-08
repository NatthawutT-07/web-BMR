import React, {
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";
import {
  calcTotalSales,
  calcTotalStockCost,
  calcTotalWithdraw
} from "../../../../../utils/shelfUtils";

/* ===========================
   Delete Confirm Modal
=========================== */
const DeleteConfirmModal = React.memo(
  ({ isOpen, onClose, onConfirm, productName }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Delete
          </h3>

          <p className="text-gray-600 mb-6">
            Delete{" "}
            <span className="font-semibold">"{productName}"</span>?<br />
            <span className="text-red-600 text-sm">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </span>
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
  }
);

/* ===========================
   Add Product Modal
=========================== */
const AddProductModal = React.memo(
  ({
    isOpen,
    onClose,
    onSubmit,
    nextIndex,
    branchCode,
    shelfCode,
    rowNo,
    shelfProducts = []
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

      const code = codeProduct.trim();
      if (!code) {
        setError("กรุณากรอกรหัสสินค้า");
        return;
      }

      const codeNum = Number(code);
      if (Number.isNaN(codeNum)) {
        setError("กรุณากรอกรหัสสินค้าให้ถูกต้อง");
        return;
      }

      const duplicate = shelfProducts.some(
        (p) => Number(p.codeProduct) === codeNum
      );

      if (duplicate) {
        setError("❌ รหัสสินค้านี้มีอยู่แล้วใน Shelf นี้");
        return;
      }

      onSubmit({
        codeProduct: codeNum,
        index: nextIndex,
        branchCode,
        shelfCode,
        rowNo
      });

      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            ➕ New Item
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Code Product : xxxxx
              </label>

              <input
                type="number"
                value={codeProduct}
                onChange={(e) => setCodeProduct(e.target.value)}
                placeholder="Code Item"
                className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 ${
                  error ? "border-red-300" : ""
                }`}
              />

              {error && (
                <span className="text-red-600 text-sm mt-1">{error}</span>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Branch: <b>{branchCode}</b>
              </p>
              <p>
                Index: <b>{nextIndex}</b>
              </p>
              <p>
                Shelf: <b>{shelfCode}</b>
              </p>
              <p>
                Row: <b>{rowNo}</b>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

/* ===========================
   Shelf Table (Main)
=========================== */

const ShelfTable = ({
  rows,
  shelfProducts,
  onDelete,
  onAdd,
  shelfCode,
  branchCode
}) => {
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null
  });

  const [addModal, setAddModal] = useState({
    isOpen: false,
    rowNo: null,
    nextIndex: 1
  });

  /* Memo: group products by row */
  const productsByRow = useMemo(() => {
    const map = {};
    shelfProducts.forEach((p) => {
      if (!map[p.rowNo]) map[p.rowNo] = [];
      map[p.rowNo].push(p);
    });

    // sort each row by index
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => Number(a.index) - Number(b.index))
    );

    return map;
  }, [shelfProducts]);

  /* Memo: calculate totals for entire shelf */
  const totalAll = useMemo(() => {
    return {
      sales: shelfProducts.reduce(
        (a, b) => a + (b.salesTotalPrice || 0),
        0
      ),
      withdraw: shelfProducts.reduce(
        (a, b) => a + (b.withdrawValue || 0),
        0
      ),
      stockCost: shelfProducts.reduce(
        (a, b) =>
          a +
          (b.stockQuantity ?? 0) * (b.purchasePriceExcVAT ?? 0),
        0
      )
    };
  }, [shelfProducts]);

  /* Action callbacks */
  const handleAddClick = useCallback(
    (rowNo) => {
      const row = productsByRow[rowNo] || [];
      const nextIndex =
        row.length > 0
          ? Math.max(...row.map((p) => Number(p.index))) + 1
          : 1;

      setAddModal({ isOpen: true, rowNo, nextIndex });
    },
    [productsByRow]
  );

  const handleDeleteClick = useCallback((p) => {
    setDeleteModal({ isOpen: true, product: p });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteModal.product && onDelete) onDelete(deleteModal.product);
    setDeleteModal({ isOpen: false, product: null });
  }, [deleteModal, onDelete]);

  const handleAddSubmit = useCallback(
    (item) => onAdd && onAdd(item),
    [onAdd]
  );

  const format = useCallback((v) => {
    if (v === null || v === undefined || v === "-") return "-";
    return Number(v).toLocaleString();
  }, []);

  /* Render table */
  const renderRow = (rowNo) => {
    const rowProducts = productsByRow[rowNo] || [];

    const totalRowStock = calcTotalStockCost(rowProducts);
    const totalRowSales = calcTotalSales(rowProducts);
    const totalRowWithdraw = calcTotalWithdraw(rowProducts);

    return (
      <React.Fragment key={`row-${rowNo}`}>
        {/* Row header */}
        <tr className="bg-blue-50">
          <td colSpan={16} className="p-2 border font-semibold italic">
            ➤ Row: {rowNo}
          </td>

          <td className="p-2 border text-center">
            <button
              onClick={() => handleAddClick(rowNo)}
              className="px-3 py-1 bg-green-400 text-white rounded hover:bg-green-600"
            >
              ➕
            </button>
          </td>
        </tr>

        {/* Products */}
        {rowProducts.length > 0 ? (
          rowProducts.map((prod) => {
            const cost =
              (prod.stockQuantity ?? 0) *
              (prod.purchasePriceExcVAT ?? 0);

            return (
              <tr key={`prod-${prod.codeProduct}-${prod.index}`} className="even:bg-gray-50">
                <td className="p-1 border text-center">{prod.index}</td>
                <td className="p-1 border text-center">{prod.barcode}</td>
                <td className="p-1 border whitespace-nowrap text-ellipsis overflow-hidden max-w-[280px]">
                  {String(prod.codeProduct).padStart(5, "0")}
                </td>
                <td className="p-1 border whitespace-nowrap text-ellipsis overflow-hidden max-w-[280px]">{prod.nameProduct ?? "-"}</td>
                <td className="p-1 border whitespace-nowrap text-ellipsis overflow-hidden max-w-[280px]">{prod.nameBrand ?? "-"}</td>

                <td className="p-1 border text-center">
                  {prod.shelfLife ?? "-"}
                </td>

                <td className="p-1 border text-center">
                  {prod.salesPriceIncVAT ?? "-"}
                </td>

                <td className="p-1 border text-center text-green-600">
                  {prod.salesQuantity || "-"}
                </td>

                <td className="p-1 border text-center text-red-600">
                  {prod.withdrawQuantity || "-"}
                </td>

                <td className="p-1 border text-center">
                  {prod.minStore ?? "-"}
                </td>

                <td className="p-1 border text-center">
                  {prod.maxStore ?? "-"}
                </td>

                <td className="p-1 border text-center text-yellow-700">
                  {prod.stockQuantity ?? "-"}
                </td>

                <td className="p-1 border text-right">
                  {format(prod.purchasePriceExcVAT)}
                </td>

                <td className="p-1 border text-right text-yellow-600">
                  {format(cost)}
                </td>

                <td className="p-1 border text-right text-green-600">
                  {prod.salesTotalPrice
                    ? prod.salesTotalPrice.toFixed(2)
                    : "-"}
                </td>

                <td className="p-1 border text-right text-orange-600">
                  {format(prod.withdrawValue)}
                </td>

                <td className="border p-1 text-center">
                  <button
                    onClick={() => handleDeleteClick(prod)}
                    className="text-red-600 hover:underline"
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
              colSpan={16}
              className="p-2 border text-center italic text-gray-500"
            >
              No products in this Row
            </td>
          </tr>
        )}

        {/* Row total */}
        <tr className="bg-gray-100 font-semibold">
          <td colSpan={11}></td>

          <td colSpan={2} className="p-2 border text-right">
            Total Row {rowNo}
          </td>

          <td className="p-2 border text-yellow-600 text-right">
            {format(totalRowStock)}
          </td>

          <td className="p-2 border text-green-700 text-right">
            {format(totalRowSales)}
          </td>

          <td className="p-2 border text-orange-600 text-right">
            {format(totalRowWithdraw)}
          </td>

          <td></td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <>
      <AddProductModal
        isOpen={addModal.isOpen}
        onClose={() =>
          setAddModal({ isOpen: false, rowNo: null, nextIndex: 1 })
        }
        onSubmit={handleAddSubmit}
        nextIndex={addModal.nextIndex}
        branchCode={branchCode}
        shelfCode={shelfCode}
        rowNo={addModal.rowNo}
        shelfProducts={shelfProducts}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, product: null })
        }
        onConfirm={confirmDelete}
        productName={deleteModal.product?.nameProduct}
      />

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border text-xs text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1 text-center">ID</th>
              <th className="border p-1 text-center">Barcode</th>
              <th className="border p-1 text-center">Code</th>
              <th className="border p-1 text-center w-40">Name</th>
              <th className="border p-1 text-center w-28">Brand</th>
              <th className="border p-1 text-center">ShelfLife</th>
              <th className="border p-1 text-center">RSP</th>
              <th className="border p-1 text-center">Sales Qty</th>
              <th className="border p-1 text-center">Withdraw Qty</th>
              <th className="border p-1 text-center">MIN</th>
              <th className="border p-1 text-center">MAX</th>
              <th className="border p-1 text-center">Stock Qty</th>
              <th className="border p-1 text-center">Unit Cost</th>
              <th className="border p-1 text-center">Stock Cost</th>
              <th className="border p-1 text-center w-20">Sales Amount</th>
              <th className="border p-1 text-center w-20">
                Withdraw Amount
              </th>
              <th className="border p-1 text-center">Delete</th>
            </tr>
          </thead>

          <tbody>
            {/* Rows */}
            {Array.from({ length: Number(rows) || 0 }, (_, i) =>
              renderRow(i + 1)
            )}

            {/* Total all rows */}
            <tr className="bg-gray-200 font-semibold">
              <td colSpan={13} className="p-2 border text-right">
                Total for All Rows
              </td>

              <td className="p-2 border text-yellow-600 text-right">
                {format(totalAll.stockCost)}
              </td>

              <td className="p-2 border text-green-700 text-right">
                {format(totalAll.sales)}
              </td>

              <td className="p-2 border text-orange-600 text-right">
                {format(totalAll.withdraw)}
              </td>

              <td className="border"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default React.memo(ShelfTable);

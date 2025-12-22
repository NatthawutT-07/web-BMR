import React, { useState, useEffect, useMemo, useCallback } from "react";
import { calcTotalSales, calcTotalWithdraw } from "../../../../../utils/shelfUtils";

/* ===========================
   Helper: number formatter
=========================== */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// คำนวณ Stock Cost ต่อรายการ โดยถ้า stockQuantity < 0 ⇒ ใช้ 0 แทนในการคิดต้นทุน
const getSafeStockCost = (p) => {
  const qtyRaw = toNumber(p.stockQuantity ?? 0);
  const unit = toNumber(p.purchasePriceExcVAT ?? 0);
  const qtyForCost = qtyRaw < 0 ? 0 : qtyRaw; // ❗ ใช้ 0 แทนถ้าติดลบ
  return qtyForCost * unit;
};

// ✅ หาเลข index ตัวถัดไปแบบ "ไม่ให้ขาด" (ใช้เลขว่างตัวแรก)
// เช่นมี [1,2,3] ลบ 2 เหลือ [1,3] => next = 2
const getNextAvailableIndex = (rowProducts = []) => {
  const used = new Set(
    rowProducts
      .map((p) => Number(p.index))
      .filter((n) => Number.isFinite(n) && n > 0)
  );

  let i = 1;
  while (used.has(i)) i += 1;
  return i;
};

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
            Delete <span className="font-semibold">"{productName}"</span>?<br />
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
        rowNo,
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

              {error && <span className="text-red-600 text-sm mt-1">{error}</span>}
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
  branchCode,
}) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });

  const [addModal, setAddModal] = useState({
    isOpen: false,
    rowNo: null,
    nextIndex: 1,
  });

  /* ✅ Memo: group products by row + sort + ใส่ displayIndex ให้เรียง 1..n ใหม่เสมอ */
  const productsByRow = useMemo(() => {
    const map = {};
    shelfProducts.forEach((p) => {
      if (!map[p.rowNo]) map[p.rowNo] = [];
      map[p.rowNo].push(p);
    });

    Object.keys(map).forEach((rowNo) => {
      // sort by stored index (ยังใช้เพื่อจัดลำดับ)
      map[rowNo].sort((a, b) => Number(a.index) - Number(b.index));

      // ใส่ displayIndex: 1..n (เลขที่แสดงจะ “ชิดกัน” หลังลบทันที)
      map[rowNo] = map[rowNo].map((p, idx) => ({
        ...p,
        displayIndex: idx + 1,
      }));
    });

    return map;
  }, [shelfProducts]);

  /* Memo: calculate totals for entire shelf
     – Stock Cost ใช้ getSafeStockCost (qty ติดลบ → คิดเป็น 0) */
  const totalAll = useMemo(() => {
    const sales = shelfProducts.reduce((a, b) => a + (b.salesTotalPrice || 0), 0);
    const withdraw = shelfProducts.reduce((a, b) => a + (b.withdrawValue || 0), 0);
    const stockCost = shelfProducts.reduce((sum, p) => sum + getSafeStockCost(p), 0);
    return { sales, withdraw, stockCost };
  }, [shelfProducts]);

  /* Action callbacks */
  const handleAddClick = useCallback(
    (rowNo) => {
      const row = productsByRow[rowNo] || [];
      const nextIndex = getNextAvailableIndex(row);
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

  const handleAddSubmit = useCallback((item) => onAdd && onAdd(item), [onAdd]);

  const format = useCallback((v) => {
    if (v === null || v === undefined || v === "-") return "-";
    return Number(v).toLocaleString();
  }, []);

  // ปัดเป็น int สำหรับ Target (3M Avg * 0.8)
  const formatInt = (v) => {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (Number.isNaN(n)) return "-";
    if (n === 0) return "-";
    return Math.round(n);
  };

  /* Render table row (per RowNo) */
  const renderRow = (rowNo) => {
    const rowProducts = productsByRow[rowNo] || [];

    const totalRowStock = rowProducts.reduce((sum, p) => sum + getSafeStockCost(p), 0);
    const totalRowSales = calcTotalSales(rowProducts);
    const totalRowWithdraw = calcTotalWithdraw(rowProducts);

    return (
      <React.Fragment key={`row-${rowNo}`}>
        {/* Row header */}
        <tr className="bg-blue-50">
          <td colSpan={18} className="p-2 border font-semibold italic">
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
            const cost = getSafeStockCost(prod);

            const salesTargetQty = Number(prod.salesTargetQty ?? 0);
            const salesCurrentMonthQty = Number(prod.salesCurrentMonthQty ?? 0);

            const targetRounded = Math.round(salesTargetQty);
            const meetTarget = targetRounded > 0 && salesCurrentMonthQty >= targetRounded;

            const rowKey = prod.id
              ? `prod-${prod.id}`
              : `prod-${prod.codeProduct}-${prod.index}`;

            return (
              <tr key={rowKey} className="even:bg-gray-50">
                {/* ✅ แสดงเลขที่ชิดกันเสมอ */}
                <td className="p-1 border text-center w-10">
                  {prod.displayIndex ?? prod.index}
                </td>

                <td className="p-1 border text-center w-24 whitespace-nowrap">
                  {prod.barcode ?? "-"}
                </td>

                <td className="p-1 border text-center w-16 whitespace-nowrap">
                  {prod.codeProduct ? String(prod.codeProduct).padStart(5, "0") : "-"}
                </td>

                <td
                  className="p-1 border whitespace-nowrap text-ellipsis overflow-hidden max-w-[320px]"
                  title={prod.nameProduct ?? "-"}
                >
                  {prod.nameProduct ?? "-"}
                </td>

                <td className="p-1 border whitespace-nowrap text-ellipsis overflow-hidden max-w-[160px]">
                  {prod.nameBrand ?? "-"}
                </td>

                <td className="border text-center w-12">{prod.shelfLife ?? "-"}</td>

                <td className="p-1 border text-center w-16">
                  {prod.salesPriceIncVAT ?? "-"}
                </td>

                {/* Target (80% avg 3M, ปัดเป็น int) */}
                <td className="p-1 border text-center w-12 text-purple-700">
                  {formatInt(salesTargetQty)}
                </td>

                {/* Sales เดือนปัจจุบันเท่านั้น + highlight ถ้าถึงเป้า */}
                <td
                  className={[
                    "p-1 border text-center w-14 font-semibold",
                    meetTarget ? "bg-green-100 text-green-700" : "text-blue-600",
                  ].join(" ")}
                >
                  {salesCurrentMonthQty ? salesCurrentMonthQty.toLocaleString() : "-"}
                </td>

                {/* Sales Qty เดิม (90 วัน / 3M) */}
                <td className="p-1 border text-center w-14 text-green-600">
                  {prod.salesQuantity ? prod.salesQuantity.toLocaleString() : "-"}
                </td>

                <td className="p-1 border text-center w-14 text-red-600">
                  {prod.withdrawQuantity ? prod.withdrawQuantity.toLocaleString() : "-"}
                </td>

                <td className="p-1 border text-center w-12">{prod.minStore ?? "-"}</td>

                <td className="p-1 border text-center w-12">{prod.maxStore ?? "-"}</td>

                {/* Stock Qty แสดงตามจริง (ติดลบได้) */}
                <td className="p-1 border text-center w-14 text-yellow-700">
                  {prod.stockQuantity !== null && prod.stockQuantity !== undefined
                    ? prod.stockQuantity.toLocaleString()
                    : "-"}
                </td>
{/* 
                <td className="p-1 border text-right w-16">
                  {format(prod.purchasePriceExcVAT)}
                </td> */}

                {/* Stock Cost = 0 ถ้า stockQuantity < 0 */}
                {/* <td className="p-1 border text-right w-20 text-yellow-600">
                  {format(cost)}
                </td> */}

                {/* <td className="p-1 border text-right w-24 text-green-600">
                  {prod.salesTotalPrice ? prod.salesTotalPrice.toFixed(2) : "-"}
                </td> */}
{/* 
                <td className="p-1 border text-right w-24 text-orange-600">
                  {format(prod.withdrawValue)}
                </td>

                <td className="border p-1 text-center w-16">
                  <button
                    onClick={() => handleDeleteClick(prod)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td> */}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={19} className="p-2 border text-center italic text-gray-500">
              No products in this Row
            </td>
          </tr>
        )}

        {/* Row total */}
        <tr className="bg-gray-100 font-semibold">
          <td colSpan={12}></td>

          <td colSpan={3} className="p-2 border text-right">
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
        onClose={() => setAddModal({ isOpen: false, rowNo: null, nextIndex: 1 })}
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
        onConfirm={confirmDelete}
        productName={deleteModal.product?.nameProduct}
      />

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border text-xs text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1 text-center w-10">ID</th>
              <th className="border p-1 text-center w-24">Barcode</th>
              <th className="border p-1 text-center w-16">Code</th>
              <th className="border p-1 text-center w-44">Name</th>

              <th className="border p-1 text-center w-32">Brand</th>
              <th className="border text-center w-12">Shelf</th>
              <th className="border p-1 text-center w-16">RSP</th>

              <th className="border p-1 text-center w-12">Target</th>
              <th className="border p-1 text-center w-14">Sales M</th>

              <th className="border p-1 text-center w-14">Sales 3M</th>
              <th className="border p-1 text-center w-14">W. Qty</th>
              <th className="border p-1 text-center w-12">MIN</th>
              <th className="border p-1 text-center w-12">MAX</th>
              <th className="border p-1 text-center w-10">
                <span className="block leading-tight">Stock</span>
                <span className="block leading-tight">Qty</span>
              </th>

              <th className="border p-1 text-center w-10">
                <span className="block leading-tight">Unit</span>
                <span className="block leading-tight">Cost</span>
              </th>

              <th className="border p-1 text-center w-20">
                <span className="block leading-tight">Stock</span>
                <span className="block leading-tight">Cost</span>
              </th>

              <th className="border p-1 text-center w-24">
                <span className="block leading-tight">Sales</span>
                <span className="block leading-tight">Amount</span>
              </th>

              <th className="border p-1 text-center w-24">Withdraw Amount</th>
              <th className="border p-1 text-center w-16">Delete</th>
            </tr>
          </thead>

          <tbody>
            {/* Rows */}
            {Array.from({ length: Number(rows) || 0 }, (_, i) => renderRow(i + 1))}

            {/* Total all rows */}
            <tr className="bg-gray-200 font-semibold">
              <td colSpan={15} className="p-2 border text-right">
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

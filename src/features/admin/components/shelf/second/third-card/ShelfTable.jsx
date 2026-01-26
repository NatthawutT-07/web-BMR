import React, { useState, useEffect, useMemo, useCallback } from "react";
import { calcTotalSales, calcTotalWithdraw } from "../../../../../../utils/shelfUtils";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AddProductModal from "./AddProductModal";

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
  const qtyForCost = qtyRaw < 0 ? 0 : qtyRaw;
  return qtyForCost * unit;
};

// ✅ หาเลข index ตัวถัดไปแบบ "ไม่ให้ขาด" (ใช้เลขว่างตัวแรก)
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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null,
  });

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
      map[rowNo].sort((a, b) => Number(a.index) - Number(b.index));

      map[rowNo] = map[rowNo].map((p, idx) => ({
        ...p,
        displayIndex: idx + 1,
      }));
    });

    return map;
  }, [shelfProducts]);

  /* Memo: calculate totals for entire shelf */
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

  const confirmDelete = useCallback(async () => {
    if (deleteModal.product && onDelete) {
      await onDelete(deleteModal.product);
    }
    // Modal will close itself after showing success message
  }, [deleteModal, onDelete]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, product: null });
  }, []);

  // ✅ ให้ Add modal เรียกแบบ async ได้เหมือนตัวอย่าง
  const handleAddSubmit = useCallback(async (item) => {
    await onAdd?.(item);
  }, [onAdd]);

  // ✅ เหมือนตัวอย่าง: เพิ่ม index ต่อไป (ถ้าอยากเป๊ะ “ไม่ให้ขาด” ให้คุณสลับไปคำนวณใหม่ได้)
  const incNextIndex = useCallback(() => {
    setAddModal((m) => ({ ...m, nextIndex: (m.nextIndex || 1) + 1 }));
  }, []);

  const format = useCallback((v) => {
    if (v === null || v === undefined || v === "-") return "-";
    return Number(v).toLocaleString();
  }, []);

  const formatMoney2 = useCallback((v) => {
    if (v === null || v === undefined || v === "-") return "-";
    const n = Number(v);
    if (n === 0) return "0";
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatIntLocal = (v) => {
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
          <td colSpan={17} className="p-2 border font-semibold italic">
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

            const salesCurrentMonthQty = Number(prod.salesCurrentMonthQty ?? 0);

            const rowKey = prod.id
              ? `prod-${prod.id}`
              : `prod-${prod.codeProduct}-${prod.index}`;

            return (
              <tr key={rowKey} className="even:bg-gray-50">
                <td className="p-1 border text-center w-10">
                  {prod.displayIndex ?? prod.index}
                </td>

                <td className="p-1 border text-center w-24 whitespace-nowrap">
                  {prod.barcode ?? "-"}
                </td>

                <td className="p-1 border text-center w-16 whitespace-nowrap">
                  {prod.codeProduct
                    ? String(prod.codeProduct).padStart(5, "0")
                    : "-"}
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

                <td className="border text-center w-12">
                  {prod.shelfLife ?? "-"}
                </td>

                <td className="p-1 border text-center w-16">
                  {prod.salesPriceIncVAT ?? "-"}
                </td>

                <td className="p-1 border text-center w-14 font-semibold text-blue-600">
                  {salesCurrentMonthQty
                    ? salesCurrentMonthQty.toLocaleString()
                    : "-"}
                </td>

                <td className="p-1 border text-center w-14 text-green-600">
                  {prod.salesQuantity ? prod.salesQuantity.toLocaleString() : "-"}
                </td>

                <td className="p-1 border text-center w-14 text-red-600">
                  {prod.withdrawQuantity
                    ? prod.withdrawQuantity.toLocaleString()
                    : "-"}
                </td>

                <td className="p-1 border text-center w-12">
                  {prod.minStore ?? "-"}
                </td>

                <td className="p-1 border text-center w-12">
                  {prod.maxStore ?? "-"}
                </td>

                <td className="p-1 border text-center w-14 text-yellow-700">
                  {prod.stockQuantity !== null && prod.stockQuantity !== undefined
                    ? prod.stockQuantity.toLocaleString()
                    : "0"}
                </td>
                {/* <td colSpan={4}>  </td> */}


                <td className="p-1 border text-right w-16">
                  {formatMoney2(prod.purchasePriceExcVAT)}
                </td>

                <td className="p-1 border text-right w-20 text-yellow-600">
                  {formatMoney2(cost)}
                </td>

                <td className="p-1 border text-right w-24 text-green-600">
                  {formatMoney2(prod.salesTotalPrice)}
                </td>

                <td className="p-1 border text-right w-24 text-orange-600">
                  {formatMoney2(prod.withdrawValue)}
                </td>

                <td className="border p-1 text-center w-16">
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
            <td colSpan={18} className="p-2 border text-center italic text-gray-500">
              No products in this Row
            </td>
          </tr>
        )}

        {/* Row total */}
        <tr className="bg-gray-100 font-semibold">
          <td colSpan={11}></td>

          <td colSpan={3} className="p-2 border text-right">
            Total Row {rowNo}
          </td>

          <td className="p-2 border text-yellow-600 text-right">
            {formatMoney2(totalRowStock)}
          </td>

          <td className="p-2 border text-green-700 text-right">
            {formatMoney2(totalRowSales)}
          </td>

          <td className="p-2 border text-orange-600 text-right">
            {formatMoney2(totalRowWithdraw)}
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
        onIncNextIndex={incNextIndex}
        branchCode={branchCode}
        shelfCode={shelfCode}
        rowNo={addModal.rowNo}
        shelfProducts={shelfProducts}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
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
            {Array.from({ length: Number(rows) || 0 }, (_, i) => renderRow(i + 1))}

            <tr className="bg-gray-200 font-semibold">
              <td colSpan={14} className="p-2 border text-right">
                Total for All Rows
              </td>

              <td className="p-2 border text-yellow-600 text-right">
                {formatMoney2(totalAll.stockCost)}
              </td>

              <td className="p-2 border text-green-700 text-right">
                {formatMoney2(totalAll.sales)}
              </td>

              <td className="p-2 border text-orange-600 text-right">
                {formatMoney2(totalAll.withdraw)}
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

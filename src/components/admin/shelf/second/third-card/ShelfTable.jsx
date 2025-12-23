import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { calcTotalSales, calcTotalWithdraw } from "../../../../../utils/shelfUtils";
import { getMasterItem } from "../../../../../api/admin/template";

// ✅ ปรับ path ให้ตรงไฟล์คุณ (ตามตัวอย่างของคุณ)

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
   Delete Confirm Modal
=========================== */
const DeleteConfirmModal = React.memo(
  ({ isOpen, onClose, onConfirm, productName }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Delete
          </h3>

          <p className="text-gray-600 mb-6">
            Delete{" "}
            <span className="font-semibold">"{productName || "-"}"</span>?
            <br />
            <span className="text-red-600 text-sm">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </span>
          </p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
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
   ✅ Add Product Modal (เหมือนตัวอย่าง: Check + Choose + กันกดรัว)
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
    onIncNextIndex,
  }) => {
    const inputRef = useRef(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);

    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [lastCheckedQuery, setLastCheckedQuery] = useState("");
    const isFreshChecked =
      query.trim().length >= 2 && query.trim() === lastCheckedQuery;

    const focusInput = () =>
      setTimeout(() => inputRef.current?.focus?.(), 0);

    useEffect(() => {
      if (isOpen) {
        setQuery("");
        setResults([]);
        setSelected(null);
        setChecking(false);
        setSaving(false);
        setError("");
        setSuccess("");
        setLastCheckedQuery("");
        focusInput();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleChangeQuery = (v) => {
      setQuery(v);
      setError("");
      setSuccess("");

      // ✅ เปลี่ยนข้อความแล้ว = ต้องเช็คใหม่
      setLastCheckedQuery("");
      setResults([]);
      setSelected(null);
    };

    const handleCheck = async () => {
      if (checking || saving) return;

      const q = query.trim();
      if (q.length < 2) {
        setError("พิมพ์อย่างน้อย 2 ตัวอักษร แล้วกด Check");
        setResults([]);
        setSelected(null);
        setLastCheckedQuery("");
        return;
      }

      setChecking(true);
      setError("");
      setSuccess("");

      try {
        const res = await getMasterItem(q);
        const items = Array.isArray(res?.items) ? res.items : [];

        setResults(items);
        setLastCheckedQuery(q);

        // ถ้าผลลัพธ์ไม่มี selected เดิม → เคลียร์
        if (
          selected &&
          !items.some(
            (x) => Number(x.codeProduct) === Number(selected.codeProduct)
          )
        ) {
          setSelected(null);
        }

        if (items.length === 0) setError("ไม่พบรายการที่ตรงกัน");
      } catch (e) {
        console.error("Check master item failed:", e);
        setResults([]);
        setSelected(null);
        setLastCheckedQuery("");
        setError("❌ Check ไม่สำเร็จ (เช็ค server log)");
      } finally {
        setChecking(false);
        focusInput();
      }
    };

    const handlePick = (item) => {
      setSelected(item);
      setError("");
      setSuccess("");
    };

    const clearForNextScan = () => {
      setQuery("");
      setResults([]);
      setSelected(null);
      setError("");
      setLastCheckedQuery("");
      focusInput();
    };

    const handleAdd = async () => {
      if (saving || checking) return;

      if (!isFreshChecked) {
        setError("กรุณากด Check ก่อน (หรือข้อความเปลี่ยนแล้ว ต้องเช็คใหม่)");
        focusInput();
        return;
      }

      if (!selected?.codeProduct) {
        setError("กรุณาเลือกสินค้าจากรายการก่อน");
        return;
      }

      const codeNum = Number(selected.codeProduct);
      if (Number.isNaN(codeNum)) {
        setError("codeProduct ไม่ถูกต้อง");
        return;
      }

      const duplicate = shelfProducts.some(
        (p) => Number(p.codeProduct) === codeNum
      );
      if (duplicate) {
        setError("❌ สินค้านี้มีอยู่แล้วใน Shelf นี้");
        return;
      }

      const payload = {
        codeProduct: codeNum,
        barcode: selected.barcode ?? null,
        nameProduct: selected.nameProduct ?? null,
        nameBrand: selected.nameBrand ?? null,
        shelfLife: selected.shelfLife ?? null,
        salesPriceIncVAT: selected.salesPriceIncVAT ?? null,

        index: nextIndex,
        branchCode,
        shelfCode,
        rowNo,
      };

      setSaving(true);
      setError("");
      setSuccess("");

      try {
        await onSubmit?.(payload);
        setSuccess("✅ Added");

        // ✅ เหมือนตัวอย่าง: เพิ่ม nextIndex เพื่อยิงตัวถัดไป
        onIncNextIndex?.();

        clearForNextScan();
      } catch (err) {
        console.error("Add item failed:", err);
        setError("❌ Add ไม่สำเร็จ (เช็ค server log)");
        focusInput();
      } finally {
        setSaving(false);
      }
    };

    const onKeyDownInput = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCheck();
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-[98vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">➕ Add item</h2>

            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
              disabled={saving || checking}
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Barcode / Keyword
              </label>

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleChangeQuery(e.target.value)}
                  onKeyDown={onKeyDownInput}
                  placeholder="885xxxxxxxx / ชื่อสินค้า / แบรนด์"
                  className={`flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 ${error ? "border-red-300" : "border-gray-300"
                    }`}
                  autoFocus
                  disabled={saving || checking}
                />

                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={checking || saving || query.trim().length < 2}
                  className={[
                    "px-4 py-2 rounded text-sm font-semibold",
                    checking || saving || query.trim().length < 2
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700",
                  ].join(" ")}
                >
                  {checking ? "Checking..." : "Check"}
                </button>
              </div>

              <div className="mt-1 text-[12px] text-gray-500 flex items-center gap-2">
                <span>
                  {query.trim().length < 2
                    ? "พิมพ์อย่างน้อย 2 ตัวอักษร แล้วกด Check"
                    : isFreshChecked
                      ? `เช็คแล้ว • พบ ${results.length} รายการ`
                      : "ยังไม่เช็ค / ข้อความเปลี่ยนแล้ว"}
                </span>

                {saving && (
                  <span className="text-emerald-700 font-medium">
                    • กำลังบันทึก...
                  </span>
                )}

                {success && !saving && !checking && (
                  <span className="text-emerald-700 font-medium">
                    • {success}
                  </span>
                )}
              </div>

              {error && (
                <div className="mt-2 text-red-600 text-sm">{error}</div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[280px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left w-[160px]">Barcode</th>
                      <th className="px-2 py-2 text-center w-[90px]">Code</th>
                      <th className="px-2 py-2 text-left">Name</th>
                      <th className="px-2 py-2 text-left w-[160px]">Brand</th>
                      <th className="px-2 py-2 text-center w-[90px]">Select</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-4 text-center text-gray-500"
                        >
                          {isFreshChecked
                            ? "ไม่พบรายการที่ตรงกัน"
                            : "กด Check เพื่อดึงรายการ"}
                        </td>
                      </tr>
                    ) : (
                      results.map((it) => {
                        const isSelected =
                          Number(selected?.codeProduct) ===
                          Number(it.codeProduct);

                        return (
                          <tr
                            key={it.codeProduct}
                            className={isSelected ? "bg-emerald-50" : "bg-white"}
                          >
                            <td className="px-2 py-2 whitespace-nowrap">
                              {it.barcode || "-"}
                            </td>
                            <td className="px-2 py-2 text-center whitespace-nowrap">
                              {String(it.codeProduct || "").padStart(5, "0")}
                            </td>
                            <td
                              className="px-2 py-2 max-w-[520px] whitespace-nowrap overflow-hidden text-ellipsis"
                              title={it.nameProduct || ""}
                            >
                              {it.nameProduct || "-"}
                            </td>
                            <td
                              className="px-2 py-2 max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis"
                              title={it.nameBrand || ""}
                            >
                              {it.nameBrand || "-"}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handlePick(it)}
                                disabled={saving || checking}
                                className={`px-2 py-1 rounded text-[11px] ${isSelected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
                                  }`}
                              >
                                {isSelected ? "Selected" : "Choose"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t p-3 bg-white">
                <div className="text-xs text-gray-600">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                      Branch: <b>{branchCode}</b>
                    </span>
                    <span>
                      Shelf: <b>{shelfCode}</b>
                    </span>
                    <span>
                      Row: <b>{rowNo}</b>
                    </span>
                    <span>
                      Index: <b>{nextIndex}</b>
                    </span>
                  </div>

                  <div className="mt-2">
                    Selected:{" "}
                    <b>
                      {selected?.nameProduct
                        ? `${selected.nameProduct} (${String(
                          selected.codeProduct
                        ).padStart(5, "0")})`
                        : "-"}
                    </b>
                    {selected?.barcode ? (
                      <span className="ml-2 text-gray-500">
                        • {selected.barcode}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || checking}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleAdd}
                disabled={
                  !selected?.codeProduct || saving || checking || !isFreshChecked
                }
                className={`px-3 py-1.5 text-sm rounded ${selected?.codeProduct && !saving && !checking && isFreshChecked
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
              >
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
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

  const confirmDelete = useCallback(() => {
    if (deleteModal.product && onDelete) onDelete(deleteModal.product);
    setDeleteModal({ isOpen: false, product: null });
  }, [deleteModal, onDelete]);

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
            const meetTarget =
              targetRounded > 0 && salesCurrentMonthQty >= targetRounded;

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

                <td className="p-1 border text-center w-12 text-purple-700">
                  {formatIntLocal(salesTargetQty)}
                </td>

                <td
                  className={[
                    "p-1 border text-center w-14 font-semibold",
                    meetTarget
                      ? "bg-green-100 text-green-700"
                      : "text-blue-600",
                  ].join(" ")}
                >
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
                    : "-"}
                </td>
                <td colSpan={4}>
                </td>
                {/* 
                <td className="p-1 border text-right w-16">
                  {format(prod.purchasePriceExcVAT)}
                </td>

                <td className="p-1 border text-right w-20 text-yellow-600">
                  {format(cost)}
                </td> */}
                {/* 
                <td className="p-1 border text-right w-24 text-green-600">
                  {prod.salesTotalPrice ? prod.salesTotalPrice.toFixed(2) : "-"}
                </td>

                <td className="p-1 border text-right w-24 text-orange-600">
                  {format(prod.withdrawValue)}
                </td> */}

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
        onIncNextIndex={incNextIndex}
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
            {Array.from({ length: Number(rows) || 0 }, (_, i) => renderRow(i + 1))}

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

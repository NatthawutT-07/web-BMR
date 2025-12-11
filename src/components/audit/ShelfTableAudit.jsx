import React, { useMemo, useState, useCallback } from "react";

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

    React.useEffect(() => {
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

      onSubmit?.({
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 ${
                  error ? "border-red-300" : "border-gray-300"
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
                Shelf: <b>{shelfCode}</b>
              </p>
              <p>
                Row: <b>{rowNo}</b>
              </p>
              <p>
                Index: <b>{nextIndex}</b>
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
                className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600"
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
   Helper
=========================== */
const zeroToDash = (v) => {
  if (v === null || v === undefined) return "-";
  if (v === 0 || v === "0") return "-";
  return v;
};

// ปัดเศษเป็น int สำหรับ Target
const formatInt = (v) => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  if (n === 0) return "-";
  return Math.round(n);
};

/* ===========================
   ShelfTableAudit with Add/Delete
=========================== */
const ShelfTableAudit = ({
  shelfProducts = [],
  branchCode,
  shelfCode,
  onAddProduct,
  onDeleteProduct,
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

  if (!Array.isArray(shelfProducts)) {
    return <div className="text-xs text-red-500">Invalid data.</div>;
  }

  // เอาเฉพาะตัวที่มี rowNo
  const valid = useMemo(
    () => shelfProducts.filter((p) => p.rowNo !== undefined),
    [shelfProducts]
  );

  // จำนวนแถวทั้งหมด (Row)
  const rowCount = useMemo(() => {
    if (!valid.length) return 0;
    return Math.max(...valid.map((p) => p.rowNo || 0), 0);
  }, [valid]);

  // group ตาม rowNo
  const groupedRows = useMemo(() => {
    const result = {};
    valid.forEach((p) => {
      const rowNo = p.rowNo || 0;
      if (!result[rowNo]) result[rowNo] = [];
      result[rowNo].push(p);
    });

    // sort index ในแต่ละ row ให้เป็นระเบียบ
    Object.keys(result).forEach((rowNo) => {
      result[rowNo].sort((a, b) => (a.index || 0) - (b.index || 0));
    });

    return result;
  }, [valid]);

  /* ========= Add / Delete handlers ========= */

  const handleAddClick = useCallback(
    (rowNo) => {
      const items = groupedRows[rowNo] || [];
      const nextIndex =
        items.length > 0
          ? Math.max(
              ...items.map((p) =>
                Number.isFinite(Number(p.index)) ? Number(p.index) : 0
              )
            ) + 1
          : 1;

      setAddModal({
        isOpen: true,
        rowNo,
        nextIndex,
      });
    },
    [groupedRows]
  );

  const handleAddSubmit = useCallback(
    (item) => {
      onAddProduct?.(item);
    },
    [onAddProduct]
  );

  const handleDeleteClick = useCallback((prod) => {
    setDeleteModal({
      isOpen: true,
      product: prod,
    });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteModal.product) {
      // ใส่ branchCode เผื่อใน product ไม่มี
      onDeleteProduct?.({
        ...deleteModal.product,
        branchCode: deleteModal.product.branchCode || branchCode,
        shelfCode: deleteModal.product.shelfCode || shelfCode,
      });
    }
    setDeleteModal({ isOpen: false, product: null });
  }, [deleteModal, onDeleteProduct, branchCode, shelfCode]);

  /* ========= RENDER ========= */

  return (
    <div className="overflow-x-auto w-full px-1 sm:px-3 print:px-0 print:overflow-visible">
      {/* Modals */}
      <AddProductModal
        isOpen={addModal.isOpen}
        onClose={() =>
          setAddModal({
            isOpen: false,
            rowNo: null,
            nextIndex: 1,
          })
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
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={confirmDelete}
        productName={deleteModal.product?.nameProduct}
      />

      <table
        className="
          w-full border text-[11px] sm:text-xs lg:text-sm text-gray-700
          print:text-[8px] print:leading-tight
        "
      >
        <thead className="bg-gray-200 sticky top-0 z-20 print:static">
          <tr>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              ID
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Barcode
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Code
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Name
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Brand
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Life
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              RSP
            </th>

            <th className="border py-1 text-center print:px-[2px] align-middle">
              Target
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Sales
            </th>

            <th className="border py-1 text-center print:px-[2px] align-middle">
              With..
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Min
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Max
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Stock
            </th>

            {/* Audit checkbox column */}
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Audit
            </th>

            {/* Delete column */}
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle print:hidden">
              Delete
            </th>
          </tr>
        </thead>

        <tbody>
          {rowCount === 0 && (
            <tr>
              <td
                colSpan={15}
                className="border p-1 text-center text-gray-500 text-xs"
              >
                No products.
              </td>
            </tr>
          )}

          {Array.from({ length: rowCount }).map((_, idx) => {
            const rowNo = idx + 1;
            const items = groupedRows[rowNo] || [];

            return (
              <React.Fragment key={rowNo}>
                {/* หัว row (แยกแต่ละ Row) + ปุ่ม Add */}
                <tr className="bg-blue-50 print:bg-slate-200">
                  <td
                    colSpan={15}
                    className="border p-1 print:py-[2px] font-semibold italic text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span>➤ Row {rowNo}</span>
                      <button
                        type="button"
                        onClick={() => handleAddClick(rowNo)}
                        className="px-2 py-0.5 text-[11px] rounded bg-emerald-500 text-white hover:bg-emerald-600 print:hidden"
                      >
                        ➕ Add item
                      </button>
                    </div>
                  </td>
                </tr>

                {items.length > 0 ? (
                  items.map((p, i) => {
                    const currentSales = Number(p.salesCurrentMonthQty ?? 0);
                    const targetVal = Number(p.salesTargetQty ?? 0);
                    const hitTarget =
                      targetVal > 0 &&
                      !Number.isNaN(currentSales) &&
                      currentSales >= targetVal;

                    return (
                      <tr
                        key={`${rowNo}-${p.codeProduct || i}`}
                        className={
                          i % 2
                            ? "bg-gray-50 print:bg-gray-100"
                            : "bg-white print:bg-white"
                        }
                      >
                        <td className="border p-1 print:px-[2px] text-center align-middle">
                          {zeroToDash(p.index)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center whitespace-nowrap align-middle">
                          {zeroToDash(p.barcode)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center whitespace-nowrap align-middle">
                          {p.codeProduct
                            ? String(p.codeProduct).padStart(5, "0")
                            : "-"}
                        </td>

                        {/* Name */}
                        <td
                          className="
                            border p-1 print:px-[2px] align-middle
                            max-w-[140px] sm:max-w-[200px] lg:max-w-[260px]
                            whitespace-nowrap overflow-hidden text-ellipsis
                            print:whitespace-normal print:max-w-none
                          "
                          title={p.nameProduct}
                        >
                          {p.nameProduct}
                        </td>

                        {/* Brand */}
                        <td
                          className="
                            border p-1 print:px-[2px] align-middle
                            max-w-[100px] sm:max-w-[140px] lg:max-w-[180px]
                            whitespace-nowrap overflow-hidden text-ellipsis
                            print:whitespace-normal print:max-w-none
                          "
                          title={p.nameBrand}
                        >
                          {p.nameBrand}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center align-middle">
                          {zeroToDash(p.shelfLife)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center align-middle">
                          {zeroToDash(p.salesPriceIncVAT)}
                        </td>

                        {/* Target */}
                        <td className="border p-1 print:px-[2px] text-center text-purple-700 align-middle">
                          {formatInt(p.salesTargetQty)}
                        </td>

                        {/* Sales เดือนนี้ + ไฮไลต์ถ้าถึงเป้า */}
                        <td
                          className={`
                            border p-1 print:px-[2px] text-center font-semibold align-middle
                            text-blue-600
                            ${hitTarget ? "bg-green-50" : ""}
                          `}
                        >
                          {zeroToDash(p.salesCurrentMonthQty)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center text-red-600 align-middle">
                          {zeroToDash(p.withdrawQuantity)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center align-middle">
                          {zeroToDash(p.minStore)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center align-middle">
                          {zeroToDash(p.maxStore)}
                        </td>

                        <td className="border p-1 print:px-[2px] text-center text-yellow-700 align-middle">
                          {zeroToDash(p.stockQuantity)}
                        </td>

                        {/* Audit */}
                        <td className="border p-1 print:px-[2px] text-center align-middle">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-600 print:hidden cursor-pointer"
                          />
                          <span className="hidden print:inline-block">☐</span>
                        </td>

                        {/* Delete button */}
                        <td className="border p-1 print:px-[2px] text-center align-middle print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(p)}
                            className="text-red-600 hover:underline text-[11px]"
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
                      colSpan={15}
                      className="border p-1 print:py-[2px] text-center text-gray-500 text-xs"
                    >
                      No products in this row
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShelfTableAudit;

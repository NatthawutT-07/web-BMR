import React, { useMemo, useState, useCallback } from "react";
import { AddProductModal, DeleteConfirmModal } from "./second/AddDelect";

/* ===========================
   Helpers
=========================== */
const zeroToDash = (v) => {
  if (v === null || v === undefined) return "-";
  if (v === 0 || v === "0") return "-";
  return v;
};

const formatInt = (v) => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  if (n === 0) return "-";
  return Math.round(n);
};

const normalizeDraft = (arr) => {
  const rows = {};
  arr.forEach((it) => {
    const r = Number(it.rowNo || 1);
    if (!rows[r]) rows[r] = [];
    rows[r].push(it);
  });

  const out = [];
  Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((r) => {
      rows[r].forEach((it, idx) => {
        out.push({ ...it, rowNo: r, index: idx + 1 });
      });
    });

  return out;
};

/* ===========================
   ShelfTableAudit
=========================== */
const ShelfTableAudit = ({
  shelfProducts = [],
  branchCode,
  shelfCode,
  rowQty = 1,
  onAddProduct,
  onDeleteProduct,
  onUpdateProducts,
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

  // ✅ โหมดลากเมาส์จัดเรียง
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  const [draggingUid, setDraggingUid] = useState(null);

  // ✅ keep reference ของ drag ghost เพื่อ cleanup ตอน dragEnd (กันบาง browser ไม่ลบ)
  const [dragGhost, setDragGhost] = useState(null);

  if (!Array.isArray(shelfProducts)) {
    return <div className="text-xs text-red-500">Invalid data.</div>;
  }

  const valid = useMemo(
    () => shelfProducts.filter((p) => p.rowNo !== undefined),
    [shelfProducts]
  );

  const rowCount = useMemo(() => {
    if (!valid.length) return 0;
    return Math.max(...valid.map((p) => p.rowNo || 0), 0);
  }, [valid]);

  const totalRows = useMemo(() => {
    return Math.max(Number(rowQty || 1), Number(rowCount || 0), 1);
  }, [rowQty, rowCount]);

  const groupedRows = useMemo(() => {
    const result = {};
    valid.forEach((p) => {
      const r = Number(p.rowNo || 1);
      if (!result[r]) result[r] = [];
      result[r].push(p);
    });

    Object.keys(result).forEach((k) => {
      result[k].sort((a, b) => (a.index || 0) - (b.index || 0));
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

  const handleAddSubmit = useCallback(async (item) => onAddProduct?.(item), [
    onAddProduct,
  ]);

  const handleDeleteClick = useCallback((prod) => {
    setDeleteModal({
      isOpen: true,
      product: prod,
    });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteModal.product) {
      onDeleteProduct?.({
        ...deleteModal.product,
        branchCode: deleteModal.product.branchCode || branchCode,
        shelfCode: deleteModal.product.shelfCode || shelfCode,
      });
    }
    setDeleteModal({ isOpen: false, product: null });
  }, [deleteModal, onDeleteProduct, branchCode, shelfCode]);

  /* ========= Reorder Mode ========= */
  const openEditMode = () => {
    const base = [...valid]
      .sort(
        (a, b) =>
          Number(a.rowNo || 0) - Number(b.rowNo || 0) ||
          Number(a.index || 0) - Number(b.index || 0)
      )
      .map((x, i) => ({
        uid: `${Date.now()}-${i}-${x.codeProduct}-${x.rowNo}-${x.index}`,
        codeProduct: Number(x.codeProduct),
        barcode: x.barcode ?? null,
        nameProduct: x.nameProduct ?? null,
        nameBrand: x.nameBrand ?? null,
        rowNo: Number(x.rowNo || 1),
        index: Number(x.index || 1),
        prevRowNo: Number(x.rowNo || 1),
        prevIndex: Number(x.index || 1),
      }));

    setDraft(normalizeDraft(base));
    setEditMode(true);
    setDirty(false);
    setDraggingUid(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setDraft([]);
    setDirty(false);
    setDraggingUid(null);

    // cleanup ghost
    if (dragGhost) {
      try {
        document.body.removeChild(dragGhost);
      } catch {}
      setDragGhost(null);
    }
  };

  const groupDraftRows = useMemo(() => {
    const r = {};
    (draft || []).forEach((it) => {
      const row = Number(it.rowNo || 1);
      if (!r[row]) r[row] = [];
      r[row].push(it);
    });
    Object.keys(r).forEach((k) => {
      r[k].sort((a, b) => (a.index || 0) - (b.index || 0));
    });
    return r;
  }, [draft]);

  const moveInDraft = (dragUid, toRowNo, toIndex) => {
    setDraft((prev) => {
      const list = [...prev];
      const dragged = list.find((x) => x.uid === dragUid);
      if (!dragged) return prev;

      const without = list.filter((x) => x.uid !== dragUid);

      const targetRowItems = without
        .filter((x) => Number(x.rowNo) === Number(toRowNo))
        .sort((a, b) => (a.index || 0) - (b.index || 0));

      const idx = Math.max(0, Math.min(Number(toIndex), targetRowItems.length));

      const newTargetRow = [
        ...targetRowItems.slice(0, idx),
        { ...dragged, rowNo: Number(toRowNo) },
        ...targetRowItems.slice(idx),
      ];

      const other = without.filter((x) => Number(x.rowNo) !== Number(toRowNo));
      const merged = [...other, ...newTargetRow];

      const normalized = normalizeDraft(merged);
      setDirty(true);
      return normalized;
    });
  };

  const allowDrop = (e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
  };

  // ✅ DragStart: ทำ drag image ให้ “ชัด” + “ยกขึ้น” เหมือนยกทั้งกล่อง
  const handleDragStart = (e, uid) => {
    setDraggingUid(uid);

    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", uid);

      const el = e.currentTarget;
      if (el && typeof e.dataTransfer.setDragImage === "function") {
        // ลบ ghost เก่าถ้ามี
        if (dragGhost) {
          try {
            document.body.removeChild(dragGhost);
          } catch {}
          setDragGhost(null);
        }

        const clone = el.cloneNode(true);

        // สไตล์ให้ “เหมือนยกทั้งกล่อง”
        clone.style.position = "absolute";
        clone.style.top = "-1000px";
        clone.style.left = "-1000px";
        clone.style.width = `${el.offsetWidth}px`;
        clone.style.opacity = "1";
        clone.style.transform = "scale(1.05)";
        clone.style.background = "white";
        clone.style.boxShadow = "0 18px 45px rgba(0,0,0,0.28)";
        clone.style.border = "2px solid rgb(16 185 129)";
        clone.style.borderRadius = "12px";

        // เพิ่มความชัดของตัวอักษร/คอนทราสต์
        clone.style.filter = "contrast(1.15) saturate(1.1)";

        document.body.appendChild(clone);
        setDragGhost(clone);

        // x/y offset ของรูปตอนลาก (ยกให้เห็นชัด)
        e.dataTransfer.setDragImage(clone, 28, 22);
      }
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggingUid(null);

    // ✅ cleanup ghost (สำคัญ: กันค้าง)
    if (dragGhost) {
      try {
        document.body.removeChild(dragGhost);
      } catch {}
      setDragGhost(null);
    }
  };

  const dropOnRowEnd = (e, rowNo) => {
    e.preventDefault();
    const uid = e.dataTransfer.getData("text/plain");
    if (!uid) return;

    const rowItems = (groupDraftRows[rowNo] || []).sort(
      (a, b) => (a.index || 0) - (b.index || 0)
    );
    moveInDraft(uid, rowNo, rowItems.length);
    setDraggingUid(null);
  };

  const dropBeforeItem = (e, rowNo, beforeUid) => {
    e.preventDefault();
    const uid = e.dataTransfer.getData("text/plain");
    if (!uid) return;

    const rowItems = (groupDraftRows[rowNo] || []).sort(
      (a, b) => (a.index || 0) - (b.index || 0)
    );
    const beforeIdx = rowItems.findIndex((x) => x.uid === beforeUid);
    moveInDraft(uid, rowNo, beforeIdx < 0 ? rowItems.length : beforeIdx);
    setDraggingUid(null);
  };

  const saveLayout = async () => {
    if (!dirty || savingLayout) return;
    if (!onUpdateProducts) {
      alert("ยังไม่ได้ต่อ onUpdateProducts");
      return;
    }

    setSavingLayout(true);
    try {
      const serverItems = (draft || []).map((x) => ({
        branchCode,
        shelfCode,
        rowNo: Number(x.rowNo),
        index: Number(x.index),
        codeProduct: Number(x.codeProduct),
      }));

      await onUpdateProducts(serverItems, draft);
      setEditMode(false);
      setDraft([]);
      setDirty(false);
    } catch (e) {
      console.error("saveLayout failed:", e);
      alert("❌ Save layout ไม่สำเร็จ (เช็ค server log)");
    } finally {
      setSavingLayout(false);
    }
  };

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
        onIncNextIndex={() =>
          setAddModal((m) => ({ ...m, nextIndex: (m.nextIndex || 1) + 1 }))
        }
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 print:hidden">
        <div className="text-xs text-slate-600">
          {editMode ? (
            <span className="font-semibold text-emerald-700">
              โหมดจัดเรียง: ลากสินค้าเพื่อเปลี่ยน Row/Index แล้วกด Save
            </span>
          ) : (
            <span>
              Tip: กด <b>Reorder</b> เพื่อจัดเรียงสินค้าแบบลากเมาส์
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!editMode ? (
            <button
              type="button"
              onClick={openEditMode}
              className="px-3 py-1.5 rounded text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              🖱️ Reorder
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={savingLayout}
                className="px-3 py-1.5 rounded text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveLayout}
                disabled={!dirty || savingLayout}
                className={[
                  "px-3 py-1.5 rounded text-xs font-semibold",
                  dirty && !savingLayout
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed",
                ].join(" ")}
              >
                {savingLayout ? "Saving..." : "Save layout"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode */}
      {editMode ? (
        <div className="border rounded-lg bg-white p-3 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: totalRows }).map((_, idx) => {
              const rowNo = idx + 1;
              const items = (groupDraftRows[rowNo] || []).sort(
                (a, b) => (a.index || 0) - (b.index || 0)
              );

              return (
                <div
                  key={rowNo}
                  className="border rounded-lg bg-slate-50 overflow-hidden"
                  onDragOver={allowDrop}
                  onDrop={(e) => dropOnRowEnd(e, rowNo)}
                >
                  <div className="px-3 py-2 bg-slate-100 border-b flex items-center justify-between">
                    <div className="font-semibold text-slate-700 text-sm">
                      Row {rowNo}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {items.length} items
                    </div>
                  </div>

                  <div className="p-2 space-y-2 min-h-[70px]">
                    {items.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-4">
                        ลากมาวางใน Row นี้ได้เลย
                      </div>
                    ) : (
                      items.map((it) => {
                        const isDragging = draggingUid === it.uid;

                        return (
                          <div
                            key={it.uid}
                            className={[
                              "rounded-md border bg-white p-2 select-none transition-all duration-150",
                              isDragging
                                ? "opacity-100 border-emerald-600 ring-2 ring-emerald-400 shadow-2xl scale-[1.04] -translate-y-1 cursor-grabbing relative z-50"
                                : "border-slate-200 hover:border-slate-300 cursor-grab hover:shadow-md",
                            ].join(" ")}
                            draggable
                            onDragStart={(e) => handleDragStart(e, it.uid)}
                            onDragEnd={handleDragEnd}
                            onDragOver={allowDrop}
                            onDrop={(e) => dropBeforeItem(e, rowNo, it.uid)}
                            title="ลากเพื่อย้ายตำแหน่ง"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs text-slate-500">
                                  #{String(it.codeProduct || "").padStart(5, "0")} •{" "}
                                  {it.barcode || "-"}
                                </div>
                                <div className="text-sm font-semibold text-slate-800 truncate">
                                  {it.nameProduct || "-"}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {it.nameBrand || "-"}
                                </div>
                              </div>

                              <div className="text-[11px] font-semibold text-slate-600">
                                {rowNo}.{it.index}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div
                      className="rounded-md border border-dashed border-slate-300 bg-white/60 p-2 text-center text-[11px] text-slate-500"
                      onDragOver={allowDrop}
                      onDrop={(e) => dropOnRowEnd(e, rowNo)}
                    >
                      วางท้าย Row {rowNo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            • ลากการ์ดไป Row อื่นเพื่อย้าย Row • วาง “บนการ์ด” = แทรกก่อนการ์ดนั้น • กด Save layout เพื่ออัปเดต backend
          </div>
        </div>
      ) : null}

      {/* Normal Table */}
      {!editMode ? (
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
              <th className="border py-1 text-center print:px-[2px] align-middle">
                RSP
              </th>
              {/* <th className="border py-1 text-center print:px-[2px] align-middle">
                Target
              </th>
              <th className="border py-1 text-center print:px-[2px] align-middle">
                Sales
              </th>
              <th className="border py-1 text-center print:px-[2px] align-middle">
                With..
              </th> */}
              <th className="border py-1 text-center print:px-[2px] align-middle">
                Min
              </th>
              <th className="border py-1 text-center print:px-[2px] align-middle">
                Max
              </th>
              <th className="border py-1 text-center print:px-[2px] align-middle">
                Stock
              </th>
              <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
                Audit
              </th>
              <th className="border px-1 py-1 text-center print:px-[2px] align-middle print:hidden">
                Delete
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: totalRows }).map((_, idx) => {
              const rowNo = idx + 1;
              const items = groupedRows[rowNo] || [];

              return (
                <React.Fragment key={rowNo}>
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
                          key={`${rowNo}-${p.codeProduct || i}-${p.index || 0}`}
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

                          {/* <td className="border p-1 print:px-[2px] text-center text-purple-700 align-middle">
                            {formatInt(p.salesTargetQty)}
                          </td>

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
                          </td> */}

                          <td className="border p-1 print:px-[2px] text-center align-middle">
                            {zeroToDash(p.minStore)}
                          </td>

                          <td className="border p-1 print:px-[2px] text-center align-middle">
                            {zeroToDash(p.maxStore)}
                          </td>

                          <td className="border p-1 print:px-[2px] text-center text-yellow-700 align-middle">
                            {zeroToDash(p.stockQuantity)}
                          </td>

                          <td className="border p-1 print:px-[2px] text-center align-middle">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-emerald-600 print:hidden cursor-pointer"
                            />
                            <span className="hidden print:inline-block">☐</span>
                          </td>

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
      ) : null}
    </div>
  );
};

export default ShelfTableAudit;

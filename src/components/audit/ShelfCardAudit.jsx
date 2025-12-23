import React, { useState, useEffect, useMemo } from "react";
import ShelfTableAudit from "./ShelfTableAudit";

const ShelfCardAudit = React.memo(function ShelfCardAudit({
  template,
  autoOpen,
  branchCode,
  onAddProduct,
  onDeleteProduct,
  onUpdateProducts,
}) {
  const shelfProducts = useMemo(
    () => (Array.isArray(template.shelfProducts) ? template.shelfProducts : []),
    [template.shelfProducts]
  );

  const shelfCode = template.shelfCode || "-";
  const fullName = template.fullName || "N/A";
  const rowQty = template.rowQty || 1;

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  const toggleOpen = () => setIsOpen((o) => !o);

  return (
    <div
      className="
        border rounded-lg bg-white mb-4
        shadow-sm hover:shadow-md transition-shadow duration-200
        print:shadow-none print:border-black
      "
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={toggleOpen}
        className="
          w-full flex justify-between items-center
          px-3 sm:px-4 py-2 sm:py-3
          cursor-pointer select-none
          hover:bg-gray-50 active:bg-gray-100
          rounded-t-lg
        "
      >
        <h2 className="text-sm sm:text-lg font-semibold text-slate-800 text-left">
          Shelf: {shelfCode} – {fullName} ({rowQty} แถว)
        </h2>

        {/* caret */}
        <div
          className={`
            ml-2 print:hidden
            transition-transform duration-300 ease-out
            ${isOpen ? "rotate-180" : "rotate-0"}
          `}
        >
          <div
            className="
              w-0 h-0
              border-l-8 border-r-8 border-b-8
              border-l-transparent border-r-transparent border-b-gray-600
            "
          />
        </div>
      </button>

      {/* ✅ FIX: ไม่ใช้ max-h แล้ว (กันตัดข้อมูล)
          ใช้ grid-rows collapse (ลื่น + ไม่กระตุก)
      */}
      <div
        className={`
          px-2 sm:px-3 pb-3 sm:pb-4
          grid transition-[grid-template-rows,opacity] duration-300 ease-out
          ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
          print:block print:opacity-100
        `}
      >
        {/* ตัวนี้สำคัญ: overflow-hidden ใช้เพื่อ collapse ตอนปิด
            ตอนเปิดจะไม่ตัด เพราะไม่มี max-h จำกัดแล้ว */}
        <div className="min-h-0 overflow-hidden print:overflow-visible">
          <div className="mt-2">
            <ShelfTableAudit
              shelfProducts={shelfProducts}
              branchCode={branchCode}
              shelfCode={shelfCode}
              rowQty={rowQty}
              onAddProduct={onAddProduct}
              onDeleteProduct={onDeleteProduct}
              onUpdateProducts={onUpdateProducts}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShelfCardAudit;

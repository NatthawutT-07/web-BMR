import React, { useEffect, useMemo, useRef, useState } from "react";
import ShelfTableUser from "./ShelfTableUser";

// ✅ รับ isPrinting จาก parent (Template) เพื่อให้ทุก shelf เรนเดอร์ตารางทันตอน print
const ShelfCardUser = React.memo(function ShelfCardUser({ template, autoOpen, isPrinting }) {
  const shelfProducts = useMemo(
    () => (Array.isArray(template.shelfProducts) ? template.shelfProducts : []),
    [template.shelfProducts]
  );

  const shelfCode = template.shelfCode || "-";
  const fullName = template.fullName || "N/A";
  const rowQty = template.rowQty || 1;

  const [isOpen, setIsOpen] = useState(false);

  // ✅ ทำ animation แบบ "วัดความสูงจริง"
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  // auto open ตอนค้นหา (หน้าจอ)
  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  // ✅ คำนวณ maxHeight ใหม่เมื่อเปิด/ปิด หรือเมื่อสินค้าข้างในเปลี่ยน หรือเมื่อเข้าโหมดพิมพ์
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isOpen || isPrinting) {
      requestAnimationFrame(() => {
        const h = el.scrollHeight || 0;
        setMaxH(h);
      });
    } else {
      setMaxH(0);
    }
  }, [isOpen, isPrinting, shelfProducts.length]);

  const toggleOpen = () => setIsOpen((o) => !o);

  // ✅ เรนเดอร์ตารางตอน "เปิด" หรือ "กำลัง print"
  const shouldRenderTable = isOpen || isPrinting;

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

      {/* CONTENT */}
      <div
        ref={contentRef}
        className="
          px-2 sm:px-3 pb-3 sm:pb-4
          overflow-hidden
          transition-[max-height,opacity] duration-300 ease-out
          print:block print:opacity-100 print:max-h-none
        "
        style={{
          maxHeight: isPrinting ? "none" : `${maxH}px`,
          opacity: isOpen || isPrinting ? 1 : 0,
        }}
      >
        <div className="mt-2">
          {shouldRenderTable ? <ShelfTableUser shelfProducts={shelfProducts} /> : null}
        </div>
      </div>
    </div>
  );
});

export default ShelfCardUser;

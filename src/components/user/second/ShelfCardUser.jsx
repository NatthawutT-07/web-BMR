import React, { useState, useEffect, useMemo } from "react";
import ShelfTableUser from "./ShelfTableUser";

const ShelfCardUser = React.memo(function ShelfCardUser({ template, autoOpen }) {
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

  const toggleOpen = () => {
    setIsOpen((o) => !o);
  };

  return (
    <div
      className="
        border rounded-lg bg-white mb-4 
        shadow-sm hover:shadow-md transition-shadow duration-200
        print:shadow-none print:border-black
      "
    >
      {/* HEADER (คลิกเปิด/ปิด) */}
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

        {/* caret icon */}
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

      {/* TABLE – บนจอใช้ isOpen + animation, เวลา print บังคับให้แสดงเสมอ */}
      <div
        className={`
          px-2 sm:px-3 pb-3 sm:pb-4
          overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}
          print:block print:max-h-none print:opacity-100
        `}
      >
        {/*
          ถึงแม้ container จะถูกบีบ max-h=0 ตอนปิด
          แต่เรายัง render ตารางไว้ เพื่อให้ print:block ใช้งานได้ตอนพิมพ์ PDF
        */}
        <div className="mt-2">
          <ShelfTableUser shelfProducts={shelfProducts} />
        </div>
      </div>
    </div>
  );
});

export default ShelfCardUser;

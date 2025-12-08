import React, { useState, useEffect, useMemo } from "react";
import ShelfTableUser from "./ShelfTableUser";

const ShelfCardUser = React.memo(({ template, autoOpen }) => {
  const shelfProducts = useMemo(
    () => Array.isArray(template.shelfProducts) ? template.shelfProducts : [],
    [template.shelfProducts]
  );

  const shelfCode = template.shelfCode || "-";
  const fullName = template.fullName || "N/A";
  const rowQty = template.rowQty || 1;

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  return (
    <div className="border rounded-lg shadow-sm p-3 sm:p-4 mb-4 bg-white print:shadow-none print:border-black">
      {/* HEADER (คลิกเปิด/ปิด) */}
      <div
        className="flex justify-between items-center mb-2 sm:mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-sm sm:text-lg font-semibold text-slate-800">
          Shelf: {shelfCode} – {fullName} ({rowQty} แถว)
        </h2>

        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} print:hidden`}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 
                        border-l-transparent border-r-transparent border-b-gray-600" />
        </div>
      </div>

      {/* TABLE – ในหน้าจอใช้ isOpen, แต่เวลา print บังคับให้แสดงเสมอ */}
      <div className={`${isOpen ? "block" : "hidden"} print:block mt-2`}>
        <ShelfTableUser shelfProducts={shelfProducts} />
      </div>
    </div>
  );
});

export default ShelfCardUser;

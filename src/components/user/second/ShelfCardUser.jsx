import React, { useState, useEffect } from "react";
import ShelfTableUser from "./ShelfTableUser";

const ShelfCardUser = ({ template, autoOpen }) => {
    const shelfProducts = Array.isArray(template.shelfProducts) ? template.shelfProducts : [];
    const shelfCode = template.shelfCode || "-";
    const fullName = template.fullName || "N/A";
    const rowQty = template.rowQty || 1;

    const [isOpen, setIsOpen] = useState(false);

    // 🔥 autoOpen จาก search → เปิด card เฉพาะการค้นหา
    useEffect(() => {
        if (autoOpen) setIsOpen(true);
    }, [autoOpen]);

    return (
        <div className="border rounded shadow-sm p-4 mb-6 bg-white">

            {/* Header Bar คลิกได้ทั้งแถบ */}
            <div
                className="flex justify-between items-center mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h2 className="text-sm sm:text-lg font-semibold">
                    Shelf: {shelfCode} - {fullName} ({rowQty} Rows)
                </h2>

                <div
                    onClick={(e) => e.stopPropagation()}
                    className="transition-transform duration-300"
                >
                    <div
                        className={`
                            w-0 h-0 border-l-8 border-r-8 border-b-8 
                            border-l-transparent border-r-transparent 
                            border-b-gray-600 transition-transform duration-300
                            ${isOpen ? "rotate-180" : ""}
                        `}
                    ></div>
                </div>
            </div>

            {isOpen && (
                <div className="mt-2">
                    <ShelfTableUser shelfProducts={shelfProducts} />
                </div>
            )}
        </div>
    );
};

export default ShelfCardUser;

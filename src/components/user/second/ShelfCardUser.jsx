import React from "react";
import ShelfTableUser from "./ShelfTableUser";
const ShelfCardUser = ({ template }) => {
    // ตรวจสอบว่า shelfProducts เป็น array หรือไม่
    const shelfProducts = Array.isArray(template.shelfProducts) ? template.shelfProducts : [];
    const shelfCode = template.shelfCode || "-";
    const fullName = template.fullName || "N/A";
    const rowQty = template.rowQty || 1;

    return (
        <div className=" border rounded shadow-sm p-4 mb-6 bg-white relative">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-lg font-semibold mb-2 sm:mb-0 ml-12">
                    Shelf: {shelfCode} - {fullName} ({rowQty} Rows)
                </h2>

            </div>
            <ShelfTableUser shelfProducts={shelfProducts} />
        </div>
    );
};

export default ShelfCardUser;

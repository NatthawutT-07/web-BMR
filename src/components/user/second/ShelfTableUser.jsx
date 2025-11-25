import React, { useState, useEffect } from "react";

const ShelfTableUser = ({ shelfProducts = [] }) => {
    // ตรวจสอบว่า shelfProducts เป็น array หรือไม่
    if (!Array.isArray(shelfProducts)) {
        console.error("Expected shelfProducts to be an array, but received:", shelfProducts);
        return <div>Error: Invalid data format.</div>;
    }

    // กรองข้อมูล shelfProducts ที่มี rowNo กำหนด
    const validProducts = shelfProducts.filter((p) => p.rowNo !== undefined);

    // หาจำนวนแถวสูงสุดจาก rowNo ที่มีอยู่
    const rowCount = Math.max(...validProducts.map((p) => p.rowNo), 0);

    // คำนวณผลรวมของ Sales, Withdraw, StockCost
    const totalSales = shelfProducts.reduce((sum, prod) => sum + (prod.salesTotalPrice || 0), 0);
    const totalWithdraw = shelfProducts.reduce((sum, prod) => sum + (prod.withdrawValue || 0), 0);
    const totalStockCost = shelfProducts.reduce(
        (sum, prod) => sum + ((prod.stockQuantity ?? 0) * (prod.purchasePriceExcVAT ?? 0)),
        0
    );

    // ฟังก์ชั่นสำหรับฟอร์แมตตัวเลข
    const formatNumber = (num) => {
        if (num === null || num === undefined) return "-";
        return num.toLocaleString(); // ใช้ toLocaleString เพื่อให้มีเครื่องหมายคั่นหลักพัน
    };

    return (
        <>
            <div className="overflow-x-auto w-full px-0 sm:px-5 lg:px-20">
                <table className=" min-w-[1000px] w-full text-left border text-gray-700 text-xs">

                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-1 py-1 text-center">ID</th>
                            <th className="border px-1 py-1 text-center">Code</th>
                            <th className="border px-1 py-1 text-center ">Name</th>
                            <th className="border px-1 py-1 text-center">Brand</th>
                            <th className="border px-1 py-1 text-center w-12">ShelfLife</th>
                            <th className="border px-1 py-1 text-center w-16">RSP</th>
                            <th className="border px-1 py-1 text-center w-12">Sales Qty</th>
                            <th className="border px-1 py-1 text-center w-12">Withdraw Qty</th>
                            <th className="border px-1 py-1 text-center w-12">MIN</th>
                            <th className="border px-1 py-1 text-center w-12">MAX</th>
                            <th className="border px-1 py-1 text-center w-16">Stock Cost</th>
                            <th className="border px-1 py-1 text-center w-16">Sales Amount</th>
                            <th className="border px-1 py-1 text-center w-16">Withdraw Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* แสดงข้อมูลแต่ละแถว */}
                        {[...Array(rowCount)].map((_, rowIndex) => {
                            const rowNo = rowIndex + 1;
                            const rowProducts = shelfProducts.filter((p) => p.rowNo === rowNo);
                            const totalStockCostRow = rowProducts.reduce(
                                (sum, prod) => sum + ((prod.stockQuantity ?? 0) * (prod.purchasePriceExcVAT ?? 0)),
                                0
                            );
                            const totalSalesRow = rowProducts.reduce(
                                (sum, prod) => sum + (prod.salesTotalPrice || 0),
                                0
                            );
                            const totalWithdrawRow = rowProducts.reduce(
                                (sum, prod) => sum + (prod.withdrawValue || 0),
                                0
                            );

                            return (
                                <React.Fragment key={`row-${rowNo}`}>
                                    <tr className="bg-blue-50">
                                        <td colSpan={15} className="p-1 border font-semibold italic text-gray-700">
                                            ➤ Row: {rowNo}
                                        </td>
                                    </tr>
                                    {rowProducts.length > 0 ? (
                                        rowProducts.map((prod) => {
                                            const rowKey = `prod-${prod.branchCode}-${prod.shelfCode}-${prod.rowNo}-${prod.codeProduct}-${prod.index}`;
                                            return (
                                                <tr key={rowKey}>
                                                    <td className="p-1 border text-center">{prod.index}</td>
                                                    <td className="p-1 border text-center">{String(prod.codeProduct).padStart(5, "0")}</td>
                                                    <td className="p-1 border">{prod.nameProduct ?? "-"}</td>
                                                    <td className="p-1 border">{prod.nameBrand ?? "-"}</td>
                                                    <td className="p-1 border text-center">{prod.shelfLife ?? "-"}</td>
                                                    <td className="p-1 border text-center ">{prod.salesPriceIncVAT ?? "-"}</td>
                                                    <td className="p-1 border text-center text-green-600">
                                                        {prod.salesQuantity || "-"}
                                                    </td>
                                                    <td className="p-1 border text-center text-red-600">
                                                        {prod.withdrawQuantity || "-"}
                                                    </td>
                                                    <td className="p-1 border text-center">{prod.minStore ?? "-"}</td>
                                                    <td className="p-1 border text-center">{prod.maxStore ?? "-"}</td>
                                                    <td className="p-1 border text-center text-yellow-500">
                                                        {prod.stockQuantity ?? "-"}
                                                    </td>
                                                    <td className="p-1 border text-right text-green-600">
                                                        {formatNumber(prod.salesTotalPrice) ?? "-"}
                                                    </td>
                                                    <td className="p-1 border text-right text-red-600">
                                                        {formatNumber(prod.withdrawValue) ?? "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={11} className="p-1 border text-center text-gray-500 italic">
                                                No products in this Row
                                            </td>
                                        </tr>
                                    )}

                                    {/* ผลรวมของแถว */}
                                    <tr className="bg-gray-100 font-semibold">
                                        <td colSpan={8} className="p-1 border"></td>
                                        <td colSpan={2} className="p-1 border text-right">
                                            Total for Row {rowNo}
                                        </td>
                                        <td className="p-1 border text-yellow-600 text-right">
                                            {formatNumber(totalStockCostRow)}
                                        </td>
                                        <td className="p-1 border text-green-700 text-right">
                                            {formatNumber(totalSalesRow)}
                                        </td>
                                        <td className="p-1 border text-orange-600 text-right">
                                            {formatNumber(totalWithdrawRow)}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {/* ผลรวมทั้งหมด */}
                        <tr className="bg-gray-200 font-semibold">
                            <td colSpan={8} className="p-1 border text-right">Total for All Rows</td>
                            <td className="p-1 border text-yellow-600 text-right text-sm">
                                {formatNumber(totalStockCost)}
                            </td>
                            <td className="p-1 border text-green-700 text-right text-sm">
                                {formatNumber(totalSales)}
                            </td>
                            <td className="p-1 border text-orange-600 text-right text-sm">
                                {formatNumber(totalWithdraw)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ShelfTableUser;

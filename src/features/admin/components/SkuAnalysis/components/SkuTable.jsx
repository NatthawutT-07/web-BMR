import React from "react";
import { fmt, fmtDec } from "../utils/analysisUtils";

const SkuTable = ({ columns, displayRows, loading, totals, infoColCount, handleSort, sortKey, sortDir }) => {
    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
        return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    return (
        <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="min-w-full text-sm table-fixed">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        {columns.map((col) => {
                            let wClass = "w-20";
                            if (col.key === "product_name") wClass = "w-auto max-w-[300px]";
                            else if (col.key === "product_code") wClass = "w-20";
                            else if (col.key === "product_brand") wClass = "w-24";
                            else if (col.key === "shelfLife" || col.key === "status" || col.key === "stock_quantity") wClass = "w-16";
                            else if (col.key === "sum_sales" || col.key === "sum_withdraw" || col.key === "condition") wClass = "w-28";

                            return (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`py-3 text-left whitespace-nowrap cursor-pointer hover:bg-gray-700 select-none ${col.key === "product_name" ? "px-3" : "px-1.5 text-xs"} ${wClass}`}
                                >
                                    {col.label}
                                    <SortIcon col={col.key} />
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {displayRows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                                {loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}
                            </td>
                        </tr>
                    ) : (
                        displayRows.map((row, i) => (
                            <tr
                                key={(row.product_code || '') + (row.product_brand || '') + i}
                                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
                            >
                                <td className="px-1.5 py-2 font-mono text-xs truncate">{row.product_code}</td>
                                <td className="px-3 py-2 truncate max-w-[300px]" title={row.product_name}>{row.product_name || "-"}</td>
                                <td className="px-1.5 py-2 truncate text-xs">{row.product_brand || "-"}</td>
                                <td className="px-1.5 py-2 text-right text-xs">{fmt(row.salesPriceIncVAT)}</td>
                                <td className="px-1.5 py-2 text-center text-xs">{row.shelfLife || "-"}</td>
                                <td className="px-1.5 py-2 text-center text-xs">{row.status || "-"}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-indigo-600 text-xs border-r border-gray-200">{fmt(row.stock_quantity)}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-blue-700 text-xs">{fmt(row.sale_quantity)}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-green-700 text-xs">{fmtDec(row.net_sales)}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-orange-600 text-xs">{fmt(row.withdraw_quantity)}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-red-600 text-xs">{fmtDec(row.withdraw_value)}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-purple-600 text-xs">{fmt(row.si_quantity)}</td>
                                <td className="px-1.5 py-2 text-right font-medium text-pink-600 text-xs">{fmt(row.sia_quantity)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                {displayRows.length > 0 && (
                    <tfoot className="bg-gray-100 font-semibold">
                        <tr>
                            <td colSpan={infoColCount - 1} className="px-3 py-2 text-right">รวม</td>
                            <td className="px-3 py-2 text-right text-indigo-600 border-r border-gray-200">{fmt(totals.stock_quantity)}</td>
                            <td className="px-3 py-2 text-right text-blue-700">{fmt(totals.sale_quantity)}</td>
                            <td className="px-3 py-2 text-right text-green-700">{fmtDec(totals.net_sales)}</td>
                            <td className="px-3 py-2 text-right text-orange-600">{fmt(totals.withdraw_quantity)}</td>
                            <td className="px-3 py-2 text-right text-red-600">{fmtDec(totals.withdraw_value)}</td>
                            <td className="px-3 py-2 text-right text-purple-600">{fmt(totals.si_quantity)}</td>
                            <td className="px-3 py-2 text-right text-pink-600">{fmt(totals.sia_quantity)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

export default SkuTable;

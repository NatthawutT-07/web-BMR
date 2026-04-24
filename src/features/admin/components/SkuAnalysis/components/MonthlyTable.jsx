import React from "react";
import { fmt, fmtDec, monthLabel } from "../utils/analysisUtils";

const MonthlyTable = ({ mode, displayRows, loading, summaryMonths, totals, onDrillDown, drillLoading }) => {
    return (
        <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        {mode === "brand" ? (
                            <>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap border-r border-gray-600">Brand</th>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap border-r border-gray-600">Consign</th>
                            </>
                        ) : mode === "storeSummary" ? (
                            <>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap border-r border-gray-600">สาขา</th>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap border-r border-gray-600">ชื่อสาขา</th>
                            </>
                        ) : mode === "sku" ? (
                            <>
                                <th rowSpan={2} className="px-1.5 py-2 text-left whitespace-nowrap">Item No.</th>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap">Item Name</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-left whitespace-nowrap">Brand</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap">RSP</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-center whitespace-nowrap">Shelf Life</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-center whitespace-nowrap">Status</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap border-r border-gray-600 text-indigo-300">Stock</th>
                            </>
                        ) : (
                            <>
                                <th rowSpan={2} className="px-1.5 py-2 text-left whitespace-nowrap">สาขา</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-left whitespace-nowrap">Item No.</th>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap">Item Name</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-left whitespace-nowrap">Brand</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap">RSP</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-center whitespace-nowrap">Shelf Life</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-center whitespace-nowrap">Status</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap">Min</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap">Max</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap">Pack</th>
                                <th rowSpan={2} className="px-1.5 py-2 text-right whitespace-nowrap border-r border-gray-600 text-indigo-300">Stock</th>
                            </>
                        )}
                        {summaryMonths.map((m) => (
                            <th key={m} colSpan={(mode === "store" || mode === "sku") ? 6 : 3} className="px-3 py-2 text-center border-r border-gray-600">{monthLabel(m)}</th>
                        ))}
                        {(mode === "store" || mode === "sku") && (
                            <th colSpan={6} className="px-3 py-2 text-center border-r border-gray-600">รวมทั้งหมด</th>
                        )}
                    </tr>
                    <tr>
                        {summaryMonths.map((m) => (
                            <React.Fragment key={m}>
                                {(mode === "store" || mode === "sku") ? (
                                    <>
                                        <th className="px-1.5 py-1 text-right text-xs text-blue-300 whitespace-nowrap">QTY Sale</th>
                                        <th className="px-1.5 py-1 text-right text-xs text-green-300 whitespace-nowrap">Actual Sale</th>
                                        <th className="px-1.5 py-1 text-right text-xs text-orange-300 whitespace-nowrap">QTY W</th>
                                        <th className="px-1.5 py-1 text-right text-xs text-red-300 whitespace-nowrap">Actual W</th>
                                        <th className="px-1.5 py-1 text-right text-xs text-purple-300 whitespace-nowrap">SI</th>
                                        <th className="px-1.5 py-1 text-right text-xs text-pink-300 whitespace-nowrap border-r border-gray-600">SIA</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-2 py-1 text-right text-xs text-green-300 whitespace-nowrap">ยอดขาย</th>
                                        <th className="px-2 py-1 text-right text-xs text-red-300 whitespace-nowrap">ตัดจ่าย</th>
                                        <th className="px-2 py-1 text-right text-xs text-orange-300 whitespace-nowrap border-r border-gray-600">(%)</th>
                                    </>
                                )}
                            </React.Fragment>
                        ))}
                        {(mode === "store" || mode === "sku") && (
                            <>
                                <th className="px-1.5 py-1 text-right text-xs text-blue-300 whitespace-nowrap">QTY Sale</th>
                                <th className="px-1.5 py-1 text-right text-xs text-green-300 whitespace-nowrap">Actual Sale</th>
                                <th className="px-1.5 py-1 text-right text-xs text-orange-300 whitespace-nowrap">QTY W</th>
                                <th className="px-1.5 py-1 text-right text-xs text-red-300 whitespace-nowrap">Actual W</th>
                                <th className="px-1.5 py-1 text-right text-xs text-purple-300 whitespace-nowrap">SI</th>
                                <th className="px-1.5 py-1 text-right text-xs text-pink-300 whitespace-nowrap border-r border-gray-600">SIA</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {displayRows.length === 0 ? (
                        <tr>
                            <td colSpan={
                                mode === "store" ? 11 + summaryMonths.length * 6 + 6 : 
                                mode === "sku" ? 7 + summaryMonths.length * 6 + 6 : 
                                2 + summaryMonths.length * 3
                            } className="text-center py-8 text-gray-400">
                                {loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}
                            </td>
                        </tr>
                    ) : (
                        displayRows.map((row, i) => (
                            <tr key={(row.branch_code || row.brand || '') + (row.product_code || '') + i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}>
                                {mode === "brand" ? (
                                    <>
                                        <td className="px-3 py-2 font-medium whitespace-nowrap border-r border-gray-100">{row.brand}</td>
                                        <td className="px-3 py-2 text-xs truncate max-w-[200px] border-r border-gray-100" title={row.consing_item}>{row.consing_item || "-"}</td>
                                    </>
                                ) : mode === "storeSummary" ? (
                                    <>
                                        <td
                                            className="px-3 py-2 font-mono text-xs whitespace-nowrap border-r border-gray-100 text-blue-600 underline cursor-pointer hover:text-blue-800"
                                            onClick={() => onDrillDown && onDrillDown(row)}
                                        >
                                            {drillLoading ? "..." : row.branch_code}
                                        </td>
                                        <td className="px-3 py-2 text-sm truncate max-w-[200px] border-r border-gray-100" title={row.branch_name}>{row.branch_name}</td>
                                    </>
                                ) : mode === "sku" ? (
                                    <>
                                        <td 
                                            className="px-1.5 py-2 font-mono text-xs truncate text-blue-600 underline cursor-pointer hover:text-blue-800"
                                            onClick={() => onDrillDown && onDrillDown(row)}
                                        >
                                            {drillLoading ? "..." : row.product_code}
                                        </td>
                                        <td className="px-3 py-2 truncate max-w-[300px]" title={row.product_name}>{row.product_name || "-"}</td>
                                        <td className="px-1.5 py-2 truncate text-xs">{row.product_brand || "-"}</td>
                                        <td className="px-1.5 py-2 text-right text-xs">{fmt(row.salesPriceIncVAT)}</td>
                                        <td className="px-1.5 py-2 text-center text-xs">{row.shelfLife || "-"}</td>
                                        <td className="px-1.5 py-2 text-center text-xs">{row.status || "-"}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-indigo-600 text-xs border-r border-gray-200">{fmt(row.stock_quantity)}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-1.5 py-2 font-mono text-xs truncate">{row.branch_code}</td>
                                        <td className="px-1.5 py-2 font-mono text-xs truncate">{row.product_code}</td>
                                        <td className="px-3 py-2 truncate max-w-[300px]" title={row.product_name}>{row.product_name || "-"}</td>
                                        <td className="px-1.5 py-2 truncate text-xs">{row.brand || "-"}</td>
                                        <td className="px-1.5 py-2 text-right text-xs">{fmt(row.rsp)}</td>
                                        <td className="px-1.5 py-2 text-center text-xs">{row.shelfLife || "-"}</td>
                                        <td className="px-1.5 py-2 text-center text-xs">{row.status || "-"}</td>
                                        <td className="px-1.5 py-2 text-right text-xs">{row.minStore ?? "-"}</td>
                                        <td className="px-1.5 py-2 text-right text-xs">{row.maxStore ?? "-"}</td>
                                        <td className="px-1.5 py-2 text-right text-xs">{row.packOrder ?? "-"}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-indigo-600 text-xs border-r border-gray-200">{fmt(row.stock_quantity)}</td>
                                    </>
                                )}
                                {summaryMonths.map((m) => (
                                    <React.Fragment key={m}>
                                        {(mode === "store" || mode === "sku") ? (
                                            <>
                                                <td className="px-1.5 py-2 text-right font-medium text-blue-700 text-xs">{fmt(row.months?.[m]?.sale_quantity || 0)}</td>
                                                <td className="px-1.5 py-2 text-right font-medium text-green-700 text-xs">{fmtDec(row.months?.[m]?.net_sales || 0)}</td>
                                                <td className="px-1.5 py-2 text-right font-medium text-orange-600 text-xs">{fmt(row.months?.[m]?.withdraw_quantity || 0)}</td>
                                                <td className="px-1.5 py-2 text-right font-medium text-red-600 text-xs">{fmtDec(row.months?.[m]?.withdraw_value || 0)}</td>
                                                <td className="px-1.5 py-2 text-right font-medium text-purple-600 text-xs">{fmt(row.months?.[m]?.si_quantity || 0)}</td>
                                                <td className="px-1.5 py-2 text-right font-medium text-pink-600 text-xs border-r border-gray-100">{fmt(row.months?.[m]?.sia_quantity || 0)}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-2 py-2 text-right font-medium text-green-700 text-xs">{fmtDec(row.months?.[m]?.sales || 0)}</td>
                                                <td className="px-2 py-2 text-right font-medium text-red-600 text-xs">{fmtDec(row.months?.[m]?.withdraw || 0)}</td>
                                                <td className="px-2 py-2 text-right font-medium text-orange-600 text-xs border-r border-gray-100">{fmtDec(row.months?.[m]?.condition || 0)}%</td>
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                                {(mode === "store" || mode === "sku") && (
                                    <>
                                        <td className="px-1.5 py-2 text-right font-medium text-blue-700 text-xs">{fmt(row.sale_quantity)}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-green-700 text-xs">{fmtDec(row.net_sales)}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-orange-600 text-xs">{fmt(row.withdraw_quantity)}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-red-600 text-xs">{fmtDec(row.withdraw_value)}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-purple-600 text-xs">{fmt(row.si_quantity)}</td>
                                        <td className="px-1.5 py-2 text-right font-medium text-pink-600 text-xs border-r border-gray-100">{fmt(row.sia_quantity)}</td>
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
                {displayRows.length > 0 && (
                    <tfoot className="bg-gray-100 font-semibold">
                        <tr>
                            {mode === "store" ? (
                                <>
                                    <td colSpan={10} className="px-3 py-2 text-right">รวมทั้งหมด</td>
                                    <td className="px-1.5 py-2 text-right text-indigo-600 border-r border-gray-200">{fmt(totals.stock_quantity)}</td>
                                </>
                            ) : mode === "sku" ? (
                                <>
                                    <td colSpan={6} className="px-3 py-2 text-right">รวมทั้งหมด</td>
                                    <td className="px-1.5 py-2 text-right text-indigo-600 border-r border-gray-200">{fmt(totals.stock_quantity)}</td>
                                </>
                            ) : (
                                <td colSpan={2} className="px-3 py-2 text-right border-r border-gray-200">รวม</td>
                            )}
                            {summaryMonths.map((m) => {
                                if (mode === "store" || mode === "sku") {
                                    const ms = totals.months?.[m] || {};
                                    return (
                                        <React.Fragment key={m}>
                                            <td className="px-1.5 py-2 text-right text-blue-700">{fmt(ms?.sale_quantity || 0)}</td>
                                            <td className="px-1.5 py-2 text-right text-green-700">{fmtDec(ms?.net_sales || 0)}</td>
                                            <td className="px-1.5 py-2 text-right text-orange-600">{fmt(ms?.withdraw_quantity || 0)}</td>
                                            <td className="px-1.5 py-2 text-right text-red-600">{fmtDec(ms?.withdraw_value || 0)}</td>
                                            <td className="px-1.5 py-2 text-right text-purple-600">{fmt(ms?.si_quantity || 0)}</td>
                                            <td className="px-1.5 py-2 text-right text-pink-600 border-r border-gray-200">{fmt(ms?.sia_quantity || 0)}</td>
                                        </React.Fragment>
                                    );
                                } else {
                                    const ms = totals.months?.[m];
                                    const cond = ms?.sales > 0 ? parseFloat(((ms.withdraw / ms.sales) * 100).toFixed(2)) : 0;
                                    return (
                                        <React.Fragment key={m}>
                                            <td className="px-2 py-2 text-right text-green-700">{fmtDec(ms?.sales || 0)}</td>
                                            <td className="px-2 py-2 text-right text-red-600">{fmtDec(ms?.withdraw || 0)}</td>
                                            <td className="px-2 py-2 text-right text-orange-600 border-r border-gray-200">{fmtDec(cond)}%</td>
                                        </React.Fragment>
                                    );
                                }
                            })}
                            {(mode === "store" || mode === "sku") && (
                                <>
                                    <td className="px-1.5 py-2 text-right text-blue-700">{fmt(totals.sale_quantity)}</td>
                                    <td className="px-1.5 py-2 text-right text-green-700">{fmtDec(totals.net_sales)}</td>
                                    <td className="px-1.5 py-2 text-right text-orange-600">{fmt(totals.withdraw_quantity)}</td>
                                    <td className="px-1.5 py-2 text-right text-red-600">{fmtDec(totals.withdraw_value)}</td>
                                    <td className="px-1.5 py-2 text-right text-purple-600">{fmt(totals.si_quantity)}</td>
                                    <td className="px-1.5 py-2 text-right text-pink-600 border-r border-gray-200">{fmt(totals.sia_quantity)}</td>
                                </>
                            )}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

export default MonthlyTable;

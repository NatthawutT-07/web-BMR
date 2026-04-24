import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { fmt, fmtDec, monthLabel } from "../utils/analysisUtils";

const SkuDrillDownModal = ({ drillDown, onClose, startDate, endDate }) => {
    const modalRef = useRef(null);

    const handleExport = () => {
        if (!drillDown.rows.length) return;
        
        const exportData = drillDown.rows.map(r => {
            const obj = {
                "สาขา": r.branch_code,
                "ชื่อสาขา": r.branch_name,
                "รหัสสินค้า": r.product_code,
                "ชื่อสินค้า": r.product_name,
                "แบรนด์": r.brand,
                "ราคาขาย": r.rsp,
                "Shelf Life": r.shelfLife || "",
                "Min": r.minStore ?? "",
                "Max": r.maxStore ?? "",
                "Pack": r.packOrder ?? "",
                "Stock": r.stock_quantity,
            };
            for (const m of drillDown.months) {
                obj[`${monthLabel(m)} QTY Sale`] = r.months?.[m]?.sale_quantity || 0;
                obj[`${monthLabel(m)} Actual Sale`] = r.months?.[m]?.net_sales || 0;
                obj[`${monthLabel(m)} QTY W`] = r.months?.[m]?.withdraw_quantity || 0;
                obj[`${monthLabel(m)} Actual W`] = r.months?.[m]?.withdraw_value || 0;
                obj[`${monthLabel(m)} SI`] = r.months?.[m]?.si_quantity || 0;
                obj[`${monthLabel(m)} SIA`] = r.months?.[m]?.sia_quantity || 0;
            }
            obj["รวม QTY Sale"] = r.sale_quantity;
            obj["รวม Actual Sale"] = r.net_sales;
            obj["รวม QTY W"] = r.withdraw_quantity;
            obj["รวม Actual W"] = r.withdraw_value;
            obj["รวม SI"] = r.si_quantity;
            obj["รวม SIA"] = r.sia_quantity;
            return obj;
        });
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SKU_Branches");
        XLSX.writeFile(wb, `${drillDown.productCode}_Branches_${startDate}_to_${endDate}.xlsx`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[1400px] max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {drillDown.productCode} — {drillDown.productName}
                        </h2>
                        <p className="text-xs text-gray-500">{startDate} ถึง {endDate} · {drillDown.rows.length} สาขา</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export XLSX
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>
                    </div>
                </div>
                <div className="overflow-auto flex-1 px-2 pb-4">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-800 text-white sticky top-0">
                            <tr>
                                <th rowSpan={2} className="px-2 py-2 text-left whitespace-nowrap">สาขา</th>
                                <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap">ชื่อสาขา</th>
                                <th rowSpan={2} className="px-2 py-2 text-right whitespace-nowrap">RSP</th>
                                <th rowSpan={2} className="px-2 py-2 text-center whitespace-nowrap">Shelf Life</th>
                                <th rowSpan={2} className="px-2 py-2 text-right whitespace-nowrap">Min</th>
                                <th rowSpan={2} className="px-2 py-2 text-right whitespace-nowrap">Max</th>
                                <th rowSpan={2} className="px-2 py-2 text-right whitespace-nowrap">Pack</th>
                                <th rowSpan={2} className="px-2 py-2 text-right whitespace-nowrap border-r border-gray-600 text-indigo-300">Stock</th>
                                {drillDown.months.map((m) => (
                                    <th key={m} colSpan={6} className="px-2 py-2 text-center border-r border-gray-600">{monthLabel(m)}</th>
                                ))}
                                <th colSpan={6} className="px-2 py-2 text-center">รวมทั้งหมด</th>
                            </tr>
                            <tr>
                                {drillDown.months.map((m) => (
                                    <React.Fragment key={m}>
                                        <th className="px-1 py-1 text-right text-xs text-blue-300">QTY Sale</th>
                                        <th className="px-1 py-1 text-right text-xs text-green-300">Actual Sale</th>
                                        <th className="px-1 py-1 text-right text-xs text-orange-300">QTY W</th>
                                        <th className="px-1 py-1 text-right text-xs text-red-300">Actual W</th>
                                        <th className="px-1 py-1 text-right text-xs text-purple-300">SI</th>
                                        <th className="px-1 py-1 text-right text-xs text-pink-300 border-r border-gray-600">SIA</th>
                                    </React.Fragment>
                                ))}
                                <th className="px-1 py-1 text-right text-xs text-blue-300">QTY Sale</th>
                                <th className="px-1 py-1 text-right text-xs text-green-300">Actual Sale</th>
                                <th className="px-1 py-1 text-right text-xs text-orange-300">QTY W</th>
                                <th className="px-1 py-1 text-right text-xs text-red-300">Actual W</th>
                                <th className="px-1 py-1 text-right text-xs text-purple-300">SI</th>
                                <th className="px-1 py-1 text-right text-xs text-pink-300">SIA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {drillDown.rows.length === 0 ? (
                                <tr><td colSpan={8 + drillDown.months.length * 6 + 6} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
                            ) : (
                                drillDown.rows.map((r, i) => (
                                    <tr key={r.branch_code + i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}>
                                        <td className="px-2 py-1.5 font-mono text-xs">{r.branch_code}</td>
                                        <td className="px-3 py-1.5 truncate max-w-[250px]" title={r.branch_name}>{r.branch_name || "-"}</td>
                                        <td className="px-2 py-1.5 text-right text-xs">{fmt(r.rsp)}</td>
                                        <td className="px-2 py-1.5 text-center text-xs">{r.shelfLife || "-"}</td>
                                        <td className="px-2 py-1.5 text-right text-xs">{r.minStore ?? "-"}</td>
                                        <td className="px-2 py-1.5 text-right text-xs">{r.maxStore ?? "-"}</td>
                                        <td className="px-2 py-1.5 text-right text-xs">{r.packOrder ?? "-"}</td>
                                        <td className="px-2 py-1.5 text-right font-medium text-indigo-600 text-xs border-r border-gray-200">{fmt(r.stock_quantity)}</td>
                                        {drillDown.months.map((m) => (
                                            <React.Fragment key={m}>
                                                <td className="px-1 py-1.5 text-right text-blue-700 text-xs">{fmt(r.months?.[m]?.sale_quantity || 0)}</td>
                                                <td className="px-1 py-1.5 text-right text-green-700 text-xs">{fmtDec(r.months?.[m]?.net_sales || 0)}</td>
                                                <td className="px-1 py-1.5 text-right text-orange-600 text-xs">{fmt(r.months?.[m]?.withdraw_quantity || 0)}</td>
                                                <td className="px-1 py-1.5 text-right text-red-600 text-xs">{fmtDec(r.months?.[m]?.withdraw_value || 0)}</td>
                                                <td className="px-1 py-1.5 text-right text-purple-600 text-xs">{fmt(r.months?.[m]?.si_quantity || 0)}</td>
                                                <td className="px-1 py-1.5 text-right text-pink-600 text-xs border-r border-gray-100">{fmt(r.months?.[m]?.sia_quantity || 0)}</td>
                                            </React.Fragment>
                                        ))}
                                        <td className="px-1 py-1.5 text-right font-medium text-blue-700 text-xs">{fmt(r.sale_quantity)}</td>
                                        <td className="px-1 py-1.5 text-right font-medium text-green-700 text-xs">{fmtDec(r.net_sales)}</td>
                                        <td className="px-1 py-1.5 text-right font-medium text-orange-600 text-xs">{fmt(r.withdraw_quantity)}</td>
                                        <td className="px-1 py-1.5 text-right font-medium text-red-600 text-xs">{fmtDec(r.withdraw_value)}</td>
                                        <td className="px-1 py-1.5 text-right font-medium text-purple-600 text-xs">{fmt(r.si_quantity)}</td>
                                        <td className="px-1 py-1.5 text-right font-medium text-pink-600 text-xs">{fmt(r.sia_quantity)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SkuDrillDownModal;

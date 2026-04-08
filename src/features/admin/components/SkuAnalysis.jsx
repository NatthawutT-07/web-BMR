import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { fetchAnalysisFilters, fetchSkuAnalysis, fetchStoreAnalysis, fetchBrandAnalysis, fetchStoreSummary } from "../../../api/admin/analysis";

// ────────────────────────────────────────────
// Multi-select dropdown
// ────────────────────────────────────────────
const MultiSelect = ({ label, options, selected, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");

    const toggle = (val) => {
        if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
        else onChange([...selected, val]);
    };

    const filtered = q.trim()
        ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
        : options;

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="w-full text-left border rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 transition min-h-[38px]"
            >
                {selected.length === 0
                    ? <span className="text-gray-400">ทั้งหมด</span>
                    : <span className="text-gray-700">{selected.length} selected</span>}
            </button>
            {open && (
                <div className="absolute z-20 mt-1 min-w-[220px] sm:min-w-[260px] max-w-sm max-h-60 overflow-y-auto bg-white border rounded-lg shadow-lg font-normal text-gray-800">
                    <div className="sticky top-0 bg-white border-b p-1.5">
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs text-gray-800"
                        />
                    </div>
                    <div className="flex justify-between items-center px-3 py-1.5 border-b bg-gray-50">
                        <button
                            type="button"
                            onClick={() => onChange(options)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                        >
                            เลือกทั้งหมด
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange([]); setQ(""); }}
                            className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 transition"
                            title="ล้าง"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            ล้าง
                        </button>
                    </div>
                    {filtered.map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-800"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                onChange={() => toggle(opt)}
                                className="accent-blue-600"
                            />
                            <span className="whitespace-normal leading-tight break-words">{opt}</span>
                        </label>
                    ))}
                    {filtered.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">ไม่พบ</div>
                    )}
                </div>
            )}
            {open && (
                <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQ(""); }} />
            )}
        </div>
    );
};

// ────────────────────────────────────────────
const SkuAnalysis = () => {
    const [filterOpts, setFilterOpts] = useState({ docStatuses: [], reasons: [], branchCodes: [], brands: [] });

    const [mode, setMode] = useState("sku");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selBranches, setSelBranches] = useState([]);
    const [selBrands, setSelBrands] = useState([]);
    const [shelfLifeFilter, setShelfLifeFilter] = useState("all");

    const [rows, setRows] = useState([]);
    const [summaryMonths, setSummaryMonths] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("product_code");
    const [sortDir, setSortDir] = useState("asc");

    // Store Summary drill-down
    const [drillDown, setDrillDown] = useState(null); // { branchCode, branchName, rows, months }
    const [drillLoading, setDrillLoading] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchAnalysisFilters();
                setFilterOpts(data);
            } catch {
                toast.error("โหลด filter ไม่สำเร็จ");
            }
        })();
    }, []);

    useEffect(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        setStartDate(`${y}-${m}-01`);
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        setEndDate(`${y}-${m}-${String(lastDay).padStart(2, "0")}`);
    }, []);

    const handleSearch = useCallback(async () => {
        if (!startDate || !endDate) {
            toast.error("กรุณาเลือกช่วงวันที่");
            return;
        }

        const s = new Date(startDate);
        const e = new Date(endDate);

        if (mode === "sku") {
            const diffDays = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 31) {
                toast.error("SKU รองรับสูงสุด 31 วัน");
                return;
            }
        }

        setLoading(true);
        setSearched(true);
        try {
            let data;
            if (mode === "store") {
                data = await fetchStoreAnalysis({
                    startDate,
                    endDate,
                    branchCodes: selBranches,
                    brands: selBrands,
                    shelfLifeFilter,
                });
                setSummaryMonths(data.months || []);
            } else if (mode === "brand") {
                // Validate max 5 months
                const s = new Date(startDate);
                const e = new Date(endDate);
                const diff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
                if (diff > 4) {
                    toast.error("Brand รองรับสูงสุด 5 เดือน");
                    setLoading(false);
                    return;
                }
                data = await fetchBrandAnalysis({
                    startDate,
                    endDate,
                    shelfLifeFilter,
                });
                setSummaryMonths(data.months || []);
            } else if (mode === "storeSummary") {
                // Validate max 5 months
                const s = new Date(startDate);
                const e = new Date(endDate);
                const diff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
                if (diff > 4) {
                    toast.error("Store Summary รองรับสูงสุด 5 เดือน");
                    setLoading(false);
                    return;
                }
                data = await fetchStoreSummary({ startDate, endDate, shelfLifeFilter });
                setSummaryMonths(data.months || []);
            } else {
                data = await fetchSkuAnalysis({
                    startDate,
                    endDate,
                    branchCodes: selBranches,
                    brands: selBrands,
                    shelfLifeFilter,
                });
            }
            setRows(data.rows || []);
            toast.success(`พบ ${data.total} รายการ`);
        } catch (err) {
            toast.error("ดึงข้อมูลไม่สำเร็จ: " + (err?.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [mode, startDate, endDate, selBranches, selBrands, shelfLifeFilter]);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("asc"); }
    };

    const displayRows = useMemo(() => {
        let list = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    r.product_code?.toLowerCase().includes(q) ||
                    r.product_name?.toLowerCase().includes(q) ||
                    r.product_brand?.toLowerCase().includes(q) ||
                    r.brand?.toLowerCase().includes(q) ||
                    r.branch_code?.toLowerCase().includes(q) ||
                    r.branch_name?.toLowerCase().includes(q)
            );
        }
        list = [...list].sort((a, b) => {
            if (mode === "brand") {
                const cA = String(a.consing_item || "");
                const cB = String(b.consing_item || "");
                if (cA !== cB) return cB.localeCompare(cA, "th");

                let sA = 0, sB = 0;
                for (const m of summaryMonths) {
                    sA += a.months?.[m]?.sales || 0;
                    sB += b.months?.[m]?.sales || 0;
                }
                return sB - sA;
            }

            const va = a[sortKey] ?? "";
            const vb = b[sortKey] ?? "";
            if (typeof va === "number" && typeof vb === "number")
                return sortDir === "asc" ? va - vb : vb - va;
            return sortDir === "asc"
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
        return list;
    }, [rows, search, sortKey, sortDir, mode, summaryMonths]);

    const totals = useMemo(() => {
        if (mode === "brand" || mode === "storeSummary" || mode === "store") {
            const monthTotals = {};
            for (const m of summaryMonths) {
                monthTotals[m] = { sales: 0, withdraw: 0, sale_quantity: 0, net_sales: 0, withdraw_quantity: 0, withdraw_value: 0, si_quantity: 0, sia_quantity: 0 };
            }
            for (const r of displayRows) {
                for (const m of summaryMonths) {
                    if (r.months?.[m]) {
                        monthTotals[m].sales += r.months[m].sales || 0;
                        monthTotals[m].withdraw += r.months[m].withdraw || 0;
                        monthTotals[m].sale_quantity += r.months[m].sale_quantity || 0;
                        monthTotals[m].net_sales += r.months[m].net_sales || 0;
                        monthTotals[m].withdraw_quantity += r.months[m].withdraw_quantity || 0;
                        monthTotals[m].withdraw_value += r.months[m].withdraw_value || 0;
                        monthTotals[m].si_quantity += r.months[m].si_quantity || 0;
                        monthTotals[m].sia_quantity += r.months[m].sia_quantity || 0;
                    }
                }
            }
            if (mode === "brand" || mode === "storeSummary") return { months: monthTotals };

            // For Store mode, also prepare overall sums for 'totals' property
            const storeTotals = displayRows.reduce(
                (acc, r) => {
                    acc.sale_quantity += r.sale_quantity || 0;
                    acc.net_sales += r.net_sales || 0;
                    acc.withdraw_quantity += r.withdraw_quantity || 0;
                    acc.withdraw_value += r.withdraw_value || 0;
                    acc.si_quantity += r.si_quantity || 0;
                    acc.sia_quantity += r.sia_quantity || 0;
                    acc.stock_quantity += r.stock_quantity || 0;
                    return acc;
                },
                { sale_quantity: 0, net_sales: 0, withdraw_quantity: 0, withdraw_value: 0, si_quantity: 0, sia_quantity: 0, stock_quantity: 0, months: monthTotals }
            );
            return storeTotals;
        }
        return displayRows.reduce(
            (acc, r) => {
                acc.sale_quantity += r.sale_quantity || 0;
                acc.net_sales += r.net_sales || 0;
                acc.withdraw_quantity += r.withdraw_quantity || 0;
                acc.withdraw_value += r.withdraw_value || 0;
                acc.si_quantity += r.si_quantity || 0;
                acc.sia_quantity += r.sia_quantity || 0;
                acc.stock_quantity += r.stock_quantity || 0;
                return acc;
            },
            { sale_quantity: 0, net_sales: 0, withdraw_quantity: 0, withdraw_value: 0, si_quantity: 0, sia_quantity: 0, stock_quantity: 0 }
        );
    }, [displayRows, mode, summaryMonths]);

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
        return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
    const fmtDec = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const skuColumns = [
        { key: "product_code", label: "Item No." },
        { key: "product_name", label: "Item Name" },
        { key: "product_brand", label: "Brand" },
        { key: "salesPriceIncVAT", label: "RSP" },
        { key: "shelfLife", label: "Shelf Life" },
        { key: "status", label: "Status" },
        { key: "stock_quantity", label: "Stock" },
        { key: "sale_quantity", label: "QTY Sale" },
        { key: "net_sales", label: "Actual Sale" },
        { key: "withdraw_quantity", label: "QTY W" },
        { key: "withdraw_value", label: "Actual W" },
        { key: "si_quantity", label: "SI" },
        { key: "sia_quantity", label: "SIA" },
    ];

    const storeColumns = [
        { key: "branch_code", label: "Branch" },
        { key: "product_code", label: "Item No." },
        { key: "product_name", label: "Item Name" },
        { key: "brand", label: "Brand" },
        { key: "rsp", label: "RSP" },
        { key: "shelfLife", label: "Shelf Life" },
        { key: "status", label: "Status" },
        { key: "minStore", label: "Min" },
        { key: "maxStore", label: "Max" },
        { key: "packOrder", label: "Pack" },
        { key: "stock_quantity", label: "Stock" },
        { key: "sale_quantity", label: "QTY Sale" },
        { key: "net_sales", label: "Actual Sale" },
        { key: "withdraw_quantity", label: "QTY W" },
        { key: "withdraw_value", label: "Actual W" },
        { key: "si_quantity", label: "SI" },
        { key: "sia_quantity", label: "SIA" },
    ];

    const brandColumns = [
        { key: "brand", label: "Brand" },
        { key: "consing_item", label: "Consign" },
        { key: "sum_sales", label: "Sum Sales" },
        { key: "sum_withdraw", label: "Sum Withdraw" },
        { key: "condition", label: "(%)" },
    ];

    const columns = mode === "store" ? storeColumns : (mode === "brand" || mode === "storeSummary") ? [] : skuColumns;

    // Month label helper
    const monthLabel = (m) => {
        const [y, mo] = m.split("-");
        const names = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        return `${names[parseInt(mo)]} ${parseInt(y) + 543 - 2500}`;
    };

    // Number of leading info columns (before the numeric totals columns)
    const infoColCount = mode === "store" ? 11 : mode === "brand" ? 2 : 7;

    const exportToExcel = () => {
        if (!displayRows.length) {
            toast.warn("ไม่มีข้อมูลสำหรับ Export");
            return;
        }

        let exportData;
        let sheetName;
        let fileName;

        if (mode === "store") {
            exportData = displayRows.map(row => {
                const obj = {
                    "สาขา": row.branch_code,
                    "ชื่อสาขา": row.branch_name || row.branch_code,
                    "รหัสสินค้า": row.product_code,
                    "ชื่อสินค้า": row.product_name,
                    "แบรนด์": row.brand,
                    "ราคาขาย": row.rsp,
                    "Shelf Life": row.shelfLife || "",
                    "Min": row.minStore ?? "",
                    "Max": row.maxStore ?? "",
                    "Pack": row.packOrder ?? "",
                    "Stock": row.stock_quantity,
                };
                for (const m of summaryMonths) {
                    obj[`${monthLabel(m)} QTY Sale`] = row.months?.[m]?.sale_quantity || 0;
                    obj[`${monthLabel(m)} Actual Sale`] = row.months?.[m]?.net_sales || 0;
                    obj[`${monthLabel(m)} QTY W`] = row.months?.[m]?.withdraw_quantity || 0;
                    obj[`${monthLabel(m)} Actual W`] = row.months?.[m]?.withdraw_value || 0;
                    obj[`${monthLabel(m)} SI`] = row.months?.[m]?.si_quantity || 0;
                    obj[`${monthLabel(m)} SIA`] = row.months?.[m]?.sia_quantity || 0;
                }
                obj["รวมทั้งหมด QTY Sale"] = row.sale_quantity;
                obj["รวมทั้งหมด Actual Sale"] = row.net_sales;
                obj["รวมทั้งหมด QTY W"] = row.withdraw_quantity;
                obj["รวมทั้งหมด Actual W"] = row.withdraw_value;
                obj["รวมทั้งหมด SI"] = row.si_quantity;
                obj["รวมทั้งหมด SIA"] = row.sia_quantity;
                return obj;
            });

            const totalRow = {
                "สาขา": "รวม", "ชื่อสาขา": "", "รหัสสินค้า": "", "ชื่อสินค้า": "",
                "แบรนด์": "", "ราคาขาย": "", "Shelf Life": "", "Min": "", "Max": "", "Pack": "",
                "Stock": totals.stock_quantity,
            };
            for (const m of summaryMonths) {
                totalRow[`${monthLabel(m)} QTY Sale`] = totals.months?.[m]?.sale_quantity || 0;
                totalRow[`${monthLabel(m)} Actual Sale`] = totals.months?.[m]?.net_sales || 0;
                totalRow[`${monthLabel(m)} QTY W`] = totals.months?.[m]?.withdraw_quantity || 0;
                totalRow[`${monthLabel(m)} Actual W`] = totals.months?.[m]?.withdraw_value || 0;
                totalRow[`${monthLabel(m)} SI`] = totals.months?.[m]?.si_quantity || 0;
                totalRow[`${monthLabel(m)} SIA`] = totals.months?.[m]?.sia_quantity || 0;
            }
            totalRow["รวมทั้งหมด QTY Sale"] = totals.sale_quantity;
            totalRow["รวมทั้งหมด Actual Sale"] = totals.net_sales;
            totalRow["รวมทั้งหมด QTY W"] = totals.withdraw_quantity;
            totalRow["รวมทั้งหมด Actual W"] = totals.withdraw_value;
            totalRow["รวมทั้งหมด SI"] = totals.si_quantity;
            totalRow["รวมทั้งหมด SIA"] = totals.sia_quantity;

            exportData.push(totalRow);
            sheetName = "Store_SKU_Analysis";
            fileName = `Store_SKU_Analysis_${startDate}_to_${endDate}.xlsx`;
        } else if (mode === "sku") {
            exportData = displayRows.map(row => ({
                "รหัสสินค้า": row.product_code,
                "ชื่อสินค้า": row.product_name,
                "แบรนด์": row.product_brand,
                "ราคาขาย": row.salesPriceIncVAT,
                "Shelf Life": row.shelfLife,
                "Stock": row.stock_quantity,
                "ยอดขาย (ชิ้น)": row.sale_quantity,
                "ยอดขาย (บาท)": row.net_sales,
                "ตัดจ่าย (ชิ้น)": row.withdraw_quantity,
                "ตัดจ่าย (บาท)": row.withdraw_value,
                "SI": row.si_quantity,
                "SIA": row.sia_quantity
            }));
            exportData.push({
                "รหัสสินค้า": "รวม", "ชื่อสินค้า": "", "แบรนด์": "",
                "ราคาขาย": "", "Shelf Life": "",
                "Stock": totals.stock_quantity,
                "ยอดขาย (ชิ้น)": totals.sale_quantity,
                "ยอดขาย (บาท)": totals.net_sales,
                "ตัดจ่าย (ชิ้น)": totals.withdraw_quantity,
                "ตัดจ่าย (บาท)": totals.withdraw_value,
                "SI": totals.si_quantity,
                "SIA": totals.sia_quantity
            });
            sheetName = "SKU_Analysis";
            fileName = `SKU_Analysis_${startDate}_to_${endDate}.xlsx`;
        }

        if (mode === "brand") {
            exportData = displayRows.map(row => {
                const obj = { "แบรนด์": row.brand, "Consign": row.consing_item || "" };
                for (const m of summaryMonths) {
                    obj[`${monthLabel(m)} ยอดขาย`] = row.months?.[m]?.sales || 0;
                    obj[`${monthLabel(m)} ตัดจ่าย`] = row.months?.[m]?.withdraw || 0;
                    obj[`${monthLabel(m)} (%)`] = row.months?.[m]?.condition || 0;
                }
                return obj;
            });
            const totalRow = { "แบรนด์": "รวม", "Consign": "" };
            for (const m of summaryMonths) {
                totalRow[`${monthLabel(m)} ยอดขาย`] = totals.months?.[m]?.sales || 0;
                totalRow[`${monthLabel(m)} ตัดจ่าย`] = totals.months?.[m]?.withdraw || 0;
                const ms = totals.months?.[m];
                totalRow[`${monthLabel(m)} (%)`] = ms?.sales > 0 ? parseFloat(((ms.withdraw / ms.sales) * 100).toFixed(2)) : 0;
            }
            exportData.push(totalRow);
            sheetName = "Brand_Analysis";
            fileName = `Brand_Analysis_${startDate}_to_${endDate}.xlsx`;
        }

        if (mode === "storeSummary") {
            exportData = displayRows.map(row => {
                const obj = { "สาขา": row.branch_code, "ชื่อสาขา": row.branch_name };
                for (const m of summaryMonths) {
                    obj[`${monthLabel(m)} ยอดขาย`] = row.months?.[m]?.sales || 0;
                    obj[`${monthLabel(m)} ตัดจ่าย`] = row.months?.[m]?.withdraw || 0;
                    obj[`${monthLabel(m)} (%)`] = row.months?.[m]?.condition || 0;
                }
                return obj;
            });
            const totalRow = { "สาขา": "รวม", "ชื่อสาขา": "" };
            for (const m of summaryMonths) {
                totalRow[`${monthLabel(m)} ยอดขาย`] = totals.months?.[m]?.sales || 0;
                totalRow[`${monthLabel(m)} ตัดจ่าย`] = totals.months?.[m]?.withdraw || 0;
                const ms = totals.months?.[m];
                totalRow[`${monthLabel(m)} (%)`] = ms?.sales > 0 ? parseFloat(((ms.withdraw / ms.sales) * 100).toFixed(2)) : 0;
            }
            exportData.push(totalRow);
            sheetName = "Store_Summary";
            fileName = `Store_Summary_${startDate}_to_${endDate}.xlsx`;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto relative">

            {/* Tip Header Right */}
            <div className="hidden sm:block absolute top-4 right-6 text-[11px] text-gray-400 text-right">
                * ยอดตัดจ่ายกรองเฉพาะสถานะ "อนุมัติแล้ว" / ยกเว้น "เบิกเพื่อขาย"
                <br /> Bill บันทึกต่อเนื่อง
                <br /> SI บันทึกต่อเนื่อง
                <br /> Withdraw ล้างเเละบันทึกใหม่
                <br /> stock บันทึกใหม่เสมอ
                <br /> ListOfItemHold บันทึกใหม่เสมอ
                <br /> Branch หากมีเพิ่มต้องนำข้อมูลใส่เองหลังบ้าน

            </div>
            {/* Mode Tabs */}
            <div className="flex gap-2 mb-6 justify-center">
                {[
                    { key: "sku", label: "SKU" },
                    { key: "brand", label: "Brand" },
                    { key: "store", label: "Store SKU" },
                    { key: "storeSummary", label: "Store Summary" },
                ].map((m) => (
                    <button
                        key={m.key}
                        disabled={m.disabled || loading}
                        onClick={() => { setMode(m.key); setRows([]); setSearched(false); setSearch(""); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${mode === m.key
                                ? "bg-blue-600 text-white shadow"
                                : m.disabled
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">วันเริ่มต้น</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            disabled={loading} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">วันสิ้นสุด</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            disabled={loading} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    {mode !== "brand" && mode !== "storeSummary" && (
                        <MultiSelect label="สาขา" options={filterOpts.branchCodes}
                            selected={selBranches} onChange={setSelBranches} disabled={loading} />
                    )}
                    {mode === "store" && (
                        <MultiSelect label="แบรนด์" options={filterOpts.brands}
                            selected={selBrands} onChange={setSelBrands} disabled={loading} />
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Shelf Life</label>
                        <select
                            value={shelfLifeFilter}
                            onChange={(e) => setShelfLifeFilter(e.target.value)}
                            disabled={loading}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 transition"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="gt15">มากกว่า 15</option>
                            <option value="lte15">น้อยกว่าเท่ากับ 15</option>
                            <option value="none">ไม่มี</option>
                        </select>
                    </div>
                    {mode !== "storeSummary" && mode !== "brand" && mode !== "store" && (
                        <p className="text-xs text-orange-600 mt-1">สูงสุด 31 วัน</p>
                    )}
                    {(mode === "storeSummary" || mode === "brand" || mode === "store") && (
                        <p className="text-xs text-orange-600 mt-1">สูงสุด 5 เดือน</p>
                    )}
                </div>
                <button onClick={handleSearch}
                    disabled={loading || (mode === "store" && selBranches.length === 0 && selBrands.length === 0)}
                    className="mt-4 w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    title={mode === "store" && selBranches.length === 0 && selBrands.length === 0 ? "กรุณาเลือกฟิลเตอร์อย่างน้อย 1 รายการ" : ""}>
                    {loading ? "กำลังโหลด..." : "🔍 ค้นหา"}
                </button>
            </div>

            {/* Summary Cards */}
            {searched && mode !== "storeSummary" && mode !== "brand" && (
                <div className="grid gap-3 mb-6 grid-cols-2 sm:grid-cols-5">
                    {[
                        { label: "ยอดขาย (ชิ้น)", value: fmt(totals.sale_quantity), color: "text-blue-600" },
                        { label: "ยอดขาย (บาท)", value: fmt(totals.net_sales), color: "text-green-600" },
                        { label: "ตัดจ่าย (ชิ้น)", value: fmt(totals.withdraw_quantity), color: "text-orange-600" },
                        { label: "ตัดจ่าย (บาท)", value: fmt(totals.withdraw_value), color: "text-red-600" },
                        { label: "SI", value: fmt(totals.si_quantity), color: "text-purple-600" },
                        { label: "SIA", value: fmt(totals.sia_quantity), color: "text-pink-600" },
                    ].map((c) => (
                        <div key={c.label} className="bg-white border rounded-xl p-3 shadow-sm text-center">
                            <div className="text-xs text-gray-500">{c.label}</div>
                            <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search bar & Export */}
            {searched && (
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                        <input
                            type="text"
                            placeholder="🔎 ค้นหา รหัสสินค้า, ชื่อ, แบรนด์, หรือ สาขา..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-96 border rounded-lg px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-gray-500">
                            {displayRows.length} / {rows.length} รายการ
                        </span>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export XLSX
                    </button>
                </div>
            )}

            {/* Monthly Table (Brand / Store Summary / Store SKU) */}
            {searched && (mode === "storeSummary" || mode === "brand" || mode === "store") && (
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
                                    <th key={m} colSpan={mode === "store" ? 6 : 3} className="px-3 py-2 text-center border-r border-gray-600">{monthLabel(m)}</th>
                                ))}
                                {mode === "store" && (
                                    <>
                                        <th colSpan={6} className="px-3 py-2 text-center border-r border-gray-600">รวมทั้งหมด</th>
                                    </>
                                )}
                            </tr>
                            <tr>
                                {summaryMonths.map((m) => (
                                    <React.Fragment key={m}>
                                        {mode === "store" ? (
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
                                {mode === "store" && (
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
                                    <td colSpan={mode === "store" ? 10 + summaryMonths.length * 6 + 6 : 2 + summaryMonths.length * 3} className="text-center py-8 text-gray-400">
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
                                                    onClick={async () => {
                                                        setDrillLoading(true);
                                                        try {
                                                            const data = await fetchStoreAnalysis({
                                                                startDate,
                                                                endDate,
                                                                branchCodes: [row.branch_code],
                                                                brands: [],
                                                                shelfLifeFilter,
                                                            });
                                                            setDrillDown({
                                                                branchCode: row.branch_code,
                                                                branchName: row.branch_name,
                                                                rows: (data.rows || []).filter(r =>
                                                                    (r.sale_quantity || 0) !== 0 ||
                                                                    (r.net_sales || 0) !== 0 ||
                                                                    (r.withdraw_quantity || 0) !== 0 ||
                                                                    (r.withdraw_value || 0) !== 0 ||
                                                                    (r.si_quantity || 0) !== 0 ||
                                                                    (r.sia_quantity || 0) !== 0
                                                                ),
                                                                months: data.months || [],
                                                            });
                                                        } catch (err) {
                                                            toast.error("ดึงข้อมูล SKU ไม่สำเร็จ");
                                                        } finally {
                                                            setDrillLoading(false);
                                                        }
                                                    }}
                                                >
                                                    {drillLoading ? "..." : row.branch_code}
                                                </td>
                                                <td className="px-3 py-2 text-sm truncate max-w-[200px] border-r border-gray-100" title={row.branch_name}>{row.branch_name}</td>
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
                                                {mode === "store" ? (
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
                                        {mode === "store" && (
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
                                            <td colSpan={9} className="px-3 py-2 text-right">รวมทั้งหมด</td>
                                            <td className="px-1.5 py-2 text-right text-indigo-600 border-r border-gray-200">{fmt(totals.stock_quantity)}</td>
                                        </>
                                    ) : (
                                        <td colSpan={2} className="px-3 py-2 text-right border-r border-gray-200">รวม</td>
                                    )}
                                    {summaryMonths.map((m) => {
                                        if (mode === "store") {
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
                                    {mode === "store" && (
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
            )}

            {/* Regular Table (SKU) */}
            {searched && mode === "sku" && (
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                    <table className="min-w-full text-sm table-fixed">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                {columns.map((col) => {
                                    // กำหนดความกว้างคอลัมน์คร่าวๆ เพื่อไม่ให้บานเกิน
                                    let wClass = "w-20"; // default for numbers
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
                                        <>
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
                                        </>
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
            )}

            {/* Store Summary Drill-Down Modal */}
            {drillDown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setDrillDown(null); }}>
                    <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[1400px] max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    {drillDown.branchCode} — {drillDown.branchName}
                                </h2>
                                <p className="text-xs text-gray-500">{startDate} ถึง {endDate} · {drillDown.rows.length} SKU</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (!drillDown.rows.length) return;
                                        const exportData = drillDown.rows.map(r => {
                                            const obj = {
                                                "รหัสสินค้า": r.product_code,
                                                "ชื่อสินค้า": r.product_name,
                                                "แบรนด์": r.brand,
                                                "ราคาขาย": r.rsp,
                                                "Shelf Life": r.shelfLife || "",
                                                "Status": r.status || "",
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
                                        XLSX.utils.book_append_sheet(wb, ws, "DrillDown");
                                        XLSX.writeFile(wb, `${drillDown.branchCode}_SKU_${startDate}_to_${endDate}.xlsx`);
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export XLSX
                                </button>
                                <button onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>
                            </div>
                        </div>
                        {/* Table */}
                        <div className="overflow-auto flex-1 px-2 pb-4">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-800 text-white sticky top-0">
                                    <tr>
                                        <th rowSpan={2} className="px-2 py-2 text-left whitespace-nowrap">Item No.</th>
                                        <th rowSpan={2} className="px-3 py-2 text-left whitespace-nowrap">Item Name</th>
                                        <th rowSpan={2} className="px-2 py-2 text-left whitespace-nowrap">Brand</th>
                                        <th rowSpan={2} className="px-2 py-2 text-right whitespace-nowrap">RSP</th>
                                        <th rowSpan={2} className="px-2 py-2 text-center whitespace-nowrap">Shelf Life</th>
                                        <th rowSpan={2} className="px-2 py-2 text-center whitespace-nowrap">Status</th>
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
                                        <tr><td colSpan={10 + drillDown.months.length * 6 + 6} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
                                    ) : (
                                        drillDown.rows.map((r, i) => (
                                            <tr key={r.product_code + i} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}>
                                                <td className="px-2 py-1.5 font-mono text-xs">{r.product_code}</td>
                                                <td className="px-3 py-1.5 truncate max-w-[250px]" title={r.product_name}>{r.product_name || "-"}</td>
                                                <td className="px-2 py-1.5 text-xs truncate">{r.brand || "-"}</td>
                                                <td className="px-2 py-1.5 text-right text-xs">{fmt(r.rsp)}</td>
                                                <td className="px-2 py-1.5 text-center text-xs">{r.shelfLife || "-"}</td>
                                                <td className="px-2 py-1.5 text-center text-xs">{r.status || "-"}</td>
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
            )}
        </div>
    );
};

export default SkuAnalysis;

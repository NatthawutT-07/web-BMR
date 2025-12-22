// src/components/admin/dashboard/parts/DashboardProductList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDashboardProductList } from "../../../../../api/admin/dashboard";

/* ============== Helpers ============== */
const fmtMoney = (v) =>
    Number(v || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const fmtQty = (v) =>
    Number(v || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

const safeDiv = (a, b) => {
    const x = Number(a || 0);
    const y = Number(b || 0);
    return y ? x / y : 0;
};

const fmtPct = (ratio) => `${(Number(ratio || 0) * 100).toFixed(1)}%`;

const modeLabel = (m) =>
    m === "diff_month"
        ? "Diff Month"
        : m === "diff_quarter"
            ? "Diff Quarter"
            : "Diff Year (YoY)";

const Spinner = ({ className = "" }) => (
    <span
        className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
    />
);

/* ============== small tooltip ============== */
const Tip = ({ text, children }) => (
    <span className="relative inline-block group">
        {children}
        {text ? (
            <span
                className="pointer-events-none absolute z-20 hidden group-hover:block
                   -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                   max-w-[420px] truncate
                   whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1
                   text-[11px] text-slate-700 shadow"
            >
                {text}
            </span>
        ) : null}
    </span>
);

const diffColor = (diff, betterWhen = "higher") => {
    // betterWhen: "higher" -> diff>0 ดี, "lower" -> diff<0 ดี
    if (betterWhen === "lower") {
        if (diff < 0) return "text-emerald-700";
        if (diff > 0) return "text-rose-700";
        return "text-slate-600";
    }
    if (diff > 0) return "text-emerald-700";
    if (diff < 0) return "text-rose-700";
    return "text-slate-600";
};

const formatDiffLine = (diffAmt, diffPct, isMoney = true) => {
    const sign = diffAmt > 0 ? "+" : diffAmt < 0 ? "-" : "";
    const amtAbs = Math.abs(Number(diffAmt || 0));
    const pctAbs = Math.abs(Number(diffPct || 0)) * 100;
    const amtText = isMoney ? fmtMoney(amtAbs) : fmtQty(amtAbs);
    return `${sign}${pctAbs.toFixed(1)}% (${sign}${amtText})`;
};

/* ============== Component ============== */
export default function DashboardProductList({
    mode,
    primaryStart,
    primaryEnd,
    compareStart,
    compareEnd,
    disabled,
}) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [primaryPayload, setPrimaryPayload] = useState(null);
    const [comparePayload, setComparePayload] = useState(null);

    // ✅ default sort: sales current มากสุดก่อน
    const [q, setQ] = useState("");
    const [sortKey, setSortKey] = useState("sales"); // sales | qty | discount | diff | product | group
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // prevent race
    const reqIdRef = useRef(0);

    useEffect(() => {
        if (!primaryStart || !primaryEnd) return;

        const myId = ++reqIdRef.current;
        let alive = true;

        const run = async () => {
            setErr("");
            setLoading(true);

            try {
                const [p, c] = await Promise.all([
                    getDashboardProductList(primaryStart, primaryEnd),
                    compareStart && compareEnd
                        ? getDashboardProductList(compareStart, compareEnd)
                        : Promise.resolve({ summary: {}, rows: [] }),
                ]);

                if (!alive || reqIdRef.current !== myId) return;
                setPrimaryPayload(p || null);
                setComparePayload(c || null);

                // ✅ keep default sort sales desc (ถ้าผู้ใช้เปลี่ยนแล้ว เราไม่ไปรีเซ็ต)
                setPage(1);
            } catch (e) {
                if (!alive || reqIdRef.current !== myId) return;
                setPrimaryPayload(null);
                setComparePayload(null);
                setErr("โหลดรายการสินค้าไม่สำเร็จ (เช็ค API / token / network)");
            } finally {
                if (alive && reqIdRef.current === myId) setLoading(false);
            }
        };

        run();
        return () => {
            alive = false;
        };
    }, [primaryStart, primaryEnd, compareStart, compareEnd]);

    const primaryRows = primaryPayload?.rows || [];
    const compareRows = comparePayload?.rows || [];

    const hasCompare = useMemo(() => {
        const s = comparePayload?.summary || {};
        const total =
            Math.abs(Number(s.totalSales || 0)) +
            Math.abs(Number(s.totalQty || 0)) +
            Math.abs(Number(s.totalDiscount || 0));
        return total > 0 || (compareRows?.length || 0) > 0;
    }, [comparePayload, compareRows]);

    // ✅ merge current+compare by product_code + product_brand
    const mergedRows = useMemo(() => {
        const makeKey = (r) => `${r.product_code}__${r.product_brand || ""}`;
        const map = new Map();

        for (const r of primaryRows) {
            const key = makeKey(r);
            map.set(key, {
                key,
                product_code: r.product_code,
                product_name: r.product_name,
                product_brand: r.product_brand,
                groupName: r.groupName ?? null,

                cur_sales: Number(r.sales || 0),
                cur_qty: Number(r.qty || 0),
                cur_discount: Number(r.discount_total || 0),
                cur_ratio: Number(r.sales_ratio || 0),

                cmp_sales: 0,
                cmp_qty: 0,
                cmp_discount: 0,
                cmp_ratio: 0,
            });
        }

        for (const r of compareRows) {
            const key = makeKey(r);
            const row =
                map.get(key) ||
                ({
                    key,
                    product_code: r.product_code,
                    product_name: r.product_name,
                    product_brand: r.product_brand,
                    groupName: r.groupName ?? null,

                    cur_sales: 0,
                    cur_qty: 0,
                    cur_discount: 0,
                    cur_ratio: 0,

                    cmp_sales: 0,
                    cmp_qty: 0,
                    cmp_discount: 0,
                    cmp_ratio: 0,
                });

            row.cmp_sales = Number(r.sales || 0);
            row.cmp_qty = Number(r.qty || 0);
            row.cmp_discount = Number(r.discount_total || 0);
            row.cmp_ratio = Number(r.sales_ratio || 0);

            if ((row.groupName == null || row.groupName === "") && r.groupName) row.groupName = r.groupName;
            if (!row.product_name && r.product_name) row.product_name = r.product_name;

            map.set(key, row);
        }

        return Array.from(map.values()).map((r) => {
            const diffSales = Number(r.cur_sales || 0) - Number(r.cmp_sales || 0);
            const diffPct =
                r.cmp_sales > 0 ? safeDiv(diffSales, r.cmp_sales) : r.cur_sales > 0 ? 1 : 0;

            const combo = `${r.product_code}:${r.product_brand || "-"}:${r.product_name || "-"}`;

            return { ...r, diffSales, diffPct, combo };
        });
    }, [primaryRows, compareRows]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return mergedRows;

        return mergedRows.filter((r) => {
            const s = [r.combo, r.groupName].filter(Boolean).join(" ").toLowerCase();
            return s.includes(term);
        });
    }, [mergedRows, q]);

    const sorted = useMemo(() => {
        const dir = sortDir === "asc" ? 1 : -1;

        const getVal = (r) => {
            if (sortKey === "product") return String(r.combo || "");
            if (sortKey === "group") return String(r.groupName || "");
            if (sortKey === "qty") return Number(r.cur_qty || 0);
            if (sortKey === "discount") return Number(r.cur_discount || 0);
            if (sortKey === "diff") return Number(r.diffSales || 0);
            return Number(r.cur_sales || 0); // sales
        };

        const copy = [...filtered];
        copy.sort((a, b) => {
            const va = getVal(a);
            const vb = getVal(b);
            if (typeof va === "string" || typeof vb === "string") {
                return String(va).localeCompare(String(vb)) * dir;
            }
            return (Number(va) - Number(vb)) * dir;
        });
        return copy;
    }, [filtered, sortKey, sortDir]);

    const totalRows = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const pageSafe = Math.min(page, totalPages);

    const paged = useMemo(() => {
        const startIdx = (pageSafe - 1) * pageSize;
        return sorted.slice(startIdx, startIdx + pageSize);
    }, [sorted, pageSafe, pageSize]);

    const onSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir(key === "product" || key === "group" ? "asc" : "desc");
        }
    };

    const SortTh = ({ k, label, className = "" }) => {
        const active = sortKey === k;
        return (
            <th className={`px-3 py-2 text-xs font-semibold text-slate-700 select-none ${className}`}>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                    onClick={() => onSort(k)}
                >
                    {label}
                    <span className={`text-[10px] ${active ? "text-slate-900" : "text-slate-400"}`}>
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                </button>
            </th>
        );
    };

    // ✅ summary + diff totals
    const curSum = primaryPayload?.summary || {};
    const cmpSum = comparePayload?.summary || {};

    const summaryCards = useMemo(() => {
        const curSales = Number(curSum.totalSales || 0);
        const curQty = Number(curSum.totalQty || 0);
        const curDisc = Math.abs(Number(curSum.totalDiscount || 0)); // แสดงเป็นบวก
        const curProducts = Number(curSum.totalProducts || 0);

        const cmpSales = Number(cmpSum.totalSales || 0);
        const cmpQty = Number(cmpSum.totalQty || 0);
        const cmpDisc = Math.abs(Number(cmpSum.totalDiscount || 0));
        const cmpProducts = Number(cmpSum.totalProducts || 0);

        // sales/qty/products: diff = current - compare
        const diffSalesAmt = curSales - cmpSales;
        const diffSalesPct = cmpSales > 0 ? safeDiv(diffSalesAmt, cmpSales) : curSales > 0 ? 1 : 0;

        const diffQtyAmt = curQty - cmpQty;
        const diffQtyPct = cmpQty > 0 ? safeDiv(diffQtyAmt, cmpQty) : curQty > 0 ? 1 : 0;

        const diffProdAmt = curProducts - cmpProducts;
        const diffProdPct = cmpProducts > 0 ? safeDiv(diffProdAmt, cmpProducts) : curProducts > 0 ? 1 : 0;

        // discount: diff = current - compare (แต่ "น้อยดีกว่า")
        const diffDiscAmt = curDisc - cmpDisc;
        const diffDiscPct = cmpDisc > 0 ? safeDiv(diffDiscAmt, cmpDisc) : curDisc > 0 ? 1 : 0;

        return {
            curSales,
            curQty,
            curDisc,
            curProducts,
            cmpSales,
            cmpQty,
            cmpDisc,
            cmpProducts,
            diffSalesAmt,
            diffSalesPct,
            diffQtyAmt,
            diffQtyPct,
            diffProdAmt,
            diffProdPct,
            diffDiscAmt,
            diffDiscPct,
        };
    }, [curSum, cmpSum]);

    return (
        <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-800">
                        รายการสินค้ารวม (Product List)
                    </h2>

                    <p className="mt-1 text-xs md:text-sm text-slate-500">
                        โหมด: <span className="font-semibold text-slate-700">{modeLabel(mode)}</span>
                        <span className="mx-2 text-slate-300">•</span>
                        Current:{" "}
                        <span className="font-medium text-slate-700">
                            {primaryStart} → {primaryEnd}
                        </span>
                        {compareStart && compareEnd ? (
                            <>
                                <span className="mx-2 text-slate-300">•</span>
                                Compare:{" "}
                                <span className="font-medium text-slate-700">
                                    {compareStart} → {compareEnd}
                                </span>
                            </>
                        ) : null}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <Spinner />
                            กำลังโหลดสินค้า...
                        </div>
                    ) : null}
                </div>
            </div>

            {err ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
                    {err}
                </div>
            ) : null}

            {/* Summary cards (มี diff ให้ยอด total ด้านบน) */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">จำนวนสินค้า (Current)</div>
                    <div className="mt-1 text-lg font-semibold text-slate-800">
                        {Number(summaryCards.curProducts || 0).toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                        Compare: {Number(summaryCards.cmpProducts || 0).toLocaleString()}
                    </div>
                    {hasCompare ? (
                        <div className={`mt-1 text-[11px] ${diffColor(summaryCards.diffProdAmt, "higher")}`}>
                            Diff: {formatDiffLine(summaryCards.diffProdAmt, summaryCards.diffProdPct, false)}
                        </div>
                    ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">ยอดขายรวม (Current)</div>
                    <div className="mt-1 text-lg font-semibold text-slate-800">{fmtMoney(summaryCards.curSales)}</div>
                    <div className="mt-1 text-[11px] text-slate-400">Compare: {fmtMoney(summaryCards.cmpSales)}</div>
                    {hasCompare ? (
                        <div className={`mt-1 text-[11px] ${diffColor(summaryCards.diffSalesAmt, "higher")}`}>
                            Diff: {formatDiffLine(summaryCards.diffSalesAmt, summaryCards.diffSalesPct, true)}
                        </div>
                    ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Qty รวม (Current)</div>
                    <div className="mt-1 text-lg font-semibold text-slate-800">{fmtQty(summaryCards.curQty)}</div>
                    <div className="mt-1 text-[11px] text-slate-400">Compare: {fmtQty(summaryCards.cmpQty)}</div>
                    {hasCompare ? (
                        <div className={`mt-1 text-[11px] ${diffColor(summaryCards.diffQtyAmt, "higher")}`}>
                            Diff: {formatDiffLine(summaryCards.diffQtyAmt, summaryCards.diffQtyPct, false)}
                        </div>
                    ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Discount รวม (Current)</div>
                    <div className="mt-1 text-lg font-semibold text-slate-800">{fmtMoney(summaryCards.curDisc)}</div>
                    <div className="mt-1 text-[11px] text-slate-400">Compare: {fmtMoney(summaryCards.cmpDisc)}</div>
                    {hasCompare ? (
                        <div className={`mt-1 text-[11px] ${diffColor(summaryCards.diffDiscAmt, "lower")}`}>
                            Diff: {formatDiffLine(summaryCards.diffDiscAmt, summaryCards.diffDiscPct, true)}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="flex-1">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="ค้นหา: brand:name / groupName"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        disabled={disabled}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={disabled}
                    >
                        <option value={10}>10 / page</option>
                        <option value={15}>15 / page</option>
                        <option value={25}>25 / page</option>
                    </select>

                    <div className="text-xs text-slate-500">{totalRows.toLocaleString()} items</div>
                </div>
            </div>

            {/* ✅ Table: ลดการล้นจอด้วย table-fixed + ซ่อนบางคอลัมน์บนจอเล็ก */}
            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full table-fixed">
                    <thead className="bg-slate-50">
                        <tr>
                            <SortTh k="product" label="Product" className="w-[46%] text-left" />
                            <SortTh k="group" label="Group" className="w-[16%] text-left hidden lg:table-cell" />

                            <SortTh k="sales" label="Sales" className="w-[18%] text-right" />
                            <SortTh k="qty" label="Qty" className="w-[10%] text-right hidden md:table-cell" />
                            <SortTh k="discount" label="Discount" className="w-[12%] text-right hidden xl:table-cell" />
                            <SortTh k="diff" label="Diff" className="w-[18%] text-right" />
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">
                                    {loading ? "Loading..." : "No products found in this range."}
                                </td>
                            </tr>
                        ) : (
                            paged.map((r) => {
                                const diff = Number(r.diffSales || 0);
                                const pct = Number(r.diffPct || 0);
                                const diffCls = diffColor(diff, "higher");
                                const brand = r.product_brand?.toLowerCase() === "unknown" ? "" : r.product_brand;
                                const name = r.product_name?.toLowerCase() === "unknown" ? "" : r.product_name;
                                const productText = `(${r.product_code})${brand}${brand && name ? ":" : ""}${name}`;

                                const groupText = r.groupName || "-";

                                return (
                                    <tr key={r.key}>
                                        {/* Product: ทำให้ไม่ล้นจอด้วย wrap + break-words */}
                                        <td className="px-3 py-2 text-sm text-slate-800 align-top">
                                            <Tip text={productText}>
                                                <div className="font-semibold text-slate-800 whitespace-normal break-words leading-snug">
                                                    {productText}
                                                </div>
                                            </Tip>

                                            <div className="mt-0.5 text-[11px] text-slate-500 whitespace-normal break-words">
                                                Share: {fmtPct(r.cur_ratio)}
                                                {hasCompare ? (
                                                    <span className="ml-2 text-slate-300">
                                                        • Compare: {fmtPct(r.cmp_ratio)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>

                                        {/* Group: ซ่อนบนจอเล็ก */}
                                        <td className="px-3 py-2 align-top hidden lg:table-cell">
                                            <Tip text={groupText !== "-" ? groupText : ""}>
                                                <div className="text-[11px] text-slate-600 whitespace-normal break-words leading-snug">
                                                    {groupText}
                                                </div>
                                            </Tip>
                                        </td>

                                        {/* Sales */}
                                        <td className="px-3 py-2 text-sm text-slate-800 text-right tabular-nums align-top">
                                            <div className="font-semibold">{fmtMoney(r.cur_sales)}</div>
                                            <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                                                Compare: {hasCompare ? fmtMoney(r.cmp_sales) : "-"}
                                            </div>
                                        </td>

                                        {/* Qty: ซ่อนบนจอเล็ก */}
                                        <td className="px-3 py-2 text-sm text-slate-800 text-right tabular-nums align-top hidden md:table-cell">
                                            <div className="font-semibold">{fmtQty(r.cur_qty)}</div>
                                            <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                                                Compare: {hasCompare ? fmtQty(r.cmp_qty) : "-"}
                                            </div>
                                        </td>

                                        {/* Discount: ซ่อนบนจอเล็ก/กลาง */}
                                        <td className="px-3 py-2 text-sm text-slate-800 text-right tabular-nums align-top hidden xl:table-cell">
                                            <div className="font-semibold">{fmtMoney(r.cur_discount)}</div>
                                            <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                                                Compare: {hasCompare ? fmtMoney(r.cmp_discount) : "-"}
                                            </div>
                                        </td>

                                        {/* Diff */}
                                        <td className="px-3 py-2 text-sm text-right tabular-nums align-top">
                                            <div className={`font-semibold ${diffCls}`}>
                                                {diff > 0 ? "+" : ""}
                                                {fmtMoney(diff)}
                                            </div>
                                            <div className={`text-[11px] ${diffCls} whitespace-nowrap`}>
                                                {hasCompare
                                                    ? `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${(Math.abs(pct) * 100).toFixed(1)}%`
                                                    : "-"}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (EN) */}
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs text-slate-500">
                    Page {pageSafe} / {totalPages}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                        onClick={() => setPage(1)}
                        disabled={disabled || pageSafe === 1}
                    >
                        First
                    </button>
                    <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={disabled || pageSafe === 1}
                    >
                        Prev
                    </button>
                    <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={disabled || pageSafe === totalPages}
                    >
                        Next
                    </button>
                    <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                        onClick={() => setPage(totalPages)}
                        disabled={disabled || pageSafe === totalPages}
                    >
                        Last
                    </button>
                </div>
            </div>
        </section>
    );
}

// src/components/admin/dashboard/second/UISections.jsx
import React from "react";

// ====================== SECTION WRAPPER ======================
export const Section = ({ title, subtitle, children, className = "" }) => (
    <section
        className={`bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 ${className}`}
    >
        {title && (
            <div className="mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-1 text-xs md:text-sm text-slate-500">
                        {subtitle}
                    </p>
                )}
            </div>
        )}
        {children}
    </section>
);

// ====================== PRODUCT LIST TABLE (ALL PRODUCTS) ======================
export const ProductListTable = ({
    loading,
    summary,
    rows,
    page,
    pageSize,
    totalRows,
    search,
    sort,
    onSearchChange,
    onSortChange,
    onPageChange,
}) => {
    // ---------- กำหนดปีปัจจุบัน / ปีก่อนหน้า (รองรับปีถัด ๆ ไปอัตโนมัติ) ----------
    const now = new Date();
    const currentYear =
        typeof summary?.currentYear === "number"
            ? summary.currentYear
            : now.getFullYear();
    const prevYear = currentYear - 1;

    // ---------- ดึงค่ารวมพื้นฐาน (ใช้เป็น fallback) ----------
    const rawTotalProducts = Number(
        summary?.totalProducts ?? summary?.total_products ?? 0
    );
    const rawTotalQty = Number(
        summary?.totalQty ?? summary?.total_qty ?? 0
    );
    const rawTotalSales = Number(
        summary?.totalSales ?? summary?.total_sales ?? 0
    );
    const rawTotalDiscount = Number(
        summary?.totalDiscount ?? summary?.total_discount ?? 0
    );

    // helper: สร้าง metric รายปีจาก summary
    const buildSummaryMetric = (baseKey, fallbackValue) => {
        const currentValue =
            summary?.[`${baseKey}_${currentYear}`] ??
            summary?.[baseKey] ??
            fallbackValue ??
            0;
        const prevValue =
            summary?.[`${baseKey}_${prevYear}`] ?? 0;

        const currentNum = Number(currentValue || 0);
        const prevNum = Number(prevValue || 0);
        const diff = currentNum - prevNum;
        const percentChange =
            prevNum === 0 ? null : (diff / prevNum) * 100;

        return { current: currentNum, prev: prevNum, diff, percentChange };
    };

    const productsMetric = buildSummaryMetric(
        "totalProducts",
        rawTotalProducts
    );
    const qtyMetric = buildSummaryMetric("totalQty", rawTotalQty);
    const salesMetric = buildSummaryMetric("totalSales", rawTotalSales);
    const discountMetric = buildSummaryMetric(
        "totalDiscount",
        rawTotalDiscount
    );

    const formatSummaryDiff = (metric, { isMoney = false } = {}) => {
        const { diff, percentChange, prev } = metric;

        if (prev === 0) {
            if (!diff) return "no change";
            const sign = diff > 0 ? "+" : "-";
            const absDiff = Math.abs(diff);
            const valueText = isMoney
                ? absDiff.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                : absDiff.toLocaleString();
            return `${sign}${valueText}`;
        }

        const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
        const absPercent = Math.abs(percentChange ?? 0).toFixed(2);
        const absDiff = Math.abs(diff);
        const valueText = isMoney
            ? absDiff.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            : absDiff.toLocaleString();
        return `${sign}${absPercent}% (${sign}${valueText})`;
    };

    const getDiffClass = (diff) => {
        if (diff > 0) return "text-emerald-600";
        if (diff < 0) return "text-red-500";
        return "text-slate-500";
    };

    const totalPages = totalRows > 0 ? Math.ceil(totalRows / pageSize) : 1;

    // ---------- metric รายปีสำหรับแต่ละ row ----------
    const getRowMetric = (row, baseKey) => {
        const currentValue =
            row[`${baseKey}_${currentYear}`] ??
            row[baseKey] ??
            0;
        const prevValue =
            row[`${baseKey}_${prevYear}`] ?? 0;

        return {
            current: Number(currentValue || 0),
            prev: Number(prevValue || 0),
        };
    };

    // render cell แบบ “ปีนี้ / ปีที่แล้ว / diff”
    const renderYearCell = (
        metric,
        { isMoney = false, isPercent = false, mainClass = "" } = {}
    ) => {
        const { current, prev } = metric;
        const diff = current - prev;
        const diffClass = getDiffClass(diff);

        const formatMain = () => {
            if (isPercent) {
                const pct = current * 100;
                return `${pct.toFixed(2)}%`;
            }
            if (isMoney) {
                return current.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }
            return current.toLocaleString();
        };

        const formatPrev = () => {
            if (isPercent) {
                const pct = prev * 100;
                return `${pct.toFixed(2)}%`;
            }
            if (isMoney) {
                return prev.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }
            return prev.toLocaleString();
        };

        const formatDiff = () => {
            if (isPercent) {
                const currPct = current * 100;
                const prevPct = prev * 100;
                const diffPts = currPct - prevPct;

                if (prevPct === 0) {
                    if (!diffPts) return "no change";
                    const sign = diffPts > 0 ? "+" : "-";
                    return `${sign}${Math.abs(diffPts).toFixed(2)} pts`;
                }

                const percentChange = (diffPts / prevPct) * 100;
                const sign = diffPts > 0 ? "+" : "-";
                return `${sign}${Math.abs(percentChange).toFixed(
                    2
                )}% (${sign}${Math.abs(diffPts).toFixed(2)})`;
            } else {
                if (prev === 0) {
                    if (!diff) return "no change";
                    const sign = diff > 0 ? "+" : "-";
                    const absDiff = Math.abs(diff);
                    const valueText = isMoney
                        ? absDiff.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })
                        : absDiff.toLocaleString();
                    return `${sign}${valueText}`;
                }

                const percentChange = (diff / prev) * 100;
                const sign = diff > 0 ? "+" : "-";
                const absPercent = Math.abs(percentChange).toFixed(2);
                const absDiff = Math.abs(diff);
                const valueText = isMoney
                    ? absDiff.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })
                    : absDiff.toLocaleString();
                return `${sign}${absPercent}% (${sign}${valueText})`;
            }
        };

        return (
            <div className="grid grid-cols-[1fr,1fr] grid-rows-2 gap-x-1">
                <div
                    className={`row-span-2 flex items-center justify-end font-medium ${mainClass}`}
                >
                    {formatMain()}
                </div>
                <div className="col-span-1 text-[10px] text-slate-500 text-right">
                    {prevYear}: {formatPrev()}
                </div>
                <div
                    className={`col-span-1 text-[10px] text-right ${diffClass}`}
                >
                    {formatDiff()}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-1 text-xs md:text-sm">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total products */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Total products
                    </p>
                    <div className="mt-1 grid grid-cols-[1.4fr,1.6fr] gap-x-2 items-center">
                        <div className="text-lg font-semibold text-slate-800">
                            {productsMetric.current.toLocaleString()}
                        </div>
                        <div className="flex flex-col items-end text-[11px]">
                            <span className="text-slate-500">
                                {prevYear}:{" "}
                                {productsMetric.prev.toLocaleString()}
                            </span>
                            <span
                                className={`mt-0.5 ${getDiffClass(
                                    productsMetric.diff
                                )}`}
                            >
                                {formatSummaryDiff(productsMetric, {
                                    isMoney: false,
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total quantity */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Total quantity
                    </p>
                    <div className="mt-1 grid grid-cols-[1.4fr,1.6fr] gap-x-2 items-center">
                        <div className="text-lg font-semibold text-slate-800">
                            {qtyMetric.current.toLocaleString()}
                        </div>
                        <div className="flex flex-col items-end text-[11px]">
                            <span className="text-slate-500">
                                {prevYear}:{" "}
                                {qtyMetric.prev.toLocaleString()}
                            </span>
                            <span
                                className={`mt-0.5 ${getDiffClass(
                                    qtyMetric.diff
                                )}`}
                            >
                                {formatSummaryDiff(qtyMetric, {
                                    isMoney: false,
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total sales + Discount yearly */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Total sales
                    </p>
                    <div className="mt-1 grid grid-cols-[1.4fr,1.6fr] gap-x-2 items-center">
                        <div className="text-lg font-semibold text-emerald-700">
                            {salesMetric.current.toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </div>
                        <div className="flex flex-col items-end text-[11px]">
                            <span className="text-slate-500">
                                {prevYear}:{" "}
                                {salesMetric.prev.toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </span>
                            <span
                                className={`mt-0.5 ${getDiffClass(
                                    salesMetric.diff
                                )}`}
                            >
                                {formatSummaryDiff(salesMetric, {
                                    isMoney: true,
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Discount yearly info */}
                    <div className="mt-1 text-[11px]">
                        <div className="text-red-500">
                            Discount {currentYear}:{" "}
                            {discountMetric.current.toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </div>
                        <div className="text-slate-500">
                            {prevYear}:{" "}
                            {discountMetric.prev.toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </div>
                        <div
                            className={`${getDiffClass(
                                discountMetric.diff
                            )} mt-0.5`}
                        >
                            {formatSummaryDiff(discountMetric, {
                                isMoney: true,
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="ค้นหาสินค้า / รหัส / แบรนด์"
                        className="w-full md:w-72 rounded-lg border border-slate-200 px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="text-[11px] text-slate-500 hover:text-slate-700"
                        >
                            clear
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2">
                    <label className="text-[11px] text-slate-500">
                        Sort by:
                    </label>
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="sales_desc">Sales (high → low)</option>
                        <option value="qty_desc">Qty (high → low)</option>
                        <option value="discount_desc">
                            Discount (most negative first)
                        </option>
                        <option value="name_asc">Name (A → Z)</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40">
                {loading ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                        Loading products...
                    </div>
                ) : rows && rows.length > 0 ? (
                    <table className="min-w-full text-xs md:text-sm">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200">
                                <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-slate-600">
                                    #
                                </th>
                                <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-slate-600">
                                    สินค้า
                                </th>
                                <th className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600">
                                    จำนวน
                                </th>
                                <th className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600">
                                    ยอดขาย
                                </th>
                                <th className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600">
                                    ส่วนลด
                                </th>
                                <th className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600">
                                    % of total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((p, i) => {
                                const qtyMetricRow = getRowMetric(p, "qty");
                                const salesMetricRow = getRowMetric(
                                    p,
                                    "sales"
                                );
                                const discountMetricRow = getRowMetric(
                                    p,
                                    "discount_total"
                                );
                                const ratioMetricRow = getRowMetric(
                                    p,
                                    "sales_ratio"
                                );

                                return (
                                    <tr
                                        key={`${p.product_code}-${i}`}
                                        className="border-b last:border-0 border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/60 transition-colors"
                                    >
                                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                                            {(page - 1) * pageSize + i + 1}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-800">
                                            <div className="font-medium">
                                                {p.product_name}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {p.product_code}
                                                {p.product_brand
                                                    ? ` • ${p.product_brand}`
                                                    : ""}
                                            </div>
                                        </td>
                                        {/* Qty */}
                                        <td className="py-2.5 px-3">
                                            {renderYearCell(
                                                qtyMetricRow,
                                                {
                                                    isMoney: false,
                                                }
                                            )}
                                        </td>
                                        {/* Sales */}
                                        <td className="py-2.5 px-3">
                                            {renderYearCell(
                                                salesMetricRow,
                                                {
                                                    isMoney: true,
                                                    mainClass:
                                                        "text-blue-700",
                                                }
                                            )}
                                        </td>
                                        {/* Discount */}
                                        <td className="py-2.5 px-3">
                                            {renderYearCell(
                                                discountMetricRow,
                                                {
                                                    isMoney: true,
                                                    mainClass:
                                                        "text-red-500",
                                                }
                                            )}
                                        </td>
                                        {/* % of total */}
                                        <td className="py-2.5 px-3">
                                            {renderYearCell(
                                                ratioMetricRow,
                                                {
                                                    isPercent: true,
                                                }
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                        ไม่มีข้อมูลสินค้าในช่วงวันที่ที่เลือก
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-500">
                    Showing{" "}
                    <span className="font-medium">
                        {totalRows === 0
                            ? 0
                            : (page - 1) * pageSize + 1}
                    </span>{" "}
                    –
                    <span className="font-medium">
                        {" "}
                        {Math.min(page * pageSize, totalRows)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                        {totalRows.toLocaleString()}
                    </span>{" "}
                    products
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] ${page <= 1
                                ? "border-slate-200 text-slate-300 cursor-default"
                                : "border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        Prev
                    </button>
                    <span className="text-[11px] text-slate-500">
                        Page{" "}
                        <span className="font-medium">{page}</span> /{" "}
                        <span className="font-medium">{totalPages}</span>
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] ${page >= totalPages
                                ? "border-slate-200 text-slate-300 cursor-default"
                                : "border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

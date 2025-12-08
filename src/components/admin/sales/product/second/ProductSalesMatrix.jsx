import React, { useState, useMemo, useEffect } from "react";

const MONTH_LABEL = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const fmtQty = (num) => {
  if (num == null || isNaN(num)) return "-";
  return Number(num).toLocaleString();
};

const fmtDiffQty = (curr, base) => {
  if (base == null || base === 0) {
    if (!curr) return "-";
    const sign = curr > 0 ? "+" : "";
    return `${sign}${fmtQty(curr)}`;
  }

  const diff = curr - base;
  if (!diff) return "0";

  const sign = diff > 0 ? "+" : "-";
  const abs = Math.abs(diff);
  const pct = (diff / base) * 100;

  return `${sign}${abs.toLocaleString()} (${sign}${Math.abs(pct).toFixed(
    1
  )}%)`;
};

const diffClass = (curr, base) => {
  if (base == null || base === 0) return "text-slate-500";
  const diff = curr - base;
  if (diff > 0) return "text-emerald-600";
  if (diff < 0) return "text-red-500";
  return "text-slate-500";
};

// สร้างสรุปรายปี (ใช้กับ all branch / selected branch)
const buildYearSummary = (yearTotals) => {
  const years = Object.keys(yearTotals)
    .map((y) => parseInt(y, 10))
    .filter((y) => !Number.isNaN(y))
    .sort((a, b) => a - b);

  if (!years.length) return null;

  const latestYear = years[years.length - 1];
  const prevYear = years.length > 1 ? years[years.length - 2] : null;

  const current = Number(yearTotals[latestYear] || 0);
  const prev = prevYear != null ? Number(yearTotals[prevYear] || 0) : null;

  let diff = null;
  let pct = null;

  if (prevYear != null && prev !== 0) {
    diff = current - prev;
    pct = (diff / prev) * 100;
  }

  return {
    latestYear,
    prevYear,
    current,
    prev,
    diff,
    pct,
  };
};

const ProductSalesMatrix = ({ detail }) => {
  const { product, range, rows } = detail;

  // ------- สร้าง list สาขาให้เลือก 1 สาขา -------
  const branchOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const code = r.branch_code || "UNKNOWN";
      if (!map.has(code)) {
        map.set(code, {
          code: r.branch_code,
          name: r.branch_name,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.code || "").localeCompare(String(b.code || ""))
    );
  }, [rows]);

  const [selectedBranchCode, setSelectedBranchCode] = useState(
    branchOptions[0]?.code || ""
  );

  useEffect(() => {
    if (
      branchOptions.length > 0 &&
      !branchOptions.find((b) => b.code === selectedBranchCode)
    ) {
      setSelectedBranchCode(branchOptions[0].code);
    }
  }, [branchOptions, selectedBranchCode]);

  // ------- เตรียม matrix + summary (รองรับหลายปี) -------
  const matrix = useMemo(() => {
    if (!rows || rows.length === 0 || !selectedBranchCode) return null;

    // filter เฉพาะสาขาที่เลือก
    const branchRows = rows.filter(
      (r) => r.branch_code === selectedBranchCode
    );
    if (branchRows.length === 0) return null;

    // รวม quantity (ขาย + คืน) รายปี "ทุกสาขา"
    const allYearTotals = {};
    rows.forEach((r) => {
      const year = r.year;
      const saleQty = Number(r.sale_quantity || 0);
      const returnQty = Number(r.return_quantity || 0);
      const qty = saleQty + returnQty;
      if (!allYearTotals[year]) allYearTotals[year] = 0;
      allYearTotals[year] += qty;
    });

    // รวม quantity รายปี "เฉพาะสาขาที่เลือก"
    const branchYearTotals = {};
    branchRows.forEach((r) => {
      const year = r.year;
      const saleQty = Number(r.sale_quantity || 0);
      const returnQty = Number(r.return_quantity || 0);
      const qty = saleQty + returnQty;
      if (!branchYearTotals[year]) branchYearTotals[year] = 0;
      branchYearTotals[year] += qty;
    });

    // ดึงปีจากข้อมูลสาขาที่เลือก → ใช้เป็น base ของตาราง
    const yearsSet = new Set();
    branchRows.forEach((r) => yearsSet.add(r.year));
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    if (years.length === 0) return null;

    const currentYear = years[years.length - 1];
    const prevYear = years.length >= 2 ? years[years.length - 2] : null;

    // key = "year-month" → quantity (ขาย + คืน) ของ "สาขาที่เลือก"
    const qtyMap = new Map();
    branchRows.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      const saleQty = Number(r.sale_quantity || 0);
      const returnQty = Number(r.return_quantity || 0);
      const qty = saleQty + returnQty;
      qtyMap.set(key, qty);
    });

    const monthRows = [];
    for (let m = 1; m <= 12; m++) {
      const keyCurr = `${currentYear}-${m}`;
      const qtyCurr = qtyMap.get(keyCurr) || 0;

      let qtyPrev = 0;
      if (prevYear != null) {
        const keyPrev = `${prevYear}-${m}`;
        qtyPrev = qtyMap.get(keyPrev) || 0;
      }

      // diff ปี: ปีล่าสุด vs ปีก่อน (เดือนเดียวกัน)
      const diffYear =
        prevYear == null || (qtyPrev === 0 && qtyCurr === 0)
          ? null
          : qtyCurr - qtyPrev;

      // diff เดือน: เดือนนี้ vs เดือนก่อนหน้า (ในปีล่าสุด)
      let diffMonth = null;
      if (m > 1) {
        const keyPrevMonth = `${currentYear}-${m - 1}`;
        const prevMonthQty = qtyMap.get(keyPrevMonth) || 0;
        if (prevMonthQty !== 0 || qtyCurr !== 0) {
          diffMonth = qtyCurr - prevMonthQty;
        }
      }

      monthRows.push({
        month: m,
        qtyPrev,
        qtyCurr,
        diffYear,
        diffMonth,
        currentYear,
        prevYear,
      });
    }

    // summary รายปี (รวมทุกเดือน)
    const allYearSummary = buildYearSummary(allYearTotals);
    const branchYearSummary = buildYearSummary(branchYearTotals);

    return {
      currentYear,
      prevYear,
      monthRows,
      allYearSummary,
      branchYearSummary,
      allYearTotals,
      branchYearTotals,
    };
  }, [rows, selectedBranchCode]);

  const rangeLabel = `${range.start} → ${range.end}`;
  const selectedBranch = branchOptions.find(
    (b) => b.code === selectedBranchCode
  );

  const renderSummaryBox = (title, summary) => {
    if (!summary) {
      return (
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-[11px] text-slate-500">
          {title}: no data
        </div>
      );
    }

    const { latestYear, prevYear, current, prev, diff, pct } = summary;
    const diffColor =
      diff == null
        ? "text-slate-500"
        : diff > 0
        ? "text-emerald-600"
        : diff < 0
        ? "text-red-500"
        : "text-slate-500";

    const diffAbs = diff != null ? Math.abs(diff) : null;
    const diffText =
      diff == null
        ? "-"
        : `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${fmtQty(diffAbs)}`;

    const pctText =
      pct == null
        ? ""
        : ` (${pct > 0 ? "+" : pct < 0 ? "-" : ""}${Math.abs(pct).toFixed(
            1
          )}%)`;

    return (
      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-[11px] text-slate-700 space-y-0.5">
        <div className="font-semibold text-slate-800 mb-0.5">{title}</div>
        <div>
          Year {latestYear}:{" "}
          <span className="font-semibold text-slate-900">
            {fmtQty(current)}
          </span>
        </div>
        {prevYear != null && (
          <div>
            Year {prevYear}:{" "}
            <span className="font-semibold text-slate-800">
              {fmtQty(prev)}
            </span>
          </div>
        )}
        {prevYear != null && (
          <div className={diffColor}>
            Diff: {diffText}
            {pctText}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 mt-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-slate-100 pb-3 mb-1">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Monthly quantity by year
          </h2>
          <p className="text-[11px] text-slate-500">
            ตารางเปรียบเทียบ <span className="font-semibold">Quantity</span>{" "}
            รายเดือนของสินค้า 1 ชิ้น แยกตามปี (row = เดือน Jan–Dec)
          </p>
          <div className="mt-2 text-[11px] text-slate-600">
            Product:{" "}
            <span className="font-semibold text-slate-800">
              {product.product_code} • {product.product_name}
            </span>
            {product.product_brand && (
              <span className="ml-1 text-slate-500">
                ({product.product_brand})
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Range:{" "}
            <span className="font-semibold text-slate-800">
              {rangeLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Branch:</span>
            <select
              value={selectedBranchCode}
              onChange={(e) => setSelectedBranchCode(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            >
              {branchOptions.map((b) => (
                <option key={b.code || "x"} value={b.code || ""}>
                  {b.code || "-"} - {b.name || "-"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ถ้าไม่มีข้อมูลสำหรับสาขานี้ */}
      {!matrix && (
        <p className="text-[11px] text-slate-500">
          ไม่พบข้อมูล quantity ของสินค้านี้ในสาขาที่เลือก
        </p>
      )}

      {/* Summary + ตารางหลัก */}
      {matrix && (
        <div className="space-y-3">
          {/* Summary: all branches + selected branch */}
          <div className="text-[11px] text-slate-600">
            Showing quantity for branch{" "}
            <span className="font-semibold text-slate-800">
              {selectedBranch?.code || "-"} {selectedBranch?.name || ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderSummaryBox("All branches (total quantity by year)", matrix.allYearSummary)}
            {renderSummaryBox(
              "Selected branch (total quantity by year)",
              matrix.branchYearSummary
            )}
          </div>

          {/* ตารางหลัก */}
          <div className="overflow-x-auto text-xs md:text-sm mt-2">
            <table className="min-w-full">
              <thead className="bg-slate-100 text-[11px] md:text-xs text-slate-600">
                <tr>
                  <th className="px-2 md:px-3 py-2.5 text-left font-semibold">
                    Month
                  </th>
                  {matrix.prevYear && (
                    <th className="px-2 md:px-3 py-2.5 text-right font-semibold">
                      Qty {matrix.prevYear}
                    </th>
                  )}
                  <th className="px-2 md:px-3 py-2.5 text-right font-semibold">
                    Qty {matrix.currentYear}
                    <span className="block text-[10px] text-slate-500">
                      (with month diff in cell)
                    </span>
                  </th>
                  <th className="px-2 md:px-3 py-2.5 text-right font-semibold">
                    Diff year
                    <span className="block text-[10px] text-slate-500">
                      current vs prev year
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {matrix.monthRows.map((row, idx) => {
                  const zebra =
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/70";

                  const qtyPrevBase =
                    matrix.prevYear != null ? row.qtyPrev : null;

                  // base สำหรับ diff เดือน = qty ของเดือนก่อนหน้า (ปีล่าสุด)
                  let prevMonthQty = null;
                  if (row.month > 1) {
                    const prevRow = matrix.monthRows[row.month - 2];
                    prevMonthQty = prevRow ? prevRow.qtyCurr : null;
                  }

                  return (
                    <tr
                      key={row.month}
                      className={`${zebra} border-b border-slate-100 last:border-b-0`}
                    >
                      {/* Month */}
                      <td className="px-2 md:px-3 py-2.5 whitespace-nowrap text-slate-800">
                        {MONTH_LABEL[row.month]}
                      </td>

                      {/* Qty prev year (ถ้ามี) */}
                      {matrix.prevYear && (
                        <td className="px-2 md:px-3 py-2.5 text-right text-slate-700 align-top">
                          {fmtQty(row.qtyPrev)}
                        </td>
                      )}

                      {/* Qty current year + diff เดือนในช่องเดียวกัน */}
                      <td className="px-2 md:px-3 py-2.5 text-right align-top">
                        <div className="text-slate-800 font-semibold">
                          {fmtQty(row.qtyCurr)}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {row.diffMonth == null ? (
                            <span className="text-slate-400">
                              – no prev month –
                            </span>
                          ) : (
                            <span
                              className={
                                row.diffMonth > 0
                                  ? "text-emerald-600"
                                  : row.diffMonth < 0
                                  ? "text-red-500"
                                  : "text-slate-500"
                              }
                            >
                              {fmtDiffQty(row.qtyCurr, prevMonthQty)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Diff year (current vs prev year) อยู่ขวาสุด */}
                      <td
                        className={`px-2 md:px-3 py-2.5 text-right text-[11px] md:text-xs align-top ${diffClass(
                          row.qtyCurr,
                          qtyPrevBase
                        )}`}
                      >
                        {row.diffYear == null
                          ? "-"
                          : fmtDiffQty(row.qtyCurr, qtyPrevBase)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductSalesMatrix;

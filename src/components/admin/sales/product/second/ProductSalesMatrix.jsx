// src/components/admin/dashboard/second/ProductSalesMatrix.jsx
import React, { useMemo, useState, useEffect } from "react";

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

const RANK_PAGE_SIZE = 10;

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

  return `${sign}${abs.toLocaleString()} (${sign}${Math.abs(pct).toFixed(1)}%)`;
};

const diffClass = (curr, base) => {
  if (base == null || base === 0) return "text-slate-500";
  const diff = curr - base;
  if (diff > 0) return "text-emerald-600";
  if (diff < 0) return "text-red-500";
  return "text-slate-500";
};

// 🔼🔽 ลูกศรเทียบเดือนก่อนหน้า (ในปีเดียวกัน)
const getMonthArrow = (curr, prev) => {
  if (prev == null) return "–";
  const diff = curr - prev;
  if (diff > 0) return "▲";
  if (diff < 0) return "▼";
  return "";
};

const getMonthArrowClass = (curr, prev) => {
  if (prev == null) return "text-slate-400";
  const diff = curr - prev;
  if (diff > 0) return "text-emerald-600";
  if (diff < 0) return "text-red-500";
  return "text-slate-500";
};

// สรุปรายปี
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

  return { latestYear, prevYear, current, prev, diff, pct };
};

// รวม qty ของแถว (ขาย + คืน)
const rowQty = (r) =>
  Number(r.sale_quantity || 0) + Number(r.return_quantity || 0);

const ProductSalesMatrix = ({ detail }) => {
  const { product, range, rows } = detail;

  // -------------------------
  // 1) ดึงปีทั้งหมด → currentYear / prevYear
  // -------------------------
  const yearInfo = useMemo(() => {
    const set = new Set();
    (rows || []).forEach((r) => {
      const y = parseInt(r.year, 10);
      if (!Number.isNaN(y)) set.add(y);
    });
    const years = Array.from(set).sort((a, b) => a - b);
    const currentYear = years.length ? years[years.length - 1] : null;
    const prevYear = years.length >= 2 ? years[years.length - 2] : null;
    return { years, currentYear, prevYear };
  }, [rows]);

  // -------------------------
  // 2) สร้าง Ranking สาขา
  // -------------------------
  const ranking = useMemo(() => {
    if (!rows || rows.length === 0 || !yearInfo.currentYear) {
      return {
        list: [],
        allYearTotals: {},
        allYearSummary: null,
        allCurrentYearTotal: 0,
        currentYear: yearInfo.currentYear,
        prevYear: yearInfo.prevYear,
      };
    }

    // all branches totals by year
    const allYearTotals = {};
    rows.forEach((r) => {
      const y = r.year;
      const qty = rowQty(r);
      if (!allYearTotals[y]) allYearTotals[y] = 0;
      allYearTotals[y] += qty;
    });

    const allYearSummary = buildYearSummary(allYearTotals);
    const currentYear = yearInfo.currentYear;
    const prevYear = yearInfo.prevYear;

    // map branch
    const map = new Map();
    rows.forEach((r) => {
      const code = r.branch_code || "UNKNOWN";
      if (!map.has(code)) {
        map.set(code, {
          code,
          name: r.branch_name || "",
          totalsByYear: {},
        });
      }

      const b = map.get(code);
      const y = r.year;
      const qty = rowQty(r);

      if (!b.totalsByYear[y]) b.totalsByYear[y] = 0;
      b.totalsByYear[y] += qty;
    });

    // build list with currentYear totals for sort
    const list = Array.from(map.values()).map((b) => {
      const totalCurr = Number(b.totalsByYear[currentYear] || 0);
      const totalPrev =
        prevYear != null ? Number(b.totalsByYear[prevYear] || 0) : null;

      const diff = prevYear != null ? totalCurr - (totalPrev || 0) : null;
      const pct =
        prevYear != null && totalPrev ? (diff / totalPrev) * 100 : null;

      return {
        ...b,
        totalCurr,
        totalPrev,
        diff,
        pct,
      };
    });

    list.sort((a, b) => b.totalCurr - a.totalCurr);

    const allCurrentYearTotal = list.reduce(
      (sum, x) => sum + (x.totalCurr || 0),
      0
    );

    return {
      list,
      allYearTotals,
      allYearSummary,
      allCurrentYearTotal,
      currentYear,
      prevYear,
    };
  }, [rows, yearInfo.currentYear, yearInfo.prevYear]);

  // -------------------------
  // 3) Pagination สำหรับ Ranking
  // -------------------------
  const [rankPage, setRankPage] = useState(1);

  const rankTotalPages = Math.max(
    1,
    Math.ceil((ranking.list?.length || 0) / RANK_PAGE_SIZE)
  );

  useEffect(() => {
    setRankPage(1);
  }, [ranking.list]);

  useEffect(() => {
    if (rankPage > rankTotalPages) setRankPage(rankTotalPages);
    if (rankPage < 1) setRankPage(1);
  }, [rankPage, rankTotalPages]);

  const pagedRanking = useMemo(() => {
    const start = (rankPage - 1) * RANK_PAGE_SIZE;
    return (ranking.list || []).slice(start, start + RANK_PAGE_SIZE);
  }, [ranking.list, rankPage]);

  // -------------------------
  // 4) สาขาที่เลือก (default = อันดับ 1)
  // -------------------------
  const [selectedBranchCode, setSelectedBranchCode] = useState("");

  useEffect(() => {
    if (!ranking.list.length) {
      setSelectedBranchCode("");
      return;
    }
    if (!selectedBranchCode) {
      setSelectedBranchCode(ranking.list[0].code);
      return;
    }
    const exists = ranking.list.find((b) => b.code === selectedBranchCode);
    if (!exists) setSelectedBranchCode(ranking.list[0].code);
  }, [ranking.list, selectedBranchCode]);

  const selectedBranch = useMemo(
    () => ranking.list.find((b) => b.code === selectedBranchCode),
    [ranking.list, selectedBranchCode]
  );

  // ✅ summary ของ selected branch (ไม่ต้องคำนวณ matrix รายเดือนก็ได้)
  const selectedBranchSummary = useMemo(() => {
    if (!selectedBranch?.totalsByYear) return null;
    return buildYearSummary(selectedBranch.totalsByYear);
  }, [selectedBranch]);

  // -------------------------
  // 5) Monthly breakdown: ปิดไว้ก่อน + คำนวณเมื่อกดโชว์เท่านั้น
  // -------------------------
  const [monthlyOpen, setMonthlyOpen] = useState(false);

  // (optional) ถ้าเปลี่ยนสินค้า/ช่วงวัน → ปิด monthly อัตโนมัติให้ลื่น
  useEffect(() => {
    setMonthlyOpen(false);
  }, [product?.product_code, range?.start, range?.end]);

  // (optional) เปลี่ยนสาขาแล้ว “ยังไม่ต้องเปิด” เพื่อความลื่น
  // ถ้าอยากให้เปลี่ยนสาขาแล้วเปิดเอง ให้ uncomment:
  // useEffect(() => { setMonthlyOpen(true); }, [selectedBranchCode]);

  const monthlyMatrix = useMemo(() => {
    if (!monthlyOpen) return null;
    if (!rows || rows.length === 0 || !selectedBranchCode || !ranking.currentYear)
      return null;

    const currentYear = ranking.currentYear;
    const prevYear = ranking.prevYear;

    const branchRows = rows.filter((r) => r.branch_code === selectedBranchCode);
    if (branchRows.length === 0) return null;

    const qtyMap = new Map();
    branchRows.forEach((r) => {
      const key = `${r.year}-${r.month}`;
      qtyMap.set(key, (qtyMap.get(key) || 0) + rowQty(r));
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

      const diffYear =
        prevYear == null || (qtyPrev === 0 && qtyCurr === 0)
          ? null
          : qtyCurr - qtyPrev;

      monthRows.push({
        month: m,
        qtyPrev,
        qtyCurr,
        diffYear,
        currentYear,
        prevYear,
      });
    }

    return { currentYear, prevYear, monthRows };
  }, [monthlyOpen, rows, selectedBranchCode, ranking.currentYear, ranking.prevYear]);

  const rangeLabel = `${range.start} → ${range.end}`;

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
        : ` (${pct > 0 ? "+" : pct < 0 ? "-" : ""}${Math.abs(pct).toFixed(1)}%)`;

    return (
      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-[11px] text-slate-700 space-y-0.5">
        <div className="font-semibold text-slate-800 mb-0.5">{title}</div>
        <div>
          Year {latestYear}:{" "}
          <span className="font-semibold text-slate-900">{fmtQty(current)}</span>
        </div>
        {prevYear != null && (
          <div>
            Year {prevYear}:{" "}
            <span className="font-semibold text-slate-800">{fmtQty(prev)}</span>
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

  const showPrevYear = ranking.prevYear != null;

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 mt-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-slate-100 mb-1 pb-2">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Branch ranking & monthly breakdown (Total Qty)
          </h2>

          <div className="mt-1 text-[11px] text-slate-500">
            Range:{" "}
            <span className="font-semibold text-slate-800">{rangeLabel}</span>
          </div>

          {product && (
            <div className="mt-0.5 text-[11px] text-slate-500">
              Product:{" "}
              <span className="font-semibold text-slate-800">
                {product.product_code} • {product.product_name}
              </span>
            </div>
          )}

          <div className="mt-1 text-[10px] text-slate-400">
            * Total Qty = sale_quantity + return_quantity
          </div>
        </div>

        {/* Dropdown (ช่วยมือถือ) */}
        <div className="flex flex-col items-start md:items-end gap-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Branch:</span>
            <select
              value={selectedBranchCode}
              onChange={(e) => setSelectedBranchCode(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            >
              {ranking.list.map((b) => (
                <option key={b.code || "x"} value={b.code || ""}>
                  {b.code || "-"} - {b.name || "-"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ranking */}
      {ranking.list.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          ไม่พบข้อมูลสาขาในช่วงวันที่นี้
        </p>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderSummaryBox(
              "All branches (total quantity)",
              ranking.allYearSummary
            )}
            {renderSummaryBox(
              "Selected branch (total quantity)",
              selectedBranchSummary
            )}
          </div>

          {/* Ranking Table + Pager */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="text-[12px] font-semibold text-slate-700">
                Branch ranking (มาก → น้อย)
              </div>

              <div className="flex items-center gap-2">
                {ranking.currentYear && (
                  <div className="hidden sm:block text-[10px] text-slate-500">
                    Sort by Total {ranking.currentYear}
                  </div>
                )}

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                    disabled={rankPage <= 1}
                    className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>

                  <span className="px-2">
                    Page{" "}
                    <span className="font-semibold text-slate-800">
                      {rankPage}
                    </span>{" "}
                    / {rankTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setRankPage((p) => Math.min(rankTotalPages, p + 1))
                    }
                    disabled={rankPage >= rankTotalPages}
                    className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-[11px] text-slate-600">
                  <tr>
                    <th className="px-2.5 py-2 text-left font-semibold w-[64px]">
                      Rank
                    </th>
                    <th className="px-2.5 py-2 text-left font-semibold min-w-[220px]">
                      Branch
                    </th>
                    {showPrevYear && (
                      <th className="px-2.5 py-2 text-right font-semibold">
                        Total {ranking.prevYear}
                      </th>
                    )}
                    <th className="px-2.5 py-2 text-right font-semibold">
                      Total {ranking.currentYear}
                    </th>
                    {showPrevYear && (
                      <th className="px-2.5 py-2 text-right font-semibold">
                        YoY diff
                      </th>
                    )}
                    <th className="px-2.5 py-2 text-right font-semibold">
                      Share
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pagedRanking.map((b, idx) => {
                    const globalRank =
                      (rankPage - 1) * RANK_PAGE_SIZE + idx + 1;

                    const active = b.code === selectedBranchCode;
                    const zebra =
                      globalRank % 2 === 1 ? "bg-white" : "bg-slate-50/70";

                    const share =
                      ranking.allCurrentYearTotal > 0
                        ? (b.totalCurr / ranking.allCurrentYearTotal) * 100
                        : 0;

                    return (
                      <tr
                        key={b.code}
                        className={`${zebra} border-b border-slate-100 last:border-b-0 ${
                          active ? "ring-1 ring-indigo-400 bg-indigo-50/40" : ""
                        }`}
                      >
                        <td className="px-2.5 py-2 text-left text-slate-700">
                          <button
                            type="button"
                            onClick={() => setSelectedBranchCode(b.code)}
                            className="inline-flex items-center gap-2 hover:text-indigo-700 transition"
                            title="คลิกเพื่อเลือกสาขา"
                          >
                            <span className="font-semibold">{globalRank}</span>
                            {active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                                selected
                              </span>
                            )}
                          </button>
                        </td>

                        <td className="px-2.5 py-2 text-left">
                          <button
                            type="button"
                            onClick={() => setSelectedBranchCode(b.code)}
                            className="text-left hover:text-indigo-700 transition"
                            title="คลิกเพื่อเลือกสาขา"
                          >
                            <div className="font-semibold text-slate-800">
                              {b.code || "-"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {b.name || "-"}
                            </div>
                          </button>
                        </td>

                        {showPrevYear && (
                          <td className="px-2.5 py-2 text-right text-slate-700">
                            {fmtQty(b.totalPrev || 0)}
                          </td>
                        )}

                        <td className="px-2.5 py-2 text-right text-slate-800 font-semibold">
                          {fmtQty(b.totalCurr || 0)}
                        </td>

                        {showPrevYear && (
                          <td
                            className={`px-2.5 py-2 text-right text-[11px] ${diffClass(
                              b.totalCurr || 0,
                              b.totalPrev || 0
                            )}`}
                          >
                            {fmtDiffQty(b.totalCurr || 0, b.totalPrev || 0)}
                          </td>
                        )}

                        <td className="px-2.5 py-2 text-right text-slate-600">
                          {share.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly breakdown (Collapsed by default) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <div className="text-[12px] font-semibold text-slate-700">
                  Monthly breakdown{" "}
                  <span className="text-slate-900">
                    — {selectedBranch?.code || "-"}
                    {selectedBranch?.name ? ` • ${selectedBranch.name}` : ""}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  ปิดไว้เพื่อความลื่น • กดปุ่มเพื่อแสดง
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMonthlyOpen((v) => !v)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  monthlyOpen
                    ? "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                    : "border-indigo-200 bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {monthlyOpen ? "Hide" : "Show"}
              </button>
            </div>

            {!monthlyOpen ? (
              <div className="p-3 text-[11px] text-slate-500">
                Monthly breakdown ถูกปิดอยู่ (ช่วยให้หน้าลื่นขึ้น) — กด{" "}
                <span className="font-semibold text-slate-800">Show</span> เพื่อแสดง
              </div>
            ) : !monthlyMatrix ? (
              <div className="p-3 text-[11px] text-slate-500">
                ไม่พบข้อมูลรายเดือนของสาขานี้ในช่วงวันที่ที่เลือก
              </div>
            ) : (
              <div className="overflow-x-auto text-xs md:text-sm">
                <table className="min-w-full">
                  <thead className="bg-slate-100 text-[11px] md:text-xs text-slate-600">
                    <tr>
                      <th className="px-2 md:px-3 py-2.5 text-left font-semibold">
                        Month
                      </th>
                      {monthlyMatrix.prevYear && (
                        <th className="px-2 md:px-3 py-2.5 text-right font-semibold">
                          Qty {monthlyMatrix.prevYear}
                        </th>
                      )}
                      <th className="px-2 md:px-3 py-2.5 text-right font-semibold">
                        Qty {monthlyMatrix.currentYear}
                      </th>
                      <th className="px-2 md:px-3 py-2.5 text-right font-semibold">
                        YoY diff
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyMatrix.monthRows.map((row, idx) => {
                      const zebra =
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/70";

                      const qtyPrevBase =
                        monthlyMatrix.prevYear != null ? row.qtyPrev : null;

                      // เดือนก่อนหน้า (ปีล่าสุด) เพื่อทำลูกศร MoM
                      const prevMonthQty =
                        idx > 0 ? monthlyMatrix.monthRows[idx - 1].qtyCurr : null;

                      const monthArrow = getMonthArrow(row.qtyCurr, prevMonthQty);
                      const arrowClass = getMonthArrowClass(row.qtyCurr, prevMonthQty);

                      return (
                        <tr
                          key={row.month}
                          className={`${zebra} border-b border-slate-100 last:border-b-0`}
                        >
                          <td className="px-2 md:px-3 py-2.5 whitespace-nowrap text-slate-800">
                            {MONTH_LABEL[row.month]}
                          </td>

                          {monthlyMatrix.prevYear && (
                            <td className="px-2 md:px-3 py-2.5 text-right text-slate-700 align-top">
                              {fmtQty(row.qtyPrev)}
                            </td>
                          )}

                          <td className="px-2 md:px-3 py-2.5 text-right text-slate-800 align-top">
                            <span className="inline-flex items-center justify-end gap-1 font-semibold">
                              <span className={`text-[9px] ${arrowClass}`}>
                                {monthArrow}
                              </span>
                              <span>{fmtQty(row.qtyCurr)}</span>
                            </span>
                          </td>

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
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductSalesMatrix;

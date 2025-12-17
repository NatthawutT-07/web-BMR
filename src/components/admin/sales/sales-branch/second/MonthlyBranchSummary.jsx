// src/components/admin/dashboard/second/MonthlyBranchSummary.jsx
import React, { useEffect, useMemo, useState } from "react";

/* =========================
   Helpers
========================= */
const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

const getDiffClass = (v) => {
  if (v > 0) return "text-emerald-600 font-semibold";
  if (v < 0) return "text-red-500 font-semibold";
  return "text-slate-400";
};

const getArrowIcon = (v) => {
  if (v > 0) return <span className="text-[9px] leading-none align-middle">▲</span>;
  if (v < 0) return <span className="text-[9px] leading-none align-middle">▼</span>;
  return null;
};

const formatMoney = (v) =>
  Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDiffWithPercent = (diff, prev) => {
  if (diff == null) return "-";

  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const absDiff = Math.abs(diff);

  const mainText = absDiff.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!prev || prev === 0) {
    if (diff === 0) return "0.00";
    return `${sign}${mainText}`;
  }

  const absPercent = Math.abs((diff / prev) * 100).toFixed(2);
  return `${sign}${mainText} (${sign}${absPercent}%)`;
};

const extractYear = (monthYear) => {
  const s = String(monthYear || "");
  const matches = s.match(/(19\d{2}|20\d{2}|21\d{2})/g);
  if (matches && matches.length) return Number(matches[matches.length - 1]);
  const tail4 = s.slice(-4);
  const y = Number(tail4);
  return Number.isFinite(y) ? y : 0;
};

const EyeIcon = ({ open = false }) => {
  return open ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.5 1.56-2.88 2.72-4.05" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-3.42" />
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.1 11.1 0 0 1-2.07 3.18" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
};

// ✅ เพิ่ม grid พื้นหลังกราฟ
const Sparkline = ({ data, height = 56, showDots = true, showGrid = true }) => {
  const vals = (data || []).map((d) => Number(d.net || 0));
  const n = vals.length;
  if (n < 2) return null;

  const W = 360;
  const H = height;

  const xStep = W / (n - 1);
  const padY = 6;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const pts = vals.map((v, i) => {
    const x = i * xStep;
    const y = padY + (1 - (v - min) / range) * (H - padY * 2);
    return { x, y, i };
  });

  const pointsStr = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const last = pts[pts.length - 1];

  const gridRows = 4; // เส้นแนวนอน
  const gridOpacity = 0.06;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      {/* ✅ grid background */}
      {showGrid && (
        <>
          {/* horizontal grid */}
          {Array.from({ length: gridRows + 1 }).map((_, i) => {
            const y = (H * i) / gridRows;
            return (
              <line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2={W}
                y2={y}
                stroke="currentColor"
                opacity={gridOpacity}
              />
            );
          })}

          {/* vertical grid (ตามจำนวนเดือน) */}
          {pts.map((p) => (
            <line
              key={`v-${p.i}`}
              x1={p.x}
              y1="0"
              x2={p.x}
              y2={H}
              stroke="currentColor"
              opacity={gridOpacity * 0.9}
            />
          ))}
        </>
      )}

      {/* baseline */}
      <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke="currentColor" opacity="0.08" />

      <polyline
        points={pointsStr}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        className="text-indigo-600"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {showDots &&
        pts.map((p) => {
          const isLast = p.i === pts.length - 1;
          return (
            <circle
              key={p.i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 3.6 : 2.2}
              className="fill-indigo-600"
              opacity={isLast ? 1 : 0.5}
            />
          );
        })}

      <circle
        cx={last.x}
        cy={last.y}
        r="6.2"
        fill="none"
        stroke="currentColor"
        className="text-indigo-600"
        opacity="0.18"
      />
    </svg>
  );
};

/* =========================
   Component
========================= */
const MonthlyBranchSummary = ({ monthRows, activeButton, onShowData }) => {
  if (!monthRows || monthRows.length === 0) return null;

  const [showChart, setShowChart] = useState(false);

  // ✅ Page = ปี (ไม่ปนปี)
  const [page, setPage] = useState(1);

  // ✅ Range selector: 3/6/10 (มีผลทั้งกราฟ + channel share + KPI)
  const [rangeN, setRangeN] = useState(12);

  const { years, rowsByYear } = useMemo(() => {
    const map = new Map();
    for (const r of monthRows) {
      const y = extractYear(r.monthYear);
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(r);
    }

    const yearList = Array.from(map.keys()).sort((a, b) => b - a);

    const obj = {};
    yearList.forEach((y) => {
      obj[y] = map.get(y) || [];
    });

    return { years: yearList, rowsByYear: obj };
  }, [monthRows]);

  useEffect(() => {
    setPage(1);
  }, [years.join(","), monthRows]);

  const totalPages = Math.max(1, years.length);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const currentYear = years[safePage - 1] ?? extractYear(monthRows?.[0]?.monthYear);

  const pageRows = useMemo(() => rowsByYear[currentYear] || [], [rowsByYear, currentYear]);

  // ✅ ช่องทางสำหรับหัวตาราง (ทั้งชุด) ไม่ให้สั่น
  const channelTotalsAll = useMemo(() => {
    const totals = {};
    monthRows.forEach((m) => {
      (m.salesChannels || []).forEach((c) => {
        const key = c.channelName;
        totals[key] = (totals[key] || 0) + (Number(c.totalSales) || 0);
      });
    });
    return totals;
  }, [monthRows]);

  const allChannels = useMemo(() => {
    return Object.keys(channelTotalsAll).sort(
      (a, b) => (channelTotalsAll[b] || 0) - (channelTotalsAll[a] || 0)
    );
  }, [channelTotalsAll]);

  // ✅ base series: ปีนี้ (เก่า→ใหม่)
  const baseSeries = useMemo(() => {
    const arr = [...pageRows].slice().reverse();
    return arr.map((r) => ({
      label: r.monthYear,
      net: Number(r.netSales || 0),
      bills: Number(r.billCount || 0),
      salesChannels: r.salesChannels || [],
    }));
  }, [pageRows]);

  const windowSeries = useMemo(() => {
    const n = Math.min(rangeN, baseSeries.length);
    return baseSeries.slice(-n);
  }, [baseSeries, rangeN]);

  const lastPoint = windowSeries[windowSeries.length - 1];
  const prevPoint = windowSeries[windowSeries.length - 2];

  const lastNet = Number(lastPoint?.net || 0);
  const prevNet = Number(prevPoint?.net || 0);
  const momDiff = windowSeries.length >= 2 ? lastNet - prevNet : null;
  const momPct = momDiff == null || prevNet === 0 ? null : (momDiff / prevNet) * 100;

  const chartFromLabel = String(windowSeries[0]?.label || "").slice(0, 7);
  const chartToLabel = String(lastPoint?.label || "").slice(0, 7);

  // ✅ Channel share อิง windowSeries
  const windowChannelTotals = useMemo(() => {
    const totals = {};
    windowSeries.forEach((m) => {
      (m.salesChannels || []).forEach((c) => {
        const key = c.channelName;
        totals[key] = (totals[key] || 0) + (Number(c.totalSales) || 0);
      });
    });
    return totals;
  }, [windowSeries]);

  const windowChannelsSorted = useMemo(() => {
    return Object.keys(windowChannelTotals).sort(
      (a, b) => (windowChannelTotals[b] || 0) - (windowChannelTotals[a] || 0)
    );
  }, [windowChannelTotals]);

  const windowChannelGrandTotal = useMemo(() => {
    return (
      Object.values(windowChannelTotals).reduce((sum, v) => sum + (Number(v) || 0), 0) || 1
    );
  }, [windowChannelTotals]);

  // ✅ KPI อิง windowSeries
  const kpiNetTotal = useMemo(() => {
    return windowSeries.reduce((sum, r) => sum + (Number(r.net) || 0), 0);
  }, [windowSeries]);

  const kpiBillsTotal = useMemo(() => {
    return windowSeries.reduce((sum, r) => sum + (Number(r.bills) || 0), 0);
  }, [windowSeries]);

  const kpiNetPerBill = useMemo(() => {
    if (!kpiBillsTotal) return 0;
    return kpiNetTotal / kpiBillsTotal;
  }, [kpiNetTotal, kpiBillsTotal]);

  // ✅ เพิ่ม KPI: ยอดเฉลี่ยต่อเดือน (ในช่วงที่เลือก)
  const kpiNetAvgPerMonth = useMemo(() => {
    const m = windowSeries.length || 0;
    if (!m) return 0;
    return kpiNetTotal / m;
  }, [kpiNetTotal, windowSeries.length]);

  const rangeLabel = useMemo(() => `${rangeN}M (${windowSeries.length} months)`, [rangeN, windowSeries.length]);

  // ✅ pagination เป็นปี
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const yearButtons = useMemo(() => {
    const idx = safePage - 1;
    const from = Math.max(0, idx - 2);
    const to = Math.min(years.length - 1, idx + 2);
    const arr = [];
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  }, [safePage, years.length]);

  const PaginationControls = () => (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={goPrev}
        disabled={safePage <= 1}
        className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-xs border shadow-sm transition ${
          safePage <= 1
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
        aria-label="Previous year"
      >
        {"<"}
      </button>

      <div className="flex items-center gap-1">
        {yearButtons[0] > 0 && (
          <>
            <button
              type="button"
              onClick={() => setPage(1)}
              className={`h-8 px-2 rounded-lg text-xs border transition ${
                safePage === 1
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title={`Year ${years[0]}`}
            >
              {years[0]}
            </button>
            {yearButtons[0] > 1 && <span className="px-1 text-xs text-slate-400">…</span>}
          </>
        )}

        {yearButtons.map((i) => {
          const p = i + 1;
          const y = years[i];
          return (
            <button
              key={y}
              type="button"
              onClick={() => setPage(p)}
              className={`h-8 px-2 rounded-lg text-xs border transition ${
                safePage === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title={`Year ${y}`}
            >
              {y}
            </button>
          );
        })}

        {yearButtons[yearButtons.length - 1] < years.length - 1 && (
          <>
            {yearButtons[yearButtons.length - 1] < years.length - 2 && (
              <span className="px-1 text-xs text-slate-400">…</span>
            )}
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              className={`h-8 px-2 rounded-lg text-xs border transition ${
                safePage === totalPages
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title={`Year ${years[years.length - 1]}`}
            >
              {years[years.length - 1]}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={goNext}
        disabled={safePage >= totalPages}
        className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-xs border shadow-sm transition ${
          safePage >= totalPages
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
        aria-label="Next year"
      >
        {">"}
      </button>
    </div>
  );

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Monthly summary by branch
          </h2>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
          <div>
            Year: <span className="font-semibold text-slate-700">{currentYear}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChart((v) => !v)}
            className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border shadow-sm transition ${
              showChart
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title={showChart ? "Hide chart" : "View chart"}
            aria-label={showChart ? "Hide chart" : "View chart"}
          >
            <EyeIcon open={showChart} />
          </button>

          <PaginationControls />
        </div>
      </div>

      {/* Chart Panel */}
      {showChart && (
        <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Line chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Net sales ({rangeN})</div>
                  <div className="text-[11px] text-slate-500">
                    {chartFromLabel} → {chartToLabel}
                  </div>

                  <div className="mt-2 text-lg font-semibold text-slate-900">฿ {formatMoney(lastNet)}</div>

                  <div className="text-[11px] mt-1">
                    <span className="text-slate-500">MoM: </span>
                    {momDiff == null ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span className={getDiffClass(momDiff)}>
                        {momDiff > 0 ? "+" : ""}฿ {formatMoney(momDiff)}
                        {momPct != null ? ` (${momPct > 0 ? "+" : ""}${momPct.toFixed(1)}%)` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 whitespace-nowrap">Latest: {chartToLabel}</div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-slate-400">
                    {chartFromLabel} → {chartToLabel}
                  </div>

                  <div className="flex items-center gap-1">
                    {[3, 6, 12].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRangeN(n)}
                        className={`h-7 px-2 rounded-lg text-[11px] border transition ${
                          rangeN === n
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-slate-900">
                  <Sparkline data={windowSeries} />
                </div>
              </div>
            </div>

            {/* Middle: Channel share (✅ แสดง 4 บล็อก ถ้าเกินให้เลื่อน) */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Channel sales</div>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  Total: ฿ {formatMoney(windowChannelGrandTotal)}
                </div>
              </div>

              {/* ✅ list wrapper: ถ้าเกิน 4 ทำเป็น scroll (ลื่น) */}
              <div
                className={`space-y-2 ${
                  windowChannelsSorted.length > 4
                    ? "max-h-[210px] overflow-y-auto overscroll-contain scroll-smooth pr-1"
                    : ""
                }`}
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {windowChannelsSorted.map((ch) => {
                  const v = Number(windowChannelTotals[ch] || 0);
                  const pct = Math.max(0, Math.min(100, (v / windowChannelGrandTotal) * 100));
                  return (
                    <div key={ch} className="rounded-lg border border-slate-100 px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-600 truncate max-w-[55%]">{ch}</span>
                        <span className="text-slate-700 font-medium whitespace-nowrap">
                          ฿ {formatMoney(v)} · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}

                {windowChannelsSorted.length === 0 && (
                  <div className="text-[11px] text-slate-400">No channel data</div>
                )}
              </div>

              {/* ✅ hint เล็ก ๆ ว่ามีให้เลื่อน */}
              {windowChannelsSorted.length > 4 && (
                <div className="mt-2 text-[10px] text-slate-400"></div>
              )}
            </div>

            {/* Right: KPI */}
            <div className="flex flex-col gap-1">
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-700">Net total</div>

                <div className="mt-2 text-xl font-semibold text-slate-900">฿ {formatMoney(kpiNetTotal)}</div>

                <div className="mt-1 text-[11px] text-slate-500">
                  Months: <span className="font-medium text-slate-700">{windowSeries.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700">Bills total</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {Number(kpiBillsTotal || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700">Net / bill</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    ฿ {formatMoney(kpiNetPerBill)}
                  </div>
                </div>
              </div>

              {/* ✅ เพิ่ม KPI ยอดเฉลี่ยต่อเดือน */}
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-700">Avg / month</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  ฿ {formatMoney(kpiNetAvgPerMonth)}
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-100 sticky top-0 z-20 text-slate-600 text-[11px]">
            <tr>
              <th className="px-3 py-2.5 border-b font-semibold text-left bg-slate-100 sticky left-0 z-[25]">
                Month / Year
              </th>

              <th className="px-3 py-2.5 border-b font-semibold text-right">Bills</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Returns</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Discount End Bill</th>

              {allChannels.map((chName) => (
                <th key={chName} className="px-2 py-2 border-b text-right text-slate-400 lowercase">
                  {chName}
                </th>
              ))}

              <th className="px-3 py-2.5 border-b font-semibold text-right">Net</th>
              <th className="px-1 py-2.5 border-b font-semibold text-left">Net diff</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Per bill</th>
              <th className="px-1 py-2.5 border-b font-semibold text-left">PB diff</th>

              <th className="px-3 py-2.5 border-b font-semibold text-right">Avg / day</th>

              <th className="px-3 py-2.5 border-b font-semibold text-center">Day</th>
              <th className="px-3 py-2.5 border-b font-semibold text-center">Product</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, idx) => {
              const globalIdx = monthRows.findIndex((m) => m?.monthYear === row?.monthYear);
              const prev = globalIdx >= 0 ? monthRows[globalIdx + 1] || null : null;

              const netNow = Number(row.netSales || 0);
              const netPrev = prev ? Number(prev.netSales || 0) : null;
              const netDiff = netPrev != null ? netNow - netPrev : null;

              const perBillNow = Number(row.salesPerBill || 0);
              const perBillPrev = prev ? Number(prev.salesPerBill || 0) : null;
              const perBillDiff = perBillPrev != null ? perBillNow - perBillPrev : null;

              const realDays = Number(row.days || 1);
              const avgPerDay = netNow / realDays;

              const k = normalizeKey(row.monthYear);

              return (
                <tr
                  key={`${row.monthYear}-${idx}`}
                  className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"} hover:bg-indigo-50/40`}
                >
                  <td className="px-1 py-2.5 sticky left-0 bg-white z-[15] font-medium">{row.monthYear}</td>

                  <td className="px-1 py-2.5 text-right text-[12px] md:text-xs text-slate-700">
                    {row.billCount}
                  </td>

                  <td className="px-1 py-2.5 text-right text-[12px] md:text-xs text-slate-700">
                    {row.totalReturns?.toLocaleString?.() ?? row.totalReturns}
                  </td>

                  <td className="px-1 py-2.5 text-center text-[12px] md:text-xs text-red-600">
                    {row.endBillDiscount}
                  </td>

                  {allChannels.map((chName) => {
                    const nowObj = row.salesChannels?.find((c) => c.channelName === chName);
                    const nowVal = nowObj ? Number(nowObj.totalSales || 0) : 0;

                    const prevObj = prev?.salesChannels?.find((c) => c.channelName === chName);
                    const prevVal = prevObj ? Number(prevObj.totalSales || 0) : 0;

                    const diff = nowVal - prevVal;

                    return (
                      <td key={chName} className="px-0.5 py-2.5 text-right text-[11px]">
                        <span className="text-slate-500 mr-1">
                          {nowVal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className={getDiffClass(diff)}>{getArrowIcon(diff)}</span>
                      </td>
                    );
                  })}

                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                    {netNow.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td
                    className={`px-1 py-2.5 text-left text-[11px] whitespace-nowrap overflow-hidden text-ellipsis ${getDiffClass(
                      netDiff ?? 0
                    )}`}
                    title={formatDiffWithPercent(netDiff, netPrev)}
                  >
                    {formatDiffWithPercent(netDiff, netPrev)}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    {perBillNow.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td
                    className={`px-1 py-2.5 text-left text-[11px] whitespace-nowrap overflow-hidden text-ellipsis ${getDiffClass(
                      perBillDiff ?? 0
                    )}`}
                    title={formatDiffWithPercent(perBillDiff, perBillPrev)}
                  >
                    {formatDiffWithPercent(perBillDiff, perBillPrev)}
                  </td>

                  <td className="px-3 py-2.5 text-right font-semibold text-indigo-600">
                    {avgPerDay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    {activeButton === `${k}:day` ? (
                      <span className="py-1 text-[11px] rounded-full bg-slate-100 text-slate-500 border">
                        Viewing
                      </span>
                    ) : (
                      <button
                        onClick={() => onShowData(row.monthYear, "day")}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-indigo-50 border border-indigo-200"
                      >
                        Day
                      </button>
                    )}
                  </td>

                  <td className="px-1 py-2.5 text-center">
                    {activeButton === `${k}:month-product` ? (
                      <span className="py-1 text-[11px] rounded-full bg-slate-100 text-slate-500 border">
                        Viewing
                      </span>
                    ) : (
                      <button
                        onClick={() => onShowData(row.monthYear, "month-product")}
                        className="px-1 py-1 rounded-full text-[11px] bg-emerald-50 border border-emerald-200"
                      >
                        Product
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MonthlyBranchSummary;

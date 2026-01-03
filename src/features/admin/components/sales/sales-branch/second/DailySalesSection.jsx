import React, { useEffect, useMemo, useState } from "react";

const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

const parseDMY = (dmy) => {
  // "dd/mm/yyyy"
  if (!dmy) return null;
  const parts = String(dmy).split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((v) => parseInt(v, 10));
  const dt = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

// Monday=0 ... Sunday=6
const getWeekdayIndexMon0 = (dateObj) => {
  const js = dateObj.getDay(); // Sun=0 ... Sat=6
  return (js + 6) % 7;
};

const getWeekdayLabel = (dmy) => {
  const dateObj = parseDMY(dmy);
  if (!dateObj) return "-";
  const names = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];
  return names[dateObj.getDay()];
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

// ✅ ไอคอน “ดวงตา” (ดู/ซ่อน)
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

// ✅ กราฟรายสัปดาห์: แกน X = จันทร์-อาทิตย์ / เส้นละ 1 สัปดาห์ (เทียบกัน)
const WeeklyLinesChart = ({ weeks = [], height = 170 }) => {
  const W = 520;
  const H = height;
  const padX = 26;
  const padY = 18;

  if (!weeks.length)
    return <div className="text-[11px] text-slate-400">No chart data</div>;

  const allVals = [];
  weeks.forEach((w) => w.values.forEach((v) => v != null && allVals.push(Number(v))));
  if (!allVals.length)
    return <div className="text-[11px] text-slate-400">No chart data</div>;

  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const xStep = (W - padX * 2) / 6; // 7 จุด
  const xAt = (i) => padX + i * xStep;
  const yAt = (v) => padY + (1 - (v - min) / range) * (H - padY * 2);

  const weekdayTicks = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

  const buildSegments = (values) => {
    // split polyline by nulls เพื่อไม่ลากเส้นข้ามวันหาย
    const segs = [];
    let cur = [];
    values.forEach((v, i) => {
      if (v == null) {
        if (cur.length >= 2) segs.push(cur);
        cur = [];
      } else {
        cur.push({ x: xAt(i), y: yAt(Number(v)), i });
      }
    });
    if (cur.length >= 2) segs.push(cur);
    return segs;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      className="block"
    >
      {/* grid baseline */}
      <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke="currentColor" opacity="0.08" />
      <line x1="0" y1="1" x2={W} y2="1" stroke="currentColor" opacity="0.04" />

      {/* x ticks */}
      {weekdayTicks.map((t, i) => (
        <g key={t}>
          <line x1={xAt(i)} y1={padY} x2={xAt(i)} y2={H - padY} stroke="currentColor" opacity="0.04" />
          <text x={xAt(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.55">
            {t}
          </text>
        </g>
      ))}

      {/* lines: สัปดาห์ล่าสุดเด่นสุด */}
      {weeks.map((w, idx) => {
        const isLast = idx === weeks.length - 1;
        const opacity = isLast ? 1 : Math.max(0.18, 0.65 - (weeks.length - 1 - idx) * 0.12);
        const strokeW = isLast ? 2.6 : 1.8;

        const segments = buildSegments(w.values);

        return (
          <g key={w.key}>
            {segments.map((seg, sIdx) => (
              <polyline
                key={sIdx}
                points={seg.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
                fill="none"
                stroke="currentColor"
                className="text-indigo-600"
                strokeWidth={strokeW}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={opacity}
              />
            ))}

            {/* dots */}
            {w.values.map((v, i) => {
              if (v == null) return null;
              const isLastWeek = isLast;
              return (
                <circle
                  key={i}
                  cx={xAt(i)}
                  cy={yAt(Number(v))}
                  r={isLastWeek ? 2.9 : 2.1}
                  className="fill-indigo-600"
                  opacity={opacity}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

const DailySalesSection = ({ date, showDay, onShowData, loadingKey }) => {
  const [onlyBelowAvg, setOnlyBelowAvg] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // ✅ Pagination: 10 row / page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [date, showDay]);

  const allRows = useMemo(() => (Array.isArray(showDay) ? showDay : []), [showDay]);

  // ✅ เรียงวันเก่า → ใหม่ (ใช้เป็นฐาน diff “ทั้งเดือน”)
  const allSorted = useMemo(() => {
    return allRows
      .map((r) => {
        const dt = parseDMY(r.dayMonthYear);
        return dt ? { ...r, __dt: dt } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.__dt - b.__dt);
  }, [allRows]);

  // ✅ map วัน -> prev วัน (อิงทั้งเดือน ไม่สน filter)
  const prevRowByDayKey = useMemo(() => {
    const m = new Map();
    for (let i = 0; i < allSorted.length; i++) {
      const cur = allSorted[i];
      const prev = i > 0 ? allSorted[i - 1] : null;
      m.set(normalizeKey(cur.dayMonthYear), prev);
    }
    return m;
  }, [allSorted]);

  // =========================
  // ✅ Avg (อิงข้อมูล “ทั้งหมด” ของเดือน) -> ใช้สำหรับ filter เท่านั้น
  // =========================
  const baseAvgNet = useMemo(() => {
    const sum = allRows.reduce((acc, r) => acc + Number(r.netSales || 0), 0);
    return allRows.length ? sum / allRows.length : 0;
  }, [allRows]);

  // ✅ ตาราง: กรองเฉพาะ “วัน” (เหมือนเดิม)
  const tableRows = useMemo(() => {
    if (!onlyBelowAvg) return allRows;
    return allRows.filter((r) => Number(r.netSales || 0) < baseAvgNet);
  }, [allRows, onlyBelowAvg, baseAvgNet]);

  // ✅ กราฟ: ให้ “ลบแสดงเฉพาะวันที่กรอง” (ใช้ชุดเดียวกับตาราง)
  const chartRows = tableRows;

  // =========================
  // ✅ Summary + KPI (รวม “ทั้งหมดของเดือน” เสมอ ไม่ตาม filter)
  // =========================
  const summaryAll = useMemo(() => {
    let minRow = null;
    let maxRow = null;
    let sumNet = 0;
    let sumBills = 0;

    for (const r of allRows) {
      const net = Number(r.netSales || 0);
      const bills = Number(r.billCount || 0);
      sumNet += net;
      sumBills += bills;

      if (!minRow || net < minRow.net) minRow = { net, row: r };
      if (!maxRow || net > maxRow.net) maxRow = { net, row: r };
    }

    const avgNet = allRows.length ? sumNet / allRows.length : 0; // ✅ KPI “ยอดเฉลี่ยต่อวันของเดือนนั้น”
    const netPerBill = sumBills ? sumNet / sumBills : 0;

    return { minRow, maxRow, sumNet, sumBills, avgNet, netPerBill };
  }, [allRows]);

  // =========================
  // ✅ Channels (รวม “ทั้งหมดของเดือน” เสมอ ไม่ตาม filter)
  // =========================
  const channelMetaAll = useMemo(() => {
    const channelTotals = {};
    const set = new Set();

    for (const d of allRows) {
      for (const c of d.salesChannels || []) {
        set.add(c.channelName);
        channelTotals[c.channelName] =
          (channelTotals[c.channelName] || 0) + Number(c.totalSales || 0);
      }
    }

    const allChannels = Array.from(set).sort(
      (a, b) => (channelTotals[b] || 0) - (channelTotals[a] || 0)
    );

    const channelGrand = Object.values(channelTotals).reduce(
      (acc, v) => acc + Number(v || 0),
      0
    );

    return { allChannels, channelTotals, channelGrand: channelGrand || 1 };
  }, [allRows]);

  // =========================
  // ✅ Weekly chart data (Mon-Sun, เส้นละสัปดาห์)
  //     ใช้ “chartRows” = แสดงตาม filter (ตามที่ขอ)
  // =========================
  const weeklyChart = useMemo(() => {
    const items = chartRows
      .map((r) => {
        const dt = parseDMY(r.dayMonthYear);
        return dt ? { ...r, __dt: dt } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.__dt - b.__dt);

    const mondayKey = (dt) => {
      const d = new Date(dt);
      const idx = getWeekdayIndexMon0(d);
      d.setDate(d.getDate() - idx);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const fmt = (dt) => {
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yy = dt.getFullYear();
      return `${dd}/${mm}/${yy}`;
    };

    const map = new Map();
    for (const it of items) {
      const key = mondayKey(it.__dt);
      if (!map.has(key)) {
        map.set(key, {
          key: String(key),
          start: new Date(Number(key)),
          values: Array(7).fill(null),
          label: "",
        });
      }
      const w = map.get(key);
      const idx = getWeekdayIndexMon0(it.__dt);
      w.values[idx] = Number(it.netSales || 0);
    }

    const weeks = Array.from(map.values()).sort((a, b) => a.start - b.start);
    weeks.forEach((w) => {
      const end = new Date(w.start);
      end.setDate(end.getDate() + 6);
      w.label = `${fmt(w.start)}–${fmt(end)}`;
    });

    return weeks;
  }, [chartRows]);

  // =========================
  // ✅ Pagination (10 row/page) — เปลี่ยนหน้าแค่ตาราง
  // =========================
  const totalRows = tableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalRows);
  const pageRows = useMemo(
    () => tableRows.slice(startIndex, endIndex),
    [tableRows, startIndex, endIndex]
  );

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const pagesToShow = useMemo(() => {
    const arr = [];
    const from = Math.max(1, safePage - 2);
    const to = Math.min(totalPages, safePage + 2);
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  }, [safePage, totalPages]);

  const onToggleBelowAvg = () => {
    setOnlyBelowAvg((v) => !v);
    setPage(1);
  };

  const { allChannels, channelTotals, channelGrand } = channelMetaAll;

  if (!allRows.length) return null;

  return (
    <section className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-slate-200">
      {/* HEADER */}
      <div className="px-4 py-2 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              Daily sales ({date})
            </h2>
           
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onToggleBelowAvg}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                onlyBelowAvg
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              {onlyBelowAvg ? "กำลังกรอง: ต่ำกว่า Avg" : "กรอง: ต่ำกว่า Avg"}
            </button>

            <div className="text-[11px] text-slate-500">
              Days:{" "}
              <span className="font-semibold text-slate-700">{tableRows.length}</span>
              {onlyBelowAvg && (
                <span className="ml-2 text-slate-400">(ALL {allRows.length})</span>
              )}
            </div>

            {/* ✅ มุมขวา: ปุ่มดวงตา + pagination */}
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

              <div className="text-[11px] text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {totalRows === 0 ? 0 : startIndex + 1}-{endIndex}
                </span>{" "}
                / <span className="font-semibold text-slate-700">{totalRows}</span>
              </div>

              <button
                type="button"
                onClick={goPrev}
                disabled={safePage <= 1}
                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-xs border shadow-sm transition ${
                  safePage <= 1
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {"<"}
              </button>

              <div className="flex items-center gap-1">
                {pagesToShow.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-[32px] px-2 inline-flex items-center justify-center rounded-lg text-xs border transition ${
                      safePage === p
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
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
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Chart Panel (ดวงตาเปิด/ปิด) */}
      {showChart && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Weekly lines chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Weekly net sales (Mon–Sun)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เส้นละ 1 สัปดาห์ (เทียบกัน)
                  </div>
                  {onlyBelowAvg && (
                    <div className="text-[10px] text-amber-700 mt-1">
                      * แสดงเฉพาะวันที่ต่ำกว่า Avg
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  Weeks: {weeklyChart.length}
                </div>
              </div>

              <div className="mt-3 text-slate-900">
                <WeeklyLinesChart weeks={weeklyChart} />
              </div>

            </div>

            {/* Middle: Channel sales (this month) — ✅ ยอดรวมทั้งเดือนเสมอ */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Channel sales (this month)
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  Total: ฿ {formatMoney(channelGrand)}
                </div>
              </div>

              <div
                className={`space-y-2 ${
                  allChannels.length > 4
                    ? "max-h-[230px] overflow-y-auto overscroll-contain scroll-smooth pr-1"
                    : ""
                }`}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {allChannels.map((ch) => {
                  const v = Number(channelTotals[ch] || 0);
                  const pct = Math.max(0, Math.min(100, (v / channelGrand) * 100));
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

                {allChannels.length === 0 && (
                  <div className="text-[11px] text-slate-400">No channel data</div>
                )}
              </div>
            </div>

            {/* Right: KPI — ✅ ยอดรวมทั้งเดือนเสมอ */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-700">Net total</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  ฿ {formatMoney(summaryAll.sumNet)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700">Bills total</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {Number(summaryAll.sumBills || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700">Net / bill</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    ฿ {formatMoney(summaryAll.netPerBill)}
                  </div>
                </div>

                {/* ✅ NEW KPI: Avg net/day of this month */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 col-span-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Avg net / day (this month)
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    ฿ {formatMoney(summaryAll.avgNet)}
                  </div>
                  {/* <div className="mt-1 text-[10px] text-slate-400">
                    (คำนวณจากจำนวนวันทั้งหมดที่มีข้อมูล: {allRows.length} วัน)
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TABLE (หน้าละ 10 row) */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr className="text-[11px] text-slate-600">
              <th className="px-3 py-2.5 text-center border-b font-semibold">Weekday</th>
              <th className="px-3 py-2.5 text-left border-b font-semibold">Date</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Bills</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Returns</th>
              <th className="px-3 py-2.5 text-center border-b font-semibold ml-auto w-[72px] max-w-[72px] whitespace-normal break-words leading-tight">
                Discount End Bill
              </th>

              {allChannels.map((chName) => (
                <th
                  key={chName}
                  className="px-1.5 py-2.5 text-center border-b text-slate-400 lowercase font-normal align-bottom"
                  title={chName}
                >
                  <div className="ml-auto w-[52px] max-w-[62px] whitespace-normal break-words leading-tight">
                    {chName}
                  </div>
                </th>
              ))}

              <th className="px-3 py-2.5 text-right border-b font-semibold">Net</th>
              <th className="px-3 py-2.5 text-left border-b font-semibold">Net diff</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Per bill</th>
              <th className="px-3 py-2.5 text-center border-b font-semibold">Product</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, idx) => {
              // ✅ diff อิง “วันก่อนหน้าในทั้งเดือน” ไม่เพี้ยนตอน filter
              const prev = prevRowByDayKey.get(normalizeKey(row.dayMonthYear)) || null;

              const netNow = Number(row.netSales || 0);
              const netPrev = prev ? Number(prev.netSales || 0) : null;
              const netDiff = netPrev != null ? netNow - netPrev : null;

              const weekdayLabel = getWeekdayLabel(row.dayMonthYear);
              const baseBg = (startIndex + idx) % 2 === 0 ? "bg-white" : "bg-slate-50/70";

              const k = normalizeKey(row.dayMonthYear);
              const dayProdKey = `${k}:day-product`;
              const isLoading = loadingKey === dayProdKey;

              return (
                <tr
                  key={`${row.dayMonthYear}-${startIndex + idx}`}
                  className={`border-b ${baseBg} hover:bg-emerald-50/40`}
                >
                  <td className="px-2 py-2.5 text-center font-semibold text-[11px]">
                    <span className="bg-slate-100 border px-2 py-0.5 rounded-lg">{weekdayLabel}</span>
                  </td>

                  <td className="px-3 py-2.5">{row.dayMonthYear}</td>
                  <td className="px-3 py-2.5 text-right">{row.billCount}</td>

                  <td className="px-3 py-2.5 text-right">
                    {row.totalReturns?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-1 py-2.5 text-center text-red-600">{row.endBillDiscount}</td>

                  {allChannels.map((chName) => {
                    const nowFound = row.salesChannels?.find((c) => c.channelName === chName);
                    const nowValue = nowFound ? Number(nowFound.totalSales || 0) : 0;

                    const prevFound = prev?.salesChannels?.find((c) => c.channelName === chName);
                    const prevValue = prevFound ? Number(prevFound.totalSales || 0) : 0;

                    const diff = nowValue - prevValue;

                    return (
                      <td key={chName} className="px-0.5 py-2.5 text-right text-[11px] whitespace-nowrap">
                        <span className="text-slate-500 mr-1">
                          {nowValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className={getDiffClass(diff)}>{getArrowIcon(diff)}</span>
                      </td>
                    );
                  })}

                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                    {netNow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className={`px-3 py-2.5 text-left text-[11px] whitespace-nowrap ${getDiffClass(netDiff ?? 0)}`}>
                    {formatDiffWithPercent(netDiff, netPrev)}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    {row.salesPerBill?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <button
                      disabled={!!loadingKey}
                      onClick={() => onShowData(row.dayMonthYear, "day-product")}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Loading..." : "Product"}
                    </button>
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

export default DailySalesSection;

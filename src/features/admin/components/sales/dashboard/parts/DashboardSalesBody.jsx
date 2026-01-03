// src/components/admin/dashboard/parts/DashboardSalesBody.jsx
import React, { useEffect, useMemo, useState, Suspense } from "react";
import {
  buildDailyAligned,
  buildMonthlyAligned,
  aggregateBranches,
  fmtMoney,
  fmtInt,
  registerChart,
} from "../dashboardSalesUtils";

const Spinner = ({ className = "" }) => (
  <span
    className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
  />
);

const LazyLine = React.lazy(() =>
  import("react-chartjs-2").then((m) => ({ default: m.Line }))
);

/* =========================================================
   ✅ Day-of-week (English short) for daily chart + daily table
   - avoid timezone shift: parse YYYY-MM-DD manually (local date)
========================================================= */
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDowShort = (isoDate) => {
  if (!isoDate) return "";
  const [y, m, d] = String(isoDate).split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d); // local date (no UTC shift)
  return DOW[dt.getDay()] || "";
};

const withDow = (isoDate) => {
  if (!isoDate) return "";
  const dow = getDowShort(isoDate);
  return dow ? `${isoDate} (${dow})` : String(isoDate);
};

const ChartCard = ({
  title,
  subtitle,
  right,
  height = 300,
  data,
  options,
  loading,
  chartReady,
}) => {
  const hasPoint = useMemo(() => {
    const ds = data?.datasets || [];
    for (const d of ds) {
      const arr = d?.data || [];
      for (const v of arr) {
        if (v == null) continue;
        const n = Number(v);
        if (Number.isFinite(n)) return true;
      }
    }
    return false;
  }, [data]);

  const noData = !loading && (!data?.labels || data.labels.length === 0 || !hasPoint);

  return (
    <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 p-4 h-full">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {subtitle ? (
            <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {right ? right : null}
          {loading ? (
            <div className="text-[11px] text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <Spinner className="h-3.5 w-3.5" /> Loading
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {!chartReady ? (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">
            กำลังเตรียมกราฟ...
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">
                กำลังโหลด component กราฟ...
              </div>
            }
          >
            <LazyLine
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: { legend: { display: true, position: "top" } },
                ...(options || {}),
              }}
            />
          </Suspense>
        )}

        {noData ? (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">
            ไม่มีข้อมูลกราฟในช่วงนี้
          </div>
        ) : null}
      </div>
    </div>
  );
};

// diff: ถ้า prev = 0 -> ไม่คำนวณ % (กันหาร 0) แต่ยังแสดงตัวเลขในช่อง compare เป็น 0 ได้
const diffText = (cur, prev, isMoney) => {
  const c = Number(cur || 0);
  const p = prev == null ? null : Number(prev || 0);
  if (p == null || p === 0) return { text: "", cls: "text-slate-300" };

  const diff = c - p;
  const pct = (diff / p) * 100;

  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const pctAbs = Math.abs(pct);
  const abs = Math.abs(diff);

  const v = isMoney ? fmtMoney(abs) : fmtInt(abs);

  const cls =
    pct > 0 ? "text-emerald-600" : pct < 0 ? "text-red-500" : "text-slate-400";

  return { text: `${sign}${pctAbs.toFixed(1)}% (${sign}${v})`, cls };
};

/* =========================
   Tooltip (hover)
========================= */
const Tip = ({ text, children }) => (
  <span className="relative inline-block group">
    {children}
    {text ? (
      <span
        className="pointer-events-none absolute z-20 hidden group-hover:block
                   -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                   max-w-[420px] truncate whitespace-nowrap
                   rounded-md border border-slate-200 bg-white px-2 py-1
                   text-[11px] text-slate-700 shadow"
      >
        {text}
      </span>
    ) : null}
  </span>
);

const SalesCompareTable = ({ tableMode, showCompare, dailyRows, monthRows }) => {
  const rows = tableMode === "month" ? monthRows || [] : dailyRows || [];

  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => setPage(1), [tableMode, showCompare, rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageRows = rows.slice(startIdx, startIdx + pageSize);

  // Summary รวมทั้งชุด (ไม่ใช่แค่หน้าปัจจุบัน)
  const summary = useMemo(() => {
    if (tableMode === "month") {
      const curSalesSum = rows.reduce((acc, r) => acc + Number(r.curSales || 0), 0);
      const cmpSalesSum = rows.reduce((acc, r) => acc + Number(r.cmpSales || 0), 0);
      return { curSalesSum, cmpSalesSum };
    }

    const curSalesSum = rows.reduce((acc, r) => acc + Number(r.curSales || 0), 0);
    const cmpSalesSum = rows.reduce((acc, r) => acc + Number(r.cmpSales || 0), 0);
    const curBillsSum = rows.reduce((acc, r) => acc + Number(r.curBills || 0), 0);
    const cmpBillsSum = rows.reduce((acc, r) => acc + Number(r.cmpBills || 0), 0);

    return { curSalesSum, cmpSalesSum, curBillsSum, cmpBillsSum };
  }, [rows, tableMode]);

  return (
    <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            {tableMode === "month" ? "Month Table" : "Daily Table"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {tableMode === "month"
              ? "Monthly sales data summary"
              : "Daily sales data summary"} {/* ✅ */}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className={`px-2.5 py-1 rounded-md border ${
              safePage <= 1
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Prev
          </button>
          <span className="tabular-nums">
            หน้า {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className={`px-2.5 py-1 rounded-md border ${
              safePage >= totalPages
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-auto">
        {tableMode === "month" ? (
          <table className="min-w-[820px] w-full text-xs border-separate border-spacing-0">
            <thead>
              <tr className="text-[11px] text-slate-500">
                <th className="text-left py-2 px-2 border-b border-slate-200">Month</th>
                {showCompare ? (
                  <th className="text-left py-2 px-2 border-b border-slate-200">Compare Month</th>
                ) : null}
                <th className="text-right py-2 px-2 border-b border-slate-200">Net Sales</th>
                {showCompare ? (
                  <th className="text-right py-2 px-2 border-b border-slate-200">Compare</th>
                ) : null}
                {showCompare ? (
                  <th className="text-right py-2 px-2 border-b border-slate-200">Diff</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={showCompare ? 5 : 2} className="py-4 text-center text-slate-400">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const d = diffText(r.curSales, showCompare ? r.cmpSales : null, true);
                  return (
                    <tr key={r.ym} className="border-b border-slate-100">
                      <td className="py-2 px-2 text-slate-700 whitespace-nowrap">{r.ym}</td>
                      {showCompare ? (
                        <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{r.compareYm || ""}</td>
                      ) : null}
                      <td className="py-2 px-2 text-right tabular-nums text-slate-800">{fmtMoney(r.curSales)}</td>
                      {showCompare ? (
                        <td className="py-2 px-2 text-right tabular-nums text-slate-600">
                          {r.cmpSales == null ? "" : fmtMoney(r.cmpSales)}
                        </td>
                      ) : null}
                      {showCompare ? (
                        <td className={`py-2 px-2 text-right tabular-nums ${d.cls}`}>{d.text}</td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/70">
                <td className="py-2 px-2 font-semibold text-slate-700">รวมทั้งหมด</td>
                {showCompare ? <td className="py-2 px-2" /> : null}
                <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-800">
                  {fmtMoney(summary.curSalesSum)}
                </td>
                {showCompare ? (
                  <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-700">
                    {fmtMoney(summary.cmpSalesSum)}
                  </td>
                ) : null}
                {showCompare ? (
                  <td
                    className={`py-2 px-2 text-right tabular-nums ${
                      diffText(summary.curSalesSum, summary.cmpSalesSum, true).cls
                    }`}
                  >
                    {diffText(summary.curSalesSum, summary.cmpSalesSum, true).text}
                  </td>
                ) : null}
              </tr>
            </tfoot>
          </table>
        ) : (
          <table className="min-w-[980px] w-full text-xs border-separate border-spacing-0">
            <thead>
              <tr className="text-[11px] text-slate-500">
                <th className="text-left py-2 px-2 border-b border-slate-200">Date</th>
                {showCompare ? (
                  <th className="text-left py-2 px-2 border-b border-slate-200">Compare Date</th>
                ) : null}
                <th className="text-right py-2 px-2 border-b border-slate-200">Net Sales</th>
                {showCompare ? (
                  <th className="text-right py-2 px-2 border-b border-slate-200">Compare</th>
                ) : null}
                {showCompare ? (
                  <th className="text-right py-2 px-2 border-b border-slate-200">Diff</th>
                ) : null}
                <th className="text-right py-2 px-2 border-b border-slate-200">Bills</th>
                {showCompare ? (
                  <th className="text-right py-2 px-2 border-b border-slate-200">Compare</th>
                ) : null}
                {showCompare ? (
                  <th className="text-right py-2 px-2 border-b border-slate-200">Diff</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={showCompare ? 8 : 3} className="py-4 text-center text-slate-400">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const ds = diffText(r.curSales, showCompare ? r.cmpSales : null, true);
                  const db = diffText(r.curBills, showCompare ? r.cmpBills : null, false);

                  return (
                    <tr key={r.date} className="border-b border-slate-100">
                      {/* ✅ add DOW */}
                      <td className="py-2 px-2 text-slate-700 whitespace-nowrap">{withDow(r.date)}</td>

                      {showCompare ? (
                        <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                          {r.compareDate ? withDow(r.compareDate) : ""}
                        </td>
                      ) : null}

                      <td className="py-2 px-2 text-right tabular-nums text-slate-800">{fmtMoney(r.curSales)}</td>

                      {showCompare ? (
                        <td className="py-2 px-2 text-right tabular-nums text-slate-600">
                          {fmtMoney(r.cmpSales)}
                        </td>
                      ) : null}

                      {showCompare ? (
                        <td className={`py-2 px-2 text-right tabular-nums ${ds.cls}`}>{ds.text}</td>
                      ) : null}

                      <td className="py-2 px-2 text-right tabular-nums text-slate-800">{fmtInt(r.curBills)}</td>

                      {showCompare ? (
                        <td className="py-2 px-2 text-right tabular-nums text-slate-600">
                          {fmtInt(r.cmpBills)}
                        </td>
                      ) : null}

                      {showCompare ? (
                        <td className={`py-2 px-2 text-right tabular-nums ${db.cls}`}>{db.text}</td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/70">
                <td className="py-2 px-2 font-semibold text-slate-700">รวมทั้งหมด</td>
                {showCompare ? <td className="py-2 px-2" /> : null}

                <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-800">
                  {fmtMoney(summary.curSalesSum)}
                </td>

                {showCompare ? (
                  <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-700">
                    {fmtMoney(summary.cmpSalesSum)}
                  </td>
                ) : null}

                {showCompare ? (
                  <td
                    className={`py-2 px-2 text-right tabular-nums ${
                      diffText(summary.curSalesSum, summary.cmpSalesSum, true).cls
                    }`}
                  >
                    {diffText(summary.curSalesSum, summary.cmpSalesSum, true).text}
                  </td>
                ) : null}

                <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-800">
                  {fmtInt(summary.curBillsSum)}
                </td>

                {showCompare ? (
                  <td className="py-2 px-2 text-right tabular-nums font-semibold text-slate-700">
                    {fmtInt(summary.cmpBillsSum)}
                  </td>
                ) : null}

                {showCompare ? (
                  <td
                    className={`py-2 px-2 text-right tabular-nums ${
                      diffText(summary.curBillsSum, summary.cmpBillsSum, false).cls
                    }`}
                  >
                    {diffText(summary.curBillsSum, summary.cmpBillsSum, false).text}
                  </td>
                ) : null}
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

const BranchSalesTable = ({ primaryDash, compareDash, showCompare }) => {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const rows = useMemo(() => {
    const cur = aggregateBranches(primaryDash);
    const cmp = aggregateBranches(compareDash);

    const curMap = new Map(cur.map((x) => [x.branch_code || x.branch_name, x]));
    const cmpMap = new Map(cmp.map((x) => [x.branch_code || x.branch_name, x]));
    const keys = new Set([...curMap.keys(), ...cmpMap.keys()]);

    const list = Array.from(keys).map((k) => {
      const c = curMap.get(k);
      const p = cmpMap.get(k);
      const current = Number(c?.total || 0);
      const compare = showCompare ? Number(p?.total || 0) : null;

      const branch_code = c?.branch_code || p?.branch_code || "";
      const branch_name = c?.branch_name || p?.branch_name || k;

      const codeName = `${branch_code || "-"}:${branch_name || "-"}`;

      return {
        key: k,
        branch_code,
        branch_name,
        codeName, // แสดงแบบ Code:Branch
        current,
        compare,
      };
    });

    list.sort((a, b) => b.current - a.current);
    return list;
  }, [primaryDash, compareDash, showCompare]);

  // ✅ ค้นหา "เฉพาะชื่อสาขา" เท่านั้น
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => String(r.branch_name || "").toLowerCase().includes(s));
  }, [q, rows]);

  useEffect(() => setPage(1), [q, filtered.length, showCompare]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 p-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">Branch Sales (All Branches)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">ตารางยอดขายทุกสาขา</div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className={`px-2.5 py-1 rounded-md border ${
              safePage <= 1
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Prev
          </button>
          <span className="tabular-nums">{safePage} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className={`px-2.5 py-1 rounded-md border ${
              safePage >= totalPages
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อสาขา..."
          className="w-full sm:w-72 border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        />
      </div>

      {/* ✅ ทำให้แคบลง */}
      <div className="mt-3 overflow-auto">
        <table className="min-w-[760px] w-full text-xs border-separate border-spacing-0">
          <thead>
            <tr className="text-[11px] text-slate-500">
              <th className="text-left py-2 px-2 border-b border-slate-200 w-[320px]">Branch</th>
              <th className="text-right py-2 px-2 border-b border-slate-200">Current</th>
              {showCompare ? (
                <th className="text-right py-2 px-2 border-b border-slate-200">Compare</th>
              ) : null}
              {showCompare ? (
                <th className="text-left py-2 px-2 border-b border-slate-200">Diff</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={showCompare ? 4 : 2} className="py-4 text-center text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              pageRows.map((r) => {
                const d = diffText(r.current, showCompare ? r.compare : null, true);
                const full = r.codeName;

                return (
                  <tr key={r.key} className="border-b border-slate-100">
                    <td className="py-2 px-2 text-slate-700">
                      <Tip text={full}>
                        <div className="font-semibold truncate max-w-[320px]">{full}</div>
                      </Tip>
                    </td>

                    <td className="py-2 px-2 text-right tabular-nums text-slate-800">{fmtMoney(r.current)}</td>

                    {showCompare ? (
                      <td className="py-2 px-2 text-right tabular-nums text-slate-600">
                        {r.compare == null ? "" : fmtMoney(r.compare)}
                      </td>
                    ) : null}

                    {showCompare ? (
                      <td className={`py-2 px-2 text-left tabular-nums ${d.cls}`}>{d.text}</td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function DashboardSalesBody({
  mode,
  primaryStart,
  primaryEnd,
  compareStart,
  compareEnd,
  primaryDash,
  compareDash,
  showCompare,
  loading,
}) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await registerChart();
        if (alive) setChartReady(true);
      } catch {
        if (alive) setChartReady(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const [netSalesMode, setNetSalesMode] = useState("daily"); // daily | month

  const daily = useMemo(
    () =>
      buildDailyAligned(primaryDash, compareDash, {
        mode,
        primaryStart,
        primaryEnd,
        compareStart,
        compareEnd,
      }),
    [primaryDash, compareDash, mode, primaryStart, primaryEnd, compareStart, compareEnd]
  );

  const monthly = useMemo(
    () =>
      buildMonthlyAligned(primaryDash, compareDash, {
        mode,
        primaryStart,
        primaryEnd,
        compareStart,
        compareEnd,
      }),
    [primaryDash, compareDash, mode, primaryStart, primaryEnd, compareStart, compareEnd]
  );

  // ✅ 0 => null (ตัดเส้น), NaN/undefined => null
  const toChartSeries = (arr) =>
    (arr || []).map((v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n === 0) return null;
      return n;
    });

  const chartData = useMemo(() => {
    const isMonth = netSalesMode === "month";

    // ✅ add DOW to daily labels only
    const rawLabels = isMonth ? monthly.labels : daily.labels;
    const labels = isMonth ? rawLabels : (rawLabels || []).map(withDow);

    const curRaw = isMonth ? monthly.curSales : daily.curSales;
    const cmpRaw = isMonth ? monthly.cmpSales : daily.cmpSales;

    const cur = toChartSeries(curRaw);
    const cmp = toChartSeries(cmpRaw);

    const labelCount = labels?.length || 0;
    const monthPointRadius = labelCount <= 1 ? 4 : 2;

    return {
      labels,
      datasets: [
        {
          label: isMonth ? "Net Sales (Month / Current)" : "Net Sales (Daily / Current)",
          data: cur,
          borderWidth: 2,
          tension: 0.25,
          pointRadius: isMonth ? monthPointRadius : 1,
          spanGaps: false,
        },
        ...(showCompare
          ? [
              {
                label: isMonth ? "Net Sales (Month / Compare)" : "Net Sales (Daily / Compare)",
                data: cmp,
                borderWidth: 2,
                tension: 0.25,
                borderDash: [10, 6],
                pointRadius: isMonth ? monthPointRadius : 0,
                spanGaps: false,
              },
            ]
          : []),
      ],
    };
  }, [netSalesMode, daily, monthly, showCompare]);

  const toggleUI = (
    <div className="flex items-center gap-1">
      {[
        { k: "daily", label: "Daily" },
        { k: "month", label: "Month" },
      ].map((x) => (
        <button
          key={x.k}
          type="button"
          onClick={() => setNetSalesMode(x.k)}
          disabled={loading}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            loading
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              : netSalesMode === x.k
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {x.label}
        </button>
      ))}
    </div>
  );

  const tableMode = netSalesMode;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <ChartCard
          title="Net Sales"
          subtitle={
            netSalesMode === "month"
              ? "โหมดรายเดือน + Compare เส้นประ"
              : "โหมดรายวัน (union) + Compare เส้นประ"
          }
          height={300}
          data={chartData}
          options={{
            scales: {
              y: { ticks: { callback: (v) => Number(v).toLocaleString() } },
            },
          }}
          loading={loading}
          chartReady={chartReady}
          right={toggleUI}
        />

        <BranchSalesTable primaryDash={primaryDash} compareDash={compareDash} showCompare={showCompare} />
      </div>

      <SalesCompareTable
        tableMode={tableMode}
        showCompare={showCompare}
        dailyRows={daily.tableRows}
        monthRows={monthly.tableRows}
      />
    </div>
  );
}

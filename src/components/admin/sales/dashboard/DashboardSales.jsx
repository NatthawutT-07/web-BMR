// src/components/admin/dashboard/DashboardSales.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDashboard } from "../../../../api/admin/dashboard";

import DashboardSalesTop from "./parts/DashboardSalesTop";
import DashboardSalesBody from "./parts/DashboardSalesBody";
import DashboardProductList from "./parts/DashboardProductList";

import {
  daysBetweenInclusive,
  getRangesByMode,
  hasCompareData,
  isValidRange,
  registerChart,
  safeDiv,
  toLocalISO,
  quarterStart,
  startOfMonthISO,
} from "./dashboardSalesUtils";

/* ============== UI small ============== */
const Spinner = ({ className = "" }) => (
  <span
    className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
  />
);

const LoadingBar = ({ show, text = "กำลังโหลดข้อมูล..." }) => {
  if (!show) return null;
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-blue-800 flex items-center gap-2">
      <Spinner />
      <div className="text-sm font-medium">{text}</div>
    </div>
  );
};

export default function DashboardSales() {
  // ✅ baseDate = เมื่อวานเสมอ
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const defaultStart = useMemo(() => startOfMonthISO(baseDate), [baseDate]);
  const defaultEnd = useMemo(() => toLocalISO(baseDate), [baseDate]);

  // ---------------- pending (UI) ----------------
  const [mode, setMode] = useState("diff_month");
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // ---------------- applied (ใช้จริงกับ KPI/กราฟ/ข้อมูล) ----------------
  const [appliedMode, setAppliedMode] = useState("diff_month");
  const [appliedStart, setAppliedStart] = useState(defaultStart);
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd);

  const appliedRanges = useMemo(() => {
    return getRangesByMode({ mode: appliedMode, start: appliedStart, end: appliedEnd, baseDate });
  }, [appliedMode, appliedStart, appliedEnd, baseDate]);

  // ✅ เปลี่ยนโหมด month/quarter ให้ “pending” เปลี่ยนตามเมื่อวาน (แต่ยังไม่โหลดจนกด Show Data)
  useEffect(() => {
    if (mode === "diff_month") {
      setStart(startOfMonthISO(baseDate));
      setEnd(toLocalISO(baseDate));
    } else if (mode === "diff_quarter") {
      setStart(toLocalISO(quarterStart(baseDate)));
      setEnd(toLocalISO(baseDate));
    }
  }, [mode, baseDate]);

  // ---------------- chart ready (โหลด chart.js ครั้งเดียว) ----------------
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    let alive = true;
    registerChart()
      .then(() => alive && setChartReady(true))
      .catch(() => alive && setChartReady(false));
    return () => {
      alive = false;
    };
  }, []);

  // ---------------- data ----------------
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [primaryDash, setPrimaryDash] = useState(null);
  const [compareDash, setCompareDash] = useState(null);

  // prevent race
  const reqIdRef = useRef(0);

  const loadBy = async ({ mode: m, start: s, end: e }) => {
    setErr("");

    if (m === "diff_year" && !isValidRange(s, e)) {
      setErr("ช่วงวันที่ไม่ถูกต้อง (Start ต้องไม่มากกว่า End)");
      return;
    }

    const myId = ++reqIdRef.current;
    setLoading(true);

    try {
      const ranges = getRangesByMode({ mode: m, start: s, end: e, baseDate });
      const p = ranges.primary;
      const c = ranges.compare;

      const [pRes, cRes] = await Promise.all([
        getDashboard(p.start, p.end),
        getDashboard(c.start, c.end),
      ]);
      if (reqIdRef.current !== myId) return;

      setPrimaryDash(pRes);
      setCompareDash(cRes);
    } catch (e2) {
      if (reqIdRef.current !== myId) return;
      setPrimaryDash(null);
      setCompareDash(null);
      setErr("โหลดข้อมูลไม่สำเร็จ (เช็ค API / token / network)");
    } finally {
      if (reqIdRef.current === myId) setLoading(false);
    }
  };

  // ✅ กด Show Data เท่านั้น => apply + load
  const applyAndLoad = () => {
    setAppliedMode(mode);
    setAppliedStart(start);
    setAppliedEnd(end);
    loadBy({ mode, start, end });
  };

  // ✅ โหลดครั้งแรกอัตโนมัติ (ค่า default เมื่อวาน)
  useEffect(() => {
    loadBy({ mode: appliedMode, start: appliedStart, end: appliedEnd });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCompare = useMemo(() => hasCompareData(compareDash), [compareDash]);

  // ✅ KPI ใช้ appliedRanges เท่านั้น
  const kpi = useMemo(() => {
    const s = primaryDash?.summary || {};
    const netSales = Number(s.total_payment || 0);
    const billSaleCount = Number(s.bill_count || 0);
    const endBillDiscount = Number(s.discount_sum || 0);

    const dayCount = daysBetweenInclusive(appliedRanges.primary.start, appliedRanges.primary.end);
    const avgPerBill = billSaleCount ? safeDiv(netSales, billSaleCount) : 0;
    const dailyAvgSales = dayCount ? safeDiv(netSales, dayCount) : 0;

    return { netSales, billSaleCount, avgPerBill, dailyAvgSales, endBillDiscount, dayCount };
  }, [primaryDash, appliedRanges.primary.start, appliedRanges.primary.end]);

  const kpiCompare = useMemo(() => {
    const s = compareDash?.summary || {};
    const netSales = Number(s.total_payment || 0);
    const billSaleCount = Number(s.bill_count || 0);
    const endBillDiscount = Number(s.discount_sum || 0);

    const dayCount = daysBetweenInclusive(appliedRanges.compare.start, appliedRanges.compare.end);
    const avgPerBill = billSaleCount ? safeDiv(netSales, billSaleCount) : 0;
    const dailyAvgSales = dayCount ? safeDiv(netSales, dayCount) : 0;

    return { netSales, billSaleCount, avgPerBill, dailyAvgSales, endBillDiscount, dayCount };
  }, [compareDash, appliedRanges.compare.start, appliedRanges.compare.end]);

  const disabled = loading;

  const isDirty = useMemo(() => {
    if (mode !== appliedMode) return true;
    return start !== appliedStart || end !== appliedEnd;
  }, [mode, start, end, appliedMode, appliedStart, appliedEnd]);

  const appliedRangeLabel = useMemo(() => {
    return `${appliedRanges.primary.start} → ${appliedRanges.primary.end}`;
  }, [appliedRanges.primary.start, appliedRanges.primary.end]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 space-y-4">
        <DashboardSalesTop
          mode={mode}
          setMode={setMode}
          start={start}
          end={end}
          setStart={setStart}
          setEnd={setEnd}
          onShowData={applyAndLoad}
          disabled={disabled}
          appliedMode={appliedMode}
          appliedStart={appliedRanges.primary.start}
          appliedEnd={appliedRanges.primary.end}
          isDirty={isDirty}
          primaryDash={primaryDash}
          compareDash={compareDash}
          showCompare={showCompare}
          kpi={kpi}
          kpiCompare={kpiCompare}
          appliedRangeLabel={appliedRangeLabel}
        />

        <LoadingBar
          show={loading}
          text={
            appliedMode === "diff_year"
              ? "กำลังโหลด YoY ตามช่วงวันที่ที่เลือก..."
              : appliedMode === "diff_month"
                ? "กำลังโหลด Diff Month..."
                : "กำลังโหลด Diff Quarter..."
          }
        />

        {err ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
            {err}
          </div>
        ) : null}

        {/* ✅ FIX: ส่ง mode + ranges ให้ Body เพื่อเทียบวันให้ตรง */}
        <DashboardSalesBody
          mode={appliedMode}
          primaryStart={appliedRanges.primary.start}
          primaryEnd={appliedRanges.primary.end}
          compareStart={appliedRanges.compare.start}
          compareEnd={appliedRanges.compare.end}
          primaryDash={primaryDash}
          compareDash={compareDash}
          showCompare={showCompare}
          loading={loading}
        />
        <DashboardProductList
          mode={appliedMode}
          primaryStart={appliedRanges.primary.start}
          primaryEnd={appliedRanges.primary.end}
          compareStart={appliedRanges.compare.start}
          compareEnd={appliedRanges.compare.end}
          disabled={disabled}
        />

        {/* <details className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Debug summary</summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-700 mb-2">Primary</div>
              <pre className="text-[11px] overflow-auto">
                {JSON.stringify(primaryDash?.summary || {}, null, 2)}
              </pre>
            </div>

            {showCompare ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">Compare</div>
                <pre className="text-[11px] overflow-auto">
                  {JSON.stringify(compareDash?.summary || {}, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
                ไม่มีข้อมูลช่วงเทียบ
              </div>
            )}
          </div>
        </details> */}
      </div>
    </div>
  );
}

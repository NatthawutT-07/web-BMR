// src/components/admin/dashboard/DashboardSales.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDashboard } from "../../../../../api/admin/dashboard";
import useDashboardSalesStore from "../../../../../store/dashboard_sales_store";

import DashboardSalesTop from "./parts/DashboardSalesTop";
import DashboardSalesBody from "./parts/DashboardSalesBody";
import DashboardProductList from "./parts/DashboardProductList";
import DashboardSalesByCategory from "./parts/DashboardSalesByCategory";

import {
  daysBetweenInclusive,
  getRangesByMode,
  hasCompareData,
  isValidRange,
  registerChart,
  safeDiv,
  toLocalISO,
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
  const cacheStore = useDashboardSalesStore();

  // ✅ baseDate = เมื่อวาน (latest)
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  // ✅ โหลดค่าล่าสุดจาก localStorage ถ้ามี
  const defaultMode = cacheStore.lastSelection?.mode || "diff_month";
  const defaultStart = cacheStore.lastSelection?.start || startOfMonthISO(baseDate);
  const defaultEnd = cacheStore.lastSelection?.end || toLocalISO(baseDate);

  // ---------------- pending ----------------
  const [mode, setMode] = useState(defaultMode);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // ✅ sync pending start/end ให้ตรงกับ mode ที่ไม่ใช่ diff_year
  useEffect(() => {
    if (mode !== "diff_year") {
      const r = getRangesByMode({ mode, start, end, baseDate });
      setStart(r.primary.start);
      setEnd(r.primary.end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, baseDate]);

  // ---------------- applied ----------------
  const [appliedMode, setAppliedMode] = useState(defaultMode);
  const [appliedStart, setAppliedStart] = useState(defaultStart);
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd);

  const appliedRanges = useMemo(
    () =>
      getRangesByMode({
        mode: appliedMode,
        start: appliedStart,
        end: appliedEnd,
        baseDate,
      }),
    [appliedMode, appliedStart, appliedEnd, baseDate]
  );

  // ---------------- chart.js ----------------
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    let alive = true;
    registerChart().then(() => alive && setChartReady(true));
    return () => (alive = false);
  }, []);

  // ---------------- data ----------------
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [primaryDash, setPrimaryDash] = useState(null);
  const [compareDash, setCompareDash] = useState(null);

  const reqIdRef = useRef(0);

  const makeCacheKey = (m, s, e) => `${m}:${s}→${e}`;

  const loadBy = async ({ mode: m, start: s, end: e, force = false }) => {
    setErr("");

    if (m === "diff_year" && !isValidRange(s, e)) {
      setErr("ช่วงวันที่ไม่ถูกต้อง");
      return;
    }

    const key = makeCacheKey(m, s, e);

    if (!force) {
      const cached = cacheStore.getCache(key);
      if (cached) {
        setPrimaryDash(cached.primaryDash);
        setCompareDash(cached.compareDash);
        return;
      }
    }

    const myId = ++reqIdRef.current;
    setLoading(true);

    try {
      const ranges = getRangesByMode({ mode: m, start: s, end: e, baseDate });
      const [pRes, cRes] = await Promise.all([
        getDashboard(ranges.primary.start, ranges.primary.end),
        getDashboard(ranges.compare.start, ranges.compare.end),
      ]);

      if (reqIdRef.current !== myId) return;

      setPrimaryDash(pRes);
      setCompareDash(cRes);
      cacheStore.setCache(key, pRes, cRes);
    } catch {
      if (reqIdRef.current !== myId) return;
      setPrimaryDash(null);
      setCompareDash(null);
      setErr("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (reqIdRef.current === myId) setLoading(false);
    }
  };

  // ✅ โหลดครั้งแรก
  useEffect(() => {
    loadBy({
      mode: appliedMode,
      start: appliedStart,
      end: appliedEnd,
    });
    // eslint-disable-next-line
  }, []);

  // ✅ Show Data = apply + เก็บ recent + load ใหม่
  const applyAndLoad = () => {
    // ✅ ค่าที่จะใช้จริง
    const r = getRangesByMode({ mode, start, end, baseDate });

    setAppliedMode(mode);
    setAppliedStart(mode === "diff_year" ? start : r.primary.start);
    setAppliedEnd(mode === "diff_year" ? end : r.primary.end);

    // ✅ save ล่าสุดให้ตรงความจริง
    cacheStore.setLastSelection(
      mode,
      mode === "diff_year" ? start : r.primary.start,
      mode === "diff_year" ? end : r.primary.end
    );

    loadBy({ mode, start, end });
  };

  // ✅ Refresh
  const refreshNow = () => {
    cacheStore.clearCache();
    loadBy({
      mode: appliedMode,
      start: appliedStart,
      end: appliedEnd,
      force: true,
    });
  };

  const showCompare = useMemo(() => hasCompareData(compareDash), [compareDash]);

  const kpi = useMemo(() => {
    const s = primaryDash?.summary || {};
    const netSales = Number(s.total_payment || 0);
    const billSaleCount = Number(s.bill_count || 0);
    const endBillDiscount = Number(s.discount_sum || 0);
    const dayCount = daysBetweenInclusive(appliedRanges.primary.start, appliedRanges.primary.end);

    return {
      netSales,
      billSaleCount,
      endBillDiscount,
      dayCount,
      avgPerBill: billSaleCount ? safeDiv(netSales, billSaleCount) : 0,
      dailyAvgSales: dayCount ? safeDiv(netSales, dayCount) : 0,
    };
  }, [primaryDash, appliedRanges]);

  const kpiCompare = useMemo(() => {
    const s = compareDash?.summary || {};
    const netSales = Number(s.total_payment || 0);
    const billSaleCount = Number(s.bill_count || 0);
    const endBillDiscount = Number(s.discount_sum || 0);
    const dayCount = daysBetweenInclusive(appliedRanges.compare.start, appliedRanges.compare.end);

    return {
      netSales,
      billSaleCount,
      endBillDiscount,
      dayCount,
      avgPerBill: billSaleCount ? safeDiv(netSales, billSaleCount) : 0,
      dailyAvgSales: dayCount ? safeDiv(netSales, dayCount) : 0,
    };
  }, [compareDash, appliedRanges]);

  const isDirty = mode !== appliedMode || start !== appliedStart || end !== appliedEnd;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-3 py-4 space-y-4">
        <DashboardSalesTop
          mode={mode}
          setMode={setMode}
          start={start}
          end={end}
          setStart={setStart}
          setEnd={setEnd}
          onShowData={applyAndLoad}
          onRefresh={refreshNow}
          disabled={loading}
          appliedMode={appliedMode}
          appliedStart={appliedRanges.primary.start}
          appliedEnd={appliedRanges.primary.end}
          isDirty={isDirty}
          primaryDash={primaryDash}
          compareDash={compareDash}
          showCompare={showCompare}
          kpi={kpi}
          kpiCompare={kpiCompare}
          appliedRangeLabel={`${appliedRanges.primary.start} → ${appliedRanges.primary.end}`}
          compareRangeLabel={`${appliedRanges.compare.start} → ${appliedRanges.compare.end}`}
        />

        <LoadingBar show={loading} />

        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
            {err}
          </div>
        )}

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

        <DashboardSalesByCategory
          mode={appliedMode}
          primaryStart={appliedRanges.primary.start}
          primaryEnd={appliedRanges.primary.end}
          compareStart={appliedRanges.compare.start}
          compareEnd={appliedRanges.compare.end}
          disabled={loading}
        />

        <DashboardProductList
          mode={appliedMode}
          primaryStart={appliedRanges.primary.start}
          primaryEnd={appliedRanges.primary.end}
          compareStart={appliedRanges.compare.start}
          compareEnd={appliedRanges.compare.end}
          disabled={loading}
        />
      </div>
    </div>
  );
}

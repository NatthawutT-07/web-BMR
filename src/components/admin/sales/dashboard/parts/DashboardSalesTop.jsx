// src/components/admin/dashboard/parts/DashboardSalesTop.jsx
import React, { useMemo, useState } from "react";
import {
  clampISO,
  formatDisplayDate,
  fmtInt,
  fmtMoney,
  normalizeChannel,
  normalizeMethod,
} from "../dashboardSalesUtils";

/* ============== UI small ============== */
const Spinner = ({ className = "" }) => (
  <span
    className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
  />
);

/**
 * KpiCard
 * - absValue: แสดงตัวเลขเป็นบวกเสมอ (เหมาะกับ Discounts ที่เก็บเป็นลบ)
 * - betterWhen:
 *    - "higher" (default): มากขึ้น = ดีขึ้น
 *    - "lower": น้อยลง = ดีขึ้น (Discount/Cost)
 */
const KpiCard = ({
  title,
  current,
  prev,
  isMoney,
  highlight,
  absValue = false,
  betterWhen = "higher", // "higher" | "lower"
}) => {
  const curRaw = Number(current || 0);
  const prevRaw = prev == null ? null : Number(prev || 0);

  const curDisp = absValue ? Math.abs(curRaw) : curRaw;
  const prevDisp = prevRaw == null ? null : absValue ? Math.abs(prevRaw) : prevRaw;

  const currentText = isMoney ? fmtMoney(curDisp) : fmtInt(curDisp);
  const prevText = prevDisp == null ? "-" : isMoney ? fmtMoney(prevDisp) : fmtInt(prevDisp);

  let diffText = "-";
  let diffCls = "text-slate-500";

  if (prevDisp != null && prevDisp !== 0) {
    const delta =
      betterWhen === "lower"
        ? Number(prevDisp) - Number(curDisp)
        : Number(curDisp) - Number(prevDisp);

    const denom = Math.abs(Number(prevDisp)) || 0;
    const pct = denom ? (delta / denom) * 100 : 0;

    const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
    const pctAbs = Math.abs(pct);
    const absDelta = Math.abs(delta);

    diffText = `${sign}${pctAbs.toFixed(2)}% (${sign}${isMoney ? fmtMoney(absDelta) : fmtInt(absDelta)})`;

    if (delta > 0) diffCls = "text-emerald-600 font-semibold";
    else if (delta < 0) diffCls = "text-red-500 font-semibold";
    else diffCls = "text-slate-400";
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border text-sm shadow-sm p-4 md:p-5 ${highlight
        ? "bg-gradient-to-br from-blue-50 via-emerald-50 to-white border-blue-100"
        : "bg-white border-slate-200"
        }`}
    >
      {highlight && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100/60" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-slate-500 text-xs font-medium mb-1">{title}</div>
          <div className="mt-1 text-xl md:text-2xl font-semibold text-gray-900 whitespace-normal break-all leading-tight">
            {currentText}
          </div>

        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Compare</div>
          <div className="text-[11px] font-medium text-slate-600 tabular-nums">{prevText}</div>
          <div className={`mt-1 text-[11px] ${diffCls}`}>{diffText}</div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   Date Filter UI (pending แต่ไม่กระทบ KPI จนกด Show Data)
========================================================= */
const DateFilter = ({
  mode,
  setMode,
  start,
  end,
  setStart,
  setEnd,
  onShowData,
  minDate,
  maxDate,
  disabled,

  // applied display
  appliedMode,
  appliedStart,
  appliedEnd,
  isDirty,
}) => {
  const pillBase = "px-3 py-1.5 rounded-full border text-xs transition whitespace-nowrap";
  const pillActive = "bg-blue-600 border-blue-600 text-white shadow-sm";
  const pillIdle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
  const pillDisabled = "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed";

  const appliedModeLabel =
    appliedMode === "diff_month"
      ? "Diff Month"
      : appliedMode === "diff_quarter"
        ? "Diff Quarter"
        : "Diff Year (YoY)";

  return (
    <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 px-4 py-3 md:px-6 md:py-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
          <span className="text-[11px] text-slate-500 mr-1">Compare mode :</span>

          <button
            type="button"
            onClick={() => !disabled && setMode("diff_month")}
            disabled={disabled}
            className={`${pillBase} ${disabled ? pillDisabled : mode === "diff_month" ? pillActive : pillIdle
              }`}
          >
            Diff Month
          </button>

          <button
            type="button"
            onClick={() => !disabled && setMode("diff_quarter")}
            disabled={disabled}
            className={`${pillBase} ${disabled ? pillDisabled : mode === "diff_quarter" ? pillActive : pillIdle
              }`}
          >
            Diff Quarter
          </button>

          <button
            type="button"
            onClick={() => !disabled && setMode("diff_year")}
            disabled={disabled}
            className={`${pillBase} ${disabled ? pillDisabled : mode === "diff_year" ? pillActive : pillIdle
              }`}
          >
            Diff Year (YoY)
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={start}
              min={minDate || undefined}
              max={maxDate || undefined}
              onChange={(e) => setStart(clampISO(e.target.value, minDate, maxDate))}
              disabled={mode !== "diff_year" || disabled}
              className={`border border-slate-200 px-3 py-2 rounded-lg w-full shadow-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 ${mode !== "diff_year" || disabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={end}
              min={minDate || undefined}
              max={maxDate || undefined}
              onChange={(e) => setEnd(clampISO(e.target.value, minDate, maxDate))}
              disabled={mode !== "diff_year" || disabled}
              className={`border border-slate-200 px-3 py-2 rounded-lg w-full shadow-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 ${mode !== "diff_year" || disabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-transparent mb-1">.</label>
            <button
              onClick={onShowData}
              disabled={disabled}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all ${disabled
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                }`}
              title="กดเพื่อ apply ช่วงวันที่/โหมด แล้วโหลดข้อมูล"
            >
              {disabled ? <Spinner className="h-4 w-4" /> : null}
              Show Data
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          ตั้งค่าไว้:{" "}
          <span className="font-medium text-slate-700">
            {formatDisplayDate(start)} - {formatDisplayDate(end)}
          </span>
          {isDirty ? (
            <span className="ml-2 text-[10px] text-amber-600">*ยังไม่กด Show Data</span>
          ) : null}
        </div>

        <div className="text-[11px] text-slate-500">
          กำลังแสดงข้อมูล:{" "}
          <span className="font-medium text-slate-700">
            ({appliedModeLabel}) {formatDisplayDate(appliedStart)} - {formatDisplayDate(appliedEnd)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   Sales by Channel + Payment (คงเดิม)
========================================================= */
const SalesChannelSummary = ({ primaryDash, compareDash, showCompare }) => {
  const [openTip, setOpenTip] = useState({});
  const [page, setPage] = useState("channel"); // channel | payment

  const totalNet = Number(primaryDash?.summary?.total_payment || 0);

  const primaryMap = useMemo(() => {
    const map = new Map();
    (primaryDash?.salesByChannelDate || []).forEach((r) => {
      const ch = normalizeChannel(r.channel_name, r.channel_code);
      map.set(ch, (map.get(ch) || 0) + Number(r.total_payment || 0));
    });
    return map;
  }, [primaryDash]);

  const compareMap = useMemo(() => {
    const map = new Map();
    (compareDash?.salesByChannelDate || []).forEach((r) => {
      const ch = normalizeChannel(r.channel_name, r.channel_code);
      map.set(ch, (map.get(ch) || 0) + Number(r.total_payment || 0));
    });
    return map;
  }, [compareDash]);

  const methodMapByChannel = useMemo(() => {
    const m = new Map();
    (primaryDash?.salesByChannelPaymentMethodDate || []).forEach((r) => {
      const ch = normalizeChannel(r.channel_name, r.channel_code);
      const method = normalizeMethod(r.payment_method);
      const amount = Number(r.total_payment || 0);
      if (!m.has(ch)) m.set(ch, new Map());
      const mm = m.get(ch);
      mm.set(method, (mm.get(method) || 0) + amount);
    });
    return m;
  }, [primaryDash]);

  const paymentSummary = useMemo(() => {
    const mm = new Map();
    (primaryDash?.salesByChannelPaymentMethodDate || []).forEach((r) => {
      const method = normalizeMethod(r.payment_method);
      const amount = Number(r.total_payment || 0);
      mm.set(method, (mm.get(method) || 0) + amount);
    });

    const rows = Array.from(mm.entries())
      .map(([method, total]) => ({ method, total: Number(total || 0) }))
      .filter((x) => Math.abs(x.total) > 1e-9)
      .sort((a, b) => b.total - a.total);

    const totalAll = rows.reduce((acc, x) => acc + Number(x.total || 0), 0);
    return { rows, totalAll };
  }, [primaryDash]);

  const hasPeriodPayment = (primaryDash?.salesByChannelPaymentMethodDate?.length || 0) > 0;

  const channels = useMemo(() => {
    const names = new Set([...Array.from(primaryMap.keys()), ...Array.from(compareMap.keys())]);

    let rows = Array.from(names).map((name) => {
      const current = Number(primaryMap.get(name) || 0);
      const prev = showCompare ? Number(compareMap.get(name) || 0) : null;
      const pct = totalNet > 0 ? (current / totalNet) * 100 : 0;

      let diffAmt = null;
      let diffPct = null;
      if (showCompare && prev != null && prev !== 0) {
        diffAmt = current - prev;
        diffPct = (diffAmt / prev) * 100;
      }

      return { name, current, prev, pct, diffAmt, diffPct };
    });

    rows = rows.filter((x) => Math.abs(x.current) > 1e-9 || Math.abs(x.prev || 0) > 1e-9);
    rows.sort((a, b) => b.current - a.current);
    return rows;
  }, [primaryMap, compareMap, totalNet, showCompare]);

  const toggleTip = (ch) => setOpenTip((p) => ({ ...p, [ch]: !p[ch] }));

  const renderChannelPage = () => {
    if (channels.length === 0) return <div className="text-[11px] text-slate-500 py-2">ไม่มีข้อมูล Channel</div>;

    return (
      <>
        {hasPeriodPayment && (
          <div className="mb-2 text-[11px] text-slate-400">
            กด <span className="font-medium text-slate-500">Tip</span> เพื่อดูวิธีชำระเงิน (ช่วงวันที่ที่เลือก)
          </div>
        )}

        <div className="space-y-2 text-xs max-h-[260px] overflow-auto pr-1">
          {channels.map((c) => {
            let diffColor = "text-slate-400";
            let diffLabel = "-";

            if (showCompare && c.prev != null && c.prev !== 0 && c.diffPct != null) {
              const sign = c.diffAmt > 0 ? "+" : c.diffAmt < 0 ? "-" : "";
              const absPct = Math.abs(c.diffPct).toFixed(2);
              const absAmt = Math.abs(c.diffAmt).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              });
              if (c.diffAmt > 0) diffColor = "text-emerald-600";
              else if (c.diffAmt < 0) diffColor = "text-red-500";
              diffLabel = `${sign}${absPct}% (${absAmt})`;
            }

            const barWidth = Math.max(4, Math.min(Math.abs(c.pct), 100));
            const isOpen = !!openTip[c.name];

            const mm = methodMapByChannel.get(c.name) || new Map();
            const methods = Array.from(mm.entries())
              .map(([method, total]) => ({ method, total: Number(total || 0) }))
              .filter((x) => Math.abs(x.total) > 1e-9)
              .sort((a, b) => b.total - a.total);

            const periodTotal = methods.reduce((acc, x) => acc + Number(x.total || 0), 0);

            return (
              <div key={c.name} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700 truncate">{c.name}</span>

                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-900 whitespace-nowrap">{c.pct.toFixed(2)}%</span>

                    {hasPeriodPayment && (
                      <button
                        type="button"
                        onClick={() => toggleTip(c.name)}
                        className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-[11px] text-slate-600 whitespace-nowrap"
                        title="ดูวิธีชำระเงิน (ช่วงวันที่ที่เลือก)"
                      >
                        {isOpen ? "ซ่อน" : "Tip"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${barWidth}%` }} />
                </div>

                <div className="mt-1 flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[11px]">
                  <span className="tabular-nums text-slate-600">Current: {fmtMoney(c.current)}</span>
                  {showCompare && <span className="tabular-nums text-slate-500">Compare: {fmtMoney(c.prev)}</span>}
                </div>

                {showCompare && <div className={`mt-0.5 text-[11px] ${diffColor}`}>{diffLabel}</div>}

                {hasPeriodPayment && isOpen && (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white/70 overflow-hidden">
                    <div className="px-3 py-2 text-[11px] text-slate-500 flex items-center justify-between border-b border-slate-200">
                      <span className="font-semibold text-slate-600">Payment Methods</span>
                      <span className="tabular-nums">
                        รวม: <span className="font-semibold text-slate-800">฿ {fmtMoney(periodTotal)}</span>
                      </span>
                    </div>

                    {methods.length === 0 ? (
                      <div className="px-3 py-3 text-[11px] text-slate-500">ไม่มีข้อมูลวิธีชำระเงิน</div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {methods.map((m) => {
                          const pctInChannel = periodTotal > 0 ? (m.total / periodTotal) * 100 : 0;
                          const label = m.method === "Unknown" ? "ไม่ระบุ" : m.method;

                          return (
                            <div
                              key={m.method}
                              className="grid grid-cols-[1fr,140px,80px] gap-2 px-3 py-2 text-[11px]"
                            >
                              <div className="text-slate-700 break-words">{label}</div>
                              <div className="text-right tabular-nums whitespace-nowrap text-slate-800">
                                ฿ {fmtMoney(m.total)}
                              </div>
                              <div className="text-right tabular-nums whitespace-nowrap text-slate-500">
                                {pctInChannel.toFixed(2)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderPaymentPage = () => {
    if (!hasPeriodPayment)
      return <div className="text-[11px] text-slate-500 py-2">ไม่มีข้อมูลวิธีชำระเงินในช่วงนี้</div>;

    const rows = paymentSummary.rows || [];
    const totalAll = Number(paymentSummary.totalAll || 0);
    if (rows.length === 0)
      return <div className="text-[11px] text-slate-500 py-2">ไม่มีข้อมูลวิธีชำระเงิน (ยอดเป็น 0)</div>;

    return (
      <div className="space-y-2 text-xs max-h-[280px] overflow-auto pr-1">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-semibold text-slate-600">รวมทั้งหมด (ช่วงวันที่ที่เลือก)</span>
            <span className="font-semibold text-slate-800 tabular-nums">฿ {fmtMoney(totalAll)}</span>
          </div>
        </div>

        {rows.map((r) => {
          const label = r.method === "Unknown" ? "ไม่ระบุ" : r.method;
          const pct = totalAll ? (r.total / totalAll) * 100 : 0;
          const barWidth = Math.max(4, Math.min(Math.abs(pct), 100));

          return (
            <div key={r.method} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-700 truncate">{label}</span>
                <span className="tabular-nums text-slate-900 whitespace-nowrap">฿ {fmtMoney(r.total)}</span>
                
              </div>

              <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${barWidth}%` }} />
              </div>

              <div className="mt-1 text-[11px] text-slate-500 tabular-nums">สัดส่วน: {pct.toFixed(2)}%</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm px-4 py-3 md:px-4 md:py-4 h-full">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-xs font-semibold text-slate-600">Sales by Channel</div>
          <div className="text-[11px] text-slate-500">ช่วงวันที่ที่เลือก (พร้อมเทียบถ้ามี)</div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage("channel")}
            className={`px-2.5 py-1 rounded-full border text-[11px] transition whitespace-nowrap ${page === "channel"
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
          >
            Channel
          </button>

          <button
            type="button"
            onClick={() => hasPeriodPayment && setPage("payment")}
            disabled={!hasPeriodPayment}
            className={`px-2.5 py-1 rounded-full border text-[11px] transition whitespace-nowrap ${!hasPeriodPayment
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              : page === "payment"
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
          >
            Payment
          </button>
        </div>
      </div>

      {page === "channel" ? renderChannelPage() : renderPaymentPage()}
    </div>
  );
};

/* =========================================================
   EXPORT: Top section
========================================================= */
export default function DashboardSalesTop({
  // pending
  mode,
  setMode,
  start,
  end,
  setStart,
  setEnd,
  onShowData,
  disabled,

  // applied display
  appliedMode,
  appliedStart,
  appliedEnd,
  isDirty,

  // data
  primaryDash,
  compareDash,
  showCompare,
  kpi,
  kpiCompare,
  appliedRangeLabel,
}) {
  const compareDays = showCompare ? Number(kpiCompare?.dayCount ?? 0) : 0;

  return (
    <div className="space-y-4">
      <DateFilter
        mode={mode}
        setMode={setMode}
        start={start}
        end={end}
        setStart={setStart}
        setEnd={setEnd}
        onShowData={onShowData}
        minDate={null}
        maxDate={null}
        disabled={disabled}
        appliedMode={appliedMode}
        appliedStart={appliedStart}
        appliedEnd={appliedEnd}
        isDirty={isDirty}
      />

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ✅ Sales by Channel */}
        <div className="w-full lg:basis-[35%] lg:max-w-[35%]">
          <SalesChannelSummary primaryDash={primaryDash} compareDash={compareDash} showCompare={showCompare} />
        </div>

        <div className="w-full lg:basis-[65%] lg:max-w-[65%]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <KpiCard
              title="Net Sales"
              current={kpi.netSales}
              prev={showCompare ? kpiCompare.netSales : null}
              isMoney
              highlight
              betterWhen="higher"
            />
            <KpiCard
              title="Bill sale Count"
              current={kpi.billSaleCount}
              prev={showCompare ? kpiCompare.billSaleCount : null}
              betterWhen="higher"
            />
            <KpiCard
              title="Average per Bill"
              current={kpi.avgPerBill}
              prev={showCompare ? kpiCompare.avgPerBill : null}
              isMoney
              betterWhen="higher"
            />
            <KpiCard
              title="Daily Average Sales"
              current={kpi.dailyAvgSales}
              prev={showCompare ? kpiCompare.dailyAvgSales : null}
              isMoney
              betterWhen="higher"
            />

            {/* ✅ Discounts: แสดงเป็นบวก แต่ "ยิ่งน้อยยิ่งดี" (ลดลง = เขียว) */}
            <KpiCard
              title="Total Discounts End Bill"
              current={kpi.endBillDiscount}
              prev={showCompare ? kpiCompare.endBillDiscount : null}
              isMoney
              absValue
              betterWhen="lower"
            />

            {/* ✅ Days in range: แสดง Current + Compare */}
            <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-slate-500 text-xs font-medium mb-1">Days in range</div>
                  <div className="mt-2 text-xl md:text-2xl font-semibold text-slate-900 tabular-nums">
                    {fmtInt(kpi.dayCount)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 whitespace-normal break-words">
                    {appliedRangeLabel}
                  </div>

                </div>

                {showCompare ? (
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Compare</div>
                    <div className="mt-2 text-lg md:text-xl font-semibold text-slate-700 tabular-nums">
                      {fmtInt(compareDays)}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">days</div>
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

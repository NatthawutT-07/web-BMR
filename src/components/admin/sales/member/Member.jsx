// src/components/admin/member/Member.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchSalesMember } from "../../../../api/admin/sales";

/* =========================
   small utils
========================= */
const toLocalISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISO(d);
};
const fmtMoney = (n) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );
const fmtInt = (n) => new Intl.NumberFormat("th-TH").format(Number(n || 0));
const fmtDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Spinner = ({ className = "" }) => (
  <span
    className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
  />
);

const Pill = ({ children, tone = "slate" }) => {
  const toneMap = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
        toneMap[tone] || toneMap.slate
      }`}
    >
      {children}
    </span>
  );
};

/**
 * Card (ปกติ = ขาวทั้งหมด)
 * - จะมีสีเฉพาะเมื่อส่ง soft + tone มา (เราจะใช้แค่ "ยอดสุทธิรวม" บล็อกเดียว)
 */
const Card = ({ title, value, sub, tone = "emerald", soft = false, emphasize = false }) => {
  const softMap = {
    emerald: {
      bg: "bg-emerald-50/60",
      border: "border-emerald-200",
      ring: "ring-1 ring-emerald-200/60",
      title: "text-emerald-900/70",
      value: "text-emerald-900",
    },
    rose: {
      bg: "bg-rose-50/60",
      border: "border-rose-200",
      ring: "ring-1 ring-rose-200/60",
      title: "text-rose-900/70",
      value: "text-rose-900",
    },
  };

  const s = softMap[tone] || softMap.emerald;

  const baseCls = "rounded-xl border p-3 shadow-sm";
  const normalCls = "border-slate-200 bg-white";
  const softCls = `${s.bg} ${s.border} ${s.ring}`;

  return (
    <div className={`${baseCls} ${soft ? softCls : normalCls}`}>
      <div className={`text-xs ${soft ? s.title : "text-slate-500"}`}>{title}</div>
      <div
        className={`mt-1 font-semibold ${
          emphasize ? "text-xl" : "text-lg"
        } ${soft ? s.value : "text-slate-800"}`}
      >
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div> : null}
    </div>
  );
};

/* =========================
   Tier helpers
========================= */
const getTier = (netAmount) => {
  const net = Number(netAmount || 0);
  if (net < 0) return "NEG";
  if (net <= 9999) return "T1";
  if (net <= 29999) return "T2";
  return "T3";
};

const tierLabel = (tier) => {
  if (tier === "T1") return "Tier 1 (0–9,999)";
  if (tier === "T2") return "Tier 2 (10,000–29,999)";
  if (tier === "T3") return "Tier 3 (30,000+)";
  if (tier === "NEG") return "ติดลบ (<0)";
  return "ทั้งหมด";
};

const tierTone = (tier) => {
  if (tier === "T1") return "amber";
  if (tier === "T2") return "purple";
  if (tier === "T3") return "green";
  if (tier === "NEG") return "red";
  return "slate";
};

/* =========================
   Day filter helpers
========================= */
const DAY_FILTERS = [30, 60, 90, 120, 180];
const dayFilterLabel = (v) => (v === "ALL" ? "ทั้งหมด" : `≤ ${v} วัน`);

/* =========================
   Detail Modal (ESC close)
========================= */
const DetailModal = ({ open, onClose, data, loading }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const customer = data?.customer;
  const totals = data?.totals;
  const visits = data?.visits || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full sm:max-w-6xl max-h-[92vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">
              รายละเอียดลูกค้า: {customer?.customer_code || "-"} — {customer?.customer_name || "-"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ครั้งทั้งหมด {fmtInt(totals?.visits)} • ล่าสุดในช่วง {fmtDateTime(totals?.lastVisitInRange)}
              <span className="ml-2 text-slate-400">(กด Esc เพื่อปิด)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ปิด
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(92vh-70px)]">
          {loading ? (
            <div className="py-8 text-center text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Spinner />
                กำลังโหลดรายละเอียด...
              </span>
            </div>
          ) : (
            <>
              {/* ✅ ใน modal ไม่ใส่สีพิเศษ (ตามที่ขอ: สีแค่บล็อกเดียวบนหน้า main) */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                <Card title="จำนวนครั้ง" value={fmtInt(totals?.visits)} />
                <Card title="ยอดขาย" value={fmtMoney(totals?.salesAmount)} />
                <Card title="ยอดคืน" value={fmtMoney(totals?.returnAmount)} />
                <Card title="ยอดสุทธิ" value={fmtMoney(totals?.netAmount)} />
                <Card title="เฉลี่ย/ครั้ง (สุทธิ)" value={fmtMoney(totals?.avgNetPerVisit)} />
                <Card
                  title="ขาดการใช้บริการ (วัน)"
                  value={fmtInt(totals?.absentDays)}
                  sub="คำนวณถึงวันสิ้นสุดที่เลือก"
                />
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  รายการเข้าใช้บริการ ({fmtInt(visits.length)} รายการ)
                </div>

                <div className="overflow-auto">
                  <table className="min-w-[1100px] w-full text-sm">
                    <thead className="bg-white sticky top-0">
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="px-3 py-2 text-left">วันที่</th>
                        <th className="px-3 py-2 text-left">สาขา</th>
                        <th className="px-3 py-2 text-left">เอกสาร</th>
                        <th className="px-3 py-2 text-left">เลขที่บิล</th>
                        <th className="px-3 py-2 text-right">ยอด (สุทธิ)</th>
                        <th className="px-3 py-2 text-left">ช่องทาง</th>
                        <th className="px-3 py-2 text-left">การชำระ</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visits.map((v) => {
                        const amt = Number(v.amountNet || 0);
                        return (
                          <tr key={v.billId} className="border-b border-slate-100 hover:bg-slate-50/70">
                            <td className="px-3 py-2">{fmtDateTime(v.date)}</td>
                            <td className="px-3 py-2">
                              <div className="text-slate-800">{v.branch?.branch_name || "-"}</div>
                              <div className="text-xs text-slate-500">{v.branch?.branch_code || ""}</div>
                            </td>
                            <td className="px-3 py-2">
                              {v.isReturn ? <Pill tone="red">คืน</Pill> : <Pill tone="green">ขาย</Pill>}
                              <div className="text-xs text-slate-500 mt-0.5">{v.docType || "-"}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{v.billNumber || "-"}</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              <span className={amt < 0 ? "text-rose-700" : "text-emerald-700"}>{fmtMoney(amt)}</span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-slate-800">{v.channel?.channel_name || "-"}</div>
                              <div className="text-xs text-slate-500">{v.channel?.channel_code || ""}</div>
                            </td>
                            <td className="px-3 py-2">
                              {Array.isArray(v.payments) && v.payments.length ? (
                                <div className="space-y-1">
                                  {v.payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between gap-2">
                                      <Pill tone="blue">{p.method || "payment"}</Pill>
                                      <span className="text-slate-700">{fmtMoney(p.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {!visits.length ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                            ไม่มีข้อมูลในช่วงวันที่เลือก
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                * absentDays: ถ้ามีซื้อในช่วง → end - lastVisitInRange (ไม่รวมวันล่าสุด) | ถ้าไม่มีซื้อในช่วง → end - start + 1
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
   compute totals for KPI
========================= */
const computeScopeTotals = (rows) => {
  const customers = rows.length;
  const visits = rows.reduce((s, r) => s + Number(r.visits || 0), 0);
  const salesAmount = rows.reduce((s, r) => s + Number(r.salesAmount || 0), 0);
  const returnAmount = rows.reduce((s, r) => s + Number(r.returnAmount || 0), 0);
  const netAmount = rows.reduce((s, r) => s + Number(r.netAmount || 0), 0);
  const avgNetPerVisitAll = visits === 0 ? 0 : netAmount / visits;
  return { customers, visits, salesAmount, returnAmount, netAmount, avgNetPerVisitAll };
};

const Member = () => {
  const [start, setStart] = useState(getYesterdayISO());
  const [end, setEnd] = useState(getYesterdayISO());

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  // sortKey: "visits" | "return" | "net"
  const [sortKey, setSortKey] = useState("visits");

  // tierFilter: "ALL" | "T1" | "T2" | "T3" | "NEG"
  const [tierFilter, setTierFilter] = useState("ALL");

  // dayFilter: "ALL" | 30 | 60 | 90 | 120 | 180
  const [dayFilter, setDayFilter] = useState("ALL");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  // jump page input
  const [jumpPage, setJumpPage] = useState("");

  const rows = summary?.rows || [];
  const totalsAll = summary?.totals || null;

  const canLoad = useMemo(() => Boolean(start && end && start <= end), [start, end]);

  // base rows after dayFilter
  const dayBaseRows = useMemo(() => {
    if (dayFilter === "ALL") return rows;
    const limit = Number(dayFilter || 0);
    return rows.filter((r) => Number(r.absentDays || 0) <= limit);
  }, [rows, dayFilter]);

  // Tier counts under dayFilter
  const tierCounts = useMemo(() => {
    const counts = { ALL: dayBaseRows.length, T1: 0, T2: 0, T3: 0, NEG: 0 };
    for (const r of dayBaseRows) {
      const t = getTier(r.netAmount);
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [dayBaseRows]);

  // tier filtered
  const tierFilteredRows = useMemo(() => {
    if (tierFilter === "ALL") return dayBaseRows;
    return dayBaseRows.filter((r) => getTier(r.netAmount) === tierFilter);
  }, [dayBaseRows, tierFilter]);

  // KPI totals: if (ALL tier + ALL day) use backend totals (fast), else compute from filtered rows
  const scopeTotals = useMemo(() => {
    if (tierFilter === "ALL" && dayFilter === "ALL") {
      if (totalsAll) {
        const customers = totalsAll.customers ?? totalsAll.customersAll ?? rows.length;
        return {
          customers,
          visits: totalsAll.visits ?? 0,
          salesAmount: totalsAll.salesAmount ?? 0,
          returnAmount: totalsAll.returnAmount ?? 0,
          netAmount: totalsAll.netAmount ?? 0,
          avgNetPerVisitAll: totalsAll.avgNetPerVisitAll ?? 0,
        };
      }
      return computeScopeTotals(rows);
    }
    return computeScopeTotals(tierFilteredRows);
  }, [tierFilter, dayFilter, totalsAll, rows, tierFilteredRows]);

  const sortedRows = useMemo(() => {
    const arr = [...tierFilteredRows];

    const keyFn = (r) => {
      if (sortKey === "return") return Number(r.returnAmount || 0);
      if (sortKey === "net") return Number(r.netAmount || 0);
      return Number(r.visits || 0);
    };

    arr.sort((a, b) => {
      const av = keyFn(a);
      const bv = keyFn(b);
      if (bv !== av) return bv - av;
      return Number(b.netAmount || 0) - Number(a.netAmount || 0);
    });

    return arr;
  }, [tierFilteredRows, sortKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedRows.length / pageSize)), [sortedRows.length]);

  const pagedRows = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages);
    const startIdx = (p - 1) * pageSize;
    return sortedRows.slice(startIdx, startIdx + pageSize);
  }, [sortedRows, page, totalPages]);

  // sync page if out of range
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageInfoText = useMemo(() => {
    if (!sortedRows.length) return "0 รายการ";
    const p = Math.min(Math.max(1, page), totalPages);
    const from = (p - 1) * pageSize + 1;
    const to = Math.min(p * pageSize, sortedRows.length);
    return `${from}-${to} จาก ${fmtInt(sortedRows.length)} รายการ`;
  }, [sortedRows.length, page, totalPages]);

  const loadSummary = async () => {
    if (!canLoad) return;
    setError("");
    setLoading(true);
    try {
      const data = await fetchSalesMember({ start, end });
      setSummary(data);
      setPage(1);
      setTierFilter("ALL");
      setDayFilter("ALL");
      setSortKey("visits");
      setJumpPage("");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerDetail = async (customerId) => {
    setError("");
    setDetailLoading(true);
    setOpenDetail(true);
    setDetail(null);
    try {
      const data = await fetchSalesMember({ start, end, customerId });
      setDetail(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "โหลดรายละเอียดไม่สำเร็จ");
      setOpenDetail(false);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const TierButton = ({ value }) => {
    const active = tierFilter === value;
    return (
      <button
        onClick={() => {
          setTierFilter(value);
          setPage(1);
          setJumpPage("");
        }}
        className={`px-3 py-1.5 text-xs border-l border-slate-200 ${
          active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
        }`}
        title={tierLabel(value)}
      >
        {value === "NEG" ? "ติดลบ" : value}
        <span className={`ml-2 ${active ? "text-white/80" : "text-slate-400"}`}>{fmtInt(tierCounts[value] || 0)}</span>
      </button>
    );
  };

  const DayButton = ({ value }) => {
    const active = dayFilter === value;
    return (
      <button
        onClick={() => {
          setDayFilter(value);
          setPage(1);
          setJumpPage("");
        }}
        className={`px-3 py-1.5 text-xs border-l border-slate-200 ${
          active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
        }`}
        title={dayFilterLabel(value)}
      >
        {value === "ALL" ? "ทั้งหมด" : `≤${value}d`}
      </button>
    );
  };

  // ใส่เป็น sub เล็กๆ เฉพาะเวลามี filter (ไม่รก)
  const filterSummaryText = useMemo(() => {
    const parts = [];
    if (dayFilter !== "ALL") parts.push(`วัน: ≤${dayFilter}`);
    if (tierFilter !== "ALL") parts.push(`Tier: ${tierFilter}`);
    return parts.join(" • ");
  }, [tierFilter, dayFilter]);

  const applyJumpPage = () => {
    const n = Number(jumpPage);
    if (!Number.isFinite(n)) return;
    const target = Math.min(Math.max(1, Math.floor(n)), totalPages);
    setPage(target);
  };

  const netTone = Number(scopeTotals.netAmount || 0) < 0 ? "rose" : "emerald";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-base font-semibold text-slate-800">Member</div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col">
                <label className="text-[11px] text-slate-500">เริ่ม</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] text-slate-500">จบ</label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                />
              </div>

              <button
                onClick={loadSummary}
                disabled={!canLoad || loading}
                className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="border-white/40 border-t-white" />
                    กำลังโหลด
                  </span>
                ) : (
                  "แสดงข้อมูล"
                )}
              </button>
            </div>
          </div>

          {!canLoad ? <div className="mt-2 text-xs text-rose-600">* วันที่เริ่มต้องไม่มากกว่าวันที่จบ</div> : null}
          {error ? <div className="mt-2 text-xs text-rose-700">{error}</div> : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* ✅ KPI: สีแค่บล็อกเดียว (ยอดสุทธิรวม) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Card title="จำนวนลูกค้า" value={fmtInt(scopeTotals.customers)} sub={filterSummaryText} />
          <Card title="จำนวนบิลรวม" value={fmtInt(scopeTotals.visits)} sub={filterSummaryText} />
          <Card title="ยอดขายรวม" value={fmtMoney(scopeTotals.salesAmount)} sub={filterSummaryText} />
          <Card title="ยอดคืนรวม" value={fmtMoney(scopeTotals.returnAmount)} sub={filterSummaryText} />

          {/* ✅ สีเฉพาะบล็อกนี้ */}
          <Card
            title="ยอดสุทธิรวม"
            value={fmtMoney(scopeTotals.netAmount)}
            sub={filterSummaryText}
            tone={netTone}
            soft
            emphasize
          />

          <Card title="เฉลี่ยสุทธิ/ครั้ง" value={fmtMoney(scopeTotals.avgNetPerVisitAll)} sub={filterSummaryText} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-2 p-3 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-800">ตารางลูกค้า</div>
                <span className="text-xs text-slate-500">{pageInfoText}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs text-slate-500">เรียงตาม:</div>
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => {
                      setSortKey("visits");
                      setPage(1);
                      setJumpPage("");
                    }}
                    className={`px-3 py-1.5 text-xs ${
                      sortKey === "visits" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    จำนวนบิล
                  </button>
                  <button
                    onClick={() => {
                      setSortKey("return");
                      setPage(1);
                      setJumpPage("");
                    }}
                    className={`px-3 py-1.5 text-xs border-l border-slate-200 ${
                      sortKey === "return" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ยอดคืนมากที่สุด
                  </button>
                  <button
                    onClick={() => {
                      setSortKey("net");
                      setPage(1);
                      setJumpPage("");
                    }}
                    className={`px-3 py-1.5 text-xs border-l border-slate-200 ${
                      sortKey === "net" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ยอดสุทธิ
                  </button>
                </div>

                <Pill tone="slate">{pageSize} รายการ/หน้า</Pill>
              </div>
            </div>

            {/* Day Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-500">ขาดการใช้บริการไม่เกิน:</div>
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                <DayButton value="ALL" />
                {DAY_FILTERS.map((d) => (
                  <DayButton key={d} value={d} />
                ))}
              </div>

              <div className="text-xs text-slate-500">
                กำลังดู: <span className="font-semibold text-slate-700">{dayFilterLabel(dayFilter)}</span>
              </div>
            </div>

            {/* Tier Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-500">Tier:</div>
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => {
                    setTierFilter("ALL");
                    setPage(1);
                    setJumpPage("");
                  }}
                  className={`px-3 py-1.5 text-xs ${
                    tierFilter === "ALL" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ทั้งหมด{" "}
                  <span className={`ml-2 ${tierFilter === "ALL" ? "text-white/80" : "text-slate-400"}`}>
                    {fmtInt(tierCounts.ALL || 0)}
                  </span>
                </button>
                <TierButton value="T1" />
                <TierButton value="T2" />
                <TierButton value="T3" />
                <TierButton value="NEG" />
              </div>

              <div className="text-xs text-slate-500">
                กำลังดู: <span className="font-semibold text-slate-700">{tierLabel(tierFilter)}</span>
              </div>
            </div>
          </div>

          {/* compact table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] table-fixed">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-[11px] text-slate-600 border-b border-slate-200">
                  <th className="px-2 py-2 text-left w-[72px]">Tier</th>
                  <th className="px-2 py-2 text-left w-[120px]">รหัสลูกค้า</th>
                  <th className="px-2 py-2 text-left">ชื่อลูกค้า</th>
                  <th className="px-2 py-2 text-right w-[84px]">ครั้ง</th>
                  <th className="px-2 py-2 text-left w-[140px]">ล่าสุด</th>
                  <th className="px-2 py-2 text-right w-[72px]">ขาด</th>
                  <th className="px-2 py-2 text-right w-[110px]">ยอดคืน</th>
                  <th className="px-2 py-2 text-right w-[120px]">สุทธิ</th>
                  <th className="px-2 py-2 text-right w-[120px]">เฉลี่ย/ครั้ง</th>
                  <th className="px-2 py-2 text-left w-[96px]">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        กำลังโหลดข้อมูล...
                      </span>
                    </td>
                  </tr>
                ) : pagedRows.length ? (
                  pagedRows.map((r) => {
                    const net = Number(r.netAmount || 0);
                    const t = getTier(net);

                    return (
                      <tr
                        key={r.customerId}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => openCustomerDetail(r.customerId)}
                      >
                        <td className="px-2 py-2">
                          <Pill tone={tierTone(t)}>{t}</Pill>
                        </td>

                        <td className="px-2 py-2 font-mono text-[12px] truncate">{r.customer_code || "-"}</td>

                        <td className="px-2 py-2">
                          <div className="text-slate-800 truncate">{r.customer_name || "-"}</div>
                          <div className="text-[10px] text-slate-500 truncate">ID: {r.customerId}</div>
                        </td>

                        <td className="px-2 py-2 text-right font-semibold text-slate-800 tabular-nums">
                          {fmtInt(r.visits)}
                        </td>

                        <td className="px-2 py-2 text-slate-700 truncate">{fmtDateTime(r.lastVisitInRange)}</td>

                        <td className="px-2 py-2 text-right tabular-nums">
                          <span className="font-semibold text-slate-800">{fmtInt(r.absentDays)}</span>
                        </td>

                        <td className="px-2 py-2 text-right text-slate-700 tabular-nums">{fmtMoney(r.returnAmount)}</td>

                        <td className="px-2 py-2 text-right font-semibold tabular-nums">
                          <span className={net < 0 ? "text-rose-700" : "text-emerald-700"}>{fmtMoney(net)}</span>
                        </td>

                        <td className="px-2 py-2 text-right text-slate-700 tabular-nums">{fmtMoney(r.avgNetPerVisit)}</td>

                        <td className="px-2 py-2">
                          <button
                            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomerDetail(r.customerId);
                            }}
                          >
                            รายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                      ไม่มีข้อมูลตามฟิลเตอร์ที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination + Jump to page */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border-t border-slate-200 bg-white">
            <div className="text-xs text-slate-500">{pageInfoText}</div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {"<"}
              </button>

              <div className="text-sm text-slate-700">
                หน้า <span className="font-semibold">{fmtInt(page)}</span> / {fmtInt(totalPages)}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {">"}
              </button>

              <div className="ml-1 inline-flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyJumpPage();
                  }}
                  className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  placeholder={`${page}`}
                />
                <button
                  onClick={applyJumpPage}
                  className="h-9 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DetailModal open={openDetail} onClose={() => setOpenDetail(false)} data={detail} loading={detailLoading} />
    </div>
  );
};

export default Member;

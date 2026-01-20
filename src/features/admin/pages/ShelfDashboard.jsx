import React, { useEffect, useMemo, useState } from "react";
import { getShelfDashboardSummary, getShelfDashboardShelfSales } from "../../../api/admin/template";
import {
  BarChart2, Calendar, Search, RefreshCw, Store,
  Layers, Package, CircleDollarSign, TrendingUp,
  ArrowUpRight, ChevronDown, ChevronUp, Loader2,
  AlertCircle
} from "lucide-react";

const fmtNumber = (value) => Number(value || 0).toLocaleString();
const fmtMoney2 = (value) => {
  const n = Number(value || 0);
  if (n === 0) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ShelfDashboard = () => {
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [shelfSalesByBranch, setShelfSalesByBranch] = useState({});
  const [shelfSalesLoading, setShelfSalesLoading] = useState({});
  const [shelfSalesError, setShelfSalesError] = useState({});

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getShelfDashboardSummary();
      setRows(Array.isArray(res?.rows) ? res.rows : []);
      setRange(res?.range || null);
    } catch (err) {
      setError(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const loadShelfSales = async (branchCode) => {
    const code = String(branchCode || "").trim();
    if (!code) return;
    if (shelfSalesLoading[code]) return;
    if (shelfSalesByBranch[code]) return;

    setShelfSalesLoading((prev) => ({ ...prev, [code]: true }));
    setShelfSalesError((prev) => ({ ...prev, [code]: "" }));

    try {
      const res = await getShelfDashboardShelfSales(code);
      const shelves = Array.isArray(res?.shelves) ? res.shelves : [];
      setShelfSalesByBranch((prev) => ({ ...prev, [code]: shelves }));
    } catch (err) {
      setShelfSalesError((prev) => ({
        ...prev,
        [code]: err?.message || "โหลดข้อมูล shelf ไม่สำเร็จ",
      }));
    } finally {
      setShelfSalesLoading((prev) => ({ ...prev, [code]: false }));
    }
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.branches += 1;
        acc.shelves += Number(r.shelfCount || 0);
        acc.products += Number(r.productCount || 0);
        acc.stockCost += Number(r.stockCost || 0);
        acc.salesTotal += Number(r.salesTotal || 0);
        acc.withdrawValue += Number(r.withdrawValue || 0);
        return acc;
      },
      {
        branches: 0,
        shelves: 0,
        products: 0,
        stockCost: 0,
        salesTotal: 0,
        withdrawValue: 0,
      }
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows.filter((r) => Number(r.shelfCount || 0) > 0);
    if (!q) return base;
    return base.filter((r) => {
      const code = String(r.branchCode || "").toLowerCase();
      const name = String(r.branchName || "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [rows, query]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BarChart2 className="text-blue-600" />
              Shelf Dashboard
            </h1>
            {range?.start && range?.end ? (
              <div className="flex items-center gap-2 mt-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg w-fit shadow-sm">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600 font-medium">
                  ข้อมูลยอดขาย: <span className="text-slate-900">{range.start} - {range.end}</span>
                </span>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mt-1">ภาพรวมประสิทธิภาพ Shelf รายสาขา</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาสาขา..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={loadSummary}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            icon={<Store size={20} />}
            label="สาขาทั้งหมด"
            value={fmtNumber(filteredRows.length)}
            color="blue"
          />
          <SummaryCard
            icon={<Layers size={20} />}
            label="Shelves"
            value={fmtNumber(totals.shelves)}
            color="indigo"
          />
          <SummaryCard
            icon={<Package size={20} />}
            label="สินค้า (SKU)"
            value={fmtNumber(totals.products)}
            color="purple"
          />
          <SummaryCard
            icon={<CircleDollarSign size={20} />}
            label="Stock Cost"
            value={fmtMoney2(totals.stockCost)}
            color="amber"
          />
          <SummaryCard
            icon={<TrendingUp size={20} />}
            label="ยอดขาย (90D)"
            value={fmtMoney2(totals.salesTotal)}
            color="emerald"
          />
          <SummaryCard
            icon={<ArrowUpRight size={20} />}
            label="Withdraw"
            value={fmtMoney2(totals.withdrawValue)}
            color="rose"
          />
        </div>

        {/* Branch Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Store size={16} className="text-slate-400" />
              สรุปข้อมูลรายสาขา
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600 border border-slate-200">
              {filteredRows.length} สาขา
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span>กำลังโหลดข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-rose-50 m-4 rounded-xl border border-rose-100">
              <AlertCircle size={32} className="mx-auto text-rose-500 mb-2" />
              <div className="text-rose-600 font-medium">{error}</div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Search size={48} className="mx-auto text-slate-200 mb-3" />
              <div>ไม่พบข้อมูลสาขาที่ค้นหา</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <th className="px-6 py-3.5">สาขา</th>
                    <th className="px-4 py-3.5 text-right">Shelves</th>
                    <th className="px-4 py-3.5 text-right">สินค้า</th>
                    <th className="px-4 py-3.5 text-right">มูลค่า Stock</th>
                    <th className="px-4 py-3.5 text-right">ยอดขาย (90D)</th>
                    <th className="px-4 py-3.5 text-right">Withdraw</th>
                    <th className="px-4 py-3.5 text-center w-28">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => {
                    const isOpen = expandedBranch === row.branchCode;
                    const shelfSalesRaw = shelfSalesByBranch[row.branchCode] || [];
                    const shelfSales = shelfSalesRaw.filter(
                      (s) => Number(s.skuCount || 0) > 0
                    );
                    const isShelfLoading = !!shelfSalesLoading[row.branchCode];
                    const shelfError = shelfSalesError[row.branchCode];

                    return (
                      <React.Fragment key={row.branchCode}>
                        <tr className={`group transition-colors ${isOpen ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all'}`}>
                                <Store size={20} />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {row.branchCode}
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                  {row.branchName || "-"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600">
                            {fmtNumber(row.shelfCount)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600">
                            {fmtNumber(row.productCount)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-amber-600 tabular-nums">
                            {fmtMoney2(row.stockCost)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-emerald-600 tabular-nums">
                            {fmtMoney2(row.salesTotal)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-rose-600 tabular-nums">
                            {fmtMoney2(row.withdrawValue)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBranch(() => {
                                  const next = isOpen ? null : row.branchCode;
                                  if (next) loadShelfSales(next);
                                  return next;
                                })
                              }
                              className={`
                                p-1.5 rounded-lg transition-all
                                ${isOpen
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                }
                              `}
                              title={isOpen ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                            >
                              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-slate-50/50 shadow-inner">
                            <td colSpan={7} className="px-6 py-6">
                              <div className="ml-4 pl-6 border-l-2 border-blue-200">
                                {isShelfLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                    กำลังโหลดข้อมูล Shelf...
                                  </div>
                                ) : shelfError ? (
                                  <div className="flex items-center gap-2 text-sm text-rose-600 py-4">
                                    <AlertCircle size={16} /> {shelfError}
                                  </div>
                                ) : shelfSales.length === 0 ? (
                                  <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                                    <Package size={16} /> ไม่พบข้อมูลยอดขายราย Shelf
                                  </div>
                                ) : (
                                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {shelfSales.map((shelf) => (
                                      <div
                                        key={shelf.shelfCode}
                                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow group/card"
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center gap-2 font-semibold text-slate-800">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                              <Layers size={14} />
                                            </div>
                                            {shelf.shelfCode}
                                          </div>
                                          <div className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                            {fmtNumber(shelf.skuCount)} SKU
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">ยอดขาย</span>
                                            <span className="font-semibold text-emerald-600">{fmtMoney2(shelf.salesTotal)}</span>
                                          </div>

                                          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-50">
                                            <span className="text-slate-500">Stock</span>
                                            <span className="font-medium text-amber-600">{fmtMoney2(shelf.stockCost)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, color }) => {
  // Color maps
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };

  const activeColor = colors[color] || colors.blue;

  return (
    <div className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between h-full`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`p-2 rounded-lg ${activeColor} bg-opacity-20`}>
          {React.cloneElement(icon, { size: 20, className: activeColor.split(" ")[1] })}
        </span>
      </div>
      <div>
        <div className={`text-2xl font-bold ${activeColor.split(" ")[1]}`}>{value}</div>
        <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
      </div>
    </div>
  );
};

export default ShelfDashboard;

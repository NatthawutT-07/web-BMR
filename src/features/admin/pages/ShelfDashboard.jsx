import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getShelfDashboardSummary, getShelfDashboardShelfSales } from "../../../api/admin/template";
import useDashboardShelfStore from "../../../store/dashboard_shelf_store";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Store,
  TrendingDown,
  TrendingUp,
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

const formatThaiDate = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
};

const SummaryCard = ({ label, value, icon, tone = "blue", helper }) => {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  }[tone] || "bg-blue-50 text-blue-700 border-blue-100";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums text-slate-900">{value}</p>
          {helper && <p className="mt-0.5 truncate text-[11px] text-slate-400">{helper}</p>}
        </div>
        <span className={`rounded-lg border p-2 ${toneClass}`}>
          {React.createElement(icon, { size: 17 })}
        </span>
      </div>
    </div>
  );
};

const EmptyState = ({ title, desc, icon = Package }) => (
  <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
    <div className="rounded-full bg-slate-100 p-3 text-slate-400">
      {React.createElement(icon, { size: 26 })}
    </div>
    <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
    {desc && <p className="mt-1 text-xs text-slate-500">{desc}</p>}
  </div>
);

const ShelfDashboard = () => {
  const {
    rows,
    setRows,
    range,
    setRange,
    query,
    setQuery,
    expandedBranch,
    setExpandedBranch,
    shelfSalesByBranch,
    setShelfSalesByBranch,
    overallUniqueSkus,
    setOverallUniqueSkus,
    missingSalesDates,
    setMissingSalesDates,
    hasLoadedInitialData,
    setHasLoadedInitialData,
  } = useDashboardShelfStore();

  const [loading, setLoading] = useState(!hasLoadedInitialData);
  const [error, setError] = useState("");
  const [shelfSalesLoading, setShelfSalesLoading] = useState({});
  const [shelfSalesError, setShelfSalesError] = useState({});

  const loadSummary = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasLoadedInitialData) return;

    setLoading(true);
    setError("");
    try {
      const res = await getShelfDashboardSummary();
      setRows(Array.isArray(res?.rows) ? res.rows : []);
      setRange(res?.range || null);
      setOverallUniqueSkus(res?.overallUniqueSkus || 0);
      setMissingSalesDates(res?.missingSalesDates || []);
      setHasLoadedInitialData(true);
    } catch (err) {
      setError(err?.message || "Load summary data failed");
    } finally {
      setLoading(false);
    }
  }, [
    hasLoadedInitialData,
    setHasLoadedInitialData,
    setMissingSalesDates,
    setOverallUniqueSkus,
    setRange,
    setRows,
  ]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadShelfSales = async (branchCode) => {
    const code = String(branchCode || "").trim();
    if (!code || shelfSalesLoading[code] || shelfSalesByBranch[code]) return;

    setShelfSalesLoading((prev) => ({ ...prev, [code]: true }));
    setShelfSalesError((prev) => ({ ...prev, [code]: "" }));

    try {
      const res = await getShelfDashboardShelfSales(code);
      const shelves = Array.isArray(res?.shelves) ? res.shelves : [];
      setShelfSalesByBranch((prev) => ({ ...prev, [code]: shelves }));
    } catch (err) {
      setShelfSalesError((prev) => ({
        ...prev,
        [code]: err?.message || "Load shelf data failed",
      }));
    } finally {
      setShelfSalesLoading((prev) => ({ ...prev, [code]: false }));
    }
  };

  const rowsWithShelves = useMemo(
    () => rows.filter((row) => Number(row.shelfCount || 0) > 0),
    [rows]
  );

  const totals = useMemo(() => {
    return rowsWithShelves.reduce(
      (acc, row) => {
        acc.branches += 1;
        acc.shelves += Number(row.shelfCount || 0);
        acc.products += Number(row.productCount || 0);
        acc.stockCost += Number(row.stockCost || 0);
        acc.salesTotal += Number(row.salesTotal || 0);
        acc.withdrawValue += Number(row.withdrawValue || 0);
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
  }, [rowsWithShelves]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rowsWithShelves;

    return rowsWithShelves.filter((row) => {
      const code = String(row.branch_code || "").toLowerCase();
      const name = String(row.branchName || "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [query, rowsWithShelves]);

  const dateRangeText = range?.start && range?.end ? `${range.start} - ${range.end}` : "-";

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Layers size={14} />
                Shelf Dashboard
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span>Date: {dateRangeText}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search branch..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={() => loadSummary(true)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
                title="Refresh data"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {!loading && missingSalesDates.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800">Missing Sales Data</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {missingSalesDates.map((dateStr) => (
                      <span key={dateStr} className="rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        {formatThaiDate(dateStr)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Branches" value={fmtNumber(totals.branches)} icon={Store} tone="slate" />
          <SummaryCard label="Shelves" value={fmtNumber(totals.shelves)} icon={Layers} tone="blue" />
          <SummaryCard label="Unique SKU" value={fmtNumber(overallUniqueSkus)} icon={Package} tone="blue" helper={`Rows: ${fmtNumber(totals.products)}`} />
          <SummaryCard label="Stock Value" value={fmtMoney2(totals.stockCost)} icon={CircleDollarSign} tone="amber" />
          {/* <SummaryCard label="Sales" value={fmtMoney2(totals.salesTotal)} icon={TrendingUp} tone="emerald" /> */}
          {/* <SummaryCard label="Withdraw" value={fmtMoney2(totals.withdrawValue)} icon={TrendingDown} tone="rose" /> */}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-500">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-rose-600">{error}</div>
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No Data Found" desc="Try changing your search criteria or refresh the data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-2.5">Branch</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5 text-right">Shelf</th>
                    <th className="px-4 py-2.5 text-right">SKU</th>
                    <th className="px-4 py-2.5 text-right">Stock</th>
                    <th className="px-4 py-2.5 text-right">Sales</th>
                    <th className="px-4 py-2.5 text-right">Withdraw</th>
                    <th className="w-20 px-4 py-2.5 text-center">Shelf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => {
                    const branchCode = row.branch_code;
                    const isOpen = expandedBranch === branchCode;
                    const shelfSalesRaw = shelfSalesByBranch[branchCode] || [];
                    const shelfSales = shelfSalesRaw.filter((shelf) => Number(shelf.skuCount || 0) > 0);
                    const isShelfLoading = !!shelfSalesLoading[branchCode];
                    const shelfError = shelfSalesError[branchCode];

                    return (
                      <React.Fragment key={branchCode}>
                        <tr className={`transition-colors hover:bg-slate-50 ${isOpen ? "bg-blue-50/40" : ""}`}>
                          <td className="px-4 py-2 font-mono font-semibold text-slate-800">{branchCode}</td>
                          <td className="max-w-[240px] px-4 py-2">
                            <div className="truncate font-medium text-slate-700" title={row.branchName || "-"}>
                              {row.branchName || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700">{fmtNumber(row.shelfCount)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700">{fmtNumber(row.productCount)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-amber-700">{fmtMoney2(row.stockCost)}</td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-emerald-700">{fmtMoney2(row.salesTotal)}</td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-rose-600">{fmtMoney2(row.withdrawValue)}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const next = isOpen ? null : branchCode;
                                setExpandedBranch(next);
                                if (next) loadShelfSales(next);
                              }}
                              className={`rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200 ${isOpen ? "bg-blue-100 text-blue-700" : ""}`}
                              title={isOpen ? "Hide shelf" : "Show shelf"}
                            >
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <td colSpan={8} className="p-0">
                              <div className="border-t border-slate-200/70 bg-slate-100/50 p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <Layers size={14} />
                                    Shelf detail - {branchCode}
                                  </h3>
                                  <span className="text-[11px] text-slate-500">{fmtNumber(shelfSales.length)} shelves</span>
                                </div>

                                {isShelfLoading ? (
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                                    {Array.from({ length: 5 }, (_, index) => (
                                      <div key={index} className="animate-pulse rounded-lg border border-slate-200 bg-white p-2">
                                        <div className="mb-2 h-4 w-20 rounded bg-slate-200" />
                                        <div className="space-y-1.5">
                                          <div className="h-3 rounded bg-slate-200" />
                                          <div className="h-3 rounded bg-slate-200" />
                                          <div className="h-3 rounded bg-slate-200" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : shelfError ? (
                                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{shelfError}</div>
                                ) : shelfSales.length === 0 ? (
                                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">ไม่พบข้อมูล SKU ในแต่ละ Shelf</div>
                                ) : (
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                                    {shelfSales.map((shelf) => (
                                      <div key={shelf.shelf_code} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                                        <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                          <span className="truncate text-xs font-semibold text-slate-900">{shelf.shelf_code}</span>
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{fmtNumber(shelf.skuCount)} SKU</span>
                                        </div>
                                        <div className="space-y-1 text-[11px]">
                                          <div className="flex justify-between gap-2">
                                            <span className="text-slate-500">Sales</span>
                                            <span className="font-semibold tabular-nums text-emerald-700">{fmtMoney2(shelf.salesTotal)}</span>
                                          </div>
                                          <div className="flex justify-between gap-2">
                                            <span className="text-slate-500">Withdraw</span>
                                            <span className="font-semibold tabular-nums text-rose-600">{fmtMoney2(shelf.withdrawValue)}</span>
                                          </div>
                                          <div className="flex justify-between gap-2">
                                            <span className="text-slate-500">Stock</span>
                                            <span className="font-semibold tabular-nums text-amber-700">{fmtMoney2(shelf.stockCost)}</span>
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

export default ShelfDashboard;

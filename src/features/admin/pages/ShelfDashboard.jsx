import React, { useEffect, useMemo, useState } from "react";
import { getShelfDashboardSummary, getShelfDashboardShelfSales } from "../../../api/admin/template";
import useDashboardShelfStore from "../../../store/dashboard_shelf_store";
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
  // Global state from Zustand store
  const {
    rows, setRows,
    range, setRange,
    query, setQuery,
    expandedBranch, setExpandedBranch,
    shelfSalesByBranch, setShelfSalesByBranch,
    overallUniqueSkus, setOverallUniqueSkus,
    missingSalesDates, setMissingSalesDates,
    hasLoadedInitialData, setHasLoadedInitialData
  } = useDashboardShelfStore();

  // Local state for loading and errors
  const [loading, setLoading] = useState(!hasLoadedInitialData);
  const [error, setError] = useState("");
  const [shelfSalesLoading, setShelfSalesLoading] = useState({});
  const [shelfSalesError, setShelfSalesError] = useState({});

  const loadSummary = async (forceRefresh = false) => {
    // Skip if already loaded and not forcing a refresh
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* Header Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Dashboard Shelf
              </h1>
              {range?.start && range?.end && (
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  Date: {range.start} - {range.end}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadSummary(true)}
                disabled={loading}
                className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          
          {/* Missing Sales Dates Warning */}
          {!loading && missingSalesDates.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">วันที่ไม่พบข้อมูลยอดขายในระบบ</h3>
                <p className="text-xs text-amber-700 mt-1">
                  กรุณาตรวจสอบและอัปโหลดไฟล์ยอดขายสำหรับวันที่ต่อไปนี้:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingSalesDates.map((dateStr) => {
                    const d = new Date(dateStr);
                    const formatted = !isNaN(d) 
                      ? d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                      : dateStr;
                    return (
                      <span key={dateStr} className="px-2 py-1 bg-white border border-amber-300 text-amber-800 text-xs rounded-md shadow-sm">
                        {formatted}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <SummaryCard label="จำนวน Shelf" value={fmtNumber(totals.shelves)} color="blue" />
          <SummaryCard label="จำนวน SKU (ไม่ซ้ำ)" value={fmtNumber(overallUniqueSkus)} color="blue" />
          <SummaryCard label="มูลค่า Stock" value={fmtMoney2(totals.stockCost)} color="yellow" />
        </div>

        {/* Branch Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              {error}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              ไม่พบข้อมูลที่ค้นหา
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">รหัสสาขา</th>
                    <th className="px-4 py-3 font-medium">ชื่อสาขา</th>
                    <th className="px-4 py-3 font-medium text-right">จำนวน Shelf</th>
                    <th className="px-4 py-3 font-medium text-right">จำนวน SKU</th>
                    <th className="px-4 py-3 font-medium text-right">มูลค่า Stock</th>
                    <th className="px-4 py-3 font-medium text-right">ยอดขาย</th>
                    <th className="px-4 py-3 font-medium text-right">ตัดจ่าย</th>
                    <th className="px-4 py-3 font-medium text-center w-20">ดู Shelf</th>
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
                        <tr className={`hover:bg-slate-50 transition-colors ${isOpen ? 'bg-slate-50' : ''}`}>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {row.branchCode}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.branchName || "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {fmtNumber(row.shelfCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {fmtNumber(row.productCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-yellow-700">
                            {fmtMoney2(row.stockCost)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-700 font-medium">
                            {fmtMoney2(row.salesTotal)}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {fmtMoney2(row.withdrawValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const next = isOpen ? null : row.branchCode;
                                setExpandedBranch(next);
                                if (next) loadShelfSales(next);
                              }}
                              className={`p-1 rounded text-slate-500 hover:bg-slate-200 transition-colors ${isOpen ? 'bg-slate-200' : ''}`}
                            >
                              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <td colSpan={8} className="p-0">
                              <div className="p-4 sm:p-6 bg-slate-100/50 border-t border-slate-200/50 shadow-inner">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <Layers size={16} /> ข้อมูลราย Shelf - {row.branchCode}
                                </h3>

                                {isShelfLoading ? (
                                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
                                    {[1, 2, 3, 4].map((i) => (
                                      <div key={i} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                                          <div className="h-4 bg-slate-200 rounded w-16"></div>
                                          <div className="h-4 bg-slate-200 rounded w-12"></div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <div className="h-3 bg-slate-200 rounded w-10"></div>
                                            <div className="h-3 bg-slate-200 rounded w-16"></div>
                                          </div>
                                          <div className="flex justify-between">
                                            <div className="h-3 bg-slate-200 rounded w-10"></div>
                                            <div className="h-3 bg-slate-200 rounded w-16"></div>
                                          </div>
                                          <div className="flex justify-between">
                                            <div className="h-3 bg-slate-200 rounded w-10"></div>
                                            <div className="h-3 bg-slate-200 rounded w-16"></div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : shelfError ? (
                                  <div className="text-sm text-red-500 py-2">
                                    {shelfError}
                                  </div>
                                ) : shelfSales.length === 0 ? (
                                  <div className="text-sm text-slate-500 py-2">
                                    ไม่พบข้อมูล SKU ในแต่ละ Shelf
                                  </div>
                                ) : (
                                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {shelfSales.map((shelf) => (
                                      <div
                                        key={shelf.shelfCode}
                                        className="bg-white p-3 rounded border border-slate-200 shadow-sm"
                                      >
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                                          <div className="font-semibold text-slate-800 text-sm">
                                            {shelf.shelfCode}
                                          </div>
                                          <div className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            {fmtNumber(shelf.skuCount)} SKU
                                          </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-slate-500">ยอดขาย</span>
                                            <span className="font-medium text-green-700">{fmtMoney2(shelf.salesTotal)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-500">ตัดจ่าย</span>
                                            <span className="font-medium text-red-600">{fmtMoney2(shelf.withdrawValue)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-500">Stock</span>
                                            <span className="font-medium text-yellow-700">{fmtMoney2(shelf.stockCost)}</span>
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

const SummaryCard = ({ label, value, color }) => {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
  };

  const activeColor = colors[color] || colors.blue;

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center min-h-[80px]">
      <div className="text-xs text-slate-500 mb-1 truncate">{label}</div>
      <div className={`text-lg sm:text-xl font-bold ${activeColor} break-words`}>{value}</div>
    </div>
  );
};

export default ShelfDashboard;

import React, { useEffect, useMemo, useState } from "react";
import { getShelfDashboardSummary, getShelfDashboardShelfSales } from "../../../api/admin/template";

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
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Shelf Dashboard
          </h1>
          {range?.start && range?.end && (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <span>📅</span>
              ข้อมูลยอดขาย: {range.start} - {range.end}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาสาขา..."
              className="w-full sm:w-64 rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <span>🔄</span> รีเฟรช
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          icon="🏪"
          label="Branches"
          value={fmtNumber(filteredRows.length)}
          color="bg-blue-50 border-blue-200"
          valueColor="text-blue-700"
        />
        <SummaryCard
          icon="🗂️"
          label="Shelves"
          value={fmtNumber(totals.shelves)}
          color="bg-indigo-50 border-indigo-200"
          valueColor="text-indigo-700"
        />
        <SummaryCard
          icon="📦"
          label="Products"
          value={fmtNumber(totals.products)}
          color="bg-purple-50 border-purple-200"
          valueColor="text-purple-700"
        />
        <SummaryCard
          icon="💰"
          label="Stock Cost"
          value={fmtMoney2(totals.stockCost)}
          color="bg-amber-50 border-amber-200"
          valueColor="text-amber-700"
        />
        <SummaryCard
          icon="📈"
          label="Sales Total"
          value={fmtMoney2(totals.salesTotal)}
          color="bg-emerald-50 border-emerald-200"
          valueColor="text-emerald-700"
        />
        <SummaryCard
          icon="📤"
          label="Withdraw"
          value={fmtMoney2(totals.withdrawValue)}
          color="bg-rose-50 border-rose-200"
          valueColor="text-rose-600"
        />
      </div>

      {/* Branch Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span>🏬</span> สรุปรายสาขา
          </h2>
          <span className="text-xs text-slate-500">
            แสดง {filteredRows.length} สาขา
          </span>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <div className="text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
          </div>
        )}
        {!loading && error && (
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}
        {!loading && !error && filteredRows.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm text-slate-500">ไม่พบข้อมูลสาขา</div>
          </div>
        )}

        {!loading && !error && filteredRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">สาขา</th>
                  <th className="px-4 py-3 text-right font-semibold">Shelves</th>
                  <th className="px-4 py-3 text-right font-semibold">สินค้า</th>
                  <th className="px-4 py-3 text-right font-semibold">มูลค่า Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">ยอดขาย (90D)</th>
                  <th className="px-4 py-3 text-right font-semibold">Withdraw</th>
                  <th className="px-4 py-3 text-center font-semibold w-32">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => {
                  const isOpen = expandedBranch === row.branchCode;
                  const shelfSalesRaw = shelfSalesByBranch[row.branchCode] || [];
                  const shelfSales = shelfSalesRaw.filter(
                    (s) => Number(s.skuCount || 0) > 0
                  );
                  const isShelfLoading = !!shelfSalesLoading[row.branchCode];
                  const shelfError = shelfSalesError[row.branchCode];

                  return (
                    <React.Fragment key={row.branchCode}>
                      <tr className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏪</span>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {row.branchCode}
                              </div>
                              <div className="text-xs text-slate-500">
                                {row.branchName || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {fmtNumber(row.shelfCount)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {fmtNumber(row.productCount)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-amber-700">
                          {fmtMoney2(row.stockCost)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-700">
                          {fmtMoney2(row.salesTotal)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-rose-600">
                          {fmtMoney2(row.withdrawValue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBranch((prev) => {
                                const next = isOpen ? null : row.branchCode;
                                if (next) loadShelfSales(next);
                                return next;
                              })
                            }
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${isOpen
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                              }`}
                          >
                            {isOpen ? "ซ่อน ▲" : "ดู Shelf ▼"}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4 bg-blue-50/50">
                            {isShelfLoading ? (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="animate-spin">⏳</span>
                                กำลังโหลดข้อมูล...
                              </div>
                            ) : shelfError ? (
                              <div className="text-sm text-red-600 flex items-center gap-2">
                                <span>❌</span> {shelfError}
                              </div>
                            ) : shelfSales.length === 0 ? (
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <span>📭</span> ไม่พบข้อมูลยอดขายราย Shelf
                              </div>
                            ) : (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {shelfSales.map((shelf) => (
                                  <div
                                    key={shelf.shelfCode}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                      <span className="text-blue-500">🗂️</span>
                                      {shelf.shelfCode}
                                    </div>
                                    <div className="text-xs text-slate-500 mb-2 truncate" title={shelf.shelfName}>
                                      {shelf.shelfName || "-"}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div className="bg-emerald-50 px-2 py-1.5 rounded">
                                        <div className="text-slate-500">ยอดขาย</div>
                                        <div className="font-semibold text-emerald-700">
                                          {fmtMoney2(shelf.salesTotal)}
                                        </div>
                                      </div>
                                      <div className="bg-amber-50 px-2 py-1.5 rounded">
                                        <div className="text-slate-500">Stock</div>
                                        <div className="font-semibold text-amber-700">
                                          {fmtMoney2(shelf.stockCost)}
                                        </div>
                                      </div>
                                      <div className="bg-slate-100 px-2 py-1.5 rounded">
                                        <div className="text-slate-500">SKU</div>
                                        <div className="font-semibold text-slate-700">
                                          {fmtNumber(shelf.skuCount)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
  );
};

const SummaryCard = ({ icon, label, value, color = "bg-white border-slate-200", valueColor = "text-slate-800" }) => {
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${color}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div className="text-xs text-slate-600 font-medium">{label}</div>
      </div>
      <div className={`mt-2 text-xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

export default ShelfDashboard;


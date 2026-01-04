import React, { useEffect, useMemo, useState } from "react";
import { getShelfDashboardSummary } from "../../../api/admin/template";

const fmtNumber = (value) => Number(value || 0).toLocaleString();

const ShelfDashboard = () => {
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [expandedBranch, setExpandedBranch] = useState(null);

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
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Shelf Dashboard
          </h1>
          {range?.start && range?.end && (
            <p className="text-xs text-slate-500 mt-1">
              Sales period: {range.start} - {range.end}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา branch code / name"
            className="w-full sm:w-64 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={loadSummary}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Branches" value={fmtNumber(totals.branches)} />
        <SummaryCard label="Shelves" value={fmtNumber(totals.shelves)} />
        <SummaryCard label="Products" value={fmtNumber(totals.products)} />
        <SummaryCard label="Stock Cost" value={fmtNumber(totals.stockCost)} />
        <SummaryCard label="Sales (90D)" value={fmtNumber(totals.salesTotal)} />
        <SummaryCard label="Withdraw" value={fmtNumber(totals.withdrawValue)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Branch Summary
          </h2>
        </div>

        {loading && (
          <div className="p-6 text-sm text-slate-500">กำลังโหลด...</div>
        )}
        {!loading && error && (
          <div className="p-6 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && filteredRows.length === 0 && (
          <div className="p-6 text-sm text-slate-500">ไม่พบข้อมูล</div>
        )}

        {!loading && !error && filteredRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Branch</th>
                  <th className="px-4 py-3 text-right">Shelves</th>
                  <th className="px-4 py-3 text-right">Products</th>
                  <th className="px-4 py-3 text-right">Stock Cost</th>
                  <th className="px-4 py-3 text-right">Sales (90D)</th>
                  <th className="px-4 py-3 text-right">Withdraw</th>
                  <th className="px-4 py-3 text-right">Shelf Sales (90D)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const isOpen = expandedBranch === row.branchCode;
                  const shelfSales = Array.isArray(row.shelfSales)
                    ? row.shelfSales.filter((s) => Number(s.skuCount || 0) > 0)
                    : [];

                  return (
                    <React.Fragment key={row.branchCode}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {row.branchCode} : {row.branchName || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {fmtNumber(row.shelfCount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {fmtNumber(row.productCount)}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-700">
                          {fmtNumber(row.stockCost)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          {fmtNumber(row.salesTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600">
                          {fmtNumber(row.withdrawValue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBranch(isOpen ? null : row.branchCode)
                            }
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            {isOpen
                              ? "ซ่อนรายละเอียด"
                              : `ดู ${shelfSales.length} shelf`}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-slate-50">
                            {shelfSales.length === 0 ? (
                              <div className="text-xs text-slate-500">
                                ไม่พบข้อมูลยอดขายราย shelf
                              </div>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {shelfSales.map((shelf) => (
                                  <div
                                    key={shelf.shelfCode}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                                  >
                                    <div className="font-semibold text-slate-700">
                                      Shelf {shelf.shelfCode} : {shelf.shelfName}
                                    </div>
                                    <div className="mt-1 grid grid-cols-3 gap-2 text-[11px]">
                                      <div>
                                        <div className="text-slate-400">Sales</div>
                                        <div className="text-emerald-700">
                                          {fmtNumber(shelf.salesTotal)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-slate-400">Stock</div>
                                        <div className="text-amber-700">
                                          {fmtNumber(shelf.stockCost)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-slate-400">SKU</div>
                                        <div className="text-slate-700">
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

const SummaryCard = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
};

export default ShelfDashboard;

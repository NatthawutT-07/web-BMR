import React, { useMemo, useState, useEffect } from "react";

const fmt = (num) => {
  if (num == null || isNaN(num)) return "-";
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ProductTable = React.memo(({ title, data, loading }) => {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("net"); // net | quantity | discount
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [pageSize, setPageSize] = useState(15);

  // เตรียม rows
  const baseRows = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((p) => {
      const saleQty = Number(p.sale_quantity) || 0;
      const returnQty = Number(p.return_quantity) || 0;
      const net = Number(p.total_net_sales) || 0;
      const discount = Number(p.total_discount) || 0;

      return {
        code: p.product_code ? p.product_code.toString().padStart(5, "0") : "-",
        name: `${p.product_brand ?? ""} : ${p.product_name ?? ""}`.trim(),
        quantity: saleQty + returnQty,
        net,
        discount,
      };
    });
  }, [data]);

  // search + sort
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();

    let filtered = baseRows;
    if (query) {
      filtered = baseRows.filter((r) => {
        const code = String(r.code || "").toLowerCase();
        const name = String(r.name || "").toLowerCase();
        return code.includes(query) || name.includes(query);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;

    const sorted = filtered.slice().sort((a, b) => {
      const va =
        sortKey === "quantity" ? a.quantity : sortKey === "discount" ? a.discount : a.net;
      const vb =
        sortKey === "quantity" ? b.quantity : sortKey === "discount" ? b.discount : b.net;
      return (va - vb) * dir;
    });

    return sorted.map((row, idx) => ({ ...row, id: idx + 1 }));
  }, [baseRows, q, sortKey, sortDir]);

  // pagination
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = rows.slice(startIndex, endIndex);

  // reset page when query / sort / pageSize changes
  useEffect(() => setPage(1), [q, sortKey, sortDir, pageSize]);

  if (!loading && (!data || data.length === 0)) return null;

  return (
    <section className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-slate-200 mt-4">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          {title && (
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              {title}
            </h2>
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            ค้นหา + จัดเรียงได้ • {loading ? "กำลังโหลด..." : "พร้อมใช้งาน"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product / code..."
            className="w-full md:w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm"
          >
            <option value="net">Sort: Net sales</option>
            <option value="quantity">Sort: Quantity</option>
            <option value="discount">Sort: Discount</option>
          </select>

          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            {sortDir === "asc" ? "Asc ↑" : "Desc ↓"}
          </button>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm"
          >
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
          </select>
        </div>
      </div>

      {/* Meta */}
      <div className="px-4 py-3 text-[11px] text-slate-600 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          Items: <span className="font-semibold text-slate-900">{totalItems.toLocaleString()}</span>
          <span className="ml-2">
            | Page{" "}
            <span className="font-semibold text-slate-900">{currentPage}</span> /{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </span>
        </div>
        {q.trim() && (
          <div className="px-2 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-800">
            Filter: “{q.trim()}”
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-emerald-50 sticky top-0 z-10 text-[11px] md:text-xs text-slate-700">
            <tr>
              <th className="border-b border-emerald-100 px-3 py-2.5 text-right font-semibold">#</th>
              <th className="border-b border-emerald-100 px-3 py-2.5 text-left font-semibold">Code</th>
              <th className="border-b border-emerald-100 px-3 py-2.5 text-left font-semibold">Product</th>
              <th className="border-b border-emerald-100 px-3 py-2.5 text-right font-semibold">Quantity</th>
              <th className="border-b border-emerald-100 px-3 py-2.5 text-right font-semibold">Net sales</th>
              <th className="border-b border-emerald-100 px-3 py-2.5 text-right font-semibold">Discount</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row) => {
              const zebra = row.id % 2 === 1 ? "bg-white" : "bg-slate-50/80";
              return (
                <tr
                  key={row.id}
                  className={`${zebra} border-b border-slate-100 last:border-b-0 hover:bg-emerald-50/60 transition-colors`}
                >
                  <td className="px-3 py-2.5 text-slate-500 text-right">{row.id}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-800 font-medium">
                    {row.code}
                  </td>
                  <td className="px-3 py-2.5 text-slate-900">
                    <div className="font-medium truncate max-w-[240px] md:max-w-md">
                      {row.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {row.quantity.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">
                    {fmt(row.net)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-600">
                    {fmt(row.discount)}
                  </td>
                </tr>
              );
            })}

            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  ไม่พบข้อมูลที่ตรงกับคำค้นหา
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-100">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </section>
  );
});

const PaginationControls = ({ currentPage, totalPages, onChange }) => {
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handlePrev = () => onChange((p) => Math.max(1, p - 1));
  const handleNext = () => onChange((p) => Math.min(totalPages, p + 1));

  const applyInputPage = () => {
    let num = parseInt(inputValue, 10);
    if (isNaN(num)) {
      setInputValue(String(currentPage));
      return;
    }
    if (num < 1) num = 1;
    if (num > totalPages) num = totalPages;
    onChange(num);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] md:text-xs text-slate-600">
      <div>
        Page{" "}
        <span className="font-semibold text-slate-900">{currentPage}</span>{" "}
        / <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className={`px-3 py-1.5 rounded-xl border ${
            currentPage <= 1
              ? "border-slate-200 text-slate-300 cursor-default"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Back
        </button>

        <div className="flex items-center gap-1">
          <span>Go</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyInputPage();
              }
            }}
            onBlur={applyInputPage}
            className="w-16 px-2 py-1.5 border border-slate-300 rounded-xl text-center text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 rounded-xl border ${
            currentPage >= totalPages
              ? "border-slate-200 text-slate-300 cursor-default"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductTable;

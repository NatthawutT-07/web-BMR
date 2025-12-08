import React, { useMemo, useState } from "react";

const fmt = (num) => {
  if (num == null || isNaN(num)) return "-";
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ProductTable = React.memo(({ title, data }) => {
  if (!data || data.length === 0) return null;

  const [page, setPage] = useState(1);
  const pageSize = 15;

  // เตรียม rows + เรียงตาม net sales (total_net_sales) มาก → น้อย
  const rows = useMemo(() => {
    const mapped = data.map((p) => {
      const saleQty = Number(p.sale_quantity) || 0;
      const returnQty = Number(p.return_quantity) || 0;
      const net = Number(p.total_net_sales) || 0;
      const discount = Number(p.total_discount) || 0;

      return {
        code: p.product_code
          ? p.product_code.toString().padStart(5, "0")
          : "-",
        name: `${p.product_brand ?? ""} : ${p.product_name ?? ""}`,
        quantity: saleQty + returnQty,
        net,
        discount,
      };
    });

    // เรียงตาม net มาก → น้อย แล้วค่อยเซ็ต id ใหม่ให้เริ่ม 1,2,3...
    const sorted = mapped.sort((a, b) => b.net - a.net);

    return sorted.map((row, idx) => ({
      ...row,
      id: idx + 1, // ลำดับใหม่หลังเรียง
    }));
  }, [data]);

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const pageRows = rows.slice(startIndex, endIndex);

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 mt-4">
      {/* Header */}
      <div className="px-3 py-3 md:px-4 md:py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          {title && (
            <h2 className="text-sm md:text-base font-semibold text-slate-800">
              {title}
            </h2>
          )}
          <p className="text-[11px] text-slate-500">
            Sorted by{" "}
            <span className="font-semibold">Net sales (high → low)</span>
          </p>
        </div>
        <div className="text-[11px] text-slate-500 text-right">
          Items:{" "}
          <span className="font-semibold text-slate-700">
            {totalItems.toLocaleString()}
          </span>
          <span className="ml-2">
            | Page{" "}
            <span className="font-semibold text-slate-700">
              {currentPage}
            </span>{" "}
            /{" "}
            <span className="font-semibold text-slate-700">
              {totalPages}
            </span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {/* 🔥 เอา max-h + overflow-y-auto ออก เพื่อให้เห็นครบ 15 แถวโดยไม่ต้องสกอลในกรอบ */}
        <div className="text-xs md:text-sm">
          <table className="min-w-full">
            <thead className="bg-emerald-50 sticky top-0 z-10 text-[11px] md:text-xs text-slate-700">
              <tr>
                <th className="border-b border-emerald-100 px-2 md:px-3 py-2.5 text-left font-semibold">
                  #
                </th>
                <th className="border-b border-emerald-100 px-2 md:px-3 py-2.5 text-left font-semibold">
                  Code
                </th>
                <th className="border-b border-emerald-100 px-2 md:px-3 py-2.5 text-left font-semibold">
                  Product
                </th>
                <th className="border-b border-emerald-100 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Quantity
                </th>
                <th className="border-b border-emerald-100 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Net sales
                </th>
                <th className="border-b border-emerald-100 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Discount
                </th>
              </tr>
            </thead>

            <tbody>
              {pageRows.map((row) => {
                const zebra =
                  row.id % 2 === 1 ? "bg-white" : "bg-slate-50/80";

                return (
                  <tr
                    key={row.id}
                    className={`${zebra} border-b border-slate-100 last:border-b-0 hover:bg-emerald-50/70 transition-colors`}
                  >
                    <td className="px-2 md:px-3 py-2.5 text-slate-500 text-right">
                      {row.id}
                    </td>
                    <td className="px-2 md:px-3 py-2.5 whitespace-nowrap text-slate-700">
                      {row.code}
                    </td>
                    <td className="px-2 md:px-3 py-2.5 text-slate-800">
                      <div className="font-medium truncate max-w-[220px] md:max-w-xs">
                        {row.name}
                      </div>
                    </td>
                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.quantity.toLocaleString()}
                    </td>
                    <td className="px-2 md:px-3 py-2.5 text-right font-semibold text-emerald-800">
                      {fmt(row.net)}
                    </td>
                    <td className="px-2 md:px-3 py-2.5 text-right text-red-600">
                      {fmt(row.discount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-3 py-2.5 md:px-4 md:py-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] md:text-xs text-slate-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {totalItems === 0 ? 0 : startIndex + 1}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-slate-800">
            {Math.min(endIndex, totalItems)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800">
            {totalItems.toLocaleString()}
          </span>{" "}
          items
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </section>
  );
});

// แยกปุ่มเปลี่ยนหน้าออกมาให้โค้ดอ่านง่าย
const PaginationControls = ({ currentPage, totalPages, onChange }) => {
  const handlePrev = () => onChange((p) => Math.max(1, p - 1));
  const handleNext = () => onChange((p) => Math.min(totalPages, p + 1));

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className={`px-2.5 py-1 rounded-lg border ${
          currentPage <= 1
            ? "border-slate-200 text-slate-300 cursor-default"
            : "border-slate-300 text-slate-700 hover:bg-slate-100"
        }`}
      >
        Prev
      </button>
      <span>
        Page{" "}
        <span className="font-semibold text-slate-800">{currentPage}</span> /{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </span>
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className={`px-2.5 py-1 rounded-lg border ${
          currentPage >= totalPages
            ? "border-slate-200 text-slate-300 cursor-default"
            : "border-slate-300 text-slate-700 hover:bg-slate-100"
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default ProductTable;

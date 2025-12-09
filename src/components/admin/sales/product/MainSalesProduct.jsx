import React, { useState, useMemo } from "react";
import {
  searchSalesProduct,
  fetchSalesProductDetail,
} from "../../../../api/admin/sales";
import ProductSalesMatrix from "./second/ProductSalesMatrix";

const PAGE_SIZE = 15;

// =================== Helpers ===================
const toLocalISO = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// "2025-12-06" -> "06/12/2025"
const formatDisplayDate = (isoStr) => {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("-");
  if (!y || !m || !d) return isoStr;
  return `${d}/${m}/${y}`;
};

// default = 1/1/2024 - เมื่อวาน
const getDefaultAllRange = () => {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  const start = new Date(2024, 0, 1, 0, 0, 0, 0);

  if (end < start) {
    return {
      start: toLocalISO(start),
      end: toLocalISO(start),
    };
  }

  return {
    start: toLocalISO(start),
    end: toLocalISO(end),
  };
};

// =================== Product Date Filter (ขนาดเล็กลง) ===================
const ProductDateFilter = ({
  start,
  end,
  setStart,
  setEnd,
  onRangeChange, // แจ้ง parent เมื่อช่วงวันที่เปลี่ยน
}) => {
  // min = 1/1/2024
  const minDate = "2024-01-01";

  // max = เมื่อวาน
  const now = new Date();
  const endBase = new Date(now);
  endBase.setDate(endBase.getDate() - 1);
  const maxDate = toLocalISO(endBase);

  const clampDate = (dateStr) => {
    if (!dateStr) return dateStr;
    const d = new Date(dateStr);
    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;

    if (min && d < min) return minDate;
    if (max && d > max) return maxDate;
    return toLocalISO(d);
  };

  const notifyRangeChange = (newStart, newEnd) => {
    if (typeof onRangeChange === "function") {
      onRangeChange(newStart, newEnd);
    }
  };

  const handleChangeStart = (value) => {
    const s = clampDate(value);
    setStart(s);
    notifyRangeChange(s, end);
  };

  const handleChangeEnd = (value) => {
    const e = clampDate(value);
    setEnd(e);
    notifyRangeChange(start, e);
  };

  const applyPreset = (type) => {
    const now = new Date();
    const endBase = new Date(now);
    // end = วันนี้ - 1 เสมอ
    endBase.setDate(endBase.getDate() - 1);

    let startDate = new Date(endBase);
    let endDate = new Date(endBase);

    if (type === "7d") {
      startDate.setDate(endBase.getDate() - 6); // 7 วัน
    } else if (type === "30d") {
      startDate.setDate(endBase.getDate() - 29); // 30 วัน
    } else if (type === "60d") {
      startDate.setDate(endBase.getDate() - 59); // 60 วัน
    } else if (type === "90d") {
      startDate.setDate(endBase.getDate() - 89); // 90 วัน
    } else if (type === "month") {
      // เดือนนี้ = 1 ของเดือนปัจจุบัน ถึง เมื่อวาน
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === "year") {
      // ปีนี้ = 1 ม.ค. ปีปัจจุบัน ถึง เมื่อวาน
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (type === "all") {
      // ทั้งหมด = 1/1/2024 - เมื่อวาน
      startDate = new Date(2024, 0, 1);
    }

    const startStr = clampDate(toLocalISO(startDate));
    const endStr = clampDate(toLocalISO(endDate));

    setStart(startStr);
    setEnd(endStr);
    notifyRangeChange(startStr, endStr);
  };

  return (
    <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 px-3 py-2 md:px-4 md:py-3">
      <div className="space-y-2">
        {/* แถว: Start / End (compact) */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] font-medium text-slate-600 mb-0.5">
              Start Date
            </label>
            <input
              type="date"
              value={start}
              min={minDate}
              max={maxDate}
              onChange={(e) => handleChangeStart(e.target.value)}
              className="border border-slate-200 px-2 py-1.5 rounded-lg w-full shadow-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/70 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-medium text-slate-600 mb-0.5">
              End Date
            </label>
            <input
              type="date"
              value={end}
              min={minDate}
              max={maxDate}
              onChange={(e) => handleChangeEnd(e.target.value)}
              className="border border-slate-200 px-2 py-1.5 rounded-lg w-full shadow-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/70 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* แสดงช่วงวันที่แบบ dd/mm/yyyy (เล็กลง) */}
        <div className="text-[10px] text-slate-500">
          ช่วงวันที่ที่ใช้ในการดูยอดขาย:{" "}
          <span className="font-medium text-slate-700">
            {formatDisplayDate(start)} - {formatDisplayDate(end)}
          </span>
        </div>

        {/* Quick Range (compact) */}
        <div className="flex flex-wrap gap-1.5 text-[10px] mt-0.5">
          <span className="self-center text-[10px] text-slate-500 mr-1">
            Quick Range :
          </span>

          <button
            type="button"
            onClick={() => applyPreset("7d")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            Last 7 Days
          </button>

          <button
            type="button"
            onClick={() => applyPreset("30d")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            Last 30 Days
          </button>

          <button
            type="button"
            onClick={() => applyPreset("60d")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            Last 60 Days
          </button>

          <button
            type="button"
            onClick={() => applyPreset("90d")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            Last 90 Days
          </button>

          <button
            type="button"
            onClick={() => applyPreset("month")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            This Month
          </button>

          <button
            type="button"
            onClick={() => applyPreset("year")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            This Year
          </button>

          <button
            type="button"
            onClick={() => applyPreset("all")}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition"
          >
            All
          </button>
        </div>

        <div className="text-[10px] text-slate-400">
          หลังจากเลือกสินค้าแล้ว ระบบจะใช้ช่วงวันที่นี้ในการคำนวณให้อัตโนมัติ
        </div>
      </div>
    </div>
  );
};

// =================== MAIN COMPONENT ===================
const MainSalesProduct = () => {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // วันที่ default = 1/1/2024 - เมื่อวาน
  const defaultRange = getDefaultAllRange();
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    const kw = keyword.trim();
    if (!kw) {
      setResults([]);
      setTotal(0);
      setPage(1);
      return;
    }

    try {
      setSearching(true);
      setSearchError("");
      setPage(1);

      const res = await searchSalesProduct(kw);
      setResults(Array.isArray(res.items) ? res.items : []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("searchSalesProduct error:", err);
      setSearchError("ไม่สามารถค้นหาสินค้าได้");
    } finally {
      setSearching(false);
    }
  };

  const loadProductDetail = async (product, s, e) => {
    if (!product) return;
    try {
      setDetailLoading(true);
      setDetailError("");
      setDetail(null);

      const payload = await fetchSalesProductDetail({
        productId: product.id,
        start: s,
        end: e,
      });

      setDetail(payload);
    } catch (err) {
      console.error("fetchSalesProductDetail error:", err);
      setDetailError("โหลดข้อมูลยอดขายสินค้าไม่สำเร็จ");
    } finally {
      setDetailLoading(false);
    }
  };

  // เมื่อเปลี่ยนช่วงวันที่ ถ้ามีสินค้าเลือกอยู่แล้ว → reload detail ให้อัตโนมัติ
  const handleRangeChange = async (s, e) => {
    if (!selectedProduct) return;
    await loadProductDetail(selectedProduct, s, e);
  };

  const handleSelectProduct = async (item) => {
    setSelectedProduct(item);
    await loadProductDetail(item, start, end);
  };

  const pagedResults = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return results.slice(startIndex, startIndex + PAGE_SIZE);
  }, [results, page]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  const handleChangePage = (dir) => {
    setPage((prev) => {
      const next = prev + dir;
      if (next < 1) return 1;
      if (next > totalPages) return totalPages;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/80 px-3 py-4 md:px-6 md:py-2 text-sm">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* LEFT: Date filter + Search + list */}
          <section className="lg:col-span-4 space-y-4">
            {/* Date Filter อยู่บนสุด */}
            <ProductDateFilter
              start={start}
              end={end}
              setStart={setStart}
              setEnd={setEnd}
              onRangeChange={handleRangeChange}
            />

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Search product
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    ค้นหาจากชื่อ, แบรนด์ หรือ code
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(e);
                    }
                  }}
                  placeholder="Type product name / brand / code..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              {searchError && (
                <p className="text-[11px] text-red-500 mt-1">
                  {searchError}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>
                  Results:{" "}
                  <span className="font-semibold text-slate-800">
                    {total}
                  </span>
                </span>
                {results.length > 0 && (
                  <span>
                    Page{" "}
                    <span className="font-semibold text-slate-800">
                      {page}
                    </span>{" "}
                    / {totalPages}
                  </span>
                )}
              </div>
            </form>

            {/* Result list + pagination */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 flex flex-col h-[420px]">
              <div className="flex items-center justify_between mb-2">
                <h3 className="text-xs font-semibold text-slate-700">
                  Product list
                </h3>
                {results.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleChangePage(-1)}
                      disabled={page <= 1}
                      className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangePage(1)}
                      disabled={page >= totalPages}
                      className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 text-xs">
                {pagedResults.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    ไม่มีผลลัพธ์ กรุณาค้นหาสินค้า
                  </p>
                )}

                {pagedResults.map((item) => {
                  const isActive =
                    selectedProduct && selectedProduct.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectProduct(item)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                        isActive
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="font-semibold text-slate-800 truncate">
                            {item.product_name || "-"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.product_brand && (
                              <span>{item.product_brand} • </span>
                            )}
                            <span className="font-mono">
                              {item.product_code}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RIGHT: Detail + matrix */}
          <section className="lg:col-span-8 space-y-4">
            {/* Matrix */}
            {detail && !detailLoading && <ProductSalesMatrix detail={detail} />}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MainSalesProduct;

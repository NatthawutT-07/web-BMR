// src/pages/admin/StockPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getStockData } from "../../api/admin/download";

const formatMoney = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatInt = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString();
};

const StockPage = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [openBranches, setOpenBranches] = useState({}); // branchCode -> boolean

  // ====== Filter state (global) ======
  const [searchText, setSearchText] = useState(""); // ค้นหาชื่อสินค้า / แบรนด์ / code
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");

  // ====== Sort state per branch (ใน card table ของแต่ละสาขา) ======
  // branchCode -> { key: "qty" | "cost", direction: "asc" | "desc" }
  const [branchSort, setBranchSort] = useState({});

  // โหลดข้อมูล stock จาก backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await getStockData(); // ไม่ส่ง branchCode = ทุกสาขา
        setRawData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Load stock page error:", err);
        setErrorMsg("โหลดข้อมูล stock ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // จัดกลุ่มตาม branchCode + คำนวณทุน (ตัวเต็ม ยังไม่ apply filter)
  const branchSummary = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    const map = {};

    rawData.forEach((row) => {
      const branchCode = row.branchCode || "-";
      const qty = Number(row.quantity ?? 0) || 0;
      const unitCost = Number(row.purchasePriceExcVAT ?? 0) || 0;
      const stockCost = qty * unitCost;

      if (!map[branchCode]) {
        map[branchCode] = {
          branchCode,
          items: [],
          totalCost: 0,
          totalQty: 0,
        };
      }

      map[branchCode].items.push({
        ...row,
        stockCost,
      });

      map[branchCode].totalCost += stockCost;
      map[branchCode].totalQty += qty;
    });

    const list = Object.values(map);

    // sort ตาม branchCode
    list.sort((a, b) => {
      if (a.branchCode < b.branchCode) return -1;
      if (a.branchCode > b.branchCode) return 1;
      return 0;
    });

    return list;
  }, [rawData]);

  // ====== Apply filter + sort ต่อสาขา ======
  const filteredBranchSummary = useMemo(() => {
    if (!branchSummary.length) return [];

    const s = searchText.trim().toLowerCase();

    const qtyMin = minQty !== "" ? Number(minQty) : null;
    const qtyMax = maxQty !== "" ? Number(maxQty) : null;
    const costMin = minCost !== "" ? Number(minCost) : null;
    const costMax = maxCost !== "" ? Number(maxCost) : null;

    return branchSummary
      .map((branch) => {
        const filteredItems = branch.items.filter((item) => {
          // search text
          if (s) {
            const codeStr = item.codeProduct
              ? String(item.codeProduct).padStart(5, "0")
              : "";
            const name = (item.nameProduct || "").toLowerCase();
            const brand = (item.nameBrand || "").toLowerCase();

            const matchText =
              codeStr.includes(s) ||
              name.includes(s) ||
              brand.includes(s);

            if (!matchText) return false;
          }

          const qty = Number(item.quantity ?? 0) || 0;
          const cost = Number(item.stockCost ?? 0) || 0;

          // Qty filter
          if (qtyMin !== null && !Number.isNaN(qtyMin) && qty < qtyMin) {
            return false;
          }
          if (qtyMax !== null && !Number.isNaN(qtyMax) && qty > qtyMax) {
            return false;
          }

          // Cost filter
          if (costMin !== null && !Number.isNaN(costMin) && cost < costMin) {
            return false;
          }
          if (costMax !== null && !Number.isNaN(costMax) && cost > costMax) {
            return false;
          }

          return true;
        });

        // ====== apply sort per branch ======
        const sortCfg = branchSort[branch.branchCode];
        let itemsForBranch = filteredItems;

        if (sortCfg && sortCfg.key) {
          const dir = sortCfg.direction === "asc" ? 1 : -1;

          itemsForBranch = [...filteredItems].sort((a, b) => {
            if (sortCfg.key === "qty") {
              const qa = Number(a.quantity ?? 0) || 0;
              const qb = Number(b.quantity ?? 0) || 0;
              if (qa === qb) return 0;
              return qa < qb ? -1 * dir : 1 * dir;
            }
            if (sortCfg.key === "cost") {
              const ca = Number(a.stockCost ?? 0) || 0;
              const cb = Number(b.stockCost ?? 0) || 0;
              if (ca === cb) return 0;
              return ca < cb ? -1 * dir : 1 * dir;
            }
            return 0;
          });
        }

        // คำนวณ total ใหม่หลัง filter + sort
        let totalCost = 0;
        let totalQty = 0;
        itemsForBranch.forEach((i) => {
          totalCost += Number(i.stockCost ?? 0) || 0;
          totalQty += Number(i.quantity ?? 0) || 0;
        });

        return {
          ...branch,
          items: itemsForBranch,
          totalCost,
          totalQty,
        };
      })
      .filter((b) => b.items.length > 0); // ซ่อนสาขาที่ไม่เหลือ item หลัง filter
  }, [branchSummary, searchText, minQty, maxQty, minCost, maxCost, branchSort]);

  // ทุนรวมทุกสาขา (หลัง filter)
  const grandTotalCost = useMemo(
    () => filteredBranchSummary.reduce((sum, b) => sum + b.totalCost, 0),
    [filteredBranchSummary]
  );

  const toggleBranch = (branchCode) => {
    setOpenBranches((prev) => ({
      ...prev,
      [branchCode]: !prev[branchCode],
    }));
  };

  // toggle sort (per branch + per key)
  const toggleSort = (branchCode, key) => {
    setBranchSort((prev) => {
      const current = prev[branchCode];

      // ถ้าเปลี่ยน key ใหม่ → เริ่มที่ desc (มาก -> น้อย)
      if (!current || current.key !== key) {
        return {
          ...prev,
          [branchCode]: { key, direction: "desc" },
        };
      }

      // ถ้า key เดิม → toggle asc/desc
      const nextDir = current.direction === "desc" ? "asc" : "desc";
      return {
        ...prev,
        [branchCode]: { key, direction: nextDir },
      };
    });
  };

  const clearFilters = () => {
    setSearchText("");
    setMinQty("");
    setMaxQty("");
    setMinCost("");
    setMaxCost("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8 py-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-800">
              Stock overview
            </h1>
            
          </div>

          <div className="bg-slate-100 rounded-lg px-3 py-2 text-right">
            <div className="text-[11px] text-slate-500">Total stock cost</div>
            <div className="text-base sm:text-lg font-semibold text-emerald-700">
              ฿ {formatMoney(grandTotalCost)}
            </div>
            <div className="text-[11px] text-slate-400">
              {filteredBranchSummary.length} branches
              {filteredBranchSummary.length !== branchSummary.length &&
                branchSummary.length > 0 && (
                  <> (from {branchSummary.length})</>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4">
          {loading && (
            <div className="text-center text-sm text-slate-500">
              กำลังโหลดข้อมูล stock...
            </div>
          )}

          {errorMsg && (
            <div className="text-center text-sm text-red-500">{errorMsg}</div>
          )}

          {!loading && !errorMsg && branchSummary.length === 0 && (
            <div className="text-center text-sm text-slate-500">
              ไม่มีข้อมูล stock
            </div>
          )}

          {/* Filter panel */}
          {branchSummary.length > 0 && (
            <section className="bg-white border rounded-lg shadow-sm px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                {/* Left side: filters */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
                  {/* Search */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Search (code / name / brand)
                    </label>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder=""
                      className="px-3 py-1.5 border rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Qty min/max */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Qty range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={minQty}
                        onChange={(e) => setMinQty(e.target.value)}
                        placeholder="Min"
                        className="w-1/2 px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <input
                        type="number"
                        min="0"
                        value={maxQty}
                        onChange={(e) => setMaxQty(e.target.value)}
                        placeholder="Max"
                        className="w-1/2 px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Cost min/max */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Stock cost range (฿)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={minCost}
                        onChange={(e) => setMinCost(e.target.value)}
                        placeholder="Min"
                        className="w-1/2 px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <input
                        type="number"
                        min="0"
                        value={maxCost}
                        onChange={(e) => setMaxCost(e.target.value)}
                        placeholder="Max"
                        className="w-1/2 px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Helper text / small tip */}
                  {/* <div className="flex flex-col justify-between gap-1 text-[11px] text-slate-500">
                    <div>
                      • เวลาพิมพ์ตัวเลข ไม่ต้องใส่ ,  
                      <br />
                      • ถ้าไม่กรอก = ไม่กรองเงื่อนไขนั้น
                    </div>
                  </div> */}
                </div>

                {/* Right side: clear button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ข้อความกรณี filter แล้วไม่เจอข้อมูล */}
          {!loading &&
            !errorMsg &&
            branchSummary.length > 0 &&
            filteredBranchSummary.length === 0 && (
              <div className="text-center text-sm text-slate-500">
                ไม่พบข้อมูลตามเงื่อนไขที่เลือก ลองปรับ filter ใหม่
              </div>
            )}

          {/* การ์ดต่อสาขา (ชุดหลัง filter + sort) */}
          {filteredBranchSummary.map((branch) => {
            const isOpen = !!openBranches[branch.branchCode];
            const sortCfg = branchSort[branch.branchCode];

            return (
              <div
                key={branch.branchCode}
                className="border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Card header (กดเพื่อเปิด/ปิด) */}
                <button
                  type="button"
                  onClick={() => toggleBranch(branch.branchCode)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-t-xl hover:bg-slate-50"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800">
                      Branch: {branch.branchCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {branch.items.length} items • Qty:{" "}
                      {formatInt(branch.totalQty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">
                        Stock cost
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-emerald-700">
                        ฿ {formatMoney(branch.totalCost)}
                      </div>
                    </div>

                    <div
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Card body: render table เมื่อเปิดเท่านั้น เพื่อลดโหลด DOM */}
                {isOpen && (
                  <div className="px-3 pb-3">
                    <div className="mt-2 overflow-x-auto max-h-[480px] border rounded-lg">
                      <table className="min-w-[900px] w-full border-collapse text-xs text-slate-700">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="border px-2 py-1 text-center">#</th>
                            <th className="border px-2 py-1 text-center">
                              Code
                            </th>
                            <th className="border px-2 py-1 text-left">
                              Name
                            </th>
                            <th className="border px-2 py-1 text-left">
                              Brand
                            </th>

                            {/* Qty header: clickable sort */}
                            <th className="border px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSort(branch.branchCode, "qty")
                                }
                                className="w-full flex items-center justify-center gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700"
                              >
                                <span>Qty</span>
                                {sortCfg?.key === "qty" && (
                                  <span>
                                    {sortCfg.direction === "desc" ? "↓" : "↑"}
                                  </span>
                                )}
                              </button>
                            </th>

                            <th className="border px-2 py-1 text-right">
                              Unit cost
                            </th>

                            {/* Stock cost header: clickable sort */}
                            <th className="border px-2 py-1 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSort(branch.branchCode, "cost")
                                }
                                className="w-full flex items-center justify-end gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700"
                              >
                                <span>Stock cost</span>
                                {sortCfg?.key === "cost" && (
                                  <span>
                                    {sortCfg.direction === "desc" ? "↓" : "↑"}
                                  </span>
                                )}
                              </button>
                            </th>

                            <th className="border px-2 py-1 text-right">
                              RSP
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {branch.items.map((item, idx) => {
                            const qtyVal =
                              Number(item.quantity ?? 0) || 0;
                            const isNeg = qtyVal < 0;

                            return (
                              <tr
                                key={`${item.codeProduct}-${idx}`}
                                className={idx % 2 ? "bg-slate-50/60" : ""}
                              >
                                <td className="border px-2 py-1 text-center">
                                  {idx + 1}
                                </td>
                                <td className="border px-2 py-1 text-center whitespace-nowrap">
                                  {item.codeProduct
                                    ? String(item.codeProduct).padStart(
                                        5,
                                        "0"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  className="border px-2 py-1 text-left max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis"
                                  title={item.nameProduct || ""}
                                >
                                  {item.nameProduct || "-"}
                                </td>
                                <td
                                  className="border px-2 py-1 text-left max-w-[180px] whitespace-nowrap overflow-hidden text-ellipsis"
                                  title={item.nameBrand || ""}
                                >
                                  {item.nameBrand || "-"}
                                </td>
                                {/* Qty – ถ้าติดลบเป็นสีแดงจาง ๆ */}
                                <td
                                  className={`border px-2 py-1 text-center ${
                                    isNeg ? "bg-red-50 text-red-600" : ""
                                  }`}
                                >
                                  {formatInt(item.quantity)}
                                </td>
                                <td className="border px-2 py-1 text-right">
                                  {formatMoney(item.purchasePriceExcVAT)}
                                </td>
                                <td className="border px-2 py-1 text-right text-emerald-700 font-semibold">
                                  {formatMoney(item.stockCost)}
                                </td>
                                <td className="border px-2 py-1 text-right">
                                  {formatMoney(item.salesPriceIncVAT)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* footer summary branch */}
                    <div className="mt-2 text-[11px] text-slate-500 text-right">
                      Total items: {branch.items.length} • Qty:{" "}
                      {formatInt(branch.totalQty)} • Cost: ฿{" "}
                      {formatMoney(branch.totalCost)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default StockPage;

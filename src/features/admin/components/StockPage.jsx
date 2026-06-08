import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getStockData } from "../../../api/admin/download";

const formatMoney = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  const n = Number(v);
  if (n === 0) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatInt = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString();
};

// ดึง branch code จริงออกจาก "EC000 : Branch Name"
const getBaseBranchCode = (branchCode) => {
  const s = String(branchCode || "-").trim();
  if (s.includes(" : ")) return s.split(" : ")[0].trim();
  if (s.includes(":")) return s.split(":")[0].trim();
  return s;
};

// debounce ช่วยลดแลคตอนพิมพ์ค้นหา
const useDebouncedValue = (value, delay = 200) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const StockPage = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [openBranches, setOpenBranches] = useState({}); // branchKey -> boolean

  // ====== Filter state (global) ======
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 200);

  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");

  // ====== Sort state per branch ======
  const [branchSort, setBranchSort] = useState({});

  // โหลดข้อมูล stock จาก backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await getStockData();
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

  // พาร์เซตัวเลขฟิลเตอร์ครั้งเดียว (ลดงานในลูป)
  const parsedFilters = useMemo(() => {
    const qtyMin = minQty !== "" ? Number(minQty) : null;
    const qtyMax = maxQty !== "" ? Number(maxQty) : null;
    const costMin = minCost !== "" ? Number(minCost) : null;
    const costMax = maxCost !== "" ? Number(maxCost) : null;

    return {
      s: debouncedSearchText.trim().toLowerCase(),
      qtyMin: qtyMin !== null && !Number.isNaN(qtyMin) ? qtyMin : null,
      qtyMax: qtyMax !== null && !Number.isNaN(qtyMax) ? qtyMax : null,
      costMin: costMin !== null && !Number.isNaN(costMin) ? costMin : null,
      costMax: costMax !== null && !Number.isNaN(costMax) ? costMax : null,
    };
  }, [debouncedSearchText, minQty, maxQty, minCost, maxCost]);

  // จัดกลุ่มตาม branchCode + คำนวณทุน + ✅เตรียม search blob ล่วงหน้า (ตัวเต็ม ยังไม่ apply filter)
  const branchSummary = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    const map = {};

    rawData.forEach((row) => {
      const branchDisplay = row.branchCode || "-";
      const branchKey = getBaseBranchCode(branchDisplay) || "-";

      const qty = Number(row.quantity ?? 0) || 0;
      const unitCost = Number(row.purchasePriceExcVAT ?? 0) || 0;

      // qty ติดลบ → stockCost = 0
      const stockCost = qty < 0 ? 0 : qty * unitCost;

      // Sales 90D (Qty) จาก backend: sales90dQty (null ได้)
      const rawSales90 =
        row.sales90dQty !== undefined ? row.sales90dQty : row.sales3mQty;
      const sales90dQty =
        rawSales90 === null || rawSales90 === undefined ? null : Number(rawSales90);

      if (!map[branchKey]) {
        map[branchKey] = {
          branchKey,
          branchCode: branchDisplay,
          items: [],
        };
      } else {
        const currentDisplay = String(map[branchKey].branchCode || "");
        const incomingDisplay = String(branchDisplay || "");
        if (incomingDisplay.length > currentDisplay.length) {
          map[branchKey].branchCode = incomingDisplay;
        }
      }

      // precompute search fields
      const codeStr = row.codeProduct ? String(row.codeProduct).padStart(5, "0") : "";
      const nameLower = String(row.nameProduct || "").toLowerCase();
      const brandLower = String(row.nameBrand || "").toLowerCase();
      const searchBlob = `${codeStr}|${nameLower}|${brandLower}`;

      map[branchKey].items.push({
        ...row,
        branchKey,
        _qty: qty,
        stockCost,
        sales90dQty,
        _search: searchBlob,
      });
    });

    const list = Object.values(map);
    list.sort((a, b) => (a.branchKey < b.branchKey ? -1 : a.branchKey > b.branchKey ? 1 : 0));
    return list;
  }, [rawData]);

  // ฟังก์ชันเช็ค filter (ใช้ precomputed)
  const passesFilter = (item) => {
    const { s, qtyMin, qtyMax, costMin, costMax } = parsedFilters;

    if (s) {
      if (!item._search.includes(s)) return false;
    }

    const qty = item._qty;
    const cost = Number(item.stockCost ?? 0) || 0;

    if (qtyMin !== null && qty < qtyMin) return false;
    if (qtyMax !== null && qty > qtyMax) return false;

    if (costMin !== null && cost < costMin) return false;
    if (costMax !== null && cost > costMax) return false;

    return true;
  };

  // Meta ต่อสาขา: คำนวณแค่ count/totals (ไม่สร้าง list ใหม่ ไม่ sort) → เบาลงตอนพิมพ์
  const filteredBranchMeta = useMemo(() => {
    if (!branchSummary.length) return [];

    return branchSummary
      .map((branch) => {
        let itemsCount = 0;
        let totalCost = 0;
        let totalQtyPos = 0;
        let totalQtyNeg = 0;
        let totalSales90dQty = 0;

        for (const it of branch.items) {
          if (!passesFilter(it)) continue;

          itemsCount += 1;
          totalCost += it.stockCost || 0;

          const q = it._qty;
          if (q > 0) totalQtyPos += q;
          if (q < 0) totalQtyNeg += q;

          totalSales90dQty += Number(it.sales90dQty || 0);
        }

        if (itemsCount === 0) return null;

        return {
          ...branch,
          itemsCount,
          totalCost,
          totalQtyPos,
          totalQtyNeg,
          totalSales90dQty,
        };
      })
      .filter(Boolean);
  }, [branchSummary, parsedFilters]);

  // สร้าง “รายการจริง” เฉพาะสาขาที่เปิดอยู่เท่านั้น + apply sort เฉพาะตอนต้องแสดงตาราง
  const openBranchItemsMap = useMemo(() => {
    const map = {};
    if (!branchSummary.length) return map;

    const openKeys = Object.keys(openBranches).filter((k) => openBranches[k]);
    if (openKeys.length === 0) return map;

    const branchByKey = new Map(branchSummary.map((b) => [b.branchKey, b]));

    for (const branchKey of openKeys) {
      const branch = branchByKey.get(branchKey);
      if (!branch) continue;

      const filteredItems = branch.items.filter(passesFilter);

      const sortCfg = branchSort[branchKey];
      if (sortCfg && sortCfg.key) {
        const dir = sortCfg.direction === "asc" ? 1 : -1;

        filteredItems.sort((a, b) => {
          if (sortCfg.key === "qty") {
            const qa = a._qty;
            const qb = b._qty;
            if (qa === qb) return 0;
            return qa < qb ? -1 * dir : 1 * dir;
          }

          if (sortCfg.key === "cost") {
            const ca = Number(a.stockCost ?? 0) || 0;
            const cb = Number(b.stockCost ?? 0) || 0;
            if (ca === cb) return 0;
            return ca < cb ? -1 * dir : 1 * dir;
          }

          if (sortCfg.key === "sales90d") {
            const saRaw = a.sales90dQty;
            const sbRaw = b.sales90dQty;

            const aNull = saRaw === null || saRaw === undefined || Number.isNaN(Number(saRaw));
            const bNull = sbRaw === null || sbRaw === undefined || Number.isNaN(Number(sbRaw));

            // null ไปท้ายเสมอ
            if (aNull && bNull) return 0;
            if (aNull) return 1;
            if (bNull) return -1;

            const sa = Number(saRaw);
            const sb = Number(sbRaw);
            if (sa === sb) return 0;
            return sa < sb ? -1 * dir : 1 * dir;
          }

          return 0;
        });
      }

      map[branchKey] = filteredItems;
    }

    return map;
  }, [branchSummary, openBranches, branchSort, parsedFilters]);

  // Total รวมทุกสาขา (หลัง filter)
  const grandTotalCostAll = useMemo(() => {
    return filteredBranchMeta.reduce((sum, b) => sum + (Number(b.totalCost ?? 0) || 0), 0);
  }, [filteredBranchMeta]);

  // Total ไม่รวมสาขาบางตัว
  const excludeTotals = useMemo(() => {
    let excludeCost = 0;

    filteredBranchMeta.forEach((b) => {
      const cost = Number(b.totalCost ?? 0) || 0;
      const code = String(b.branchKey || "").trim().toUpperCase();

      if (code !== "EC000" && code !== "ST000" && code !== "ST036" && code !== "ST037") {
        excludeCost += cost;
      }
    });

    return { excludeCost };
  }, [filteredBranchMeta]);

  const toggleBranch = (branchKey) => {
    setOpenBranches((prev) => ({
      ...prev,
      [branchKey]: !prev[branchKey],
    }));
  };

  // toggle sort (per branch + per key) : desc -> asc -> none
  const toggleSort = (branchKey, key) => {
    setBranchSort((prev) => {
      const current = prev[branchKey];

      if (!current || current.key !== key) {
        return { ...prev, [branchKey]: { key, direction: "desc" } };
      }

      if (current.direction === "desc") {
        return { ...prev, [branchKey]: { key, direction: "asc" } };
      }

      const next = { ...prev };
      delete next[branchKey];
      return next;
    });
  };

  const clearFilters = () => {
    setSearchText("");
    setMinQty("");
    setMaxQty("");
    setMinCost("");
    setMaxCost("");
  };

  const handleExportBranch = async (branch) => {
    try {
      const XLSX = await import("xlsx");

      // Get items for this branch, apply the same filters as the UI
      const branchItems = branch.items.filter(passesFilter);

      if (branchItems.length === 0) {
        toast.warning("ไม่มีข้อมูลที่จะส่งออก");
        return;
      }

      // Prepare data for Excel
      const data = branchItems.map((item, idx) => ({
        "#": idx + 1,
        "Code": item.codeProduct ? String(item.codeProduct).padStart(5, "0") : "-",
        "Name": item.nameProduct || "-",
        "Brand": item.nameBrand || "-",
        "Qty": item._qty,
        "Sales 90D": item.sales90dQty ?? "-",
        "Min": item.minStore ?? "-",
        "Max": item.maxStore ?? "-",
        "Pack": item.packOrder ?? "-",
        "Unit Cost": item.purchasePriceExcVAT || 0,
        "Stock Cost": item.stockCost || 0,
        "RSP": item.salesPriceIncVAT || 0,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const wscols = [
        { wch: 5 },  // #
        { wch: 10 }, // Code
        { wch: 40 }, // Name
        { wch: 20 }, // Brand
        { wch: 8 },  // Qty
        { wch: 10 }, // Sales 90D
        { wch: 8 },  // Min
        { wch: 8 },  // Max
        { wch: 8 },  // Pack
        { wch: 12 }, // Unit Cost
        { wch: 12 }, // Stock Cost
        { wch: 12 }, // RSP
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stock");

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const cleanBranchName = branch.branchCode.replace(/[^a-z0-9]/gi, '_');
      const filename = `Stock_${cleanBranchName}_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      // toast.success(`Exported ${branch.branchCode} successfully`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("ไม่สามารถส่งออกข้อมูลได้");
    }
  };

  const handleExportAll = async () => {
    try {
      const XLSX = await import("xlsx");

      const allData = [];
      filteredBranchMeta.forEach(branch => {
        const branchItems = branch.items.filter(passesFilter);
        branchItems.forEach((item, idx) => {
          allData.push({
            "Branch": branch.branchCode,
            "#": idx + 1,
            "Code": item.codeProduct ? String(item.codeProduct).padStart(5, "0") : "-",
            "Name": item.nameProduct || "-",
            "Brand": item.nameBrand || "-",
            "Qty": item._qty,
            "Sales 90D": item.sales90dQty ?? "-",
            "Min": item.minStore ?? "-",
            "Max": item.maxStore ?? "-",
            "Pack": item.packOrder ?? "-",
            "Unit Cost": item.purchasePriceExcVAT || 0,
            "Stock Cost": item.stockCost || 0,
            "RSP": item.salesPriceIncVAT || 0,
          });
        });
      });

      if (allData.length === 0) {
        toast.warning("ไม่มีข้อมูลที่จะส่งออก");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(allData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Branch
        { wch: 5 },  // #
        { wch: 10 }, // Code
        { wch: 40 }, // Name
        { wch: 20 }, // Brand
        { wch: 8 },  // Qty
        { wch: 10 }, // Sales 90D
        { wch: 8 },  // Min
        { wch: 8 },  // Max
        { wch: 8 },  // Pack
        { wch: 12 }, // Unit Cost
        { wch: 12 }, // Stock Cost
        { wch: 12 }, // RSP
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stock");

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Stock_AllBranches_${dateStr}.xlsx`);
      // toast.success("Exported all branches successfully");
    } catch (err) {
      console.error("Export all error:", err);
      toast.error("ไม่สามารถส่งออกข้อมูลได้");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8 py-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-800">Stock overview</h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 w-full sm:w-auto">
            <div className="bg-slate-100 rounded-lg px-3 py-2 text-right w-full sm:min-w-[190px]">
              <div className="text-[11px] text-slate-500">Total stock cost</div>
              <div className="text-base sm:text-lg font-semibold text-emerald-700">
                ฿ {formatMoney(grandTotalCostAll)}
              </div>
              <div className="text-[11px] text-slate-400">
                {filteredBranchMeta.length} branches
                {filteredBranchMeta.length !== branchSummary.length && branchSummary.length > 0 && (
                  <> (from {branchSummary.length})</>
                )}
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg px-3 py-2 text-right w-full sm:min-w-[190px]">
              <div className="text-[11px] text-slate-500">Total stock cost</div>
              <div className="text-base sm:text-lg font-semibold text-emerald-700">
                ฿ {formatMoney(excludeTotals.excludeCost)}
              </div>
              <div className="text-[11px] text-slate-400">
                <span className="text-slate-500 text-right">EC000, ST000, ST036, ST037</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-2 space-y-2">
          {loading && <div className="text-center text-sm text-slate-500">กำลังโหลดข้อมูล stock...</div>}
          {errorMsg && <div className="text-center text-sm text-red-500">{errorMsg}</div>}
          {!loading && !errorMsg && branchSummary.length === 0 && (
            <div className="text-center text-sm text-slate-500">ไม่มีข้อมูล stock</div>
          )}

          {/* Filter panel */}
          {branchSummary.length > 0 && (
            <section className="bg-white border rounded-lg shadow-sm px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Search (code / name / brand)
                    </label>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="px-3 py-1.5 border rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />

                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">Qty range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={minQty}
                        onChange={(e) => setMinQty(e.target.value)}
                        placeholder="Min"
                        className="w-1/2 px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <input
                        type="number"
                        value={maxQty}
                        onChange={(e) => setMaxQty(e.target.value)}
                        placeholder="Max"
                        className="w-1/2 px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">Stock cost range (฿)</label>
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
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleExportAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] sm:text-xs font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-sm active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            </section>
          )}

          {!loading && !errorMsg && branchSummary.length > 0 && filteredBranchMeta.length === 0 && (
            <div className="text-center text-sm text-slate-500">ไม่พบข้อมูลตามเงื่อนไขที่เลือก ลองปรับ filter ใหม่</div>
          )}

          {filteredBranchMeta.map((branch) => {
            const isOpen = !!openBranches[branch.branchKey];
            const sortCfg = branchSort[branch.branchKey];
            const items = isOpen ? openBranchItemsMap[branch.branchKey] || [] : [];

            return (
              <div
                key={branch.branchKey}
                className="border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleBranch(branch.branchKey)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-t-xl hover:bg-slate-50"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800">
                      Branch: {branch.branchCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {branch.itemsCount} items ll Qty  {" "}{formatInt(branch.totalQtyPos)}    {">l<"}  {formatInt(branch.totalSales90dQty)}  • Sales 90D{" "}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportBranch(branch);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 group"
                      title="Export to Excel"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-[11px] font-bold uppercase tracking-wider">XLSX</span>
                    </button>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Stock cost</div>
                      <div className="text-sm sm:text-base font-semibold text-emerald-700">
                        ฿ {formatMoney(branch.totalCost)}
                      </div>
                    </div>

                    <div className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3">
                    <div className="mt-2 overflow-x-auto max-h-[480px] border rounded-lg">
                      <table className="min-w-[980px] w-full border-collapse text-xs text-slate-700">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="border px-2 py-1 text-center">#</th>
                            <th className="border px-2 py-1 text-center">Code</th>
                            <th className="border px-2 py-1 text-left">Name</th>
                            <th className="border px-2 py-1 text-left">Brand</th>

                            <th className="border px-2 py-1 text-center">Min</th>
                            <th className="border px-2 py-1 text-center">Max</th>
                            <th className="border px-2 py-1 text-center">Pack</th>
                            <th className="border px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSort(branch.branchKey, "qty")}
                                className="w-full flex items-center justify-center gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700"
                              >
                                <span>Qty</span>
                                {sortCfg?.key === "qty" && (
                                  <span>{sortCfg.direction === "desc" ? "↓" : "↑"}</span>
                                )}
                              </button>
                            </th>

                            <th className="border px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSort(branch.branchKey, "sales90d")}
                                className="w-full flex items-center justify-center gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700"
                              >
                                <span>Sales 90D</span>
                                {sortCfg?.key === "sales90d" && (
                                  <span>{sortCfg.direction === "desc" ? "↓" : "↑"}</span>
                                )}
                              </button>
                            </th>


                            <th className="border px-2 py-1 text-right">Unit cost</th>
                            <th className="border px-2 py-1 text-right">RSP</th>
                            <th className="border px-2 py-1 text-right">
                              <button
                                type="button"
                                onClick={() => toggleSort(branch.branchKey, "cost")}
                                className="w-full flex items-center justify-end gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700"
                              >
                                <span>Stock cost</span>
                                {sortCfg?.key === "cost" && (
                                  <span>{sortCfg.direction === "desc" ? "↓" : "↑"}</span>
                                )}
                              </button>
                            </th>

                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => {
                            const isNeg = item._qty < 0;
                            return (
                              <tr
                                key={`${branch.branchKey}-${item.codeProduct ?? "x"}-${idx}`}
                                className={idx % 2 ? "bg-slate-50/60" : ""}
                              >
                                <td className="border px-2 py-1 text-center">{idx + 1}</td>
                                <td className="border px-2 py-1 text-center whitespace-nowrap">
                                  {item.codeProduct ? String(item.codeProduct).padStart(5, "0") : "-"}
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
                                <td className="border px-2 py-1 text-center">
                                  {item.minStore !== null && item.minStore !== undefined ? formatInt(item.minStore) : "-"}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {item.maxStore !== null && item.maxStore !== undefined ? formatInt(item.maxStore) : "-"}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {item.packOrder !== null && item.packOrder !== undefined ? formatInt(item.packOrder) : "-"}
                                </td>

                                <td className={`border px-2 py-1 text-center ${isNeg ? "bg-red-50 text-red-600" : ""}`}>
                                  {formatInt(item._qty)}
                                </td>

                                <td className="border px-2 py-1 text-center">{formatInt(item.sales90dQty)}</td>



                                <td className="border px-2 py-1 text-right">{formatMoney(item.purchasePriceExcVAT)}</td>
                                <td className="border px-2 py-1 text-right">{formatMoney(item.salesPriceIncVAT)}</td>
                                <td className="border px-2 py-1 text-right text-emerald-700 font-semibold">
                                  {formatMoney(item.stockCost)}
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500 text-right">
                      Total items: {branch.itemsCount}  ll  <span className="text-[12px] text-slate-500">

                        Qty  {" "}{formatInt(branch.totalQtyPos)}    {">l<"}  {formatInt(branch.totalSales90dQty)}  • Sales 90D{" "}
                      </span>
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



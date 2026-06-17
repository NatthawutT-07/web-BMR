import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { Box, Maximize2, Printer, Search, X } from "lucide-react";
import useBmrStore from "../../../store/bmr_store";
import useStockMetaStore from "../../../store/stock_meta_store";
import { getTemplateAndProduct } from "../../../api/users/home";

const ShelfCardUser = React.lazy(() => import("./second/ShelfCardUser"));
const ShelfFilterUser = React.lazy(() => import("./ShelfFilterUser"));

import TemplateBarcodePanel from "./TemplateBarcodePanel";

const fmtThaiDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const dd = get("day");
  const mm = get("month");
  const yyyy = get("year");
  const hh = get("hour");
  const min = get("minute");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const cx = (...a) => a.filter(Boolean).join(" ");

const rowToneClasses = [
  "bg-amber-50 border-amber-200 text-amber-900",
  "bg-emerald-50 border-emerald-200 text-emerald-900",
  "bg-sky-50 border-sky-200 text-sky-900",
  "bg-violet-50 border-violet-200 text-violet-900",
  "bg-rose-50 border-rose-200 text-rose-900",
  "bg-cyan-50 border-cyan-200 text-cyan-900",
];

const ShelfTemplate = () => {
  const storecode = useBmrStore((s) => s.user?.storecode);

  const [data, setData] = useState([]);
  const [branchName, setBranchName] = useState(null);

  const [selectedShelves, setSelectedShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchHint, setSearchHint] = useState("");
  const [mode, setMode] = useState("shelf");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stockUpdatedAt = useStockMetaStore((s) => s.updatedAt);
  const stockStatus = useStockMetaStore((s) => s.status);
  const loadStockMetaOnce = useStockMetaStore((s) => s.loadOnce);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPick, setPrintPick] = useState([]);
  const [printAll, setPrintAll] = useState(true);
  const [printTargetShelves, setPrintTargetShelves] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const shelfRefs = useRef({});
  const [jumpShelfCode, setJumpShelfCode] = useState(null);

  const [openShelfOnce, setOpenShelfOnce] = useState({ code: null, nonce: 0 });

  useEffect(() => {
    if (!storecode) return;

    const load = async () => {
      setLoading(true);
      try {
        const payload = await getTemplateAndProduct(storecode);
        setBranchName(payload?.branchName ?? null);
        setData(Array.isArray(payload?.items) ? payload.items : []);
      } catch (e) {
        console.error("ShelfTemplate Load Error:", e);
        setBranchName(null);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storecode]);

  useEffect(() => {
    if (!storecode) return;
    loadStockMetaOnce?.();
  }, [storecode, loadStockMetaOnce]);

  useEffect(() => {
    const before = () => setIsPrinting(true);
    const after = () => {
      setIsPrinting(false);
      setPrintTargetShelves(null);
    };

    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);

    const mql = window.matchMedia?.("print");
    const onMql = (e) => {
      const printing = !!e.matches;
      setIsPrinting(printing);
      if (!printing) setPrintTargetShelves(null);
    };
    if (mql?.addEventListener) mql.addEventListener("change", onMql);

    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      if (mql?.removeEventListener) mql.removeEventListener("change", onMql);
    };
  }, []);

  useEffect(() => {
    if (mode !== "shelf") return;
    if (!jumpShelfCode) return;

    requestAnimationFrame(() => {
      const el = shelfRefs.current?.[jumpShelfCode];
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      setJumpShelfCode(null);
    });
  }, [mode, jumpShelfCode]);
  const groupedShelves = useMemo(() => {
    if (!data.length) return [];

    const groups = data.reduce((acc, item) => {
      const code = item.shelf_code || "-";
      if (!acc[code]) acc[code] = [];
      acc[code].push(item);
      return acc;
    }, {});

    return Object.keys(groups).map((shelf_code) => {
      const items = groups[shelf_code];
      const rowNumbers = items
        .map((i) => i.shelf_row_number || 1)
        .filter((n) => typeof n === "number");
      const shelf_total_row = rowNumbers.length ? Math.max(...rowNumbers) : 1;

      return {
        shelf_code,
        shelf_name: items[0]?.shelf_name || "N/A",
        shelf_total_row,
        shelfProducts: items.sort(
          (a, b) =>
            (a.shelf_row_number || 0) - (b.shelf_row_number || 0) || (a.shelf_index_number || 0) - (b.shelf_index_number || 0)
        ),
      };
    });
  }, [data]);

  const duplicateCodes = useMemo(() => {
    const counts = {};
    data.forEach(p => {
      const code = p.item_code ? String(p.item_code) : p.barcode ? String(p.barcode) : null;
      if (code && code !== "-" && code !== "null") {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    const dupes = new Set();
    Object.keys(counts).forEach(k => {
      if (counts[k] > 1) dupes.add(k);
    });
    return dupes;
  }, [data]);

  const displayedShelves = useMemo(() => {
    const qRaw = searchText.trim();
    const q = qRaw.toLowerCase();

    let base = groupedShelves;

    if (isPrinting && Array.isArray(printTargetShelves) && printTargetShelves.length > 0) {
      base = base.filter((s) => printTargetShelves.includes(s.shelf_code));
    }

    if (!isPrinting) {
      base = base.filter(
        (shelf) => selectedShelves.length === 0 || selectedShelves.includes(shelf.shelf_code)
      );
    }

    const mapped = base
      .map((shelf) => {
        const matched = shelf.shelfProducts.filter((item) => {
          if (!qRaw) return true;
          const barcodeStr = item.barcode != null ? String(item.barcode) : "";
          const brandStr = item.brand_name != null ? String(item.brand_name).toLowerCase() : "";
          return barcodeStr.includes(qRaw) || brandStr.includes(q);
        });

        return { ...shelf, matchedProducts: matched };
      })
      .filter((shelf) => qRaw === "" || shelf.matchedProducts.length > 0);

    return mapped;
  }, [groupedShelves, selectedShelves, searchText, isPrinting, printTargetShelves]);

  useEffect(() => {
    const q = searchText.trim();
    if (q.length === 1) {
      setSearchHint("พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหาให้แม่นยำขึ้น");
    } else {
      setSearchHint("");
    }
  }, [searchText]);

  const overviewShelves = useMemo(() => {
    return groupedShelves.filter(
      (shelf) => selectedShelves.length === 0 || selectedShelves.includes(shelf.shelf_code)
    );
  }, [groupedShelves, selectedShelves]);

  //  Print flow 
  const openPrintModal = () => {
    setPrintAll(true);
    setPrintPick([]);
    setPrintModalOpen(true);
  };

  const confirmPrint = () => {
    const target = printAll ? null : [...printPick];
    setPrintTargetShelves(target);
    setPrintModalOpen(false);

    setIsPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const togglePick = (code) => {
    setPrintPick((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  };

  const allShelfCodes = useMemo(() => groupedShelves.map((s) => s.shelf_code), [groupedShelves]);

  const openShelfFromOverview = (shelfCode) => {
    setSelectedShelves([shelfCode]);
    setSearchText("");
    setJumpShelfCode(shelfCode);
    setOpenShelfOnce({ code: shelfCode, nonce: Date.now() });
  };

  return (
    <div className="print-page-shell min-h-screen overflow-x-hidden bg-slate-100 print:bg-white">
      <div className="print-content-shell mx-auto w-full max-w-[1920px] px-3 py-1 sm:px-4 sm:py-1 lg:px-6 space-y-2 sm:space-y-2">
        {/*  PRINT HEADER */}
        <div className="print-header hidden print:block pb-1 mb-1">
          <p className="text-xs sm:text-sm text-slate-500">
            สาขา: <span className="font-semibold text-slate-700">{storecode || "-"}</span>
            {branchName ? <span className="ml-2 text-slate-600">({branchName})</span> : null}
          </p>

          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Stock อัปเดตล่าสุด:{" "}
            <span className="font-semibold text-slate-700">
              {stockStatus === "loading" ? "กำลังโหลด..." : fmtThaiDateTime(stockUpdatedAt)}
            </span>
          </p>
        </div>

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 print:hidden">
            <p className="text-xs sm:text-sm text-slate-500">
              สาขา: <span className="font-semibold text-slate-700">{storecode || "-"}</span>
              {branchName ? <span className="ml-2 text-slate-600">({branchName})</span> : null}
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <div className="inline-flex rounded-xl border bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("barcode")}
                className={cx(
                  "px-4 py-2.5 text-sm font-semibold rounded-lg transition-all",
                  mode === "barcode" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                สแกนบาร์โค้ด
              </button>
              <button
                type="button"
                onClick={() => setMode("shelf")}
                className={cx(
                  "px-4 py-2.5 text-sm font-semibold rounded-lg transition-all",
                  mode === "shelf" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                ดูชั้นวาง
              </button>
            </div>

            {/* ปุ่มพิมพ์ */}
            {mode === "shelf" && (
              <button
                type="button"
                onClick={openPrintModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" />
                พิมพ์
              </button>
            )}
          </div>
        </header>

        {/*  PRINT MODAL  */}
        {printModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center print:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPrintModalOpen(false)} />
            <div className="relative w-[92vw] max-w-xl bg-white rounded-xl shadow-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">เลือก Shelf ที่ต้องการพิมพ์</div>
                </div>
                <button
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setPrintModalOpen(false)}
                  aria-label="close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={printAll}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setPrintAll(v);
                      if (v) setPrintPick([]);
                    }}
                  />
                  <span className="font-medium">พิมพ์ทุก Shelf</span>
                </label>

                <div
                  className={cx(
                    "border rounded-lg p-3 bg-slate-50 max-h-[320px] overflow-y-auto",
                    printAll ? "opacity-50 pointer-events-none" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-600">Shelf ทั้งหมด: {allShelfCodes.length}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded bg-white border hover:bg-slate-100"
                        onClick={() => setPrintPick(allShelfCodes)}
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded bg-white border hover:bg-slate-100"
                        onClick={() => setPrintPick([])}
                      >
                        ล้าง
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allShelfCodes.map((code) => (
                      <label
                        key={code}
                        className="flex items-center gap-2 text-xs bg-white border rounded px-2 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-600"
                          checked={printPick.includes(code)}
                          onChange={() => togglePick(code)}
                        />
                        <span className="font-semibold text-slate-700">{code}</span>
                      </label>
                    ))}
                  </div>

                  {!printAll && printPick.length === 0 && (
                    <div className="mt-3 text-xs text-rose-600">
                      * ยังไม่ได้เลือก Shelf (ถ้าต้องการพิมพ์บาง Shelf ให้เลือกอย่างน้อย 1 อัน)
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPrintModalOpen(false)}
                    className="px-3 py-2 rounded-md text-xs sm:text-sm border bg-white hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    onClick={confirmPrint}
                    disabled={!printAll && printPick.length === 0}
                    className="px-3 py-2 rounded-md text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    พิมพ์
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* โหมดบาร์โค้ด */}
        {mode === "barcode" && (
          <TemplateBarcodePanel
            storecode={storecode}
            branchName={branchName}
            availableShelves={groupedShelves.map(s => ({
              shelf_code: s.shelf_code,
              shelf_name: s.shelf_name,
              shelf_total_row: s.shelf_total_row,
              items: s.shelfProducts
            }))}
            onGoShelf={(shelf_code) => {
              setMode("shelf");
              setSelectedShelves([shelf_code]);
              setSearchText("");
              setJumpShelfCode(shelf_code);

              setOpenShelfOnce({ code: shelf_code, nonce: Date.now() });
            }}
          />
        )}

        {mode === "shelf" && (
          <>

            {!loading && groupedShelves.length > 0 && (
              <section className="w-full print:hidden">
                <div className="mx-auto grid w-full max-w-full grid-cols-1 gap-4 overflow-hidden rounded-xl border bg-white p-4 shadow-sm lg:p-5 xl:grid-cols-[minmax(220px,300px)_minmax(0,1fr)_minmax(280px,360px)]">

                  {/* LEFT */}
                  <div
                    className="group relative min-w-0 cursor-pointer"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <div
                      className="mx-auto h-[360px] w-full max-w-[300px] bg-contain bg-center bg-no-repeat rounded-lg border bg-slate-50 shadow-sm select-none transition-transform group-hover:scale-[1.01] md:h-[440px] xl:h-[500px]"
                      style={{ backgroundImage: `url('/images/branch/${storecode?.toUpperCase()}.png')` }}
                      aria-label={`BranchMain ${storecode}`}
                    />
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Fullscreen Image Overlay */}
                  {isFullscreen && (
                    <div
                      className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out print:hidden backdrop-blur-sm"
                      onClick={() => setIsFullscreen(false)}
                      title="แตะเพื่อย่อรูปภาพ"
                    >
                      <img
                        src={`/images/branch/${storecode?.toUpperCase()}.png`}
                        alt={`BranchMain ${storecode}`}
                        className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-xl"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* CENTER */}
                  <div className="min-w-0">
                    <div
                      className="h-[440px] w-full overflow-y-auto rounded-xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-inner xl:h-[500px]"
                    >
                      <div className="sticky top-0 z-10 -mx-1 -mt-2 mb-3 bg-emerald-50/95 px-1 py-2 backdrop-blur-sm">
                        <h3 className="font-bold text-emerald-800 text-base text-center">
                          โครงสร้างชั้นสินค้าในสาขา
                        </h3>
                        <p className="mt-1 text-center text-xs text-emerald-700/80">
                          {overviewShelves.length} Shelf / {overviewShelves.reduce((sum, shelf) => sum + shelf.shelf_total_row, 0)} ชั้น
                        </p>
                      </div>

                      <div className="space-y-3">
                        {overviewShelves.length === 0 && (
                          <div className="rounded-lg border border-dashed border-emerald-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                            ไม่พบ Shelf ตาม Filter ที่เลือก
                          </div>
                        )}

                        {overviewShelves.map((shelf) => (
                          <button
                            type="button"
                            key={shelf.shelf_code}
                            onClick={() => openShelfFromOverview(shelf.shelf_code)}
                            className="w-full bg-white rounded-lg p-3 border border-slate-200 shadow-sm text-left transition-all hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            <div className="flex items-center gap-2 pb-2 border-b border-dashed border-slate-200">
                              <Box className="h-5 w-5 flex-shrink-0 text-amber-600" />
                              <div className="flex-1 min-w-0 flex items-center whitespace-nowrap overflow-x-auto scrollbar-hide">
                                <span className="font-bold text-blue-700 text-base">
                                  {shelf.shelf_code}
                                </span>
                                {shelf.shelf_name && (
                                  <span className="text-sm text-slate-600 ml-1">
                                    - {shelf.shelf_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold flex-shrink-0 whitespace-nowrap">
                                {shelf.shelf_total_row} ชั้น
                              </span>
                            </div>

                            <div className="mt-2 space-y-1.5">
                              {Array.from({ length: shelf.shelf_total_row }).map((_, idx) => {
                                const shelf_row_number = idx + 1;
                                const rowProducts = shelf.shelfProducts.filter(
                                  (p) => (p.shelf_row_number || 0) === shelf_row_number
                                );
                                const colorClass = rowToneClasses[idx % rowToneClasses.length];

                                return (
                                  <div
                                    key={shelf_row_number}
                                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border ${colorClass}`}
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-white/85 flex items-center justify-center text-sm font-extrabold shadow-sm border border-current/10">
                                        {shelf_row_number}
                                      </div>
                                      <span className="truncate text-sm font-semibold opacity-90">ชั้นที่ {shelf_row_number}</span>
                                    </div>
                                    <span className="flex-shrink-0 text-xs font-bold bg-white/70 px-2.5 py-1 rounded-full">
                                      {rowProducts.length} รายการ
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="min-w-0">
                    <div className="h-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-4">
                        <Suspense fallback={<div className="text-sm text-gray-500">Loading filter...</div>}>
                          <ShelfFilterUser
                            shelves={groupedShelves.map((s) => s.shelf_code)}
                            selectedShelves={selectedShelves}
                            onToggle={(code) =>
                              setSelectedShelves((prev) =>
                                prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
                              )
                            }
                            onClear={() => setSelectedShelves([])}
                          />
                        </Suspense>

                        <div className="pt-4 border-t border-slate-200">
                          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">ค้นหาสินค้าในหน้านี้</label>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="พิมพ์ชื่อแบรนด์ หรือเลขบาร์โค้ด..."
                              className="w-full px-10 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                              value={searchText}
                              onChange={(e) => setSearchText(e.target.value)}
                            />
                            {searchText && (
                              <button
                                type="button"
                                onClick={() => setSearchText("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="ล้างคำค้นหา"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {searchHint && (
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-1">
                              <span>{searchHint}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            )}



            {/* SHELF LIST */}
            <section className="space-y-4">
              {loading && <div className="text-center text-sm text-gray-500">กำลังโหลดข้อมูลชั้นวาง...</div>}

              {!loading && displayedShelves.length === 0 && (
                <div className="text-center text-sm text-gray-500">
                  ไม่พบข้อมูล (ลองล้าง Filter หรือเคลียร์คำค้นหา)
                </div>
              )}

              <Suspense fallback={<div className="text-sm text-gray-500">Loading shelves...</div>}>
                {displayedShelves.map((shelf) => (
                  <div
                    key={shelf.shelf_code}
                    ref={(el) => {
                      if (el) shelfRefs.current[shelf.shelf_code] = el;
                    }}
                  >
                    <ShelfCardUser
                      shelfTemplate={{ ...shelf, shelfProducts: shelf.matchedProducts }}
                      autoOpen={searchText.length > 0}
                      isPrinting={isPrinting}
                      openNonce={openShelfOnce.code === shelf.shelf_code ? openShelfOnce.nonce : 0}
                      branchName={branchName}
                      availableShelves={groupedShelves.map(s => ({
                        shelf_code: s.shelf_code,
                        shelf_name: s.shelf_name,
                        shelf_total_row: s.shelf_total_row,
                        items: s.shelfProducts
                      }))}
                      duplicateCodes={duplicateCodes}
                    />
                  </div>
                ))}
              </Suspense>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ShelfTemplate;

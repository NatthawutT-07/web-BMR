
// Template.jsx
import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import useBmrStore from "../../../store/bmr_store";
import useStockMetaStore from "../../../store/stock_meta_store";
import { getTemplateAndProduct } from "../../../api/users/home";

// Lazy load component หนัก ๆ
const ShelfCardUser = React.lazy(() => import("./second/ShelfCardUser"));
const ShelfFilterUser = React.lazy(() => import("./ShelfFilterUser"));

// ✅ แยกบาร์โค้ดออกไปไฟล์ข้าง ๆ
import TemplateBarcodePanel from "./TemplateBarcodePanel";

/* =========================
   Helpers: Thai/BKK datetime
========================= */
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

const Template = () => {
  const storecode = useBmrStore((s) => s.user?.storecode);

  const [data, setData] = useState([]);
  const [branchName, setBranchName] = useState(null);

  const [selectedShelves, setSelectedShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchHint, setSearchHint] = useState("");

  // ✅ โหมด 2 ปุ่ม
  const [mode, setMode] = useState("shelf"); // "barcode" | "shelf"

  // ===== Stock Meta (ยิงครั้งเดียว) =====
  const stockUpdatedAt = useStockMetaStore((s) => s.updatedAt);
  const stockStatus = useStockMetaStore((s) => s.status);
  const loadStockMetaOnce = useStockMetaStore((s) => s.loadOnce);

  // ===== Print modal + print target =====
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPick, setPrintPick] = useState([]);
  const [printAll, setPrintAll] = useState(true);
  const [printTargetShelves, setPrintTargetShelves] = useState(null); // null=all
  const [isPrinting, setIsPrinting] = useState(false);

  // ใช้ scroll ไป shelf (ตอนมาจาก barcode -> ไป shelf)
  const shelfRefs = useRef({});
  const [jumpShelfCode, setJumpShelfCode] = useState(null);

  // ✅ สั่ง “เปิดการ์ด shelf” 1 ครั้ง เมื่อมาจาก barcode
  const [openShelfOnce, setOpenShelfOnce] = useState({ code: null, nonce: 0 });

  // โหลด Template + Product
  useEffect(() => {
    if (!storecode) return;

    const load = async () => {
      setLoading(true);
      try {
        const payload = await getTemplateAndProduct(storecode);
        setBranchName(payload?.branchName ?? null);
        setData(Array.isArray(payload?.items) ? payload.items : []);
      } catch (e) {
        console.error("Template Load Error:", e);
        setBranchName(null);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storecode]);

  // โหลด stock meta ครั้งเดียวต่อการเปิดเว็บ
  useEffect(() => {
    if (!storecode) return;
    loadStockMetaOnce?.();
  }, [storecode, loadStockMetaOnce]);

  // จับเหตุการณ์ print เพื่อ reset state หลังพิมพ์
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

  // scroll ไป shelf card หลังสลับมา shelf
  useEffect(() => {
    if (mode !== "shelf") return;
    if (!jumpShelfCode) return;

    requestAnimationFrame(() => {
      const el = shelfRefs.current?.[jumpShelfCode];
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      setJumpShelfCode(null);
    });
  }, [mode, jumpShelfCode]);

  // Group ตาม shelfCode
  const groupedShelves = useMemo(() => {
    if (!data.length) return [];

    const groups = data.reduce((acc, item) => {
      const code = item.shelfCode || "-";
      if (!acc[code]) acc[code] = [];
      acc[code].push(item);
      return acc;
    }, {});

    return Object.keys(groups).map((shelfCode) => {
      const items = groups[shelfCode];
      const rowNumbers = items
        .map((i) => i.rowNo || 1)
        .filter((n) => typeof n === "number");
      const rowQty = rowNumbers.length ? Math.max(...rowNumbers) : 1;

      return {
        shelfCode,
        fullName: items[0]?.fullName || "N/A",
        rowQty,
        shelfProducts: items.sort(
          (a, b) =>
            (a.rowNo || 0) - (b.rowNo || 0) || (a.index || 0) - (b.index || 0)
        ),
      };
    });
  }, [data]);

  // Filter + Search
  const displayedShelves = useMemo(() => {
    const qRaw = searchText.trim();
    const q = qRaw.toLowerCase();

    let base = groupedShelves;

    if (isPrinting && Array.isArray(printTargetShelves) && printTargetShelves.length > 0) {
      base = base.filter((s) => printTargetShelves.includes(s.shelfCode));
    }

    if (!isPrinting) {
      base = base.filter(
        (shelf) => selectedShelves.length === 0 || selectedShelves.includes(shelf.shelfCode)
      );
    }

    const mapped = base
      .map((shelf) => {
        const matched = shelf.shelfProducts.filter((item) => {
          if (!qRaw) return true;
          const barcodeStr = item.barcode != null ? String(item.barcode) : "";
          const brandStr = item.nameBrand != null ? String(item.nameBrand).toLowerCase() : "";
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
      setSearchHint("พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา");
    } else {
      setSearchHint("");
    }
  }, [searchText]);

  // ===== Print flow =====
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

  const allShelfCodes = useMemo(() => groupedShelves.map((s) => s.shelfCode), [groupedShelves]);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8 py-1 sm:py-1 space-y-2 sm:space-y-2">
        {/* ===== PRINT HEADER (แสดงเฉพาะตอนพิมพ์) ===== */}
        <div className="hidden print:block pb-1 mb-1">
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

        {/* HEADER + ปุ่มโหมด + ปุ่ม PRINT */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 print:hidden">
            <p className="text-xs sm:text-sm text-slate-500">
              สาขา: <span className="font-semibold text-slate-700">{storecode || "-"}</span>
              {branchName ? <span className="ml-2 text-slate-600">({branchName})</span> : null}
            </p>
          </div>

          {/* ปุ่มเลือกโหมด */}
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
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 shadow-sm transition-colors"
              >
                พิมพ์
              </button>
            )}
          </div>
        </header>

        {/* ===== PRINT MODAL ===== */}
        {printModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center print:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPrintModalOpen(false)} />
            <div className="relative w-[92vw] max-w-xl bg-white rounded-xl shadow-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">เลือก Shelf ที่ต้องการพิมพ์</div>
                  <div className="text-xs text-slate-500 mt-1">เลือกได้หลาย Shelf หรือเลือก “พิมพ์ทุก Shelf”</div>
                </div>
                <button
                  className="text-slate-500 hover:text-slate-700 text-lg leading-none"
                  onClick={() => setPrintModalOpen(false)}
                  aria-label="close"
                >
                  ✕
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

        {/* ✅ โหมดบาร์โค้ด */}
        {mode === "barcode" && (
          <TemplateBarcodePanel
            storecode={storecode}
            branchName={branchName}
            availableShelves={groupedShelves.map(s => ({
              shelfCode: s.shelfCode,
              fullName: s.fullName,
              rowQty: s.rowQty,
              items: s.shelfProducts // for calculating available indices
            }))}
            onGoShelf={(shelfCode) => {
              setMode("shelf");
              setSelectedShelves([shelfCode]);
              setSearchText("");
              setJumpShelfCode(shelfCode);

              // ✅ สั่งเปิดการ์ด shelf นี้ 1 ครั้ง
              setOpenShelfOnce({ code: shelfCode, nonce: Date.now() });
            }}
          />
        )}

        {/* ✅ โหมด shelf */}
        {mode === "shelf" && (
          <>

            {/* SUMMARY + IMAGE */}
            {!loading && groupedShelves.length > 0 && (
              <section className="w-full print:hidden">
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border flex flex-col xl:flex-row gap-6 mx-auto w-full max-w-[1400px]">

                  {/* LEFT: Branch Image */}
                  <div className="flex justify-center xl:justify-start xl:w-[260px] flex-shrink-0">
                    <div
                      className="w-full max-w-[260px] aspect-[4/3] bg-contain bg-center bg-no-repeat rounded-lg shadow-sm border bg-slate-50 select-none pointer-events-none"
                      style={{ backgroundImage: `url('/images/branch/${storecode?.toUpperCase()}.png')` }}
                      aria-label={`Branch ${storecode}`}
                    />
                  </div>

                  {/* CENTER: Shelf Structure List */}
                  <div className="flex-1 flex flex-col">
                    <div
                      className="bg-gradient-to-b from-emerald-50 to-white border-2 border-emerald-200 rounded-xl p-4 shadow-inner 
                      max-h-[420px] md:max-h-[480px] w-full overflow-y-auto"
                    >
                      <h3 className="font-bold text-emerald-800 mb-3 text-base text-center flex items-center justify-center gap-2 sticky top-0 bg-emerald-50/95 py-2 -mt-2 z-10 backdrop-blur-sm">
                        <span className="text-lg">🗂️</span>
                        โครงสร้าง Shelf
                      </h3>

                      <div className="space-y-3">
                        {groupedShelves.map((shelf) => (
                          <div
                            key={shelf.shelfCode}
                            className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="flex items-center gap-2 pb-2 border-b border-dashed border-slate-200">
                              <span className="text-xl flex-shrink-0">📦</span>
                              <div className="flex-1 min-w-0 flex items-center whitespace-nowrap overflow-x-auto scrollbar-hide">
                                <span className="font-bold text-blue-700 text-base">
                                  {shelf.shelfCode}
                                </span>
                                {shelf.fullName && (
                                  <span className="text-sm text-slate-600 ml-1">
                                    - {shelf.fullName}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold flex-shrink-0 whitespace-nowrap">
                                {shelf.rowQty} ชั้น
                              </span>
                            </div>

                            {/* รายการแต่ละ Row */}
                            <div className="mt-2 space-y-1.5">
                              {Array.from({ length: shelf.rowQty }).map((_, idx) => {
                                const rowNo = idx + 1;
                                const rowProducts = shelf.shelfProducts.filter(
                                  (p) => (p.rowNo || 0) === rowNo
                                );
                                const rowColors = [
                                  'bg-amber-50 border-amber-200 text-amber-800',
                                  'bg-emerald-50 border-emerald-200 text-emerald-800',
                                  'bg-sky-50 border-sky-200 text-sky-800',
                                  'bg-violet-50 border-violet-200 text-violet-800',
                                  'bg-rose-50 border-rose-200 text-rose-800',
                                  'bg-cyan-50 border-cyan-200 text-cyan-800',
                                ];
                                const colorClass = rowColors[idx % rowColors.length];

                                return (
                                  <div
                                    key={rowNo}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colorClass}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold uppercase tracking-wider opacity-70">Row</span>
                                      <span className="text-sm font-bold">{rowNo}</span>
                                    </div>
                                    <span className="text-sm font-semibold bg-white/60 px-2 rounded-md">
                                      {rowProducts.length} รายการ
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Filter & Search Panel */}
                  <div className="xl:w-[320px] 2xl:w-[380px] flex-shrink-0 flex flex-col gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-full">
                      <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                        <span>🔍</span> ตัวเลือกและการค้นหา
                      </h3>

                      <div className="space-y-4">
                        <Suspense fallback={<div className="text-sm text-gray-500">Loading filter...</div>}>
                          <ShelfFilterUser
                            shelves={groupedShelves.map((s) => s.shelfCode)}
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
                          <input
                            type="text"
                            placeholder="พิมพ์ชื่อแบรนด์ หรือเลขบาร์โค้ด..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                          />
                          {searchHint && (
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-1">
                              <span>⚠️</span>
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
                    key={shelf.shelfCode}
                    ref={(el) => {
                      if (el) shelfRefs.current[shelf.shelfCode] = el;
                    }}
                  >
                    <ShelfCardUser
                      template={{ ...shelf, shelfProducts: shelf.matchedProducts }}
                      autoOpen={searchText.length > 0}
                      isPrinting={isPrinting}
                      openNonce={openShelfOnce.code === shelf.shelfCode ? openShelfOnce.nonce : 0}
                      branchName={branchName}
                      availableShelves={groupedShelves.map(s => ({
                        shelfCode: s.shelfCode,
                        fullName: s.fullName,
                        rowQty: s.rowQty,
                        items: s.shelfProducts
                      }))}
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

export default Template;

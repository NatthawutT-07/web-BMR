// TemplateBarcodePanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../utils/axios";
import CameraBarcodeScannerModal from "./CameraBarcodeScannerModal";

const cx = (...a) => a.filter(Boolean).join(" ");

const TemplateBarcodePanel = ({ storecode, branchName, onGoShelf }) => {
  const barcodeInputRef = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupRes, setLookupRes] = useState(null);

  const [blocksLoading, setBlocksLoading] = useState(false);
  const [shelfBlocks, setShelfBlocks] = useState(null);

  // ✅ กล้อง + popup
  const [cameraOpen, setCameraOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => barcodeInputRef.current?.focus?.());
  }, []);

  const primaryLoc = useMemo(() => {
    const l = lookupRes?.locations?.[0];
    if (!l) return null;
    return {
      shelfCode: l.shelfCode,
      shelfName: l.shelfName,
      rowNo: Number(l.rowNo || 0),
      index: Number(l.index || 0),
    };
  }, [lookupRes]);

  const branchText = useMemo(() => {
    const code = storecode || "-";
    return branchName ? `${code} (${branchName})` : code;
  }, [storecode, branchName]);

  const reasonText = (r) => {
    if (r === "BARCODE_NOT_FOUND") return "ไม่พบบาร์โค้ดในรายการสินค้า";
    if (r === "NO_LOCATION_IN_POG") return "พบสินค้า แต่ยังไม่มีตำแหน่งใน POG";
    if (r === "TIMEOUT") return "ระบบตอบช้าเกินไป (ลองสแกนใหม่อีกครั้ง)";
    if (r === "REQUEST_ERROR") return "โหลดไม่สำเร็จ";
    return "ไม่พบข้อมูล";
  };

  const clearAll = () => {
    setBarcode("");
    setBarcodeError("");
    setLookupRes(null);
    setShelfBlocks(null);
    setPopupOpen(false);
    requestAnimationFrame(() => barcodeInputRef.current?.focus?.());
  };

  const lookupByBarcode = async (bc) => {
    const code = String(bc || "").trim();
    if (!storecode || !code) return;
    if (code.length < 6) {
      setBarcodeError("บาร์โค้ดควรมีอย่างน้อย 6 หลัก");
      return;
    }

    setLookupLoading(true);
    setLookupRes(null);
    setShelfBlocks(null);
    setBarcodeError("");

    try {
      const res = await api.get("/lookup", {
        params: { branchCode: storecode, barcode: code },
        timeout: 15000,
      });
      setLookupRes(res.data);
    } catch (e) {
      console.error("lookup error:", e);
      const isTimeout = e?.code === "ECONNABORTED";
      setLookupRes({ found: false, reason: isTimeout ? "TIMEOUT" : "REQUEST_ERROR" });
    } finally {
      setLookupLoading(false);
    }
  };

  const loadShelfBlocks = async (shelfCode) => {
    if (!storecode || !shelfCode) return;
    setBlocksLoading(true);
    try {
      const res = await api.get("/shelf-blocks", {
        params: { branchCode: storecode, shelfCode },
        timeout: 15000,
      });
      setShelfBlocks(res.data);
    } catch (e) {
      console.error("shelf-blocks error:", e);
      setShelfBlocks(null);
    } finally {
      setBlocksLoading(false);
    }
  };

  // ✅ สแกนจากกล้องแล้ว: เปิด popup “ก่อน” แล้วค่อยยิง API (ให้ user เห็นสปิน)
  const onCameraDetected = (code) => {
    setCameraOpen(false);
    setBarcode(code);

    // เปิด popup ทันทีเพื่อโชว์สปิน
    setPopupOpen(true);

    // ยิง lookup รอ backend
    lookupByBarcode(code);
  };

  const openPopupAndLookup = (bc) => {
    const code = String(bc || "").trim();
    if (!code) return;
    setBarcode(code);
    setPopupOpen(true);
    lookupByBarcode(code);
  };

  return (
    <section className="space-y-3">
      {/* กล้อง modal */}
      <CameraBarcodeScannerModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetected={onCameraDetected}
      />

      <div className="bg-white border rounded-xl shadow-sm p-3">
        <div className="text-sm font-semibold text-slate-800">สแกน/พิมพ์บาร์โค้ด หรือใช้กล้อง</div>
        <div className="text-xs text-slate-500 mt-1">
          {/* สแกนติดแล้วจะขึ้น Popup และแสดงสถานะกำลังโหลดข้อมูลจากระบบ */}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            ref={barcodeInputRef}
            type="text"
            inputMode="numeric"
            value={barcode}
            onChange={(e) => {
              const raw = e.target.value || "";
              const digitsOnly = raw.replace(/\D/g, "");
              if (raw !== digitsOnly) {
                setBarcodeError("กรอกได้เฉพาะตัวเลขเท่านั้น");
              } else if (barcodeError) {
                setBarcodeError("");
              }
              setBarcode(digitsOnly);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") openPopupAndLookup(barcode);
            }}
            placeholder="พิมพ์/หัวสแกนบาร์โค้ด..."
            className="flex-1 px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openPopupAndLookup(barcode)}
              disabled={!String(barcode).trim() || lookupLoading}
              className="px-4 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {lookupLoading ? "กำลังค้นหา..." : "ค้นหา"}
            </button>

            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="px-4 py-3 rounded-xl font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700"
            >
              📷 กล้อง
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="px-4 py-3 rounded-xl font-semibold text-sm border bg-white hover:bg-slate-50"
            >
              ล้าง
            </button>
          </div>
        </div>
        {barcodeError && (
          <div className="mt-2 text-xs text-rose-600">{barcodeError}</div>
        )}
      </div>

      {/* Popup ผลลัพธ์ */}
      {popupOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPopupOpen(false)} />
          <div className="relative w-[94vw] max-w-xl bg-white rounded-2xl shadow-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">ผลการสแกน</div>
                {/* ✅ แสดงชื่อสาขา */}
                <div className="text-xs text-slate-500 mt-1">สาขา: {branchText}</div>
              </div>
              <button
                className="text-slate-500 hover:text-slate-700 text-lg leading-none"
                onClick={() => setPopupOpen(false)}
                aria-label="close"
              >
                ✕
              </button>
            </div>

            {/* ✅ สปินตอนรอ backend */}
            {lookupLoading || !lookupRes ? (
              <div className="mt-4 p-4 rounded-xl border bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">กำลังดึงข้อมูลจากระบบ…</div>
                    <div className="text-xs text-slate-500 mt-1">
                      บาร์โค้ด: <span className="font-semibold text-slate-700">{barcode || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !lookupRes.found ? (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-sm font-semibold text-rose-700">ไม่พบตำแหน่ง</div>
                {/* <div className="text-xs text-rose-700 mt-1">{reasonText(lookupRes.reason)}</div> */}
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <div className="text-xs text-slate-500">สินค้า</div>
                  <div className="text-sm font-semibold text-slate-900">{lookupRes.product?.name || "-"}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {lookupRes.product?.brand ? `แบรนด์: ${lookupRes.product.brand}` : null}
                    {lookupRes.product?.price != null ? ` • ราคา: ${lookupRes.product.price}` : null}
                  </div>
                </div>

                {primaryLoc && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs text-emerald-700">ตำแหน่งที่ควรวาง</div>
                    <div className="mt-1 text-3xl font-extrabold text-emerald-800 leading-none">
                      {primaryLoc.shelfCode}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-emerald-800">
                      Row {primaryLoc.rowNo} • ตำแหน่ง {primaryLoc.index}
                    </div>
                    {primaryLoc.shelfName ? (
                      <div className="mt-1 text-xs text-emerald-700">{primaryLoc.shelfName}</div>
                    ) : null}

                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      {/* <button
                        type="button"
                        onClick={async () => {
                          await loadShelfBlocks(primaryLoc.shelfCode);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        ดูเป็นบล็อก
                      </button> */}

                      <button
                        type="button"
                        onClick={() => {
                          setPopupOpen(false);
                          onGoShelf?.(primaryLoc.shelfCode);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm border bg-white hover:bg-slate-50"
                      >
                        ไปหน้า Shelf
                      </button>
                    </div>
                  </div>
                )}

                {(blocksLoading || shelfBlocks) && (
                  <div className="mt-3 border rounded-xl p-3">
                    <div className="text-sm font-semibold text-slate-800">
                      {blocksLoading ? "กำลังโหลด Shelf..." : `Shelf ${shelfBlocks?.shelf?.shelfCode || "-"}`}
                    </div>

                    {!blocksLoading && Array.isArray(shelfBlocks?.rows) && (
                      <div className="mt-3 space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                        {shelfBlocks.rows.map((row) => {
                          const isTargetRow = primaryLoc && row.rowNo === primaryLoc.rowNo;
                          return (
                            <div
                              key={row.rowNo}
                              className={cx(
                                "rounded-xl border p-3",
                                isTargetRow ? "border-emerald-300 bg-emerald-50" : "bg-white"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className={cx("text-sm font-bold", isTargetRow ? "text-emerald-800" : "text-slate-800")}>
                                  Row {row.rowNo}
                                </div>
                                <div className="text-xs text-slate-500">{(row.items || []).length} รายการ</div>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {(row.items || []).map((it) => {
                                  const isTarget =
                                    primaryLoc &&
                                    row.rowNo === primaryLoc.rowNo &&
                                    Number(it.index) === primaryLoc.index;

                                  return (
                                    <div
                                      key={`${it.codeProduct}-${it.index}`}
                                      className={cx(
                                        "px-2 py-2 rounded-lg border text-xs min-w-[92px]",
                                        isTarget ? "border-emerald-500 bg-white shadow-sm" : "bg-slate-50"
                                      )}
                                    >
                                      <div className={cx("font-extrabold", isTarget ? "text-emerald-800" : "text-slate-800")}>
                                        {it.index}
                                      </div>
                                      <div className="text-slate-700 line-clamp-2">
                                        {it.name || `#${it.codeProduct}`}
                                      </div>
                                      {it.brand ? <div className="text-slate-500">{it.brand}</div> : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-slate-50"
                onClick={() => {
                  setPopupOpen(false);
                  setCameraOpen(true);
                }}
              >
                สแกนต่อ
              </button>
              <button
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
                onClick={() => setPopupOpen(false)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TemplateBarcodePanel;

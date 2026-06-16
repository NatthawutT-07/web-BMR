import React, { useEffect, useMemo, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import api from "../../../utils/axios";
import CameraBarcodeScannerModal from "./CameraBarcodeScannerModal";
import PogRequestModal from "./PogRequestModal";

const TemplateBarcodePanel = ({ storecode, branchName, availableShelves = [] }) => {
  const barcodeInputRef = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupRes, setLookupRes] = useState(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [pogRequestOpen, setPogRequestOpen] = useState(false);
  const [requestAction, setRequestAction] = useState("");

  useEffect(() => {
    requestAnimationFrame(() => barcodeInputRef.current?.focus?.());
  }, []);

  const primaryLoc = useMemo(() => {
    const l = lookupRes?.locations?.[0];
    if (!l) return null;
    return {
      shelf_code: l.shelf_code,
      shelfName: l.shelfName,
      shelf_row_number: Number(l.shelf_row_number || 0),
      shelf_index_number: Number(l.shelf_index_number || 0),
    };
  }, [lookupRes]);

  const branchText = useMemo(() => {
    const code = storecode || "-";
    return branchName ? `${code} (${branchName})` : code;
  }, [storecode, branchName]);

  const clearAll = () => {
    setBarcode("");
    setScannedBarcode("");
    setBarcodeError("");
    setLookupRes(null);
    setPopupOpen(false);
    requestAnimationFrame(() => barcodeInputRef.current?.focus?.());
  };

  const lookupByBarcode = React.useCallback(async (bc) => {
    const code = String(bc || "").trim();
    if (!storecode || !code) return;
    if (code.length < 5) {
      setBarcodeError("บาร์โค้ดอย่างน้อย 5 ตัว");
      return;
    }

    setLookupLoading(true);
    setLookupRes(null);
    setBarcodeError("");

    try {
      const res = await api.get("/lookup", {
        params: { branch_code: storecode, barcode: code },
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
  }, [storecode]);

  const onCameraDetected = React.useCallback((code) => {
    setCameraOpen(false);
    if (code.length < 5) {
      setBarcodeError("บาร์โค้ดอย่างน้อย 5 ตัว");
      setBarcode(code);
      return;
    }
    setBarcodeError("");
    setScannedBarcode(code);
    setBarcode("");

    setPopupOpen(true);
    lookupByBarcode(code);
  }, [lookupByBarcode]);

  const openPopupAndLookup = (bc) => {
    const code = String(bc || "").trim();
    if (!code) return;
    if (code.length < 5) {
      setBarcodeError("บาร์โค้ดอย่างน้อย 5 ตัว");
      return;
    }
    setBarcodeError("");
    setScannedBarcode(code);
    setBarcode("");
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

      {/* POG Request modal */}
      <PogRequestModal
        open={pogRequestOpen}
        onClose={() => setPogRequestOpen(false)}
        branch_code={storecode}
        branchName={branchName}
        barcode={scannedBarcode}
        item_name={lookupRes?.product?.name}
        currentShelf={primaryLoc?.shelf_code}
        currentRow={primaryLoc?.shelf_row_number}
        currentIndex={primaryLoc?.shelf_index_number}
        initialAction={requestAction}
        availableShelves={availableShelves}
      />

      <div className="bg-white border rounded-xl shadow-sm p-4 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-slate-800">ค้นหาสินค้าจากบาร์โค้ด</div>
          </div>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="sm:hidden w-10 h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center justify-center shadow-sm shrink-0 ml-3"
            title="สแกนด้วยกล้อง"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden sm:flex mt-3 items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-xs font-semibold text-red-700">พร้อมสแกน</span>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 relative min-w-0">
            <input
              ref={barcodeInputRef}
              type="text"
              inputMode="text"
              value={barcode}
              onChange={(e) => {
                const raw = e.target.value || "";
                setBarcode(raw);
                if (barcodeError) {
                  setBarcodeError("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") openPopupAndLookup(barcode);
              }}
              placeholder=""
              className="w-full px-4 py-3 pr-10 rounded-xl text-base font-semibold border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            />
            {barcode && (
              <button
                type="button"
                onClick={clearAll}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="ล้าง"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openPopupAndLookup(barcode)}
            disabled={!String(barcode).trim() || lookupLoading}
            className="shrink-0 px-5 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {lookupLoading ? "..." : "ค้นหา"}
          </button>
        </div>

        {barcodeError && (
          <div className="mt-2 text-xs text-rose-600">{barcodeError}</div>
        )}
      </div>

      {/* Result popup */}
        {popupOpen && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={() => setPopupOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 sm:p-6 pointer-events-auto transform transition-all">
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                <div>
                  <div className="text-base font-bold text-slate-800">ผลสแกนบาร์โค้ด</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">สาขา: {branchText}</div>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
                  onClick={() => setPopupOpen(false)}
                  aria-label="close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Spin backend */}
              {lookupLoading || !lookupRes ? (
                <div className="mt-4 p-4 rounded-xl border bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">กำลังค้นหา...</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        บาร์โค้ด: <span className="font-semibold text-slate-700">{scannedBarcode || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !lookupRes.found ? (
                <div className="mt-4 flex flex-col w-full gap-3">
                  {/* Status Banner */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-rose-200 text-rose-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <div className="text-sm font-bold text-rose-800">
                      {lookupRes.reason === "BARCODE_NOT_FOUND"
                        ? "ไม่พบข้อมูลสินค้า"
                        : lookupRes.reason === "TIMEOUT"
                          ? "หมดเวลาเชื่อมต่อ"
                          : lookupRes.reason === "REQUEST_ERROR"
                            ? "การเชื่อมต่อผิดพลาด"
                            : "ยังไม่มีตำแหน่ง"}
                    </div>
                  </div>
                  
                  {/* Product Details Card (Spans full width, not indented by icon) */}
                  {lookupRes.reason === "NO_LOCATION_IN_POG" && lookupRes.product && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-start gap-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สินค้า</div>
                        <div className="text-sm font-bold text-slate-900 leading-snug break-words">{lookupRes.product.name}</div>
                        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-2 text-[11px] text-slate-500">
                          <span>แบรนด์: {lookupRes.product.brand || "ทั่วไป"}</span>
                          <span>•</span>
                          <span>บาร์โค้ด: {scannedBarcode}</span>
                        </div>
                      </div>
                      {lookupRes.product.price != null && (
                        <div className="shrink-0 text-right">
                          <div className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">ราคา</div>
                          <div className="text-lg font-extrabold text-emerald-600">{lookupRes.product.price} บ.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {lookupRes.reason !== "BARCODE_NOT_FOUND" && (
                    <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestAction("add");
                          setPogRequestOpen(true);
                          setPopupOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        แจ้งเพิ่มตำแหน่ง
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-start gap-4 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สินค้า</div>
                      <div className="text-sm font-bold text-slate-900 leading-snug break-words">{lookupRes.product?.name || "-"}</div>
                      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-2 text-[11px] text-slate-500">
                        <span>แบรนด์: {lookupRes.product?.brand || "ทั่วไป"}</span>
                        <span>•</span>
                        <span>บาร์โค้ด: {scannedBarcode}</span>
                      </div>
                    </div>
                    {lookupRes.product?.price != null && (
                      <div className="shrink-0 text-right">
                        <div className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">ราคา</div>
                        <div className="text-lg font-extrabold text-emerald-600">{lookupRes.product.price} บ.</div>
                      </div>
                    )}
                  </div>

                  {primaryLoc ? (
                    <div className="border border-emerald-300 rounded-xl overflow-hidden mt-3 shadow-sm bg-white">
                      <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-55 bg-emerald-50 border-b border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-800 font-bold text-xs">ตำแหน่งบนชั้นวาง</span>
                      </div>

                      <div className="grid grid-cols-3 divide-x divide-emerald-100 text-center py-3 bg-emerald-50/20">
                        <div className="px-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shelf</span>
                          <span className="text-xl font-black text-emerald-650 text-emerald-600 mt-0.5 block">{primaryLoc.shelf_code}</span>
                        </div>
                        <div className="px-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">ชั้น</span>
                          <span className="text-xl font-black text-emerald-650 text-emerald-600 mt-0.5 block">{primaryLoc.shelf_row_number}</span>
                        </div>
                        <div className="px-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">ลำดับ</span>
                          <span className="text-xl font-black text-emerald-650 text-emerald-600 mt-0.5 block">{primaryLoc.shelf_index_number}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center font-bold">
                      ยังไม่ระบุตำแหน่งบนชั้นวาง
                    </div>
                  )}
                </>
              )}

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3.5">
                {!lookupLoading && lookupRes && lookupRes.found && (
                  primaryLoc ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRequestAction("");
                        setPogRequestOpen(true);
                        setPopupOpen(false);
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      แจ้งเปลี่ยน
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRequestAction("add");
                        setPogRequestOpen(true);
                        setPopupOpen(false);
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      แจ้งเพิ่มตำแหน่ง
                    </button>
                  )
                )}
                <button
                  className="sm:hidden px-3.5 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setPopupOpen(false);
                    setCameraOpen(true);
                  }}
                >
                  สแกนต่อ
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
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

// TemplateBarcodePanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../utils/axios";
import CameraBarcodeScannerModal from "./CameraBarcodeScannerModal";
import PogRequestModal from "./PogRequestModal";

const cx = (...a) => a.filter(Boolean).join(" ");

const TemplateBarcodePanel = ({ storecode, branchName, onGoShelf, availableShelves = [] }) => {
  const barcodeInputRef = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupRes, setLookupRes] = useState(null);

  // ✅ กล้อง + popup
  const [cameraOpen, setCameraOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [pogRequestOpen, setPogRequestOpen] = useState(false);
  const [requestAction, setRequestAction] = useState(""); // ✅ State for initial action

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
    setScannedBarcode("");
    setBarcodeError("");
    setLookupRes(null);
    setPopupOpen(false);
    requestAnimationFrame(() => barcodeInputRef.current?.focus?.());
  };

  const lookupByBarcode = async (bc) => {
    const code = String(bc || "").trim();
    if (!storecode || !code) return;
    if (code.length < 5) {
      setBarcodeError("บาร์โค้ดควรมีอย่างน้อย 5 ตัว");
      return;
    }

    setLookupLoading(true);
    setLookupRes(null);
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

  const onCameraDetected = React.useCallback((code) => {
    setCameraOpen(false);
    if (code.length < 5) {
      setBarcodeError("บาร์โค้ดควรมีอย่างน้อย 5 ตัว");
      setBarcode(code);
      return;
    }
    setBarcodeError("");
    setScannedBarcode(code);
    setBarcode(""); // ✅ เคลียร์ทันทีที่สแกน

    // เปิด popup ทันทีเพื่อโชว์สปิน
    setPopupOpen(true);

    // ยิง lookup รอ backend
    lookupByBarcode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPopupAndLookup = (bc) => {
    const code = String(bc || "").trim();
    if (!code) return;
    if (code.length < 5) {
      setBarcodeError("บาร์โค้ดควรมีอย่างน้อย 5 ตัว");
      return;
    }
    setBarcodeError("");
    setScannedBarcode(code);
    setBarcode(""); // ✅ เคลียร์ทันทีที่กดค้นหาเพื่อรับบาร์โค้ดถัดไป
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
        branchCode={storecode}
        branchName={branchName}
        barcode={scannedBarcode}
        productName={lookupRes?.product?.name}
        currentShelf={primaryLoc?.shelfCode}
        currentRow={primaryLoc?.rowNo}
        currentIndex={primaryLoc?.index}
        initialAction={requestAction}
        availableShelves={availableShelves}
      />

      <div className="bg-white border rounded-xl shadow-sm p-4">
        {/* ✅ Header: หัวข้อซ้าย + ปุ่มกล้องขวา */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold text-slate-800">ค้นหาสินค้าจากบาร์โค้ด</div>
            <div className="text-sm text-slate-500 mt-1">
              สแกนบาร์โค้ดเพื่อค้นหาสินค้า
            </div>
          </div>
          {/* ✅ ปุ่มกล้อง มุมบนขวา เฉพาะมือถือ */}
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="sm:hidden w-10 h-10 rounded-lg text-lg  text-white transition-colors flex items-center justify-center shadow-sm shrink-0 ml-3"
            title="ใช้กล้องสแกน"
          >
            📷
          </button>
        </div>

        {/* ✅ แถบแดงบอกสถานะ Scanner Ready (เฉพาะบน PC) */}
        <div className="hidden sm:flex mt-3 items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-xs font-semibold text-red-700">พร้อมรับสแกนจากเครื่องยิงบาร์โค้ด</span>
        </div>

        {/* ✅ ช่องกรอก + ปุ่มค้นหา */}
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
                ✕
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

      {/* Popup ผลลัพธ์ */}
      {popupOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPopupOpen(false)} />
          <div className="relative w-[94vw] max-w-xl bg-white rounded-2xl shadow-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">ผลการสแกน</div>
                {/* แสดงชื่อสาขา */}
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

            {/* สปินตอนรอ backend */}
            {lookupLoading || !lookupRes ? (
              <div className="mt-4 p-4 rounded-xl border bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">กำลังดึงข้อมูลจากระบบ…</div>
                    <div className="text-xs text-slate-500 mt-1">
                      บาร์โค้ด: <span className="font-semibold text-slate-700">{scannedBarcode || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !lookupRes.found ? (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">❌</div>
                  <div>
                    <div className="text-sm font-bold text-rose-700">
                      {lookupRes.reason === "BARCODE_NOT_FOUND"
                        ? "ไม่พบสินค้านี้ในระบบร้านค้า"
                        : "ไม่พบข้อมูลตำแหน่งสินค้า"}
                    </div>
                    <div className="text-xs text-rose-600 mt-1">
                      {lookupRes.reason === "BARCODE_NOT_FOUND"
                        ? "สินค้านี้ยังไม่มีข้อมูลในระบบ"
                        : reasonText(lookupRes.reason)}
                    </div>

                    {/* ✅ แสดงสินค้าที่พบ (แต่ไม่มี Location) */}
                    {lookupRes.reason === "NO_LOCATION_IN_POG" && lookupRes.product && (
                      <div className="mt-2 p-2 bg-rose-50 rounded border text-slate-700">
                        <div className="font-semibold">{lookupRes.product.name}</div>
                        <div className="text-xs text-slate-500">
                          {lookupRes.product.brand && <span>{lookupRes.product.brand}</span>}
                          {lookupRes.product.price && <span> • ราคา: {lookupRes.product.price}</span>}
                        </div>
                      </div>
                    )}

                    {/* ✅ ปุ่มแจ้งเพิ่มสินค้า (เฉพาะกรณีมีสินค้าในระบบแต่ไม่มี Location) */}
                    {lookupRes.reason !== "BARCODE_NOT_FOUND" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRequestAction("add"); // ✅ Pre-select 'add'
                          setPogRequestOpen(true);
                          setPopupOpen(false); // ✅ Close popup
                        }}
                        className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm"
                      >
                        แจ้งเพิ่มสินค้านี้
                      </button>
                    )}
                  </div>
                </div>
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

                                      </div>
                )}
              </>
            )}

            <div className="mt-4 flex justify-end gap-2">
              {primaryLoc && (
                <button
                  type="button"
                  onClick={() => {
                    setRequestAction(""); // ✅ Default (user selects)
                    setPogRequestOpen(true);
                    setPopupOpen(false); // ✅ Close popup
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-300"
                >
                  แจ้งขอเปลี่ยน
                </button>
              )}
              <button
                className="sm:hidden px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-slate-50"
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

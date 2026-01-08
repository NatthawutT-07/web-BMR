// CameraBarcodeScannerModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import Tesseract from "tesseract.js";

const cx = (...a) => a.filter(Boolean).join(" ");

export default function CameraBarcodeScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  // กันสแกนซ้ำรัว ๆ
  const lastRef = useRef({ code: "", ts: 0 });

  const [err, setErr] = useState(null);

  // ✅ โชว์ตัวเลขที่อ่านได้ระหว่างสแกน
  const [liveText, setLiveText] = useState("");
  const [liveDigits, setLiveDigits] = useState("");
  const [isOcrMode, setIsOcrMode] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setErr(null);
    setLiveText("");
    setLiveDigits("");

    // ✅ จำกัดฟอร์แมตที่ใช้จริงในร้าน
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ]);

    const reader = new BrowserMultiFormatReader(hints, 80); // 80ms interval
    readerRef.current = reader;

    let stopped = false;

    const start = async () => {
      try {
        await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result, _error) => {
            if (stopped) return;
            if (!result) return;

            const raw = String(result.getText() || "").trim();
            if (!raw) return;

            // ✅ ไม่ตัดตัวอักษรแล้ว (รับ CNS..., MM...)
            setLiveText(raw);
            setLiveDigits(raw);

            // cooldown กันเด้งซ้ำ
            const now = Date.now();
            if (lastRef.current.code === raw && now - lastRef.current.ts < 1200) return;
            lastRef.current = { code: raw, ts: now };

            onDetected?.(raw);
          }
        );
      } catch (e) {
        console.error("camera start error:", e);
        setErr(
          e?.name === "NotAllowedError"
            ? "ไม่ได้อนุญาตใช้กล้อง (Allow Camera ก่อน)"
            : e?.name === "NotFoundError"
              ? "ไม่พบกล้องในอุปกรณ์"
              : "เปิดกล้องไม่สำเร็จ"
        );
      }
    };

    start();

    return () => {
      stopped = true;
      try {
        readerRef.current?.reset?.();
      } catch { }
      readerRef.current = null;
    };
  }, [open, onDetected]);

  useEffect(() => {
    // รีเซ็ต OCR mode เมื่อเปิดใหม่
    setIsOcrMode(false);
    setOcrLoading(false);

    // ถ้าผ่านไป 2 วินาทีแล้วยังสแกนไม่ได้ ให้ลองเปิด OCR
    const timer = setTimeout(() => {
      // เช็คว่ายังเปิดอยู่และยังไม่ได้ผลลัพธ์ (จริงๆ component จะ unmount ถ้าได้ผลแล้ว แต่กันไว้)
      if (open && !lastRef.current.code) {
        setIsOcrMode(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [open]);

  // Logic OCR
  useEffect(() => {
    if (!isOcrMode || !open) return;

    let intervalId;
    let busy = false;

    const runOcr = async () => {
      if (busy || !videoRef.current) return;
      // ถ้าวิดีโอไม่พร้อม
      if (videoRef.current.readyState < 2) return;

      busy = true;
      setOcrLoading(true);
      try {
        // สร้าง canvas ชั่วคราวตัดภาพมา OCR
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // แปลงเป็นภาพ base64 หรือส่ง canvas ให้ tesseract โดยตรง
        const res = await Tesseract.recognize(canvas, "eng", {
          // logger: m => console.log(m)
        });

        const text = res?.data?.text || "";
        // ลองหา pattern ที่น่าจะเป็นรหัสสินค้า เช่น ตัวเลข 5 หลักขึ้นไป หรือ CNS...
        // ตัวอย่าง regex อย่างง่าย: เจอคำที่มีตัวเลขและยาว >= 5
        const words = text.split(/\s+/);
        for (let w of words) {
          const clean = w.replace(/[^a-zA-Z0-9]/g, ""); // ตัดอักขระพิเศษ
          if (clean.length >= 5) {
            // เจอสิ่งที่น่าจะเป็นรหัส
            console.log("OCR Match:", clean);
            if (clean !== lastRef.current.code) {
              lastRef.current = { code: clean, ts: Date.now() };
              onDetected?.(clean);
              setLiveText("OCR: " + clean);
            }
            break;
          }
        }
      } catch (e) {
        console.error("OCR error", e);
      } finally {
        busy = false;
        setOcrLoading(false);
      }
    };

    intervalId = setInterval(runOcr, 1500); // OCR ทุก 1.5 วิ เพราะมันหนัก

    return () => clearInterval(intervalId);
  }, [isOcrMode, open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-[94vw] max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <div className="text-sm font-semibold text-slate-800">สแกนบาร์โค้ดด้วยกล้อง</div>
            <div className="text-xs text-slate-500">เล็งบาร์โค้ดให้อยู่ในกรอบแนวนอน</div>
          </div>
          <button
            className="px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-slate-50"
            onClick={onClose}
          >
            ปิด
          </button>
        </div>

        <div className="p-3">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full aspect-[3/4] object-cover" muted playsInline />

            {/* ✅ กรอบสแกน “แนวนอน” สำหรับบาร์โค้ด */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={cx(
                  "w-[86%] max-w-[380px]",
                  "h-[22%] max-h-[120px]",
                  "rounded-2xl border-2 border-white/85",
                  "shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]"
                )}
              />
            </div>

            {/* ✅ แถบโชว์ตัวเลขที่อ่านได้ */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/55">
              <div className="text-[11px] text-white/80">
                {isOcrMode ? "กำลังอ่านข้อความ (OCR)..." : "ตัวเลขบาร์โค้ด"}
              </div>
              <div className="text-2xl font-extrabold text-white tracking-wider">
                {liveDigits || (liveText ? liveText : (isOcrMode ? "Scanning Text..." : "กำลังอ่าน..."))}
              </div>
            </div>

            {/* Loading OCR indicator */}
            {ocrLoading && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                OCR...
              </div>
            )}
          </div>

          {err && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-sm font-semibold text-rose-700">เปิดกล้องไม่สำเร็จ</div>
              <div className="text-xs text-rose-700 mt-1">{err}</div>
              <div className="text-[11px] text-rose-700 mt-2">
                {/* * บนมือถือ ต้องเป็น HTTPS (ยกเว้น localhost) */}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-slate-500">
            เคล็ดลับ: ให้บาร์โค้ดอยู่กลางกรอบ, แสงพอ, ขยับเข้า-ออกเล็กน้อยช่วยโฟกัส
          </div>
        </div>
      </div>
    </div>
  );
}

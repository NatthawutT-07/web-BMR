// CameraBarcodeScannerModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

const cx = (...a) => a.filter(Boolean).join(" ");

const POSSIBLE_BARCODE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
];

const normalizeBarcodeText = (value) => {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  return {
    raw,
    digits,
    code: digits || raw,
  };
};

export default function CameraBarcodeScannerModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  const lastRef = useRef({ code: "", ts: 0 });

  const [err, setErr] = useState(null);

  const [liveText, setLiveText] = useState("");
  const [liveDigits, setLiveDigits] = useState("");

  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onDetectedRef.current = onDetected;
    onCloseRef.current = onClose;
  }, [onDetected, onClose]);

  useEffect(() => {
    if (!open) return;

    setErr(null);
    setLiveText("");
    setLiveDigits("");

    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, POSSIBLE_BARCODE_FORMATS);

    const reader = new BrowserMultiFormatReader(hints, 500);
    readerRef.current = reader;

    let stopped = false;
    let mediaStream = null;
    const videoElement = videoRef.current;

    const start = async () => {
      try {
        if (!videoElement) return;

        await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoElement,
          (result) => {
            if (stopped) return;
            if (!result) return;

            const { raw, digits, code } = normalizeBarcodeText(result.getText());
            if (!code) return;

            setLiveText(raw);
            setLiveDigits(digits);

            const now = Date.now();
            if (lastRef.current.code === code && now - lastRef.current.ts < 1200) return;
            lastRef.current = { code, ts: now };

            onDetectedRef.current?.(code);

            setTimeout(() => {
              onCloseRef.current?.();
            }, 100);
          }
        );

        if (videoElement.srcObject) {
          mediaStream = videoElement.srcObject;
        }
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
      } catch (err) {
        console.warn("ZXing reader reset failed", err);
      }
      readerRef.current = null;

      try {
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => {
            track.stop();
          });
        }
        if (videoElement?.srcObject) {
          const stream = videoElement.srcObject;
          stream.getTracks().forEach(track => track.stop());
          videoElement.srcObject = null;
        }
      } catch (e) {
        console.error("cleanup video tracks error:", e);
      }

      setLiveText("");
      setLiveDigits("");
    };
  }, [open]);

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
            <video ref={videoRef} className="w-full aspect-[3/4] object-cover" autoPlay muted playsInline />

            {/*  กรอบสแกน “แนวนอน” สำหรับบาร์โค้ด */}
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

            {/*  แถบโชว์ตัวเลขที่อ่านได้ */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/55">
              <div className="text-[11px] text-white/80">ตัวเลขบาร์โค้ด</div>
              <div className="text-2xl font-extrabold text-white tracking-wider">
                {liveDigits || (liveText ? liveText : "กำลังอ่าน...")}
              </div>
            </div>
          </div>

          {err && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-sm font-semibold text-rose-700">เปิดกล้องไม่สำเร็จ</div>
              <div className="text-xs text-rose-700 mt-1">{err}</div>
              <div className="text-[11px] text-rose-700 mt-2">
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

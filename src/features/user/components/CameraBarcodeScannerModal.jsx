// CameraBarcodeScannerModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

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

  useEffect(() => {
    if (!open) return;

    setErr(null);
    setLiveText("");
    setLiveDigits("");

    // ✅ จำกัดฟอร์แมตที่ใช้จริงในร้าน + เปิดโหมด TryHarder
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true); // ✅ พยายามอ่านให้ละเอียดขึ้น (ช้าลงนิดนึงแต่แม่นขึ้น)

    const reader = new BrowserMultiFormatReader(hints, 500); // ✅ สแกนทุก 500ms (ลดภาระ CPU ให้มีเวลาโฟกัส)
    readerRef.current = reader;

    let stopped = false;

    const start = async () => {
      try {
        await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: "environment", // ✅ ใช้กล้องหลัง
              width: { min: 1280, ideal: 1920 }, // ✅ ขอความละเอียดสูงขึ้นให้เห็นเส้นบาร์โค้ดชัด
              height: { min: 720, ideal: 1080 },
              focusMode: { ideal: "continuous" }, // ✅ พยายามขอโฟกัสต่อเนื่อง
            },
          },
          videoRef.current,
          (result, _error) => {
            if (stopped) return;
            if (!result) return;

            // ✅ Check Bounding Box (Scan Area Only)
            // resultPoints คืนค่าเป็น [Point {x, y}, ... ] ของตำแหน่งบาร์โค้ดใน video frame
            const points = result.getResultPoints();
            if (points && points.length > 0 && videoRef.current) {
              // หาค่า x, y ของจุดที่เจอ (เฉลี่ยตรงกลางของบาร์โค้ด)
              const xs = points.map(p => p.x);
              const ys = points.map(p => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;

              // ขนาด video จริง (internal resolution)
              const vW = videoRef.current.videoWidth;
              const vH = videoRef.current.videoHeight;

              if (vW > 0 && vH > 0) {
                // กำหนด "Zone" ตรงกลาง (ประมาณ 20% - 80% แกน X, 35% - 65% แกน Y ตาม UI กรอบ)
                // ถ้าอยู่นอกโซนนี้ ให้ ignore
                const safeZoneX_Min = vW * 0.15;
                const safeZoneX_Max = vW * 0.85;
                const safeZoneY_Min = vH * 0.30;
                const safeZoneY_Max = vH * 0.70;

                const isInside =
                  centerX >= safeZoneX_Min && centerX <= safeZoneX_Max &&
                  centerY >= safeZoneY_Min && centerY <= safeZoneY_Max;

                if (!isInside) {
                  // console.log("Ignored: Outside Box", centerX, centerY);
                  return; // ❌ ไม่อยู่ในกรอบ -> ข้าม
                }
              }
            }

            const raw = String(result.getText() || "").trim();
            if (!raw) return;

            // ✅ เอาเฉพาะตัวเลข (EAN/UPC จะเป็นเลขล้วน)
            const digits = raw.replace(/\D/g, "");
            setLiveText(raw);
            setLiveDigits(digits);

            // cooldown กันเด้งซ้ำ
            const now = Date.now();
            const key = digits || raw;
            if (lastRef.current.code === key && now - lastRef.current.ts < 1200) return;
            lastRef.current = { code: key, ts: now };

            // ✅ ส่งกลับเป็น "ตัวเลข" ก่อน ถ้าไม่มีเลขค่อยส่ง raw
            onDetected?.(digits || raw);
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

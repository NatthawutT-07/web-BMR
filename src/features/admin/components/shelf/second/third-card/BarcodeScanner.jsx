import React, { useRef, useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

/**
 * BarcodeScanner - เปิดกล้องและสแกน barcode
 * @param {Function} onDetected - callback เมื่อสแกนได้ (barcode: string)
 * @param {Function} onClose - callback เมื่อปิด scanner
 */
const BarcodeScanner = ({ onDetected, onClose }) => {
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
    const detectedRef = useRef(false); // ✅ ป้องกันการ detect ซ้ำ
    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(true);

    // ✅ ฟังก์ชันหยุดกล้อง
    const stopScanner = () => {
        // หยุด decoding controls
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        // หยุด video stream
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setScanning(false);
    };

    const handleClose = () => {
        stopScanner();
        onClose?.();
    };

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();
        detectedRef.current = false;

        const startScanning = async () => {
            try {
                setError("");

                // ขอ permission กล้อง
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }, // กล้องหลัง
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                // เริ่มสแกน - เก็บ controls ไว้เพื่อ stop ได้
                controlsRef.current = await codeReader.decodeFromVideoElement(
                    videoRef.current,
                    (result, err) => {
                        // ✅ ถ้าสแกนได้แล้ว ไม่ทำซ้ำ
                        if (detectedRef.current) return;

                        if (result) {
                            const barcode = result.getText();
                            // ✅ รับเฉพาะ barcode ที่มี 5-13 ตัวอักษร
                            if (barcode && barcode.length >= 5 && barcode.length <= 13) {
                                detectedRef.current = true; // ✅ Mark as detected
                                stopScanner();
                                onDetected?.(barcode);
                            }
                        }
                        // ไม่ต้อง handle error ทุกครั้ง เพราะจะยิงบ่อยมาก
                    }
                );
            } catch (err) {
                console.error("Camera error:", err);
                if (err.name === "NotAllowedError") {
                    setError("กรุณาอนุญาตการเข้าถึงกล้อง");
                } else if (err.name === "NotFoundError") {
                    setError("ไม่พบกล้องในอุปกรณ์นี้");
                } else {
                    setError(`เกิดข้อผิดพลาด: ${err.message}`);
                }
                setScanning(false);
            }
        };

        startScanning();

        // Cleanup เมื่อ unmount
        return () => {
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Empty dependency - run once only

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60]">
            {/* Header */}
            <div className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white">
                <h3 className="text-lg font-semibold">📷 สแกน Barcode</h3>
                <button
                    onClick={handleClose}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                >
                    ✕ ปิด
                </button>
            </div>

            {/* Camera Preview */}
            <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden mx-4">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                />

                {/* Scan Guide */}
                {scanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3/4 h-1/2 border-2 border-green-400 rounded-lg">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                        </div>
                    </div>
                )}

                {/* Scanning indicator */}
                {scanning && !error && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-black/60 text-white px-3 py-1 rounded text-sm animate-pulse">
                            กำลังสแกน... (รับ 5-13 หลัก)
                        </span>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded max-w-md text-center">
                    {error}
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-white text-sm text-center px-4">
                <p>วาง barcode ให้อยู่ในกรอบสีเขียว</p>
                <p className="text-gray-400 mt-1">รองรับ barcode 5-13 หลัก</p>
            </div>
        </div>
    );
};

export default BarcodeScanner;

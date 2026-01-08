// PogRequestModal.jsx - Modal สำหรับสร้าง Request เปลี่ยนแปลง POG
import React, { useState } from "react";
import api from "../../../utils/axios";

const cx = (...a) => a.filter(Boolean).join(" ");

const ACTION_OPTIONS = [
    { value: "add", label: "เพิ่มสินค้า", desc: "เพิ่มสินค้านี้ไปยังตำแหน่งใหม่" },
    { value: "move", label: "ย้ายตำแหน่ง", desc: "ย้ายสินค้านี้ไปตำแหน่งอื่น (แทรก)" },
    { value: "delete", label: "ลบสินค้า", desc: "ลบสินค้าออกจากตำแหน่งปัจจุบัน" },
];

export default function PogRequestModal({
    open,
    onClose,
    branchCode,
    barcode,
    productName,
    currentShelf,
    currentRow,
    currentIndex,
    initialAction = "",
}) {
    const [action, setAction] = useState(initialAction);
    const [toShelf, setToShelf] = useState(currentShelf || "");
    const [toRow, setToRow] = useState("");
    const [toIndex, setToIndex] = useState("");
    const [swapBarcode, setSwapBarcode] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const resetForm = () => {
        setAction(initialAction || "");
        setToShelf(currentShelf || "");
        setToRow("");
        setToIndex("");
        setSwapBarcode("");
        setNote("");
        setError("");
        setSuccess(false);
    };

    // Reset action when initialAction changes
    React.useEffect(() => {
        if (initialAction) setAction(initialAction);
    }, [initialAction]);

    const handleClose = () => {
        resetForm();
        onClose?.();
    };

    const handleSubmit = async () => {
        if (!action) {
            setError("กรุณาเลือกประเภทการเปลี่ยนแปลง");
            return;
        }

        if ((action === "add" || action === "move") && (!toShelf || !toRow || !toIndex)) {
            setError("กรุณาระบุตำแหน่งปลายทางให้ครบถ้วน");
            return;
        }

        if ((action === "add" || action === "move") && (Number(toRow) <= 0 || Number(toIndex) <= 0)) {
            setError("ตำแหน่ง Row และ Index ต้องมากกว่า 0");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await api.post("/pog-request", {
                branchCode,
                action,
                barcode,
                branchCode,
                action,
                barcode,
                productName,
                fromShelf: currentShelf,
                fromRow: currentRow,
                fromIndex: currentIndex,
                toShelf: action !== "delete" ? toShelf : null,
                toRow: action !== "delete" ? Number(toRow) : null,
                toIndex: action !== "delete" ? Number(toIndex) : null,
                swapBarcode: null,
                note,
            });

            setSuccess(true);
        } catch (e) {
            console.error("POG request error:", e);
            // Handle JSON string in message
            let msg = e?.response?.data?.message;
            if (typeof msg === 'string' && msg.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(msg);
                    msg = parsed.message || msg;
                } catch { }
            }
            setError(msg || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <div className="relative w-[94vw] max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-amber-50">
                    <div>
                        <div className="text-base font-semibold text-amber-800">แจ้งขอเปลี่ยนแปลง</div>
                        <div className="text-sm text-amber-700 mt-0.5">สาขา: {branchCode}</div>
                    </div>
                    <button
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-white hover:bg-slate-50"
                        onClick={handleClose}
                    >
                        ปิด
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">✅</div>
                            <div className="text-lg font-semibold text-emerald-700">ส่งคำขอสำเร็จ!</div>
                            <div className="text-sm text-slate-600 mt-1">รอดำเนินการ</div>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                            >
                                ปิด
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Product Info */}
                            <div className="p-3 rounded-xl bg-slate-50 border">
                                <div className="text-sm text-slate-500">สินค้าที่เลือก</div>
                                <div className="text-base font-semibold text-slate-800 mt-1">{productName || "-"}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                    บาร์โค้ด: {barcode}
                                    {currentShelf && (
                                        <> • ตำแหน่งปัจจุบัน: {currentShelf} / ชั้น {currentRow} / ลำดับ {currentIndex}</>
                                    )}
                                </div>
                            </div>

                            {/* Action Selection */}
                            <div>
                                <div className="text-sm font-semibold text-slate-800 mb-2">เลือกประเภทการเปลี่ยนแปลง</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                                    {ACTION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setAction(opt.value)}
                                            className={cx(
                                                "w-full text-left p-3 rounded-xl border-2 transition",
                                                action === opt.value
                                                    ? "border-amber-500 bg-amber-50"
                                                    : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="font-semibold text-sm">{opt.label}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Position (for add/swap) */}
                            {(action === "add" || action === "move") && (
                                <div className="p-3 rounded-xl border bg-blue-50 space-y-3">
                                    <div className="text-sm font-semibold text-blue-800">
                                        {action === "add" ? "ตำแหน่งที่ต้องการเพิ่ม" : "ตำแหน่งปลายทาง (ย้ายไป)"}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-sm text-slate-600">ชั้นวาง</label>
                                            <input
                                                type="text"
                                                value={toShelf}
                                                onChange={(e) => setToShelf(e.target.value.toUpperCase())}
                                                placeholder="W1"
                                                className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-600">ชั้นที่</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={toRow}
                                                onChange={(e) => setToRow(e.target.value)}
                                                placeholder="1"
                                                className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-600">ลำดับ</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={toIndex}
                                                onChange={(e) => setToIndex(e.target.value)}
                                                placeholder="5"
                                                className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}



                            {/* Note */}
                            <div>
                                <label className="text-sm font-semibold text-slate-800">หมายเหตุ (ถ้ามี)</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="ระบุเหตุผลหรือรายละเอียดเพิ่มเติม..."
                                    rows={2}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm border bg-white hover:bg-slate-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || !action}
                                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
                                >
                                    {loading ? "กำลังส่ง..." : "ส่งคำขอ"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

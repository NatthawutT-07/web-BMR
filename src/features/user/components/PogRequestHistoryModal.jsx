// PogRequestHistoryModal.jsx - Modal แสดงประวัติ Request (Compact Table)
import React, { useEffect, useState } from "react";
import api from "../../../utils/axios";

const cx = (...a) => a.filter(Boolean).join(" ");

const STATUS_MAP = {
    pending: { label: "รอดำเนินการ", color: "text-amber-600 bg-amber-50 border-amber-200" },
    approved: { label: "อนุมัติ", color: "text-blue-600 bg-blue-50 border-blue-200" },
    rejected: { label: "ไม่อนุมัติ", color: "text-rose-600 bg-rose-50 border-rose-200" },
    completed: { label: "เสร็จสิ้น", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "ยกเลิก", color: "text-slate-500 bg-slate-100 border-slate-300" },
};

const ACTION_MAP = {
    add: "เพิ่ม",
    move: "ย้าย",
    swap: "สลับ",
    delete: "ลบ",
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function PogRequestHistoryModal({ open, onClose, branchCode }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null); // ✅ เก็บ id ที่กำลังยกเลิก

    const loadData = async () => {
        if (!branchCode) return;
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/pog-request", {
                params: { branchCode },
            });
            setData(res.data?.data || []);
        } catch (e) {
            console.error("Load history error:", e);
            setError("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm("คุณต้องการยกเลิกคำขอนี้ใช่หรือไม่?")) return;
        setCancellingId(id); // ✅ เริ่ม loading
        try {
            const res = await api.patch(`/pog-request/${id}/cancel`);
            if (res.data?.ok) {
                // ✅ อัปเดต local state แทนการเรียก API ใหม่
                setData(prev => prev.map(item =>
                    item.id === id ? { ...item, status: "cancelled" } : item
                ));
            }
        } catch (e) {
            console.error("Cancel error:", e);
            let msg = e?.response?.data?.message;
            if (typeof msg === 'string' && msg.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(msg);
                    msg = parsed.message || msg;
                } catch { }
            }
            alert(msg || "ไม่สามารถยกเลิกคำขอได้");
        } finally {
            setCancellingId(null); // ✅ หยุด loading
        }
    };

    useEffect(() => {
        if (open) loadData();
    }, [open, branchCode]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-[95vw] max-w-7xl bg-white rounded-xl shadow-xl border overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 shrink-0">
                    <div>
                        <div className="text-base font-semibold text-slate-800">📋 ประวัติคำขอ (ทั้งหมด {data.length})</div>
                        <div className="text-xs text-slate-500">สาขา: {branchCode}</div>
                    </div>
                    <button
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">กำลังโหลด...</div>
                    ) : error ? (
                        <div className="text-center py-12 text-rose-600">{error}</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">ไม่มีประวัติ</div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-600 font-medium sticky top-0 z-10 shadow-sm text-xs">
                                <tr>
                                    <th className="px-3 py-2 text-center w-[100px] whitespace-nowrap">สถานะ</th>
                                    <th className="px-3 py-2 text-center w-[60px]">Action</th>
                                    <th className="px-3 py-2">สินค้า</th>
                                    <th className="px-3 py-2">ตำแหน่ง</th>
                                    <th className="px-3 py-2 text-right w-[110px]">เวลา</th>
                                    <th className="px-3 py-2 w-[40px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((item) => {
                                    const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            {/* Status */}
                                            <td className="px-2 py-2 text-center align-middle">
                                                <span className={cx("px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap", statusInfo.color)}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className="px-2 py-2 text-center align-middle font-medium text-slate-700">
                                                {ACTION_MAP[item.action] || item.action}
                                            </td>

                                            {/* Product */}
                                            <td className="px-3 py-2 align-middle">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <span className="font-medium text-slate-800" title={item.productName}>
                                                        {item.productName || "-"}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 font-mono">
                                                        ({item.barcode})
                                                    </span>
                                                    {item.swapBarcode && (
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded border">
                                                            ⇄ {item.swapBarcode}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.note && (
                                                    <div className="text-[11px] text-amber-600 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded mt-1 max-w-[300px] truncate" title={item.note}>
                                                        Note: {item.note}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Location */}
                                            <td className="px-3 py-2 align-middle text-xs text-slate-600 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {item.fromShelf && (
                                                        <span>
                                                            <span className="text-slate-400">จาก:</span> {item.fromShelf}/{item.fromRow}/{item.fromIndex}
                                                        </span>
                                                    )}
                                                    {item.fromShelf && item.toShelf && <span className="text-slate-300">→</span>}
                                                    {item.toShelf && (
                                                        <span>
                                                            <span className="text-slate-400">ไป:</span> {item.toShelf}/{item.toRow}/{item.toIndex}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-3 py-2 text-right align-middle text-xs text-slate-400 font-mono whitespace-nowrap">
                                                {formatDateShort(item.createdAt)}
                                            </td>

                                            {/* Action Button */}
                                            <td className="px-2 py-2 text-center align-middle">
                                                {item.status === "pending" && (
                                                    cancellingId === item.id ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500">
                                                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>

                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCancel(item.id)}
                                                            className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 hover:border-rose-300 transition"
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div >
    );
}

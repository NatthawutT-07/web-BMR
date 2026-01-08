// PogRequestHistoryModal.jsx - Modal แสดงประวัติ Request (Compact Table)
import React, { useEffect, useState } from "react";
import api from "../../../utils/axios";

const cx = (...a) => a.filter(Boolean).join(" ");

const STATUS_MAP = {
    pending: { label: "รอ", color: "text-amber-600 bg-amber-50 border-amber-200" },
    approved: { label: "อนุมัติ", color: "text-blue-600 bg-blue-50 border-blue-200" },
    rejected: { label: "ปฏิเสธ", color: "text-rose-600 bg-rose-50 border-rose-200" },
    completed: { label: "เสร็จ", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
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

    useEffect(() => {
        if (open) loadData();
    }, [open, branchCode]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-[95vw] max-w-4xl bg-white rounded-xl shadow-xl border overflow-hidden max-h-[90vh] flex flex-col">
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
                                    <th className="px-3 py-2 text-center w-[80px]">สถานะ</th>
                                    <th className="px-3 py-2 text-center w-[60px]">Action</th>
                                    <th className="px-3 py-2">สินค้า</th>
                                    <th className="px-3 py-2">ตำแหน่ง</th>
                                    <th className="px-3 py-2 text-right w-[110px]">เวลา</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((item) => {
                                    const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            {/* Status */}
                                            <td className="px-2 py-2 text-center align-top">
                                                <span className={cx("px-2 py-1 rounded text-[10px] font-bold border", statusInfo.color)}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className="px-2 py-2 text-center align-top font-medium text-slate-700">
                                                {ACTION_MAP[item.action] || item.action}
                                            </td>

                                            {/* Product */}
                                            <td className="px-3 py-2 align-top">
                                                <div className="font-medium text-slate-800 line-clamp-1" title={item.productName}>
                                                    {item.productName || "-"}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                    {item.barcode}
                                                </div>
                                                {item.note && (
                                                    <div className="text-[11px] text-amber-600 mt-0.5">
                                                        Note: {item.note}
                                                    </div>
                                                )}
                                                {item.swapBarcode && (
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        &rarr; ต้องสลับกับ: {item.swapBarcode}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Location */}
                                            <td className="px-3 py-2 align-top text-xs text-slate-600">
                                                {item.fromShelf ? (
                                                    <div>
                                                        <span className="text-slate-400">จาก:</span> {item.fromShelf}/{item.fromRow}/{item.fromIndex}
                                                    </div>
                                                ) : null}
                                                {item.toShelf ? (
                                                    <div>
                                                        <span className="text-slate-400">ไป: </span> {item.toShelf}/{item.toRow}/{item.toIndex}
                                                    </div>
                                                ) : null}
                                            </td>

                                            {/* Date */}
                                            <td className="px-3 py-2 text-right align-top text-xs text-slate-400 font-mono whitespace-nowrap">
                                                {formatDateShort(item.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

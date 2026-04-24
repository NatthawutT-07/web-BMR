import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Clock, Package, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/axios';

const ACTION_MAP = {
    add: { label: 'นำสินค้าเข้า', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    delete: { label: 'นำสินค้าออก', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    move: { label: 'เปลี่ยนตำแหน่ง', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
};

export default function ShelfChangeNotification({ branchCode }) {
    const [open, setOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [ackingId, setAckingId] = useState(null);
    const [ackingAll, setAckingAll] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const fetchLogs = useCallback(async () => {
        if (!branchCode) return;
        setLoading(true);
        try {
            // Get unacknowledged logs
            const res = await api.get(`/shelf-change-logs/${branchCode}?limit=50`);
            if (res.ok) {
                const pendingLogs = res.data || [];
                setLogs(pendingLogs);
                setUnacknowledgedCount(res.meta?.unacknowledgedCount || pendingLogs.length);
            }
        } catch (error) {
            console.error('Fetch shelf change logs error:', error);
        } finally {
            setLoading(false);
        }
    }, [branchCode]);

    // Initial fetch and polling
    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [fetchLogs]);

    // Fetch on open
    useEffect(() => {
        if (open) fetchLogs();
    }, [open, fetchLogs]);

    const handleAcknowledgeOne = async (id) => {
        setAckingId(id);
        try {
            await api.post(`/shelf-change-log-acknowledge/${id}`);
            setLogs(prev => prev.filter(log => log.id !== id));
            setUnacknowledgedCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Acknowledge error:', error);
        } finally {
            setAckingId(null);
        }
    };

    const handleAcknowledgeAll = async () => {
        if (!logs.length) return;
        setAckingAll(true);
        try {
            await api.post(`/shelf-change-logs-acknowledge-all/${branchCode}`);
            setLogs([]);
            setUnacknowledgedCount(0);
        } catch (error) {
            console.error('Acknowledge all error:', error);
        } finally {
            setAckingAll(false);
            setOpen(false);
        }
    };

    if (!branchCode) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-full hover:bg-white/20 transition-colors text-white flex items-center justify-center"
                title="การแจ้งเตือนการปรับผัง"
            >
                <Bell size={20} />
                {unacknowledgedCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-rose-500 rounded-full min-w-[18px]">
                        {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[28rem] sm:w-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-slate-800 text-base">การอัปเดต POG จากส่วนกลาง</h3>
                            <span className="text-sm text-slate-500 mt-0.5">รอรับทราบ {unacknowledgedCount} รายการ</span>
                        </div>
                        {logs.length > 0 && (
                            <button
                                onClick={handleAcknowledgeAll}
                                disabled={ackingAll}
                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                                {ackingAll ? 'กำลังบันทึก...' : 'รับทราบทั้งหมด'}
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 p-3 bg-white" style={{ maxHeight: '65vh' }}>
                        {loading && logs.length === 0 ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <CheckCircle2 size={40} className="text-emerald-300 mb-3" />
                                <p className="text-base font-medium">ไม่มีรายการค้างรับทราบ</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {logs.map(log => {
                                    const actionConf = ACTION_MAP[log.action] || ACTION_MAP.move;
                                    return (
                                        <div key={log.id} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition group bg-white">
                                            {/* Top bar: Action + Shelf + Ack button */}
                                            <div className="flex justify-between items-center mb-3 gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${actionConf.bg}`}>
                                                        {actionConf.label}
                                                    </span>
                                                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                                        Shelf: {log.shelfCode}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleAcknowledgeOne(log.id)}
                                                    disabled={ackingId === log.id}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50 flex shrink-0 transition"
                                                    title="รับทราบ"
                                                >
                                                    {ackingId === log.id ? (
                                                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Check size={20} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Product Name */}
                                            <div className="flex items-start gap-2.5 mb-3">
                                                <Package size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-base font-semibold text-slate-800 line-clamp-1" title={log.productName}>
                                                        {log.productName || `รหัส ${log.codeProduct}`}
                                                    </span>
                                                    {log.productName && (
                                                        <span className="text-xs text-slate-500 font-mono mt-0.5">
                                                            {log.codeProduct}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Position Info — Card style like search result */}
                                            {log.action === 'add' ? (
                                                <div className="border-2 border-emerald-300 rounded-2xl overflow-hidden">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-b border-emerald-200">
                                                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-200">
                                                            <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                        </div>
                                                        <span className="text-emerald-700 font-bold text-xs">เพิ่มที่</span>
                                                    </div>
                                                    <div className="flex items-center justify-around px-4 py-4 bg-white">
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-1">Shelf</span>
                                                            <span className="text-lg font-bold text-slate-800">{log.shelfCode}</span>
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-100"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-1">ชั้นที่</span>
                                                            <span className="text-xl font-extrabold text-emerald-700">{log.toRow}</span>
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-100"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-1">ตำแหน่ง</span>
                                                            <span className="text-xl font-extrabold text-emerald-700">{log.toIndex}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : log.action === 'delete' ? (
                                                <div className="border-2 border-rose-300 rounded-2xl overflow-hidden">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border-b border-rose-200">
                                                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-200">
                                                            <svg className="w-3 h-3 text-rose-700" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                                                        </div>
                                                        <span className="text-rose-700 font-bold text-xs">ลบออกจาก</span>
                                                    </div>
                                                    <div className="flex items-center justify-around px-4 py-4 bg-white">
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-1">Shelf</span>
                                                            <span className="text-lg font-bold text-slate-800">{log.shelfCode}</span>
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-100"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-1">ชั้นที่</span>
                                                            <span className="text-xl font-extrabold text-rose-700">{log.fromRow}</span>
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-100"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-1">ตำแหน่ง</span>
                                                            <span className="text-xl font-extrabold text-rose-700">{log.fromIndex}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="border-2 border-blue-300 rounded-2xl overflow-hidden">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200">
                                                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-200">
                                                            <svg className="w-3 h-3 text-blue-700" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" /></svg>
                                                        </div>
                                                        <span className="text-blue-700 font-bold text-xs">เปลี่ยนตำแหน่ง</span>
                                                    </div>
                                                    {/* From Row */}
                                                    <div className="flex items-center justify-around px-4 py-3 bg-slate-50 border-b border-slate-100">
                                                        <div className="text-[10px] text-slate-400 font-medium w-10">จาก</div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-0.5">Shelf</span>
                                                            <span className="text-base font-bold text-slate-500">{log.shelfCode}</span>
                                                        </div>
                                                        <div className="w-px h-7 bg-slate-200"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-0.5">ชั้นที่</span>
                                                            <span className="text-base font-bold text-slate-500">{log.fromRow}</span>
                                                        </div>
                                                        <div className="w-px h-7 bg-slate-200"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-0.5">ตำแหน่ง</span>
                                                            <span className="text-base font-bold text-slate-500">{log.fromIndex}</span>
                                                        </div>
                                                    </div>
                                                    {/* To Row */}
                                                    <div className="flex items-center justify-around px-4 py-3 bg-white">
                                                        <div className="text-[10px] text-blue-600 font-bold w-10">ไป</div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 mb-0.5">Shelf</span>
                                                            <span className="text-lg font-bold text-slate-800">{log.shelfCode}</span>
                                                        </div>
                                                        <div className="w-px h-7 bg-slate-100"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-blue-500 mb-0.5">ชั้นที่</span>
                                                            <span className="text-xl font-extrabold text-blue-700">{log.toRow}</span>
                                                        </div>
                                                        <div className="w-px h-7 bg-slate-100"></div>
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-blue-500 mb-0.5">ตำแหน่ง</span>
                                                            <span className="text-xl font-extrabold text-blue-700">{log.toIndex}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Timestamp */}
                                            <div className="mt-3 flex items-center text-xs text-slate-400">
                                                <Clock size={14} className="mr-1" />
                                                {formatDateShort(log.createdAt)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

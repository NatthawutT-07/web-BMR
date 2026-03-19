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
            if (res.data?.ok) {
                const pendingLogs = res.data.logs || [];
                setLogs(pendingLogs);
                setUnacknowledgedCount(res.data.total || pendingLogs.length);
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-slate-800 text-sm">การอัปเดต POG จากส่วนกลาง</h3>
                            <span className="text-xs text-slate-500">รอรับทราบ {unacknowledgedCount} รายการ</span>
                        </div>
                        {logs.length > 0 && (
                            <button
                                onClick={handleAcknowledgeAll}
                                disabled={ackingAll}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition disabled:opacity-50"
                            >
                                {ackingAll ? 'กำลังบันทึก...' : 'รับทราบทั้งหมด'}
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 bg-white" style={{ maxHeight: '60vh' }}>
                        {loading && logs.length === 0 ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                <CheckCircle2 size={32} className="text-emerald-300 mb-2" />
                                <p className="text-sm font-medium">ไม่มีรายการค้างรับทราบ</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {logs.map(log => {
                                    const actionConf = ACTION_MAP[log.action] || ACTION_MAP.move;
                                    return (
                                        <div key={log.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition group">
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${actionConf.bg}`}>
                                                        {actionConf.label}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        Shelf: {log.shelfCode}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleAcknowledgeOne(log.id)}
                                                    disabled={ackingId === log.id}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-50 flex shrink-0"
                                                    title="รับทราบ"
                                                >
                                                    {ackingId === log.id ? (
                                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Check size={16} />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="flex items-start gap-2 mb-2">
                                                <Package size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium text-slate-800 line-clamp-1" title={log.productName}>
                                                        {log.productName || `รหัส ${log.codeProduct}`}
                                                    </span>
                                                    {log.productName && (
                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                            {log.codeProduct}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 border border-slate-100">
                                                {log.action === 'add' ? (
                                                    <span>เพิ่มที่ ชั้น <span className="font-semibold">{log.toRow}</span> ตำแหน่ง <span className="font-semibold">{log.toIndex}</span></span>
                                                ) : log.action === 'delete' ? (
                                                    <span>ลบออกจาก ชั้น <span className="font-semibold">{log.fromRow}</span> ตำแหน่ง <span className="font-semibold">{log.fromIndex}</span></span>
                                                ) : (
                                                    <span>จาก ชั้น <span className="font-semibold">{log.fromRow}</span> ({log.fromIndex}) ไป ชั้น <span className="font-semibold">{log.toRow}</span> ({log.toIndex})</span>
                                                )}
                                            </div>

                                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDateShort(log.createdAt)}
                                                </div>
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

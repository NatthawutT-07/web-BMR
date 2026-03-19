import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../../utils/axios";
import {
    Filter, RefreshCw, CheckCircle2, XCircle, Clock,
    Trash2, Edit2, Check, X,
    AlertCircle, Package, MapPin,
    Store, LayoutGrid, Layers, ArrowLeft, ChevronRight
} from "lucide-react";

// --- Constants & Styles ---

const STATUS_STYLES = {
    pending: {
        label: "รอดำเนินการ",
        icon: <Clock size={16} />,
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        indicator: "bg-amber-500"
    },
    rejected: {
        label: "ปฏิเสธ",
        icon: <XCircle size={16} />,
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        indicator: "bg-rose-500"
    },
    completed: {
        label: "เสร็จสิ้น",
        icon: <CheckCircle2 size={16} />,
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        indicator: "bg-emerald-500"
    },
};

const ACTION_STYLES = {
    add: { label: "เพิ่มสินค้า", badge: "bg-emerald-100 text-emerald-800" },
    move: { label: "ย้ายสินค้า", badge: "bg-blue-100 text-blue-800" },
    delete: { label: "ลบสินค้า", badge: "bg-rose-100 text-rose-800" },
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// --- Sub-Components ---

const StatCard = ({ count, type, active, onClick }) => {
    const style = STATUS_STYLES[type];
    return (
        <button
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-xl border p-4 transition-all duration-200 text-left w-full
                ${active
                    ? `bg-white shadow-md ring-2 ring-offset-1 ${style.text.replace('text', 'ring')}`
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                }
            `}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.indicator}`} />
            <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${active ? style.text : "text-slate-600"}`}>
                    {style.label}
                </span>
                <div className={`p-1.5 rounded-full ${style.bg} ${style.text}`}>
                    {style.icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">
                {count.toLocaleString()}
            </div>
        </button>
    );
};

// --- Modals ---

const RejectReasonModal = ({ isOpen, onClose, onConfirm, count = 1 }) => {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setSubmitting(true);
        await onConfirm(reason);
        setSubmitting(false);
        setReason("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">ยืนยันการปฏิเสธ</h3>
                        <p className="text-sm text-slate-500">
                            {count > 1 ? `กำลังปฏิเสธ ${count} รายการ` : "กำลังปฏิเสธรายการนี้"}
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        เหตุผล (ไม่บังคับ)
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="ระบุสาเหตุที่ปฏิเสธ..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none h-32"
                    />
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-200 transition-all flex items-center gap-2"
                    >
                        {submitting ? "กำลังบันทึก..." : "ยืนยันปฏิเสธ"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditPositionModal = ({ isOpen, onClose, item, onSave }) => {
    const [formData, setFormData] = useState({
        toShelf: "", toRow: "", toIndex: "",
        fromShelf: "", fromRow: "", fromIndex: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item && isOpen) {
            setFormData({
                toShelf: item.toShelf || "",
                toRow: item.toRow || "",
                toIndex: item.toIndex || "",
                fromShelf: item.fromShelf || "",
                fromRow: item.fromRow || "",
                fromIndex: item.fromIndex || "",
            });
        }
    }, [item, isOpen]);

    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(item.id, formData);
            onClose();
        } catch (e) {
            alert(`Error: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !item) return null;

    const showFrom = ["move", "delete"].includes(item.action);
    const showTo = ["add", "move"].includes(item.action);

    const PositionFields = ({ title, prefix }) => (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" /> {title}
            </h4>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Shelf</label>
                    <input
                        type="text"
                        value={formData[`${prefix}Shelf`]}
                        onChange={(e) => handleChange(`${prefix}Shelf`, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                        placeholder="A1"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Row</label>
                    <select
                        value={formData[`${prefix}Row`]}
                        onChange={(e) => handleChange(`${prefix}Row`, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    >
                        <option value="">-</option>
                        {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Index</label>
                    <select
                        value={formData[`${prefix}Index`]}
                        onChange={(e) => handleChange(`${prefix}Index`, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    >
                        <option value="">-</option>
                        {[...Array(20)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-white">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Edit2 size={18} className="text-blue-500" />
                        แก้ไขตำแหน่ง
                    </h3>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                            <Package size={16} />
                            <span className="font-medium text-slate-900">{item.productName || item.barcode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 pl-6">
                            <span>{item.barcode}</span> •
                            <span className={`px-1.5 py-0.5 rounded ${ACTION_STYLES[item.action]?.badge || 'bg-slate-200'}`}>
                                {ACTION_STYLES[item.action]?.label || item.action}
                            </span>
                        </div>
                    </div>

                    {showFrom && <PositionFields title="ตำแหน่งเดิม (From)" prefix="from" />}
                    {showTo && <PositionFields title="ตำแหน่งใหม่ (To)" prefix="to" />}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                    >
                        {saving ? "บันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

export default function PogRequests() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filterStatus, setFilterStatus] = useState("pending");
    const [filterAction, setFilterAction] = useState("");
    const [filterShelf, setFilterShelf] = useState("");
    const [filterRow, setFilterRow] = useState("");
    const [updating, setUpdating] = useState(null);
    const [stats, setStats] = useState({ pending: 0, rejected: 0, completed: 0 }); // API stats
    const [branchStats, setBranchStats] = useState({}); // Branch-level pending stats
    const [branches, setBranches] = useState([]); // Dynamic branches from API

    // View mode: 'summary' = branch cards, 'detail' = single branch requests
    const [viewMode, setViewMode] = useState('summary');
    const [selectedBranch, setSelectedBranch] = useState(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkUpdating, setBulkUpdating] = useState(false);

    // Concurrency protection: track data version
    const [dataVersion, setDataVersion] = useState(0);

    // Modals
    const [rejectModal, setRejectModal] = useState({ open: false, ids: [], count: 0 });
    const [editModal, setEditModal] = useState({ open: false, item: null });

    const loadBranches = useCallback(async () => {
        try {
            const res = await api.get("/branches");
            setBranches(res.data || []);
        } catch (err) {
            console.error("Load branches error:", err);
        }
    }, []);

    // Load summary stats (for landing page)
    const loadSummary = useCallback(async () => {
        setLoading(true);
        try {
            // Add timestamp to prevent HTTP 304 caching
            const res = await api.get("/pog-requests", { params: { limit: 1, _t: Date.now() } });
            if (res.data?.stats) setStats(res.data.stats);
            if (res.data?.branchStats) setBranchStats(res.data.branchStats);
        } catch (e) {
            console.error("Load summary error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load detail data for selected branch
    const loadData = useCallback(async () => {
        if (viewMode === 'summary' || !selectedBranch) return;
        
        setLoading(true);
        try {
            const params = { limit: 50, page, branchCode: selectedBranch, _t: Date.now() };
            if (filterStatus) params.status = filterStatus;
            if (filterAction) params.action = filterAction;
            if (filterShelf) params.shelf = filterShelf;
            if (filterRow) params.row = filterRow;

            const res = await api.get("/pog-requests", { params });
            setData(res.data?.data || []);
            setTotalPages(res.data?.totalPages || 1);
            setTotalItems(res.data?.total || 0);
            setDataVersion(Date.now()); // Track version for concurrency

            if (res.data?.stats) setStats(res.data.stats);
            if (res.data?.branchStats) setBranchStats(res.data.branchStats);

            setSelectedIds(new Set());
        } catch (e) {
            console.error("Load POG requests error:", e);
        } finally {
            setLoading(false);
        }
    }, [viewMode, selectedBranch, filterStatus, filterAction, filterShelf, filterRow, page]);

    useEffect(() => { loadBranches(); }, [loadBranches]);
    
    useEffect(() => {
        if (viewMode === 'summary') {
            loadSummary();
        } else {
            loadData();
        }
    }, [viewMode, loadSummary, loadData]);

    useEffect(() => {
        setPage(1);
    }, [filterStatus, filterAction, filterShelf, filterRow]);

    // Enter branch detail view
    const enterBranchDetail = (branchCode) => {
        setSelectedBranch(branchCode);
        setViewMode('detail');
        setPage(1);
        setSelectedIds(new Set());
    };

    // Back to summary view
    const backToSummary = () => {
        setViewMode('summary');
        setSelectedBranch(null);
        setData([]);
        setSelectedIds(new Set());
    };

    const availableRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // Helper to get branch name
    const getBranchName = (code) => {
        const b = branches.find(b => b.branch_code === code);
        return b ? b.branch_name : code;
    };

    const visibleData = data;

    // Status Updates
    const updateStatus = async (id, newStatus, reason = null) => {
        setUpdating(id);
        try {
            const payload = { status: newStatus, ...(reason && { rejectReason: reason }) };
            const res = await api.patch(`/pog-requests/${id}`, payload);

            if (res.data?.ok !== false) {
                setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus, note: reason || item.note } : item));
                setStats(prev => {
                    const next = { ...prev };
                    const item = data.find(d => d.id === id);
                    if (item && item.status !== newStatus) {
                        if (next[item.status] > 0) next[item.status]--;
                        next[newStatus] = (next[newStatus] || 0) + 1;
                    }
                    return next;
                });
            }
            return { success: true };
        } catch (e) {
            return { success: false, message: e.response?.data?.message || "Failed" };
        } finally {
            setUpdating(null);
        }
    };

    // Bulk Actions
    const handleBulkApprove = async () => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;
        if (!confirm(`ยืนยันอนุมัติ ${ids.length} รายการ?`)) return;

        setBulkUpdating(true);
        try {
            const res = await api.post("/pog-requests/bulk-approve", { ids });
            if (res.data?.ok) {
                setData(prev => prev.map(d => ids.includes(d.id) ? { ...d, status: "completed" } : d));
                // Refetch stats simplier for bulk
                const successCount = res.data.successCount || ids.length;
                setStats(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - successCount),
                    completed: prev.completed + successCount
                }));
                setSelectedIds(new Set());
                alert(`สำเร็จ ${successCount} รายการ`);
            }
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            alert(`Error: ${msg}`);
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleApproveAllPending = async () => {
        const pending = visibleData.filter(d => d.status === 'pending');
        if (pending.length === 0) return alert("ไม่มีรายการรอดำเนินการบนหน้านี้");
        if (!confirm(`อนุมัติทั้งหมด ${pending.length} รายการในหน้านี้?`)) return;

        setBulkUpdating(true);
        try {
            const res = await api.post("/pog-requests/bulk-approve", { ids: pending.map(p => p.id) });
            if (res.data?.ok) {
                setData(prev => prev.map(d => d.status === 'pending' ? { ...d, status: "completed" } : d));
                const successCount = res.data.successCount || pending.length;
                setStats(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - successCount),
                    completed: prev.completed + successCount
                }));
                alert(`✅ อนุมัติ ${successCount} รายการเรียบร้อย`);
            }
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            alert(`Error: ${msg}`);
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleBulkReject = () => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;
        setRejectModal({ open: true, ids, count: ids.length });
    };

    const confirmBulkReject = async (reason) => {
        setBulkUpdating(true);
        for (const id of rejectModal.ids) {
            await updateStatus(id, "rejected", reason);
        }
        setBulkUpdating(false);
        setSelectedIds(new Set());
    };

    const deleteRequest = async (id) => {
        if (!confirm("ต้องการลบรายการนี้?")) return;
        try {
            await api.delete(`/pog-requests/${id}`);
            setData(prev => prev.filter(d => d.id !== id));
            loadData();
        } catch (e) {
            console.error(e);
            alert("ลบไม่สำเร็จ");
        }
    };

    // Helper to render Position
    const PositionCell = ({ item }) => {
        const renderPos = (s, r, i) => s ? `${s}-${r}-${i}` : '-';
        return (
            <div className="flex flex-col gap-1 text-xs">
                {item.fromShelf && (
                    <div className="flex items-center gap-1 text-slate-500">
                        <span className="w-8">จาก:</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{renderPos(item.fromShelf, item.fromRow, item.fromIndex)}</span>
                    </div>
                )}
                {item.toShelf && (
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <span className="w-8">ไป:</span>
                        <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{renderPos(item.toShelf, item.toRow, item.toIndex)}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ==================== SUMMARY VIEW ==================== */}
                {viewMode === 'summary' && (
                    <>
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">คำขอเปลี่ยนแปลง POG</h1>
                                <p className="text-slate-500 text-sm mt-1">เลือกสาขาเพื่อตรวจสอบและอนุมัติคำขอ</p>
                            </div>
                            <button
                                onClick={loadSummary}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="รีเฟรชข้อมูล"
                            >
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {/* Overall Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {["pending", "rejected", "completed"].map(type => (
                                <StatCard
                                    key={type}
                                    type={type}
                                    count={stats[type] || 0}
                                    active={false}
                                    onClick={() => {}}
                                />
                            ))}
                        </div>

                        {/* Branch Cards - Click to Enter */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Store className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-slate-800">สาขาที่มีคำขอรอดำเนินการ</h3>
                                </div>
                                <span className="text-xs text-slate-500">คลิกเพื่อเข้าดูรายละเอียดและอนุมัติ</span>
                            </div>

                            {Object.keys(branchStats).length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-300" />
                                    <p className="font-medium">ไม่มีคำขอรอดำเนินการ</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(branchStats)
                                        .sort(([,a], [,b]) => b.total - a.total)
                                        .map(([branchCode, bStats]) => (
                                        <button
                                            key={branchCode}
                                            onClick={() => enterBranchDetail(branchCode)}
                                            className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-left hover:shadow-md hover:border-blue-300 hover:from-blue-50 hover:to-white transition-all group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    {/* <h4 className="font-semibold text-slate-800 group-hover:text-blue-700">
                                                        {branchCode} - {getBranchName(branchCode)}
                                                    </h4> */}
                                                    <span className="text-sm text-slate-800">{branchCode} - {getBranchName(branchCode)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-2xl font-bold text-amber-600">{bStats.total}</span>
                                                    <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                                                {bStats.add > 0 && (
                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                                                        +{bStats.add} เพิ่ม
                                                    </span>
                                                )}
                                                {bStats.move > 0 && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                        ⇄{bStats.move} ย้าย
                                                    </span>
                                                )}
                                                {bStats.delete > 0 && (
                                                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">
                                                        -{bStats.delete} ลบ
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Card */}
                        {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-semibold">วิธีการอนุมัติที่ปลอดภัย</strong>
                                    <p className="mt-1 text-blue-700">
                                        ระบบจะประมวลผลคำขอตามลำดับเวลาที่ส่งมา (เก่าสุดก่อน) พร้อมชดเชย Index อัตโนมัติ 
                                        เพื่อป้องกันปัญหาตำแหน่งคลาดเคลื่อน กรุณาอนุมัติทีละสาขาเพื่อความถูกต้อง
                                    </p>
                                </div>
                            </div>
                        </div> */}
                    </>
                )}

                {/* ==================== DETAIL VIEW (Per Branch) ==================== */}
                {viewMode === 'detail' && selectedBranch && (
                    <>
                        {/* Header with Back Button */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={backToSummary}
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="กลับไปหน้าสรุป"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                                        {getBranchName(selectedBranch)}
                                    </h1>
                                    <p className="text-slate-500 text-sm mt-1">
                                        รหัสสาขา: {selectedBranch} • คำขอรอดำเนินการ: {branchStats[selectedBranch]?.total || 0} รายการ
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={loadData}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="รีเฟรชข้อมูล"
                            >
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                            {["pending", "rejected", "completed"].map(type => {
                                const style = STATUS_STYLES[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setFilterStatus(type)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                                            filterStatus === type
                                                ? `${style.bg} ${style.text} shadow-sm`
                                                : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {style.icon}
                                        {style.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Toolbar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg min-w-[140px]">
                                    <Filter size={16} className="text-slate-400" />
                                    <select
                                        value={filterAction}
                                        onChange={e => setFilterAction(e.target.value)}
                                        className="bg-transparent text-sm w-full outline-none text-slate-700 cursor-pointer"
                                    >
                                        <option value="">Action ทั้งหมด</option>
                                        <option value="add">เพิ่มสินค้า</option>
                                        <option value="move">ย้ายสินค้า</option>
                                        <option value="delete">ลบสินค้า</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full max-w-[150px]">
                                    <Layers size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหา Shelf"
                                        defaultValue={filterShelf}
                                        onBlur={e => setFilterShelf(e.target.value.trim().toUpperCase())}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') setFilterShelf(e.currentTarget.value.trim().toUpperCase());
                                        }}
                                        className="bg-transparent text-sm w-full outline-none text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg min-w-[100px]">
                                    <LayoutGrid size={16} className="text-slate-400" />
                                    <select
                                        value={filterRow}
                                        onChange={e => setFilterRow(e.target.value)}
                                        className="bg-transparent text-sm w-full outline-none text-slate-700 cursor-pointer"
                                    >
                                        <option value="">Row</option>
                                        {availableRows.map(r => <option key={r} value={r}>Row {r}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Bulk Actions Bar */}
                            {filterStatus === 'pending' && visibleData.length > 0 && (
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                                checked={selectedIds.size > 0 && selectedIds.size === visibleData.filter(d => d.status === 'pending').length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds(new Set(visibleData.filter(d => d.status === 'pending').map(d => d.id)));
                                                    else setSelectedIds(new Set());
                                                }}
                                            />
                                            <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                                                เลือกทั้งหมดในหน้านี้
                                            </span>
                                        </label>

                                        {selectedIds.size > 0 && (
                                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                                เลือกไว้ {selectedIds.size} รายการ
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {selectedIds.size > 0 ? (
                                            <>
                                                <button
                                                    onClick={handleBulkReject}
                                                    disabled={bulkUpdating}
                                                    className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    <X size={16} /> ปฏิเสธที่เลือก
                                                </button>
                                                <button
                                                    onClick={handleBulkApprove}
                                                    disabled={bulkUpdating}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    <Check size={16} /> อนุมัติที่เลือก
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleApproveAllPending}
                                                disabled={bulkUpdating}
                                                className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                <CheckCircle2 size={16} /> อนุมัติทั้งหมด (สาขานี้)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                                            <th className="px-6 py-4 w-12 text-center">#</th>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4">สินค้า</th>
                                            <th className="px-6 py-4">ตำแหน่ง</th>
                                            <th className="px-6 py-4">สถานะ</th>
                                            <th className="px-6 py-4 w-20 text-center">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading...</td></tr>
                                        ) : visibleData.length === 0 ? (
                                            <tr><td colSpan="6" className="p-12 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
                                        ) : (
                                            visibleData.map((item, idx) => {
                                                const isSelected = selectedIds.has(item.id);
                                                return (
                                                    <tr key={item.id} className={`group transition-colors hover:bg-slate-50/80 ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                                        <td className="px-6 py-4 text-center">
                                                            {item.status === 'pending' ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        const newSet = new Set(selectedIds);
                                                                        if (newSet.has(item.id)) newSet.delete(item.id);
                                                                        else newSet.add(item.id);
                                                                        setSelectedIds(newSet);
                                                                    }}
                                                                    className="w-5 h-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">{idx + 1}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${ACTION_STYLES[item.action]?.badge || 'bg-gray-100 text-gray-800'}`}>
                                                                {ACTION_STYLES[item.action]?.label || item.action}
                                                            </span>
                                                            <div className="text-xs text-slate-400 mt-1">{formatDate(item.createdAt)}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-900 line-clamp-1" title={item.productName}>
                                                                    {item.productName || item.barcode}
                                                                </span>
                                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Package size={12} /> {item.barcode}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <PositionCell item={item} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]?.bg} ${STATUS_STYLES[item.status]?.text}`}>
                                                                {STATUS_STYLES[item.status]?.icon}
                                                                {STATUS_STYLES[item.status]?.label}
                                                            </span>
                                                            {item.status === 'rejected' && item.note && (
                                                                <div className="text-xs text-rose-500 mt-1 truncate max-w-[120px]" title={item.note}>{item.note}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {item.status === 'pending' ? (
                                                                    <>
                                                                        <button onClick={() => updateStatus(item.id, "completed")} disabled={updating === item.id} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="อนุมัติ"><Check size={18} /></button>
                                                                        <button onClick={() => setEditModal({ open: true, item })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข"><Edit2 size={18} /></button>
                                                                        <button onClick={() => setRejectModal({ open: true, ids: [item.id], count: 1 })} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="ปฏิเสธ"><X size={18} /></button>
                                                                    </>
                                                                ) : (
                                                                    <button onClick={() => deleteRequest(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="ลบ"><Trash2 size={18} /></button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {totalPages > 0 && (
                                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-600">
                                    <div>แสดง {visibleData.length} รายการ (จากทั้งหมด {totalItems})</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50">ก่อนหน้า</button>
                                        <span className="font-medium px-2">หน้า {page} / {totalPages}</span>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50">ถัดไป</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>

            <RejectReasonModal
                isOpen={rejectModal.open}
                onClose={() => setRejectModal({ open: false, ids: [], count: 0 })}
                onConfirm={rejectModal.count > 1 ? confirmBulkReject : (reason) => updateStatus(rejectModal.ids[0], "rejected", reason)}
                count={rejectModal.count}
            />

            <EditPositionModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, item: null })}
                item={editModal.item}
                onSave={async (id, data) => {
                    const res = await api.put(`/pog-requests/${id}/position`, data);
                    if (res.data.ok) {
                        setData(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
                        alert("แก้ไขสำเร็จ");
                    }
                }}
            />
        </div>
    );
}

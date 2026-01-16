// PogRequests.jsx - Admin Page สำหรับจัดการ POG Change Requests
import React, { useEffect, useState, useMemo } from "react";
import api from "../../../utils/axios";

const cx = (...a) => a.filter(Boolean).join(" ");

const STATUS_MAP = {
    pending: { label: "รอดำเนินการ", color: "bg-amber-100 text-amber-700", badge: "border-amber-300" },
    rejected: { label: "ปฏิเสธ", color: "bg-rose-100 text-rose-700", badge: "border-rose-300" },
    completed: { label: "เสร็จสิ้น", color: "bg-emerald-100 text-emerald-700", badge: "border-emerald-300" },
};

const ACTION_MAP = {
    add: { label: "เพิ่มสินค้า", icon: "" },
    move: { label: "ย้ายสินค้า", icon: "" },
    swap: { label: "สลับตำแหน่ง", icon: "" },
    delete: { label: "ลบสินค้า", icon: "" },
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// ✅ Reject Reason Modal
const RejectReasonModal = ({ isOpen, onClose, onConfirm, count = 1 }) => {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        setSubmitting(true);
        await onConfirm(reason);
        setSubmitting(false);
        setReason("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    ❌ ปฏิเสธ {count > 1 ? `${count} รายการ` : "รายการนี้"}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    กรุณาระบุเหตุผล (ไม่บังคับ)
                </p>

                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="เช่น: ตำแหน่งไม่ถูกต้อง, Shelf ไม่มีอยู่จริง..."
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
                    >
                        {submitting ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ✅ Edit Position Modal
const EditPositionModal = ({ isOpen, onClose, item, onSave }) => {
    const [formData, setFormData] = useState({
        toShelf: "",
        toRow: "",
        toIndex: "",
        fromShelf: "",
        fromRow: "",
        fromIndex: "",
    });
    const [saving, setSaving] = useState(false);

    // Initialize form data when modal opens
    React.useEffect(() => {
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

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(item.id, formData);
            onClose();
        } catch (e) {
            alert(`เกิดข้อผิดพลาด: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !item) return null;

    const showFrom = ["move", "delete", "swap"].includes(item.action);
    const showTo = ["add", "move", "swap"].includes(item.action);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    ✏️ แก้ไขตำแหน่ง
                </h3>

                <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm">
                    <div><span className="font-medium">Barcode:</span> {item.barcode}</div>
                    <div><span className="font-medium">Action:</span> {ACTION_MAP[item.action]?.label || item.action}</div>
                </div>

                {/* From Location (for move, delete, swap) */}
                {showFrom && (
                    <div className="mb-4">
                        <div className="text-sm font-semibold text-slate-700 mb-2">📍 ตำแหน่งเดิม (From)</div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-slate-500">Shelf</label>
                                <input
                                    type="text"
                                    value={formData.fromShelf}
                                    onChange={(e) => handleChange("fromShelf", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    placeholder="W1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Row</label>
                                <select
                                    value={formData.fromRow}
                                    onChange={(e) => handleChange("fromRow", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="">เลือก</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Index</label>
                                <select
                                    value={formData.fromIndex}
                                    onChange={(e) => handleChange("fromIndex", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="">เลือก</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* To Location (for add, move, swap) */}
                {showTo && (
                    <div className="mb-4">
                        <div className="text-sm font-semibold text-slate-700 mb-2">🎯 ตำแหน่งใหม่ (To)</div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-slate-500">Shelf</label>
                                <input
                                    type="text"
                                    value={formData.toShelf}
                                    onChange={(e) => handleChange("toShelf", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    placeholder="W1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Row</label>
                                <select
                                    value={formData.toRow}
                                    onChange={(e) => handleChange("toRow", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="">เลือก</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Index</label>
                                <select
                                    value={formData.toIndex}
                                    onChange={(e) => handleChange("toIndex", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="">เลือก</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function PogRequests() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filterStatus, setFilterStatus] = useState("pending"); // ✅ Default: show only pending
    const [filterBranch, setFilterBranch] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [filterShelf, setFilterShelf] = useState(""); // ✅ Filter by shelf
    const [filterRow, setFilterRow] = useState(""); // ✅ Filter by row
    const [updating, setUpdating] = useState(null);

    const [stats, setStats] = useState({ pending: 0, rejected: 0, completed: 0 }); // ✅ Stats from API

    // ✅ Lazy loading state
    const [visibleCount, setVisibleCount] = useState(50);
    const PAGE_SIZE = 50;

    // ✅ Bulk selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkUpdating, setBulkUpdating] = useState(false);

    // ✅ Reject modal state
    const [rejectModal, setRejectModal] = useState({ open: false, ids: [], count: 0 });

    // ✅ Edit position modal state
    const [editModal, setEditModal] = useState({ open: false, item: null });

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { limit: 1000 };
            if (filterStatus) params.status = filterStatus;
            if (filterBranch) params.branchCode = filterBranch;
            if (filterAction) params.action = filterAction;

            const res = await api.get("/pog-requests", { params });
            setData(res.data?.data || []);

            // ✅ Update stats from API if available
            if (res.data?.stats) {
                setStats(res.data.stats);
            }

            setSelectedIds(new Set());
            setVisibleCount(PAGE_SIZE);
        } catch (e) {
            console.error("Load POG requests error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterStatus, filterBranch, filterAction]);

    // ✅ Get unique branches, shelves, rows from data (only those with requests)
    const availableBranches = useMemo(() => {
        const branches = [...new Set(data.map(d => d.branchCode).filter(Boolean))];
        return branches.sort();
    }, [data]);

    const availableShelves = useMemo(() => {
        const shelves = new Set();
        data.forEach(d => {
            if (d.fromShelf) shelves.add(d.fromShelf);
            if (d.toShelf) shelves.add(d.toShelf);
        });
        return [...shelves].sort();
    }, [data]);

    const availableRows = useMemo(() => {
        const rows = new Set();
        data.forEach(d => {
            if (d.fromRow) rows.add(String(d.fromRow));
            if (d.toRow) rows.add(String(d.toRow));
        });
        return [...rows].sort((a, b) => parseInt(a) - parseInt(b));
    }, [data]);

    // ✅ Client-side filtering + Sort by createdAt (เก่าก่อน = ลำดับ 1)
    const availableData = useMemo(() => {
        return data
            .filter((d) => {
                const matchBranch = !filterBranch || d.branchCode === filterBranch;
                const matchShelf = !filterShelf || d.fromShelf === filterShelf || d.toShelf === filterShelf;
                const matchRow = !filterRow || String(d.fromRow) === filterRow || String(d.toRow) === filterRow;
                return matchBranch && matchShelf && matchRow;
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // เก่า → ใหม่
    }, [data, filterBranch, filterShelf, filterRow]);

    const visibleData = useMemo(() => availableData.slice(0, visibleCount), [availableData, visibleCount]);
    const hasMore = visibleCount < availableData.length;

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, availableData.length));
    };

    // ✅ Pending items for Bulk Actions
    const pendingItems = useMemo(() => availableData.filter((d) => d.status === "pending"), [availableData]);
    const selectedPendingCount = useMemo(() => {
        return [...selectedIds].filter(id => pendingItems.some(p => p.id === id)).length;
    }, [selectedIds, pendingItems]);

    const getErrorMessage = (e) => {
        let msg = e?.response?.data?.message;
        if (!msg) return "ไม่สามารถอัปเดตสถานะได้";
        if (typeof msg === 'string' && msg.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(msg);
                if (parsed.message) return parsed.message;
            } catch { }
        }
        return msg;
    };

    const updateStatus = async (id, newStatus, reason = null) => {
        setUpdating(id);
        try {
            const payload = { status: newStatus };
            if (reason) payload.rejectReason = reason;
            const res = await api.patch(`/pog-requests/${id}`, payload);

            if (res.data?.ok !== false) {
                // ✅ อัปเดต local state แทนการเรียก API ใหม่
                setData(prev => prev.map(item =>
                    item.id === id ? { ...item, status: newStatus, note: reason || item.note } : item
                ));

                // ✅ อัปเดต stats
                setStats(prev => {
                    const newStats = { ...prev };
                    // ค้นหา item เดิมเพื่อลด stats เก่า
                    const oldItem = data.find(d => d.id === id);
                    if (oldItem && oldItem.status !== newStatus) {
                        if (newStats[oldItem.status] > 0) newStats[oldItem.status]--;
                        newStats[newStatus] = (newStats[newStatus] || 0) + 1;
                    }
                    return newStats;
                });
            }

            return { success: true, message: res.data.message };
        } catch (e) {
            console.error("Update status error:", e);
            const msg = getErrorMessage(e);
            return { success: false, message: msg };
        } finally {
            setUpdating(null);
        }
    };

    // ✅ Bulk update function
    const bulkUpdateStatus = async (ids, newStatus, reason = null) => {
        setBulkUpdating(true);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const id of ids) {
            const result = await updateStatus(id, newStatus, reason);
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
                errors.push(result.message);
            }
        }

        setBulkUpdating(false);
        setSelectedIds(new Set());

        if (errorCount === 0) {
            alert(`✅ ดำเนินการสำเร็จ ${successCount} รายการ`);
        } else {
            alert(`ดำเนินการสำเร็จ ${successCount} รายการ, ล้มเหลว ${errorCount} รายการ\n\n${errors.slice(0, 3).join('\n')}`);
        }
        // ✅ ไม่ต้อง loadData() เพราะ updateStatus อัปเดต local state แล้ว
    };

    // ✅ Quick approve all pending (ใช้ Bulk API ที่ optimize แล้ว)
    const handleApproveAllPending = async () => {
        const pendingIds = pendingItems.map(p => p.id);

        if (pendingIds.length === 0) {
            alert("ไม่มีรายการที่รอดำเนินการ");
            return;
        }
        if (!confirm(`ต้องการอนุมัติทั้งหมด ${pendingIds.length} รายการ?\n\n`)) return;

        setBulkUpdating(true);
        try {
            const res = await api.post("/pog-requests/bulk-approve", { ids: pendingIds });

            if (res.data?.ok) {
                // อัปเดต local state - เปลี่ยน status เป็น completed
                setData(prev => prev.map(d =>
                    pendingIds.includes(d.id) ? { ...d, status: "completed" } : d
                ));

                // อัปเดต stats
                const approvedCount = res.data.successCount || pendingIds.length;
                setStats(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - approvedCount),
                    completed: prev.completed + approvedCount
                }));

                alert(`✅ ${res.data.message}`);
            } else {
                alert(`❌ ${res.data?.message || "เกิดข้อผิดพลาด"}`);
            }
        } catch (e) {
            console.error("Bulk approve error:", e);
            alert(`❌ ${e.response?.data?.message || "เกิดข้อผิดพลาดในการอนุมัติ"}`);
        } finally {
            setBulkUpdating(false);
            setSelectedIds(new Set());
        }
    };

    // ✅ Bulk approve selected (ใช้ Bulk API ที่ optimize แล้ว)
    const handleBulkApprove = async () => {
        // กรองเฉพาะ pending items ที่ถูกเลือก
        const selectedPending = pendingItems.filter(p => selectedIds.has(p.id));

        if (selectedPending.length === 0) {
            alert("กรุณาเลือกรายการที่รอดำเนินการ");
            return;
        }

        const ids = selectedPending.map(p => p.id);

        if (!confirm(`ต้องการอนุมัติ ${ids.length} รายการที่เลือก?\n\n(เรียงลำดับ: ที่สร้างก่อน → อนุมัติก่อน)`)) return;

        setBulkUpdating(true);
        try {
            const res = await api.post("/pog-requests/bulk-approve", { ids });

            if (res.data?.ok) {
                // อัปเดต local state - เปลี่ยน status เป็น completed
                setData(prev => prev.map(d =>
                    ids.includes(d.id) ? { ...d, status: "completed" } : d
                ));

                // อัปเดต stats
                const approvedCount = res.data.successCount || ids.length;
                setStats(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - approvedCount),
                    completed: prev.completed + approvedCount
                }));

                alert(`✅ ${res.data.message}`);
            } else {
                alert(`❌ ${res.data?.message || "เกิดข้อผิดพลาด"}`);
            }
        } catch (e) {
            console.error("Bulk approve error:", e);
            alert(`❌ ${e.response?.data?.message || "เกิดข้อผิดพลาดในการอนุมัติ"}`);
        } finally {
            setBulkUpdating(false);
            setSelectedIds(new Set());
        }
    };

    // ✅ Bulk reject selected (with reason)
    const handleBulkReject = () => {
        const ids = [...selectedIds].filter(id => pendingItems.some(p => p.id === id));
        if (ids.length === 0) {
            alert("กรุณาเลือกรายการที่รอดำเนินการ");
            return;
        }
        setRejectModal({ open: true, ids, count: ids.length });
    };

    const confirmBulkReject = async (reason) => {
        await bulkUpdateStatus(rejectModal.ids, "rejected", reason || null);
    };

    // ✅ Single reject with reason
    const handleSingleReject = (id) => {
        setRejectModal({ open: true, ids: [id], count: 1 });
    };

    const confirmSingleReject = async (reason) => {
        await bulkUpdateStatus(rejectModal.ids, "rejected", reason || null);
    };

    // ✅ Edit position
    const handleEditPosition = (item) => {
        setEditModal({ open: true, item });
    };

    const savePosition = async (id, formData) => {
        const res = await api.put(`/pog-requests/${id}/position`, formData);
        if (res.data?.ok) {
            // อัปเดต local state
            setData(prev => prev.map(d =>
                d.id === id ? { ...d, ...formData } : d
            ));
            alert("✅ แก้ไขตำแหน่งสำเร็จ");
        } else {
            throw new Error(res.data?.message || "เกิดข้อผิดพลาด");
        }
    };

    const deleteRequest = async (id) => {
        if (!confirm("ต้องการลบรายการนี้?")) return;
        try {
            const res = await api.delete(`/pog-requests/${id}`);
            if (res.data?.ok !== false) {
                // ✅ ลบจาก local state แทนการเรียก API
                const deletedItem = data.find(d => d.id === id);
                setData(prev => prev.filter(item => item.id !== id));

                // ✅ อัปเดต stats
                if (deletedItem) {
                    setStats(prev => {
                        const newStats = { ...prev };
                        if (newStats[deletedItem.status] > 0) newStats[deletedItem.status]--;
                        return newStats;
                    });
                }
            }
        } catch (e) {
            console.error("Delete error:", e);
            alert("ไม่สามารถลบได้");
        }
    };

    // ✅ Toggle selection
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // ✅ Select all pending
    const selectAllPending = () => {
        setSelectedIds(new Set(pendingItems.map(p => p.id)));
    };

    // ✅ Clear selection
    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Reject Reason Modal */}
            <RejectReasonModal
                isOpen={rejectModal.open}
                onClose={() => setRejectModal({ open: false, ids: [], count: 0 })}
                onConfirm={rejectModal.count > 1 ? confirmBulkReject : confirmSingleReject}
                count={rejectModal.count}
            />

            {/* Edit Position Modal */}
            <EditPositionModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, item: null })}
                item={editModal.item}
                onSave={savePosition}
            />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">📋 คำขอเปลี่ยนแปลง POG</h1>
                <p className="text-sm text-slate-500 mt-1">จัดการคำขอจากสาขาต่างๆ</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                    <option value="">ทุกสถานะ</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="rejected">ปฏิเสธ</option>
                    <option value="completed">เสร็จสิ้น</option>
                </select>

                {/* ✅ Action Filter */}
                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                    <option value="">ทุก Action</option>
                    <option value="add">เพิ่มสินค้า</option>
                    <option value="move">ย้ายสินค้า</option>
                    <option value="delete">ลบสินค้า</option>
                </select>

                {/* ✅ Branch Filter - Dropdown */}
                <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[140px]"
                >
                    <option value="">ทุกสาขา</option>
                    {availableBranches.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                    ))}
                </select>

                {/* ✅ Shelf Filter - Dropdown */}
                <select
                    value={filterShelf}
                    onChange={(e) => setFilterShelf(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[100px]"
                >
                    <option value="">ทุก Shelf</option>
                    {availableShelves.map(shelf => (
                        <option key={shelf} value={shelf}>{shelf}</option>
                    ))}
                </select>

                {/* ✅ Row Filter - Dropdown */}
                <select
                    value={filterRow}
                    onChange={(e) => setFilterRow(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[90px]"
                >
                    <option value="">ทุก Row</option>
                    {availableRows.map(row => (
                        <option key={row} value={row}>Row {row}</option>
                    ))}
                </select>

                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700"
                >
                    🔄 รีเฟรช
                </button>
            </div>

            {/* ✅ Bulk Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-lg border">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="font-semibold">⚡ Quick Actions:</span>
                </span>

                <button
                    onClick={handleApproveAllPending}
                    disabled={bulkUpdating || pendingItems.length === 0}
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✓ อนุมัติทั้งหมด ({pendingItems.length})
                </button>

                <div className="border-l border-slate-300 mx-2" />

                <button
                    onClick={selectAllPending}
                    disabled={pendingItems.length === 0}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                    เลือกทั้งหมด ({pendingItems.length})
                </button>

                {selectedIds.size > 0 && (
                    <>
                        <button
                            onClick={clearSelection}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        >
                            ยกเลิกเลือก
                        </button>

                        <span className="text-xs text-slate-500 flex items-center">
                            เลือก {selectedPendingCount} รายการ
                        </span>

                        <button
                            onClick={handleBulkApprove}
                            disabled={bulkUpdating || selectedPendingCount === 0}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                        >
                            ✓ อนุมัติที่เลือก
                        </button>

                        <button
                            onClick={handleBulkReject}
                            disabled={bulkUpdating || selectedPendingCount === 0}
                            className="px-3 py-1.5 text-xs font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
                        >
                            ✗ ปฏิเสธที่เลือก
                        </button>
                    </>
                )}

                {bulkUpdating && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                        <span className="animate-spin">⏳</span> กำลังดำเนินการ...
                    </span>
                )}
            </div>

            {/* Stats - Clickable to filter */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {["pending", "rejected", "completed"].map((status) => {
                    const count = stats[status] || 0; // ✅ Use API stats
                    const info = STATUS_MAP[status];
                    const isActive = filterStatus === status;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilterStatus(isActive ? "" : status)}
                            className={cx(
                                "p-3 rounded-xl border-2 text-left cursor-pointer transition-all",
                                info.badge,
                                info.color.split(" ")[0], // Use bg color
                                isActive && "opacity-100 border-slate-500 ring-2 ring-offset-1 ring-slate-300",
                                !isActive && "opacity-60 hover:opacity-100 grayscale-[0.3]"
                            )}
                        >
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-xs font-medium">{info.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-6 w-6 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                        <span className="ml-3 text-slate-600">กำลังโหลด...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">ไม่มีรายการ</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    {/* ✅ Checkbox column */}
                                    <th className="w-10 px-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size > 0 && selectedIds.size === pendingItems.length && pendingItems.length > 0}
                                            onChange={(e) => e.target.checked ? selectAllPending() : clearSelection()}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="w-12 text-center px-2 py-3 font-semibold text-slate-700">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-700">สาขา</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Action</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-700">สินค้า</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-700">ตำแหน่ง</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-700">สถานะ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-700">วันที่</th>
                                    <th className="text-center px-4 py-3 font-semibold text-slate-700">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {visibleData.map((item, rowIndex) => {
                                    const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
                                    const actionInfo = ACTION_MAP[item.action] || { label: item.action, icon: "📦" };
                                    const isUpdating = updating === item.id;
                                    const isPending = item.status === "pending";
                                    const isSelected = selectedIds.has(item.id);

                                    return (
                                        <tr key={item.id} className={cx("hover:bg-slate-50", isSelected && "bg-blue-50")}>
                                            {/* ✅ Checkbox */}
                                            <td className="px-3 py-3">
                                                {isPending && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(item.id)}
                                                        className="rounded"
                                                    />
                                                )}
                                            </td>
                                            {/* ✅ Index */}
                                            <td className="px-2 py-3 text-center text-slate-500 font-mono text-xs">
                                                {rowIndex + 1}
                                            </td>
                                            <td className="px-4 py-3 font-medium">{item.branchCode}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1">
                                                    {actionInfo.icon} {actionInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium whitespace-nowrap">
                                                    {item.productName || item.barcode}
                                                </div>
                                                <div className="text-xs text-slate-500">{item.barcode}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {item.fromShelf && (
                                                    <div>จาก: {item.fromShelf}/{item.fromRow}/{item.fromIndex}</div>
                                                )}
                                                {item.toShelf && (
                                                    <div>ไป: {item.toShelf}/{item.toRow}/{item.toIndex}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cx("px-2 py-1 rounded-full text-xs font-medium", statusInfo.color)}>
                                                    {statusInfo.label}
                                                </span>
                                                {/* ✅ Show reject reason if exists (stored in note field) */}
                                                {item.status === "rejected" && item.note && (
                                                    <div className="text-xs text-rose-500 mt-1 max-w-[150px] truncate" title={item.note}>
                                                        💬 {item.note}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    {item.status === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(item.id, "completed")}
                                                                title="อนุมัติและดำเนินการทันที"
                                                                disabled={isUpdating}
                                                                className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50"
                                                            >
                                                                ✓ อนุมัติ
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditPosition(item)}
                                                                title="แก้ไขตำแหน่ง"
                                                                disabled={isUpdating}
                                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleSingleReject(item.id)}
                                                                disabled={isUpdating}
                                                                className="px-2 py-1 text-xs bg-rose-600 text-white rounded hover:bg-rose-500 disabled:opacity-50"
                                                            >
                                                                ✗
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.status === "approved" && (
                                                        <button
                                                            onClick={() => updateStatus(item.id, "completed")}
                                                            disabled={isUpdating}
                                                            className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50"
                                                        >
                                                            เสร็จ
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteRequest(item.id)}
                                                        className="px-2 py-1 text-xs border rounded hover:bg-slate-50"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* ✅ Load More Button */}
                        {hasMore && (
                            <div className="p-4 text-center border-t">
                                <button
                                    onClick={loadMore}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                                >
                                    โหลดเพิ่ม ({visibleCount}/{data.length})
                                </button>
                                <span className="ml-3 text-xs text-slate-500">
                                    แสดง {visibleCount} จาก {data.length} รายการ
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


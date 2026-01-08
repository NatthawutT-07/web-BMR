// PogRequests.jsx - Admin Page สำหรับจัดการ POG Change Requests
import React, { useEffect, useState } from "react";
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

export default function PogRequests() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [updating, setUpdating] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterBranch) params.branchCode = filterBranch;

            const res = await api.get("/pog-requests", { params });
            setData(res.data?.data || []);
        } catch (e) {
            console.error("Load POG requests error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterStatus, filterBranch]);

    const updateStatus = async (id, newStatus) => {
        setUpdating(id);
        try {
            const res = await api.patch(`/pog-requests/${id}`, { status: newStatus });
            loadData();
            alert(res.data.message || "อัปเดตสถานะสำเร็จ");
        } catch (e) {
            console.error("Update status error:", e);
            const msg = e?.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้";
            alert(msg);
        } finally {
            setUpdating(null);
        }
    };

    const deleteRequest = async (id) => {
        if (!confirm("ต้องการลบรายการนี้?")) return;
        try {
            await api.delete(`/pog-requests/${id}`);
            loadData();
        } catch (e) {
            console.error("Delete error:", e);
            alert("ไม่สามารถลบได้");
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
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

                <input
                    type="text"
                    placeholder="ค้นหาสาขา..."
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm w-40"
                />

                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700"
                >
                    🔄 รีเฟรช
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {["pending", "rejected", "completed"].map((status) => {
                    const count = data.filter((d) => d.status === status).length;
                    const info = STATUS_MAP[status];
                    return (
                        <div
                            key={status}
                            className={cx("p-3 rounded-xl border-2", info.badge, info.color.split(" ")[0])}
                        >
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-xs font-medium">{info.label}</div>
                        </div>
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
                                {data.map((item) => {
                                    const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
                                    const actionInfo = ACTION_MAP[item.action] || { label: item.action, icon: "📦" };
                                    const isUpdating = updating === item.id;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50">
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
                                                                onClick={() => updateStatus(item.id, "rejected")}
                                                                disabled={isUpdating}
                                                                className="px-2 py-1 text-xs bg-rose-600 text-white rounded hover:bg-rose-500 disabled:opacity-50"
                                                            >
                                                                ✗
                                                            </button>
                                                        </>
                                                    )}
                                                    {/* Legacy support: if any stuck in approved, allow complete */}
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
                    </div>
                )}
            </div>
        </div>
    );
}

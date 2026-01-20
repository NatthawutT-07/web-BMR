import React, { useState, useEffect, useMemo } from "react";
import api from "../../../utils/axios";
import {
    Search, RefreshCw, Building2, AlertTriangle,
    CheckCircle2, Clock, Store
} from "lucide-react";

// --- Constants ---

const BRANCH_NAMES = {
    "ST002": "เลี่ยงเมืองนนท์",
    "1001": "สาขาพระราม 9",
    "1002": "สาขาสุขุมวิท",
    "1003": "สาขาสยาม",
    "1004": "สาขาลาดพร้าว",
    "1005": "สาขาบางนา",
    "1006": "สาขารังสิต",
    "1007": "สาขาอ่อนนุช",
    "1008": "สาขาเมกะบางนา",
    "1009": "สาขาเซ็นทรัลเวิลด์",
    "1010": "สาขาสีลม",
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// --- Components ---

const StatCard = ({ title, count, icon, color, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            relative overflow-hidden rounded-xl border p-4 transition-all duration-200 text-left w-full
            ${active
                ? `bg-white shadow-md ring-2 ring-offset-1 ring-${color}-500 border-${color}-200`
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
            }
        `}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500`} />
        <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${active ? `text-${color}-700` : "text-slate-600"}`}>
                {title}
            </span>
            <div className={`p-1.5 rounded-full bg-${color}-100 text-${color}-600`}>
                {icon}
            </div>
        </div>
        <div className="text-2xl font-bold text-slate-800">
            {count.toLocaleString()}
        </div>
    </button>
);

export default function BranchAckStatus() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ branches: [], summary: {} });
    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, pending, completed

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/branch-ack-status");
            if (res.data.ok) {
                setData(res.data);
            } else {
                setError(res.data.message || "Failed to load data");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const { branches, summary } = data;

    // Filter Logic
    const filteredBranches = useMemo(() => {
        return branches.filter(b => {
            // Search
            const branchName = BRANCH_NAMES[b.branchCode] || "";
            const searchLower = search.toLowerCase();
            const matchSearch =
                b.branchCode.includes(searchLower) ||
                branchName.toLowerCase().includes(searchLower);

            // Status
            const matchStatus =
                statusFilter === 'all' ? true :
                    statusFilter === 'pending' ? b.pending > 0 :
                        b.status === 'completed';

            return matchSearch && matchStatus;
        }).sort((a, b) => b.pending - a.pending); // Show pending pending first
    }, [branches, search, statusFilter]);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">สถานะการรับทราบของสาขา</h1>
                        <p className="text-slate-500 text-sm mt-1">ติดตามการตอบรับการเปลี่ยนแปลง Shelf จากแต่ละสาขา</p>
                    </div>
                </div>

                {/* Summary Cards */}
                {!loading && summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="สาขาทั้งหมด"
                            count={summary.totalBranches || 0}
                            icon={<Store size={18} />}
                            color="blue"
                            active={statusFilter === 'all'}
                            onClick={() => setStatusFilter('all')}
                        />
                        <StatCard
                            title="สาขารอรับทราบ"
                            count={summary.branchesWithPending || 0}
                            icon={<Clock size={18} />}
                            color="amber"
                            active={statusFilter === 'pending'}
                            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                        />
                        <StatCard
                            title="รายการค้างรับทราบ"
                            count={summary.totalPending || 0}
                            icon={<AlertTriangle size={18} />}
                            color="rose"
                            active={false} // Just info
                            onClick={() => { }}
                        />
                    </div>
                )}

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ค้นหาสาขา หรือ รหัสสาขา..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-lg border border-slate-200">
                            {[
                                { id: 'all', label: 'ทั้งหมด' },
                                { id: 'pending', label: 'รอรับทราบ' },
                                { id: 'completed', label: 'เรียบร้อย' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setStatusFilter(opt.id)}
                                    className={`
                                        px-3 py-1.5 text-xs font-medium rounded-md transition-all
                                        ${statusFilter === opt.id
                                            ? "bg-white text-slate-800 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                            title="รีเฟรชข้อมูล"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                                    <th className="px-6 py-4">สาขา</th>
                                    <th className="px-6 py-4 text-center">รอรับทราบ</th>
                                    <th className="px-6 py-4 text-center">รับทราบแล้ว</th>
                                    <th className="px-6 py-4">เปลี่ยนล่าสุด</th>
                                    <th className="px-6 py-4">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-500">กำลังโหลด...</td></tr>
                                ) : filteredBranches.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
                                ) : filteredBranches.map((branch) => (
                                    <tr
                                        key={branch.branchCode}
                                        className={`transition-colors hover:bg-slate-50 ${branch.pending > 0 ? 'bg-amber-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${branch.pending > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                                                    <Building2 size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">
                                                        {BRANCH_NAMES[branch.branchCode] || branch.branchCode}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-mono">
                                                        {branch.branchCode}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {branch.pending > 0 ? (
                                                <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 text-xs font-bold text-white bg-rose-500 rounded-full shadow-sm shadow-rose-200">
                                                    {branch.pending}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-slate-600 font-medium">
                                                {branch.acknowledged || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-slate-400" />
                                                {formatDate(branch.lastChange)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {branch.status === "completed" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle2 size={14} />
                                                    เรียบร้อย
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                                                    <Clock size={14} />
                                                    รอรับทราบ
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

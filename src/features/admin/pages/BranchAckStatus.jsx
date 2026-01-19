// BranchAckStatus.jsx - Admin page to monitor branch acknowledgment status
import React, { useState, useEffect } from "react";
import api from "../../../utils/axios";

// Branch name mapping
const BRANCH_NAMES = {
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
    const d = new Date(dateStr);
    return d.toLocaleString("th-TH", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function BranchAckStatus() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ branches: [], summary: {} });
    const [error, setError] = useState("");

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

    useEffect(() => {
        fetchData();
    }, []);

    const { branches, summary } = data;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    สถานะการรับทราบของสาขา
                </h1>
                <p className="text-gray-500 mt-1">
                    ตรวจสอบว่าสาขาไหนรับทราบการเปลี่ยนแปลงแล้ว
                </p>
            </div>

            {/* Summary Cards */}
            {!loading && summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-500">สาขาทั้งหมด</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {summary.totalBranches || 0}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
                        <div className="text-sm text-gray-500">สาขารอรับทราบ</div>
                        <div className="text-2xl font-bold text-amber-600">
                            {summary.branchesWithPending || 0}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
                        <div className="text-sm text-gray-500">รายการรอรับทราบ</div>
                        <div className="text-2xl font-bold text-red-600">
                            {summary.totalPending || 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                    <span className="ml-3 text-gray-500">กำลังโหลด...</span>
                </div>
            )}

            {/* Table */}
            {!loading && branches.length > 0 && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    สาขา
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    รอรับทราบ
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    รับทราบแล้ว
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    เปลี่ยนล่าสุด
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    สถานะ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {branches.map((branch) => (
                                <tr
                                    key={branch.branchCode}
                                    className={branch.pending > 0 ? "bg-amber-50" : ""}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {BRANCH_NAMES[branch.branchCode] || branch.branchCode}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {branch.branchCode}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {branch.pending > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                                {branch.pending}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">0</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600">
                                        {branch.acknowledged}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDate(branch.lastChange)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {branch.status === "completed" ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ ครบแล้ว
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                ⏳ รอรับทราบ
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && branches.length === 0 && !error && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="text-gray-500">ยังไม่มีข้อมูลการเปลี่ยนแปลง</div>
                </div>
            )}

            {/* Refresh Button */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition"
                >
                    🔄 รีเฟรช
                </button>
            </div>
        </div>
    );
}

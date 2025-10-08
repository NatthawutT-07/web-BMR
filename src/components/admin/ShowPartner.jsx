import React, { useState, useEffect } from "react";
import useBmrStore from "../../store/bmr_store";
import { getPartner } from "../../api/admin/partner";

const ITEMS_PER_PAGE = 50;

const ShowPartner = () => {
    const token = useBmrStore((state) => state.token);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (token) {
            handleGetPartners(token);
        }
    }, [token]);

    const handleGetPartners = async (token) => {
        setLoading(true);
        try {
            const res = await getPartner(token);
            setPartners(res.data);
        } catch (err) {
            console.error("Error fetching partners:", err);
        } finally {
            setLoading(false);
        }
    };

    // Filter
    const filteredPartners = partners.filter((partner) =>
        partner.nameBP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.codeBP?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredPartners.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentPartners = filteredPartners.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Actions
    const handleEdit = (partnerId) => {
        console.log("Edit partner:", partnerId);
        // TODO: เปิด modal หรือ navigate ไปแก้ไข
    };

    const handleDelete = (partnerId) => {
        if (window.confirm("คุณแน่ใจว่าต้องการลบ?")) {
            console.log("Delete partner:", partnerId);
            // TODO: เรียก API ลบข้อมูล
        }
    };

    if (loading) {
        return (
            <div className="min-h-[300px] flex items-center justify-center bg-white rounded shadow p-6">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg font-medium">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4 font-sans text-gray-800">
            <h2 className="text-2xl font-semibold">Partner</h2>

            {/* Search */}
            <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัส"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {/* Table with scroll */}
            <div className="overflow-y-auto max-h-[600px] border border-gray-300 rounded shadow-sm">
                <table className="min-w-full text-sm table-fixed border-collapse">
                    <thead className="bg-gray-100 text-gray-700 font-semibold">
                        <tr>
                            <th className="px-3 py-2 border w-12 text-center">#</th>
                            <th className="px-3 py-2 border w-28 text-center">BP Code</th>
                            <th className="px-3 py-2 border w-60 text-left">BP Name</th>
                            <th className="px-3 py-2 border w-28 text-right">Balance</th>
                            <th className="px-3 py-2 border w-32 text-left">GroupCode</th>
                            <th className="px-3 py-2 border w-24 text-center">Country</th>
                            <th className="px-3 py-2 border w-40 text-left">TaxID</th>
                            <th className="px-3 py-2 border w-32 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPartners.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-6 text-gray-500">
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        ) : (
                            currentPartners.map((partner, idx) => (
                                <tr
                                    key={partner.id}
                                    className="border-t hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-3 py-2 text-center align-middle">{startIndex + idx + 1}</td>
                                    <td className="px-3 py-2 text-center align-middle">{partner.codeBP}</td>
                                    <td className="px-3 py-2 align-middle break-words whitespace-normal">{partner.nameBP}</td>
                                    <td className="px-3 py-2 text-right align-middle">{partner.accountBalance.toFixed(2)}</td>
                                    <td className="px-3 py-2 align-middle">{partner.groupCode}</td>
                                    <td className="px-3 py-2 text-center align-middle">{partner.billCountry}</td>
                                    <td className="px-3 py-2 align-middle break-words whitespace-normal">{partner.federalTaxId}</td>
                                    <td className="px-3 py-2 text-center align-middle space-x-2">
                                        <button
                                            onClick={() => handleEdit(partner.id)}
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white text-xs px-3 py-1 rounded"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => handleDelete(partner.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                                        >
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center space-x-3 mt-4">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                    >
                        ก่อนหน้า
                    </button>
                    <span className="px-3 py-1 border border-gray-300 rounded bg-gray-100">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                    >
                        ถัดไป
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShowPartner;

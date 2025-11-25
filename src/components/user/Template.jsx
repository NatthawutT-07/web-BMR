import React, { useState, useEffect } from "react";
import useBmrStore from "../../store/bmr_store";
import useShelfStore from "../../store/shelf_store";
import { getTemplateAndProduct } from "../../api/users/home";
import ShelfFilter from "../admin/shelf/second/ShelfFilter";
import ShelfCardUser from "./second/ShelfCardUser";

const Template = () => {
    const token = useBmrStore((s) => s.token);
    const branches = useShelfStore((s) => s.branches);
    const { fetchBranches } = useShelfStore();

    const [selectedBranchCode, setSelectedBranchCode] = useState("");
    const [filteredTemplate, setFilteredTemplate] = useState([]);
    const [selectedShelves, setSelectedShelves] = useState([]);
    const [loading, setLoading] = useState(false); // สถานะการโหลด

    useEffect(() => {
        if (token) {
            useShelfStore.getState().setToken(token);
            fetchBranches(token);
        }
    }, [token]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);  // เมื่อเริ่มโหลดข้อมูล
        try {
            const res = await getTemplateAndProduct(token, selectedBranchCode);

            // 1. กรุ๊ปข้อมูลตาม shelfCode
            const groupedByShelf = res.reduce((acc, item) => {
                const { shelfCode } = item;
                if (!acc[shelfCode]) acc[shelfCode] = [];
                acc[shelfCode].push(item);
                return acc;
            }, {});

            // 2. สร้าง array ของ shelf แต่ละอัน
            const shelvesArray = Object.keys(groupedByShelf).map((shelfCode) => {
                const items = groupedByShelf[shelfCode];
                const rowQty = Math.max(...items.map((i) => i.rowNo));
                const fullName = items[0]?.fullName || "N/A"; // สมมติชื่อชั้นวางอยู่ใน item
                return {
                    shelfCode,
                    fullName,
                    rowQty,
                    shelfProducts: items.sort((a, b) => a.rowNo - b.rowNo || a.index - b.index),
                };
            });

            setFilteredTemplate(shelvesArray);
        } catch (e) {
            console.error("Error fetching template data:", e);
        } finally {
            setLoading(false);  // เมื่อโหลดเสร็จให้ตั้งเป็น false
        }
    };

    // toggle shelf filter
    const handleToggleShelf = (shelfCode) => {
        setSelectedShelves((prev) =>
            prev.includes(shelfCode)
                ? prev.filter((s) => s !== shelfCode)
                : [...prev, shelfCode]
        );
    };

    const handleClearShelves = () => setSelectedShelves([]);

    // กรองตาม selectedShelves
    const displayedShelves = selectedShelves.length
        ? filteredTemplate.filter((shelf) => selectedShelves.includes(shelf.shelfCode))
        : filteredTemplate;

    return (
        <div className="container mx-auto px-6 md:px-8 space-y-6 max-w-full m-4">
            <form
                onSubmit={handleSubmit}
                className="mb-3 bg-white p-4 rounded shadow-sm w-full max-w-md mx-auto"
            >
                <label htmlFor="branch-sales" className="block mb-2 font-medium text-gray-700 text-sm">
                    Select Branch
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">
                    <select
                        id="branch-sales"
                        value={selectedBranchCode}
                        onChange={(e) => setSelectedBranchCode(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 w-full sm:flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs sm:text-sm"
                    >
                        <option value="">-- Select Branch --</option>
                        {branches.map((branch, id) => (
                            <option key={branch.branch_code ?? id} value={branch.branch_code}>
                                {id + 1}. {branch.branch_code} - {branch.branch_name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        disabled={loading}  // ปิดปุ่มขณะโหลด
                        className={`px-4 py-2 font-medium rounded text-xs sm:text-sm w-full sm:w-auto 
                        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`
                        }
                    >
                        {loading ? "OK" : "OK"}
                    </button>

                </div>
            </form>

            {loading && (
                <div className="flex justify-center items-center">
                    <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-blue-600 rounded-full"></div>
                    <span className="ml-2 text-gray-600">loading...</span>
                </div>
            )}

            {/* Shelf Filter */}
            {filteredTemplate.length > 0 && !loading && (
                <ShelfFilter
                    shelves={filteredTemplate.map((s) => s.shelfCode)}
                    selectedShelves={selectedShelves}
                    onToggle={handleToggleShelf}
                    onClear={handleClearShelves}
                    loading={loading}  // ส่งสถานะการโหลดไปยัง ShelfFilter
                />
            )}

            {/* แสดงทุก Shelf */}
            {displayedShelves.map((shelf) => (
                <ShelfCardUser key={shelf.shelfCode} template={shelf} />
            ))}
        </div>
    );
};

export default Template;

import React, { useState, useEffect } from "react";
import useBmrStore from "../../store/bmr_store";
import { getTemplateAndProduct } from "../../api/users/home";
import ShelfCardUser from "./second/ShelfCardUser";
import ShelfFilterUser from "./ShelfFilterUser";

const Template = () => {
    const token = useBmrStore((s) => s.token);
    const storecode = useBmrStore((s) => s.user?.storecode);

    const [filteredTemplate, setFilteredTemplate] = useState([]);
    const [selectedShelves, setSelectedShelves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    // โหลดข้อมูลอัตโนมัติ
    useEffect(() => {
        if (!token || !storecode) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await getTemplateAndProduct(token, storecode);

                const groupedByShelf = res.reduce((acc, item) => {
                    const { shelfCode } = item;
                    if (!acc[shelfCode]) acc[shelfCode] = [];
                    acc[shelfCode].push(item);
                    return acc;
                }, {});

                const shelvesArray = Object.keys(groupedByShelf).map((shelfCode) => {
                    const items = groupedByShelf[shelfCode];
                    const rowQty = Math.max(...items.map((i) => i.rowNo));
                    const fullName = items[0]?.fullName || "N/A";

                    return {
                        shelfCode,
                        fullName,
                        rowQty,
                        shelfProducts: items.sort(
                            (a, b) => a.rowNo - b.rowNo || a.index - b.index
                        ),
                    };
                });

                setFilteredTemplate(shelvesArray);
            } catch (err) {
                console.error("Error fetching template data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, storecode]);


    // 🔎 ฟิลเตอร์ + ค้นหา
    const displayedShelves = filteredTemplate
        .filter(
            (shelf) =>
                selectedShelves.length === 0 ||
                selectedShelves.includes(shelf.shelfCode)
        )
        .map((shelf) => {
            const text = searchText.toLowerCase();
            const matched = shelf.shelfProducts.filter((item) => {
                return (
                    item.codeProduct?.toString().includes(text) ||
                    item.nameProduct?.toLowerCase().includes(text) ||
                    item.nameBrand?.toLowerCase().includes(text) ||
                    item.shelfCode?.toLowerCase().includes(text) ||
                    item.rowNo?.toString().includes(text) ||
                    item.index?.toString().includes(text)
                );
            });

            return { ...shelf, matchedProducts: matched };
        })
        .filter((shelf) => searchText === "" || shelf.matchedProducts.length > 0);


    return (
        <div className="container mx-auto px-3 md:px-6 space-y-6">

            {/* Branch Header */}
            <div className="bg-white p-4 rounded shadow-sm text-center text-lg font-medium">
                Branch: <span className="font-bold">{storecode}</span>
            </div>

            {/* SUMMARY + IMAGE */}
            {!loading && filteredTemplate.length > 0 && (
                <div className="w-full flex justify-center">

    <div className="bg-white p-4 rounded-lg shadow-md 
                    flex flex-col sm:flex-row gap-4 
                    mx-auto max-w-4xl">

        {/* RIGHT IMAGE */}
        <div className="flex justify-center sm:w-[260px]">
            <img
                src={`/images/branch/${storecode.toUpperCase()}.png`}
                alt={`Branch ${storecode}`}
                className="w-full max-w-[240px] object-cover rounded"
                loading="lazy"
            />
        </div>

        {/* LEFT SUMMARY */}
        <div className="bg-gray-50 border rounded p-3 shadow-sm 
                        max-h-[480px] w-[260px] overflow-y-auto">

            <h3 className="font-semibold text-gray-700 mb-2 text-sm text-center">
                Shelf Structure Summary
            </h3>

            {filteredTemplate.map((shelf) => (
                <div
                    key={shelf.shelfCode}
                    className="mb-2 pb-2 border-b last:border-b-0"
                >
                    <div className="font-bold text-blue-700 text-sm leading-tight">
                        Shelf {shelf.shelfCode}
                    </div>

                    <div className="ml-2 mt-1 text-xs leading-tight">
                        <div className="font-semibold text-gray-600 leading-tight">
                            Total Rows: {shelf.rowQty}
                        </div>

                        {Array.from({ length: shelf.rowQty }).map((_, idx) => {
                            const rowNo = idx + 1;
                            const rowProducts = shelf.shelfProducts.filter(
                                (p) => p.rowNo === rowNo
                            );

                            return (
                                <div
                                    key={rowNo}
                                    className="ml-1 flex text-gray-700 leading-tight py-[1px]"
                                >
                                    <span className="pr-4">• Row {rowNo}</span>
                                    <span>{rowProducts.length} items</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

    </div>
</div>


            )}

            {/* Shelf Filter */}
            {!loading && filteredTemplate.length > 0 && (
                <ShelfFilterUser
                    shelves={filteredTemplate.map((s) => s.shelfCode)}
                    selectedShelves={selectedShelves}
                    onToggle={(shelfCode) =>
                        setSelectedShelves((prev) =>
                            prev.includes(shelfCode)
                                ? prev.filter((s) => s !== shelfCode)
                                : [...prev, shelfCode]
                        )
                    }
                    onClear={() => setSelectedShelves([])}
                />
            )}

            {/* SEARCH BAR */}
            <div className="w-full max-w-xl mx-auto">
                <input
                    type="text"
                    placeholder="Search shelf / row / index / name / brand / code..."
                    className="w-full px-4 py-2 border rounded shadow-sm"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            {/* SHELF LIST */}
            {displayedShelves.map((shelf) => (
                <ShelfCardUser
                    key={shelf.shelfCode}
                    template={{ ...shelf, shelfProducts: shelf.matchedProducts }}
                    autoOpen={searchText.length > 0}
                />
            ))}
        </div>
    );
};

export default Template;

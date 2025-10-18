import React, { useState } from "react";
import useBmrStore from "../../store/bmr_store";
import useShelfData from "../../hooks/useShelfData";

const Template = () => {
    const token = useBmrStore((s) => s.token);
    const { branches, template, product, loading, fetchProduct } = useShelfData(token);

    const [selectedBranchCode, setSelectedBranchCode] = useState("");
    const [selectedShelves, setSelectedShelves] = useState([]);
    const [filteredTemplate, setFilteredTemplate] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const matched = template.filter(
            (item) => String(item.branchCode) === String(selectedBranchCode)
        );
        setFilteredTemplate(matched);
        fetchProduct(selectedBranchCode);
    };

    const toggleShelfFilter = (code) =>
        setSelectedShelves((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );

    const handleClearFilter = () => setSelectedShelves([]);

    const displayedTemplates = selectedShelves.length
        ? filteredTemplate.filter((t) => selectedShelves.includes(t.shelfCode))
        : filteredTemplate;

    const checkData = () => console.log("branches : ", branches, "||   template : ", template, "||  product", product);

    return (
        <div className="container mx-auto px-3 md:px-6 py-4 space-y-6 max-w-full">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col md:flex-row md:items-center gap-3 mb-4"
            >
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-3/4">
                    <select
                        id="branches"
                        value={selectedBranchCode}
                        onChange={(e) => setSelectedBranchCode(e.target.value)}
                        className="border border-gray-300 rounded p-2 w-full sm:w-auto min-w-[300px] text-sm md:text-base"
                    >
                        <option value="">-- Select Branch --</option>
                        {branches.map((branch, id) => (
                            <option key={branch.codeADA ?? id} value={branch.codeADA}>
                                {id + 1}. {branch.adaStore} - {branch.codeSAP}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
                    >
                        OK
                    </button>
                </div>
            </form>

            {/* 🔹 Loading */}
            {loading && (
                <div className="flex items-center justify-center mt-4 text-gray-600 text-sm">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600 mr-2"></div>
                    <span>Loading...</span>
                </div>
            )}

            {/* 🔹 Filter Shelf */}
            {filteredTemplate.length > 0 && !loading && (
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 text-sm md:text-base">
                        🗂 Filter by Shelf
                    </label>
                    <div className="flex flex-wrap gap-3 mb-2 text-sm">
                        {[...new Set(filteredTemplate.map((t) => t.shelfCode))].map(
                            (shelfCode) => (
                                <label key={shelfCode} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedShelves.includes(shelfCode)}
                                        onChange={() => toggleShelfFilter(shelfCode)}
                                    />
                                    <span>{shelfCode}</span>
                                </label>
                            )
                        )}
                    </div>
                    <button
                        onClick={handleClearFilter}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs md:text-sm"
                    >
                        ❌ Clear Filter
                    </button>
                </div>
            )}

            {/* 🔹 Template Data */}
            {!loading &&
                displayedTemplates.map((t) => {
                    const shelfProducts = product
                        .filter((p) => p.shelfCode === t.shelfCode)
                        .sort((a, b) => Number(a.index) - Number(b.index));

                    return (
                        <div
                            key={t.shelfCode}
                            className="border rounded shadow-sm md:shadow-md p-3 md:p-4 mb-6 bg-white"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                                <h2 className="text-sm md:text-lg font-semibold text-gray-800">
                                    Shelf: {t.shelfCode} - {t.fullName} ({t.rowQty} Rows)
                                </h2>
                            </div>

                            {/* ตาราง Responsive */}
                            <div className="overflow-x-auto">
                                <table className="min-w-[800px] md:min-w-[1200px] w-full text-left border text-gray-700 border-gray-300 text-[11px] md:text-xs">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            {[
                                                "ID",
                                                "Code",
                                                "Name",
                                                "Brand",
                                                "ShelfLife",
                                                "RSP",
                                                "SalesQty",
                                                "Wd Qty",
                                                "MIN",
                                                "MAX",
                                                "StockQty",
                                            ].map((h) => (
                                                <th key={h} className="border px-2 py-1 text-center">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {[...Array(Number(t.rowQty) || 0)].map((_, rowIndex) => {
                                            const rowNo = rowIndex + 1;
                                            const rowProducts = shelfProducts.filter(
                                                (p) => p.rowNo === rowNo
                                            );

                                            return (
                                                <React.Fragment key={rowNo}>
                                                    <tr className="bg-blue-50">
                                                        <td
                                                            className="p-2 border font-semibold italic text-gray-700"
                                                            colSpan={15}
                                                        >
                                                            ➤ Row: {rowNo}
                                                        </td>
                                                    </tr>

                                                    {rowProducts.length > 0 ? (
                                                        rowProducts.map((prod) => (
                                                            <tr key={prod.codeProduct}>
                                                                <td className="p-2 border text-center">
                                                                    {prod.index}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {String(prod.codeProduct).padStart(5, "0")}
                                                                </td>
                                                                <td className="p-2 border">{prod.nameProduct ?? "-"}</td>
                                                                <td className="p-2 border">{prod.nameBrand ?? "-"}</td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.shelfLife ?? "-"}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.salesPriceIncVAT ?? "-"}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.salesQuantity ?? "-"}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.withdrawQuantity ?? "-"}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.minStore ?? "-"}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.maxStore ?? "-"}
                                                                </td>
                                                                <td className="p-2 border text-center">
                                                                    {prod.stockQuantity ?? "-"}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                className="p-2 border text-center text-gray-500 italic"
                                                                colSpan={16}
                                                            >
                                                                No products in this Row
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
};

export default Template;

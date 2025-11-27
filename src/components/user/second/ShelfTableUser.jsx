import React from "react";

const ShelfTableUser = ({ shelfProducts = [] }) => {
    if (!Array.isArray(shelfProducts)) return <div>Invalid data.</div>;

    const valid = shelfProducts.filter((p) => p.rowNo !== undefined);
    const rowCount = Math.max(...valid.map((p) => p.rowNo), 0);

    const formatNum = (n) => (n ? n.toLocaleString() : "-");

    return (
        <div className="overflow-x-auto w-full px-1 sm:px-3">
            <table className="min-w-[900px] w-full text-xs border text-gray-700">

                <thead className="bg-gray-200 sticky top-0 z-20">
                    <tr>
                        <th className="border px-1 py-1 text-center">ID</th>
                        <th className="border px-1 py-1 text-center">Baccode</th>
                        <th className="border px-1 py-1 text-center">Code</th>
                        <th className="border px-1 py-1 text-center">Name</th>
                        <th className="border px-1 py-1 text-center">Brand</th>
                        <th className="border px-1 py-1 text-center w-14">Life</th>
                        <th className="border px-1 py-1 text-center w-14">RSP</th>
                        <th className="border px-1 py-1 text-center w-14">Sales Qty</th>
                        <th className="border px-1 py-1 text-center w-14">Withdraw Qty</th>
                        <th className="border px-1 py-1 text-center w-14">Min</th>
                        <th className="border px-1 py-1 text-center w-14">Max</th>
                        <th className="border px-1 py-1 text-center w-14">Stock</th>
                        {/* <th className="border px-7 py-1 text-center w-10">Sales Amt</th> */}
                        {/* <th className="border px-3 py-1 text-center w-10">Withdraw Amt</th> */}
                    </tr>
                </thead>

                <tbody>

                    {[...Array(rowCount)].map((_, idx) => {
                        const rowNo = idx + 1;
                        const items = shelfProducts.filter((p) => p.rowNo === rowNo);
                        const zeroToDash = (v) => (v === 0 || v === "0" ? "-" : v ?? "-");

                        return (
                            <React.Fragment key={rowNo}>
                                {/* Row header */}
                                <tr className="bg-blue-50">
                                    <td className="border p-1 font-semibold italic" colSpan={14}>
                                        ➤ Row {rowNo}
                                    </td>
                                </tr>

                                {items.length > 0 ? (
                                    items.map((p, i) => {
                                        const isStriped = i % 2 !== 0 ? "bg-gray-50" : "bg-white";
                                        return (
                                            <tr key={i} className={isStriped}>
                                                <td className="border p-1 text-center">{zeroToDash(p.index)}</td>
                                                <td className="border p-1 text-center">{zeroToDash(p.barcode)}</td>
                                                <td className="border p-1 text-center">{String(p.codeProduct).padStart(5, "0")}</td>
                                                <td className="border p-1">{p.nameProduct}</td>
                                                <td className="border p-1">{p.nameBrand}</td>
                                                <td className="border p-1 text-center">{zeroToDash(p.shelfLife)}</td>
                                                <td className="border p-1 text-center">{zeroToDash(p.salesPriceIncVAT)}</td>

                                                <td className="border p-1 text-center text-green-600">
                                                    {zeroToDash(p.salesQuantity)}
                                                </td>

                                                <td className="border p-1 text-center text-red-600">
                                                    {zeroToDash(p.withdrawQuantity)}
                                                </td>

                                                <td className="border p-1 text-center">{zeroToDash(p.minStore)}</td>
                                                <td className="border p-1 text-center">{zeroToDash(p.maxStore)}</td>

                                                <td className="border p-1 text-center text-yellow-700">
                                                    {zeroToDash(p.stockQuantity)}
                                                </td>

                                                {/* <td className="border p-1 text-right text-green-700">
                                                    {p.salesTotalPrice && p.salesTotalPrice !== 0
                                                        ? Number(p.salesTotalPrice).toFixed(2)
                                                        : "-"}
                                                </td>

                                                <td className="border p-1 text-right text-orange-700">
                                                    {zeroToDash(formatNum(p.withdrawValue))}
                                                </td> */}
                                            </tr>

                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={13} className="border p-1 text-center text-gray-500">
                                            No products in this row
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ShelfTableUser;

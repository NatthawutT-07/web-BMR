import ShelfRow from "./ShelfRow";

const ShelfTable = ({ rows, shelfDetail , handleDeleteProduct}) => {
    // คำนวณ total ของทั้ง shelf
    const shelfTotals = Object.values(rows).flat().reduce(
        (acc, product) => {
            const matchedDetail = shelfDetail.find(
                (item) => String(item.codeProduct) === String(product.codeProduct)
            );
            const toNumber = (val) => Number(val) || 0;
            acc.salesTotalPrice += toNumber(matchedDetail?.salesTotalPrice);
            acc.withdrawValue += toNumber(matchedDetail?.withdrawValue);
            return acc;
        },
        {
            salesTotalPrice: 0,
            withdrawValue: 0,
        }
    );

    return (
        <table className="w-full table-auto text-sm text-gray-700 border border-gray-300 rounded">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border px-2 py-1 text-center">ID</th>
                    <th className="border px-2 py-1 text-center">Code</th>
                    <th className="border px-2 py-1 text-center">Name</th>
                    <th className="border px-2 py-1 text-center">Brand</th>
                    <th className="border px-2 py-1 text-center">ShelfLife</th>
                    <th className="border px-2 py-1 text-center">RSP</th>
                    <th className="border px-2 py-1 text-center">SalesQty</th>
                    <th className="border px-2 py-1 text-center">Wd Qty</th>
                    <th className="border px-2 py-1 text-center">MIN</th>
                    <th className="border px-2 py-1 text-center">MAX</th>
                    <th className="border px-2 py-1 text-center">StockQty</th>
                    <th className="border px-2 py-1 text-center">UnitCost</th>
                    <th className="border px-2 py-1 text-center">StockCost</th>
                    <th className="border px-2 py-1 text-center">SalesAmount</th>
                    <th className="border px-2 py-1 text-center">Wd Amount</th>
                    <th className="border px-2 py-1 text-center">delete</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(rows).map(([row, products]) => (
                    <ShelfRow key={row} row={row} products={products} shelfDetail={shelfDetail} handleDeleteProduct={handleDeleteProduct} />
                ))}

                {/* ✅ แถว Total ของทั้ง shelf */}
                <tr className="bg-green-100 font-semibold">
                    <td colSpan={13} className="border px-2 py-1 text-center">(Shelf) Total</td>
                    <td className="border px-2 py-1 text-center">{shelfTotals.salesTotalPrice.toFixed(2)}</td>
                    <td className="border px-2 py-1 text-center">{shelfTotals.withdrawValue.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    );
};

export default ShelfTable;

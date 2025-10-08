const ShelfRow = ({ row, products, shelfDetail ,handleDeleteProduct}) => {
    // คำนวณยอดรวมของ salesTotalPrice และ withdrawValue
    const totals = products.reduce(
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
        <>
            <tr className="bg-gray-50">
                <td colSpan={15} className="font-semibold px-2 py-2 border border-t-2 border-gray-300">
                    Row: {row}
                </td>
            </tr>

            {products.map((product, idx) => {
                const matchedDetail = shelfDetail.find(
                    (item) => String(item.codeProduct) === String(product.codeProduct)
                );

                return (
                    <tr key={`${row}-${product.codeProduct}`} className="border-t">
                        <td className="border px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border px-2 py-1 text-center">
                            {String(product.codeProduct).padStart(5, '0')}
                        </td>
                        <td className="border px-2 py-1">{matchedDetail?.nameProduct ?? '-'}</td>
                        <td className="border px-2 py-1">{matchedDetail?.nameBrand ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.shelfLife ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.salesPriceIncVAT ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.salesQuantity ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.withdrawQuantity ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.minStore ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.maxStore ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.stockQuantity ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.purchasePriceExcVAT ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">
                            {(matchedDetail?.stockQuantity && matchedDetail?.purchasePriceExcVAT)
                                ? (matchedDetail.stockQuantity * matchedDetail.purchasePriceExcVAT).toFixed(2)
                                : '-'}
                        </td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.salesTotalPrice ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">{matchedDetail?.withdrawValue ?? '-'}</td>
                        <td className="border px-2 py-1 text-center">
                            <button
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleDeleteProduct(product)}
                            >
                                Delete
                            </button>
                        </td>

                    </tr>
                );
            })}

            <tr className="bg-yellow-100 font-semibold">
                <td className="border px-2 py-1 text-center" colSpan={13}>(Row) Total</td>
                <td className="border px-2 py-1 text-center">{totals.salesTotalPrice.toFixed(2)}</td>
                <td className="border px-2 py-1 text-center">{totals.withdrawValue.toFixed(2)}</td>
            </tr>
        </>
    );
};

export default ShelfRow;

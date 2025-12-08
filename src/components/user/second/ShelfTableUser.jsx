import React, { useMemo } from "react";

const ShelfTableUser = ({ shelfProducts = [] }) => {
  if (!Array.isArray(shelfProducts)) return <div>Invalid data.</div>;

  // เอาเฉพาะตัวที่มี rowNo
  const valid = useMemo(
    () => shelfProducts.filter((p) => p.rowNo !== undefined),
    [shelfProducts]
  );

  // จำนวนแถวทั้งหมด (Row)
  const rowCount = useMemo(
    () => Math.max(...valid.map((p) => p.rowNo || 0), 0),
    [valid]
  );

  // group ตาม rowNo
  const groupedRows = useMemo(() => {
    const result = {};
    valid.forEach((p) => {
      const rowNo = p.rowNo || 0;
      if (!result[rowNo]) result[rowNo] = [];
      result[rowNo].push(p);
    });
    return result;
  }, [valid]);

  const zeroToDash = (v) => (v === 0 || v === "0" ? "-" : v ?? "-");

  return (
    <div className="overflow-x-auto w-full px-1 sm:px-3 print:px-0 print:overflow-visible">
      <table
        className="
          w-full border text-[11px] sm:text-xs lg:text-sm text-gray-700
          print:text-[8px] print:leading-tight
        "
      >
        <thead className="bg-gray-200 sticky top-0 z-20 print:static">
          <tr>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              ID
            </th>
            <th className="border px-2 py-1 text-center print:px-[2px] align-middle">
              Barcode
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Code
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Name
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Brand
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Life
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              RSP
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Sales
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              With..
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Min
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Max
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Stock
            </th>
            {/* ✅ คอลัมน์ Audit */}
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              Audit
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rowCount }).map((_, idx) => {
            const rowNo = idx + 1;
            const items = groupedRows[rowNo] || [];

            return (
              <React.Fragment key={rowNo}>
                {/* หัว row (แยกแต่ละ Row) */}
                <tr className="bg-blue-50 print:bg-slate-200">
                  <td
                    colSpan={13} // 12 คอลัมน์ข้อมูล + 1 Audit
                    className="border p-1 print:py-[2px] font-semibold italic text-left"
                  >
                    ➤ Row {rowNo}
                  </td>
                </tr>

                {items.length > 0 ? (
                  items.map((p, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2
                          ? // แถวลำดับที่ 2,4,6,... → สีอ่อนขึ้นทั้งบนเว็บและ PDF
                            "bg-gray-50 print:bg-gray-100"
                          : // แถว 1,3,5,... → ขาวปกติ
                            "bg-white print:bg-white"
                      }
                    >
                      <td className="border p-1 print:px-[2px] text-center align-middle">
                        {zeroToDash(p.index)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center whitespace-nowrap align-middle">
                        {zeroToDash(p.barcode)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center whitespace-nowrap align-middle">
                        {p.codeProduct
                          ? String(p.codeProduct).padStart(5, "0")
                          : "-"}
                      </td>

                      {/* Name: 1 บรรทัดบนเว็บ + … / PDF ให้ wrap ได้ */}
                      <td
                        className="
                          border p-1 print:px-[2px] align-middle
                          max-w-[140px] sm:max-w-[200px] lg:max-w-[260px]
                          whitespace-nowrap overflow-hidden text-ellipsis
                          print:whitespace-normal print:max-w-none
                        "
                        title={p.nameProduct}
                      >
                        {p.nameProduct}
                      </td>

                      {/* Brand */}
                      <td
                        className="
                          border p-1 print:px-[2px] align-middle
                          max-w-[100px] sm:max-w-[140px] lg:max-w-[180px]
                          whitespace-nowrap overflow-hidden text-ellipsis
                          print:whitespace-normal print:max-w-none
                        "
                        title={p.nameBrand}
                      >
                        {p.nameBrand}
                      </td>

                      <td className="border p-1 print:px-[2px] text-center align-middle">
                        {zeroToDash(p.shelfLife)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center align-middle">
                        {zeroToDash(p.salesPriceIncVAT)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center text-green-600 align-middle">
                        {zeroToDash(p.salesQuantity)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center text-red-600 align-middle">
                        {zeroToDash(p.withdrawQuantity)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center align-middle">
                        {zeroToDash(p.minStore)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center align-middle">
                        {zeroToDash(p.maxStore)}
                      </td>
                      <td className="border p-1 print:px-[2px] text-center text-yellow-700 align-middle">
                        {zeroToDash(p.stockQuantity)}
                      </td>

                      {/* Audit: บนจอ = checkbox, PDF = กล่องติ๊ก */}
                      <td className="border p-1 print:px-[2px] text-center align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-600 print:hidden"
                        />
                        <span className="hidden print:inline-block">☐</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={13}
                      className="border p-1 print:py-[2px] text-center text-gray-500"
                    >
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

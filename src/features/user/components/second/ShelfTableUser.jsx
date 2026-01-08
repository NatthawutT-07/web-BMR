import React, { useMemo, useState } from "react";
import PogRequestModal from "../PogRequestModal";
import useBmrStore from "../../../../store/bmr_store";

const ShelfTableUser = ({ shelfProducts = [] }) => {
  const storecode = useBmrStore((s) => s.user?.storecode);
  const [pogRequestOpen, setPogRequestOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRequest = (product) => {
    setSelectedProduct(product);
    setPogRequestOpen(true);
  };
  if (!Array.isArray(shelfProducts)) {
    return <div className="text-xs text-red-500">Invalid data.</div>;
  }

  // เอาเฉพาะตัวที่มี rowNo
  const valid = useMemo(
    () => shelfProducts.filter((p) => p.rowNo !== undefined),
    [shelfProducts]
  );

  // จำนวนแถวทั้งหมด (Row)
  const rowCount = useMemo(() => {
    if (!valid.length) return 0;
    return Math.max(...valid.map((p) => p.rowNo || 0), 0);
  }, [valid]);

  // group ตาม rowNo
  const groupedRows = useMemo(() => {
    const result = {};
    valid.forEach((p) => {
      const rowNo = p.rowNo || 0;
      if (!result[rowNo]) result[rowNo] = [];
      result[rowNo].push(p);
    });

    // sort index ในแต่ละ row ให้เป็นระเบียบ
    Object.keys(result).forEach((rowNo) => {
      result[rowNo].sort((a, b) => (a.index || 0) - (b.index || 0));
    });

    return result;
  }, [valid]);

  const zeroToDash = (v) => {
    if (v === null || v === undefined) return "0";
    if (v === 0 || v === "0") return "0";
    return v;
  };

  // ปัดเศษเป็น int สำหรับ 3M Avg และ Target
  const formatInt = (v) => {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (Number.isNaN(n)) return "-";
    if (n === 0) return "-";
    return Math.round(n); // ถ้าอยากปัดลงใช้ Math.floor ได้
  };

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
              id
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              บาร์โค้ด
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              รหัส
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              ชื่อสินค้า
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              ยี่ห้อ
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              ชีวิต
            </th>
            <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              ราคา
            </th>

            {/* ⭐ ใหม่: Avg 3 เดือน, Target, ยอดขายเดือนนี้ */}
            {/* <th className="border px-1 py-1 text-center print:px-[2px] align-middle"> */}
            {/* 3M
            </th> */}
            {/* <th className="border py-1 text-center print:px-[2px] align-middle">
              Target
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Sales
            </th> */}

            {/* <th className="border py-1 text-center print:px-[2px] align-middle">
              With..
            </th> */}
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Min
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              Max
            </th>
            <th className="border py-1 text-center print:px-[2px] align-middle">
              สต็อค
            </th>
            {/* Audit */}
            {/* <th className="border px-1 py-1 text-center print:px-[2px] align-middle">
              ตรวจสอบ
            </th> */}
            {/* Notify Request */}
            <th className="border px-1 py-1 text-center print:hidden align-middle">
              report
            </th>
          </tr>
        </thead>

        <tbody>
          {rowCount === 0 && (
            <tr>
              <td
                colSpan={16}
                className="border p-1 text-center text-gray-500 text-xs"
              >
                No products.
              </td>
            </tr>
          )}

          {Array.from({ length: rowCount }).map((_, idx) => {
            const rowNo = idx + 1;
            const items = groupedRows[rowNo] || [];

            return (
              <React.Fragment key={rowNo}>
                {/* หัว row (แยกแต่ละ Row) */}
                <tr className="bg-blue-50 print:bg-slate-200">
                  <td
                    colSpan={16} // 14 คอลัมน์ข้อมูล + 1 Audit + 1 Request
                    className="border p-1 print:py-[2px] font-semibold italic text-left"
                  >
                    ➤ Row {rowNo}
                  </td>
                </tr>

                {items.length > 0 ? (
                  items.map((p, i) => {
                    const currentSales = Number(p.salesCurrentMonthQty ?? 0);
                    const targetVal = Number(p.salesTargetQty ?? 0);
                    const hitTarget =
                      targetVal > 0 &&
                      !Number.isNaN(currentSales) &&
                      currentSales >= targetVal;

                    return (
                      <tr
                        key={`${rowNo}-${p.codeProduct || i}`}
                        className={
                          i % 2
                            ? "bg-gray-50 print:bg-gray-100"
                            : "bg-white print:bg-white"
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

                        {/* Name */}
                        <td
                          className="
    border p-1 print:px-[2px] align-middle
    whitespace-nowrap
    min-w-[240px] sm:min-w-[230px] lg:min-w-[260px]
    print:min-w-0
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

                        {/* ⭐ 3M Qty (รวม 3 เดือน ปัดเป็น int) */}
                        {/* <td className="border p-1 print:px-[2px] text-center text-indigo-700 align-middle">
                          {formatInt(p.sales3mQty)}
                        </td> */}

                        {/* ⭐ Target (80% ของ avg 3 เดือน) ปัดเป็น int */}
                        {/* <td className=" border p-1 print:px-[2px] text-center text-purple-700 align-middle">
                          {formatInt(p.salesTargetQty)}
                        </td> */}

                        {/* ⭐ Sales เดือนนี้เท่านั้น + ไฮไลต์ถ้าถึงเป้า */}
                        {/* <td
                          className={`
                            border p-1 print:px-[2px] text-center font-semibold align-middle
                            text-blue-600
                            ${hitTarget ? "bg-green-50" : ""}
                          `}
                        >
                          {zeroToDash(p.salesCurrentMonthQty)}
                        </td> */}

                        {/* <td className="border p-1 print:px-[2px] text-center text-red-600 align-middle">
                          {zeroToDash(p.withdrawQuantity)}
                        </td> */}

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
                        {/* <td className="border p-1 print:px-[2px] text-center align-middle">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-600 print:hidden cursor-pointer"
                          />
                          <span className="hidden print:inline-block">☐</span>
                        </td> */}

                        {/* Request Button */}
                        <td className="border text-center align-middle print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRequest(p)}
                            className=" hover:bg-amber-200 p-1 rounded transition-colors"
                            title="แจ้งขอเปลี่ยน"
                          >
                            📝
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={16}
                      className="border p-1 print:py-[2px] text-center text-gray-500 text-xs"
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

      {/* Modal */}
      {pogRequestOpen && (
        <PogRequestModal
          open={pogRequestOpen}
          onClose={() => setPogRequestOpen(false)}
          branchCode={storecode}
          barcode={selectedProduct?.barcode}
          productName={selectedProduct?.nameProduct}
          currentShelf={selectedProduct?.shelfCode}
          currentRow={selectedProduct?.rowNo}
          currentIndex={selectedProduct?.index}
        />
      )}
    </div>
  );
};

export default ShelfTableUser;

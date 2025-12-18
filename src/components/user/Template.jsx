import React, { useState, useEffect, useMemo, Suspense } from "react";
import useBmrStore from "../../store/bmr_store";
import { getTemplateAndProduct } from "../../api/users/home";

// Lazy load component หนัก ๆ
const ShelfCardUser = React.lazy(() => import("./second/ShelfCardUser"));
const ShelfFilterUser = React.lazy(() => import("./ShelfFilterUser"));

/* ================================
 * Helper: ช่วงเดือนตามเวลาไทย
 * - currentStart  = วันแรกของเดือนปัจจุบัน 00:00 (เวลาไทย)
 * - prev3Start    = วันแรกของเดือนย้อนหลังไป 3 เดือน 00:00 (เวลาไทย)
 * ================================ */
const getBangkokMonthWindows = () => {
  const now = new Date();
  const bangkokNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  // วันแรกของเดือนปัจจุบัน
  const currentStart = new Date(bangkokNow);
  currentStart.setDate(1);
  currentStart.setHours(0, 0, 0, 0);

  // วันแรกของเดือนย้อนหลัง 3 เดือน
  const prev3Start = new Date(currentStart);
  prev3Start.setMonth(prev3Start.getMonth() - 3);

  return { currentStart, prev3Start };
};

// แปลง Date → MM/YYYY
const formatMMYYYY = (d) => {
  if (!d) return "";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
};

const Template = () => {
  const storecode = useBmrStore((s) => s.user?.storecode);

  const [data, setData] = useState([]);
  const [selectedShelves, setSelectedShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 🕒 ช่วงเดือนสำหรับ logic ใหม่ (3 เดือนก่อนหน้า + เดือนปัจจุบัน)
  const { currentStart, prev3Start } = useMemo(
    () => getBangkokMonthWindows(),
    []
  );

  // เดือนสุดท้ายของช่วง 3 เดือนก่อนหน้า = เดือนก่อนหน้าเดือนปัจจุบัน
  const prev3EndMonth = useMemo(() => {
    const d = new Date(currentStart);
    d.setMonth(d.getMonth() - 1);
    return d;
  }, [currentStart]);

  // โหลด Template + Product
  useEffect(() => {
    if (!storecode) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getTemplateAndProduct(storecode);
        setData(res || []);
      } catch (e) {
        console.error("Template Load Error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storecode]);

  // Group ตาม shelfCode
  const groupedShelves = useMemo(() => {
    if (!data.length) return [];

    const groups = data.reduce((acc, item) => {
      if (!acc[item.shelfCode]) acc[item.shelfCode] = [];
      acc[item.shelfCode].push(item);
      return acc;
    }, {});

    return Object.keys(groups).map((shelfCode) => {
      const items = groups[shelfCode];

      const rowNumbers = items
        .map((i) => i.rowNo || 1)
        .filter((n) => typeof n === "number");

      const rowQty = rowNumbers.length ? Math.max(...rowNumbers) : 1;

      return {
        shelfCode,
        fullName: items[0]?.fullName || "N/A",
        rowQty,
        shelfProducts: items.sort(
          (a, b) =>
            (a.rowNo || 0) - (b.rowNo || 0) ||
            (a.index || 0) - (b.index || 0)
        ),
      };
    });
  }, [data]);

  // Filter + Search
  const displayedShelves = useMemo(() => {
    const lower = searchText.toLowerCase();

    return groupedShelves
      .filter(
        (shelf) =>
          selectedShelves.length === 0 ||
          selectedShelves.includes(shelf.shelfCode)
      )
      .map((shelf) => {
        const matched = shelf.shelfProducts.filter((item) => {
          return (
            item.codeProduct?.toString().includes(lower) ||
            item.nameBrand?.toLowerCase().includes(lower)
          );
        });

        return { ...shelf, matchedProducts: matched };
      })
      .filter(
        (shelf) => searchText === "" || shelf.matchedProducts.length > 0
      );
  }, [groupedShelves, selectedShelves, searchText]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* HEADER + ปุ่ม PRINT (ซ่อนปุ่มตอนพิมพ์) */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:gap-1">
          <div>
            <p className="text-xs sm:text-sm text-slate-500">
              สาขา:{" "}
              <span className="font-semibold text-slate-700">
                {storecode || "-"}
              </span>{" "}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
            >
              🖨 พิมพ์ PDF / กระดาษ
            </button>
          </div>
        </header>

        {/* SUMMARY + IMAGE (ไม่ต้องติดในกระดาษ → print:hidden) */}
        {!loading && groupedShelves.length > 0 && (
          <section className="w-full flex justify-center print:hidden">
            <div
              className="bg-white p-4 rounded-lg shadow-sm border justify-center
              flex flex-col md:flex-row gap-4 mx-auto w-full max-w-4xl"
            >
              {/* IMAGE */}
              <div className="flex justify-center md:w-[260px]">
                <img
                  src={`/images/branch/${storecode?.toUpperCase()}.png`}
                  alt={`Branch ${storecode}`}
                  className="w-full max-w-[260px] object-contain rounded"
                  loading="lazy"
                />
              </div>

              {/* SUMMARY */}
              <div
                className="bg-gray-50 border rounded p-3 shadow-inner 
                max-h-[420px] md:max-h-[480px] w-full md:w-[260px] overflow-y-auto"
              >
                <h3 className="font-semibold text-gray-700 mb-1 text-sm text-center">
                  โครงสร้าง Shelf
                </h3>

                {/* ช่วงเวลาสำหรับ logic ใหม่ */}
                <p className="text-[11px] text-center text-slate-500 mb-1">
                  Target ใช้ยอดขาย 3 เดือนก่อนหน้า:{" "}
                  {formatMMYYYY(prev3Start)} - {formatMMYYYY(prev3EndMonth)}
                </p>
                <p className="text-[11px] text-center text-slate-500 mb-2">
                  ยอดขายปัจจุบัน (เดือนนี้): {formatMMYYYY(currentStart)}
                </p>

                {groupedShelves.map((shelf) => (
                  <div
                    key={shelf.shelfCode}
                    className="mb-2 pb-2 border-b last:border-b-0"
                  >
                    <div className="font-semibold text-blue-700 text-sm leading-tight">
                      Shelf {shelf.shelfCode}
                    </div>

                    <div className="ml-2 mt-1 text-xs leading-tight">
                      <div className="font-semibold text-gray-600">
                        จำนวน : {shelf.rowQty} เเถว
                      </div>

                      {Array.from({ length: shelf.rowQty }).map((_, idx) => {
                        const rowNo = idx + 1;
                        const rowProducts = shelf.shelfProducts.filter(
                          (p) => (p.rowNo || 0) === rowNo
                        );

                        return (
                          <div
                            key={rowNo}
                            className="ml-1 flex text-gray-700 leading-tight py-[1px]"
                          >
                            <span className="pr-4">• Row {rowNo}</span>
                            <span>{rowProducts.length} รายการ</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FILTER + SEARCH (ไม่ต้องติดในกระดาษ → print:hidden) */}
        <section className="space-y-3 print:hidden">
          {/* SHELF FILTER */}
          {!loading && groupedShelves.length > 0 && (
            <Suspense fallback={<div className="text-sm text-gray-500">Loading filter...</div>}>
              <ShelfFilterUser
                shelves={groupedShelves.map((s) => s.shelfCode)}
                selectedShelves={selectedShelves}
                onToggle={(code) =>
                  setSelectedShelves((prev) =>
                    prev.includes(code)
                      ? prev.filter((s) => s !== code)
                      : [...prev, code]
                  )
                }
                onClear={() => setSelectedShelves([])}
              />
            </Suspense>
          )}

          {/* SEARCH */}
          <div className="w-full max-w-xl mx-auto">
            <input
              type="text"
              placeholder="ค้นหาแบรนด์ / รหัสสินค้า..."
              className="w-full px-4 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </section>

        {/* SHELF LIST (อันนี้ให้พิมพ์ออก PDF เต็ม ๆ) */}
        <section className="space-y-4">
          {loading && (
            <div className="text-center text-sm text-gray-500">
              กำลังโหลดข้อมูลชั้นวาง...
            </div>
          )}

          {!loading && displayedShelves.length === 0 && (
            <div className="text-center text-sm text-gray-500">
              ไม่พบข้อมูล (ลองล้าง Filter หรือเคลียร์คำค้นหา)
            </div>
          )}

          <Suspense fallback={<div className="text-sm text-gray-500">Loading shelves...</div>}>
            {displayedShelves.map((shelf) => (
              <ShelfCardUser
                key={shelf.shelfCode}
                template={{ ...shelf, shelfProducts: shelf.matchedProducts }}
                autoOpen={searchText.length > 0}
              />
            ))}
          </Suspense>
        </section>
      </div>
    </div>
  );
};

export default Template;

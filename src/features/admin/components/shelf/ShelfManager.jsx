import React, {
  useEffect,
  useState,
  useRef,
  lazy,
  Suspense,
  useMemo,
} from "react";

import useBmrStore from "../../../../store/bmr_store";
import useShelfStore from "../../../../store/shelf_store";
import * as XLSX from "xlsx";

// lazy load components
const ShelfFilter = lazy(() => import("./second/ShelfFilter"));
const ShelfCard = lazy(() => import("./second/ShelfCard"));
const BranchSelector = lazy(() => import("./second/BranchSelector"));

/* ================================
 * Helper: ช่วงเวลา 90 วันย้อนหลัง (ตามเวลาไทย, yesterday = end)
 * ================================ */
const getBangkok90DaysRange = () => {
  const now = new Date();
  const bangkokNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  // yesterday = end
  const end = new Date(bangkokNow);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  // start = yesterday - 89 วัน (รวมทั้งหมด 90 วัน)
  const start = new Date(end);
  start.setDate(start.getDate() - 89);
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

// แปลง Date → DD/MM/YYYY
const formatDDMMYYYY = (d) => {
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const ShelfManager = () => {
  const accessToken = useBmrStore((s) => s.accessToken);

  const {
    branches,
    template,
    product,
    loading,
    actionLoading,
    fetchBranches,
    fetchTemplate,
    fetchProduct,
    handleAddProduct,
    handleDelete,
    handleUpdateProducts,
    refreshDataProduct,
  } = useShelfStore();

  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [submittedBranchCode, setSubmittedBranchCode] = useState("");
  const [selectedShelves, setSelectedShelves] = useState([]);
  const [filteredTemplate, setFilteredTemplate] = useState([]);
  const [branchSummary, setBranchSummary] = useState([]);
  const [okLocked, setOkLocked] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const captureRef = useRef(null);

  // 🕒 ช่วงเวลายอดขาย 90 วัน (ตาม logic backend)
  const { start: salesStart, end: salesEnd } = useMemo(
    () => getBangkok90DaysRange(),
    []
  );

  // 🟢 ใช้เฉพาะ product ของ "สาขาที่กด OK แล้ว"
  const branchProduct = useMemo(() => {
    if (!submittedBranchCode) return [];
    return (product || []).filter(
      (p) => String(p.branchCode) === String(submittedBranchCode)
    );
  }, [product, submittedBranchCode]);

  // initial load branches + templates
  useEffect(() => {
    if (!accessToken) return;
    fetchBranches();
    fetchTemplate();
  }, [accessToken, fetchBranches, fetchTemplate]);

  // 🟢 summary ใช้เฉพาะ branchProduct
  useEffect(() => {
    if (!branchProduct || branchProduct.length === 0) {
      setBranchSummary([]);
      return;
    }

    const summaryMap = {};

    branchProduct.forEach((p) => {
      const shelf = p.shelfCode || p.shelf_code;
      if (!shelf) return;

      if (!summaryMap[shelf]) {
        summaryMap[shelf] = {
          shelfCode: shelf,
          totalStockCost: 0,
          totalSales: 0,
          totalWithdraw: 0,
        };
      }

      const stockQty = p.stockQuantity ?? p.stock_qty ?? 0;
      const purchasePrice =
        p.purchasePriceExcVAT ?? p.purchase_price_ex_vat ?? 0;
      const salesTotal = p.salesTotalPrice ?? p.sales_total_price ?? 0;
      const withdrawVal = p.withdrawValue ?? p.withdraw_value ?? 0;

      summaryMap[shelf].totalStockCost += stockQty * purchasePrice;
      summaryMap[shelf].totalSales += salesTotal;
      summaryMap[shelf].totalWithdraw += withdrawVal;
    });

    const summaryList = Object.values(summaryMap);

    const totalRow = summaryList.reduce(
      (acc, s) => {
        acc.totalStockCost += s.totalStockCost;
        acc.totalSales += s.totalSales;
        acc.totalWithdraw += s.totalWithdraw;
        return acc;
      },
      {
        shelfCode: "TOTAL",
        totalStockCost: 0,
        totalSales: 0,
        totalWithdraw: 0,
      }
    );

    summaryList.push(totalRow);
    setBranchSummary(summaryList);
  }, [branchProduct]);

  // submit branch
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBranchCode) return;

    setOkLocked(true);

    // โหลด product ของสาขานี้
    fetchProduct(selectedBranchCode);

    // filter template ตาม branch
    const matched = (template || []).filter(
      (item) => String(item.branchCode) === String(selectedBranchCode)
    );
    setFilteredTemplate(matched);

    // ตั้งสาขาที่ใช้งานจริง
    setSubmittedBranchCode(selectedBranchCode);

    // reset filter/ search
    setSelectedShelves([]);
    setSearchText("");
    setSearchResult([]);
    setBranchSummary([]);
  };

  // filter shelves
  const toggleShelfFilter = (code) => {
    setSelectedShelves((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleClearFilter = () => {
    setSelectedShelves([]);
  };

  // displayed templates (filter + sort)
  const displayedTemplates = useMemo(() => {
    const base =
      selectedShelves.length > 0
        ? filteredTemplate.filter((t) => selectedShelves.includes(t.shelfCode))
        : filteredTemplate;

    return [...base].sort((a, b) => {
      if (!a.shelfCode || !b.shelfCode) return 0;
      return String(a.shelfCode).localeCompare(String(b.shelfCode));
    });
  }, [filteredTemplate, selectedShelves]);

  // search product by brand / barcode (ใช้เฉพาะ branchProduct)
  const handleSearch = (value) => {
    setSearchText(value);

    if (!value || !submittedBranchCode) {
      setSearchResult([]);
      return;
    }

    const text = value.toLowerCase();

    const found = (branchProduct || [])
      .filter((p) => {
        const brand = (p.nameBrand || p.product_brand || "").toLowerCase();
        const barcode = (p.barcode || p.product_code || "").toString();
        return brand.includes(text) || barcode.includes(text);
      })
      .sort((a, b) => {
        const aShelf = a.shelfCode || "";
        const bShelf = b.shelfCode || "";
        return String(aShelf).localeCompare(String(bShelf));
      });

    setSearchResult(found);
  };

  const handleRefreshProduct = (branchCode) => {
    const code = branchCode || submittedBranchCode || selectedBranchCode;
    if (!code) return;
    refreshDataProduct(code);
  };

  // ==== DOWNLOAD XLSX: ใช้ branchProduct เท่านั้น ====
  const handleDownloadShelfXlsx = () => {
    const code = submittedBranchCode;
    if (!code || !branchProduct || branchProduct.length === 0) return;

    setDownloadLoading(true);
    try {
      // ดึง key ทั้งหมดจาก object ใน branchProduct เพื่อเป็น column
      const headerSet = new Set();
      branchProduct.forEach((row) => {
        if (!row) return;
        Object.keys(row).forEach((k) => headerSet.add(k));
      });
      const headers = Array.from(headerSet);

      // สร้าง array ของ object ตาม headers (ให้ทุก row มี column เท่ากัน)
      const rows = branchProduct.map((row) => {
        const obj = {};
        headers.forEach((h) => {
          const v = row ? row[h] : "";
          obj[h] = v === undefined || v === null ? "" : v;
        });
        return obj;
      });

      // แปลงเป็น worksheet
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

      // หา column ที่เป็นพวก code / barcode แล้วบังคับให้เป็น text
      if (ws["!ref"]) {
        const range = XLSX.utils.decode_range(ws["!ref"]);
        const headerRowIndex = range.s.r; // แถว header (ปกติคือ 0)

        const textCols = [];

        // หา column index ที่ชื่อ header มีคำว่า code / barcode
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({
            r: headerRowIndex,
            c: C,
          });
          const cell = ws[addr];
          if (!cell) continue;
          const header = String(cell.v || "");
          const lower = header.toLowerCase();
          if (lower.includes("code") || lower.includes("barcode")) {
            textCols.push(C);
          }
        }

        // บังคับให้ทั้ง column เหล่านั้นเป็น text (ตัด 0 ข้างหน้าออกไม่ได้)
        textCols.forEach((col) => {
          for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
            const addr = XLSX.utils.encode_cell({ r: R, c: col });
            const cell = ws[addr];
            if (!cell || cell.v === undefined || cell.v === null) continue;
            cell.t = "s"; // text
            cell.z = "@"; // format text
            cell.v = String(cell.v); // แปลงเป็น string ชัด ๆ
          }
        });
      }

      // สร้าง workbook แล้วเขียนไฟล์
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Shelf");

      XLSX.writeFile(
        wb,
        `shelf_${code}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const imageUrl = submittedBranchCode
    ? `/images/branch/${submittedBranchCode}.png`
    : "";

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      <Suspense
        fallback={
          <div className="w-full flex justify-center">
            <div className="text-gray-500 text-sm">Loading branches...</div>
          </div>
        }
      >
        <BranchSelector
          branches={branches || []}
          selectedBranchCode={selectedBranchCode}
          onChange={(val) => {
            setSelectedBranchCode(val);
            setOkLocked(false);
          }}
          okLocked={okLocked}
          onSubmit={handleSubmit}
          onRefreshProduct={handleRefreshProduct}
          onDownload={handleDownloadShelfXlsx}
          downloadLoading={downloadLoading}
        />
      </Suspense>

      {(loading || actionLoading) && (
        <div className="flex items-center justify-center text-gray-600 mt-4">
          <div className="animate-spin h-5 w-5 border-b-2 border-t-2 border-gray-600 rounded-full mr-2"></div>
          loading...
        </div>
      )}

      <div ref={captureRef}>
        {/* SUMMARY + IMAGE */}
        {submittedBranchCode && (
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-4 mx-auto max-w-4xl justify-center mb-4">
            <div className="flex justify-center sm:w-[260px]">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Branch"
                  className="w-full max-w-[240px] rounded"
                />
              )}
            </div>

            <div className="bg-gray-50 border rounded p-3 shadow-sm max-h-[450px] w-full sm:w-[400px] max-w-full overflow-y-auto">
              <h3 className="text-sm font-semibold text-center mb-1">
                Summary
              </h3>

              {/* ช่วงเวลา start - end ของยอดขาย 90 วัน */}
              {salesStart && salesEnd && (
                <p className="text-[11px] text-center text-gray-500 mb-2">
                  Sales period: {formatDDMMYYYY(salesStart)} -{" "}
                  {formatDDMMYYYY(salesEnd)}
                </p>
              )}

              <div className="grid grid-cols-4 text-xs font-semibold border-b pb-2 mb-2">
                <span>Shelf</span>
                <span className="text-right text-yellow-700">Stock</span>
                <span className="text-right text-green-700">Sales</span>
                <span className="text-right text-red-700">Withdraw</span>
              </div>

              <div className="divide-y text-xs bg-white border rounded max-h-[350px] overflow-y-auto">
                {branchSummary.map((s) => (
                  <div
                    key={s.shelfCode}
                    className={`grid grid-cols-4 px-2 py-2 ${
                      s.shelfCode === "TOTAL"
                        ? "bg-gray-100 font-semibold sticky bottom-0"
                        : ""
                    }`}
                  >
                    <span>{s.shelfCode}</span>
                    <span className="text-right text-yellow-700">
                      {s.totalStockCost.toLocaleString()}
                    </span>
                    <span className="text-right text-green-700">
                      {s.totalSales.toLocaleString()}
                    </span>
                    <span className="text-right text-red-700">
                      {s.totalWithdraw.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FILTER */}
        {filteredTemplate.length > 0 && !loading && (
          <Suspense
            fallback={
              <div className="mt-3 text-gray-500 text-sm">
                Loading filter...
              </div>
            }
          >
            <ShelfFilter
              shelves={filteredTemplate.map((t) => t.shelfCode)}
              selectedShelves={selectedShelves}
              onToggle={toggleShelfFilter}
              onClear={handleClearFilter}
            />
          </Suspense>
        )}

        {/* SEARCH */}
        {submittedBranchCode && (
          <div className="bg-white p-3 mt-3 rounded shadow-sm mb-3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              🔍 Search (Brand / Barcode)
            </label>

            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="หงษ์ทอง / 885..."
              className="w-full border rounded px-3 py-2 text-sm"
            />

            {searchText && (
              <div className="mt-3 border rounded p-2 bg-gray-50 max-h-60 overflow-y-auto text-sm">
                {searchResult.length === 0 ? (
                  <div className="text-gray-500 italic">Not found.</div>
                ) : (
                  searchResult.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center p-1 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        item.shelfCode && setSelectedShelves([item.shelfCode])
                      }
                    >
                      <span className="font-semibold text-blue-700 whitespace-nowrap">
                        {item.shelfCode} / Row {item.rowNo} / Index{" "}
                        {item.index}
                      </span>

                      <span className="text-xs break-all">
                        {item.barcode} : {item.nameProduct} : {item.nameBrand}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* SHELF LIST */}
        {!loading && displayedTemplates.length > 0 && (
          <Suspense
            fallback={
              <div className="text-gray-500 text-sm mt-4">
                Loading shelf detail...
              </div>
            }
          >
            {displayedTemplates.map((t) => (
              <ShelfCard
                key={t.shelfCode}
                template={t}
                // ใช้เฉพาะ product ของสาขาที่กด OK แล้ว
                product={branchProduct}
                onAdd={(item) => handleAddProduct(item)}
                onDelete={(p) => handleDelete(p)}
                onUpdateProducts={(updated) => handleUpdateProducts(updated)}
                actionLoading={actionLoading}
              />
            ))}
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default ShelfManager;

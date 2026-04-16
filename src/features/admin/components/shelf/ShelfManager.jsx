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
import useStoreShelfManagerStore from "../../../../store/store_shelf_manager_store";


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

const fmtMoney2 = (value) => {
  const n = Number(value || 0);
  if (n === 0) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
    syncDates,
    fetchSyncDates,
  } = useShelfStore();

  const {
    selectedBranchCode, setSelectedBranchCode,
    submittedBranchCode, setSubmittedBranchCode,
    selectedShelves, setSelectedShelves,
    filteredTemplate, setFilteredTemplate,
    branchSummary, setBranchSummary,
    okLocked, setOkLocked,
    searchText, setSearchText,
    searchResult, setSearchResult,
    isFullscreenImage, setIsFullscreenImage,
    hasLoadedInitialData, setHasLoadedInitialData
  } = useStoreShelfManagerStore();

  const captureRef = useRef(null);

  //  ช่วงเวลายอดขาย 90 วัน (ตาม logic backend)
  const { start: salesStart, end: salesEnd } = useMemo(
    () => getBangkok90DaysRange(),
    []
  );

  //  ใช้เฉพาะ product ของ "สาขาที่กด OK แล้ว"
  const branchProduct = useMemo(() => {
    if (!submittedBranchCode) return [];
    return (product || []).filter(
      (p) => String(p.branchCode) === String(submittedBranchCode)
    );
  }, [product, submittedBranchCode]);

  //  หาสินค้าที่ซ้ำกันในระดับสาขา (ดูจาก codeProduct เป็นหลัก หรือ barcode)
  const duplicateCodes = useMemo(() => {
    const counts = {};
    branchProduct.forEach(p => {
      const code = p.codeProduct ? String(p.codeProduct) : p.barcode ? String(p.barcode) : null;
      if (code && code !== "-" && code !== "null") {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    
    const dupes = new Set();
    Object.keys(counts).forEach(k => {
      if (counts[k] > 1) dupes.add(k);
    });
    return dupes;
  }, [branchProduct]);

  // initial load branches + templates + syncDates
  useEffect(() => {
    if (!accessToken) return;

    // Load static global data only if we haven't loaded it in this session
    if (!hasLoadedInitialData) {
      fetchBranches();
      fetchTemplate();
      fetchSyncDates();
      setHasLoadedInitialData(true);
    }
  }, [accessToken, fetchBranches, fetchTemplate, fetchSyncDates, hasLoadedInitialData, setHasLoadedInitialData]);

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

      if (stockQty > 0) {
        summaryMap[shelf].totalStockCost += stockQty * purchasePrice;
      }
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



  const imageUrl = submittedBranchCode
    ? `/images/branch/${submittedBranchCode}.png`
    : "";

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      {/* BranchSelector with center-to-top animation */}
      <div

      >
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

          />
        </Suspense>
      </div>

      {(loading || actionLoading) && (
        <div className="flex items-center justify-center text-gray-600 mt-4">
          <div className="animate-spin h-5 w-5 border-b-2 border-t-2 border-gray-600 rounded-full mr-2"></div>
          loading...
        </div>
      )}

      <div ref={captureRef}>
        {/* SUMMARY + IMAGE + FILTER + SEARCH (Combined Layout) */}
        <section className="w-full print:hidden mb-6">
          <div className={`bg-white p-4 lg:p-6 rounded-xl shadow-sm border flex flex-col xl:flex-row gap-6 mx-auto w-full max-w-[1400px] ${!submittedBranchCode ? 'opacity-60 grayscale-[50%]' : ''}`}>

            {/* LEFT: Branch Image */}
            <div className="flex justify-center xl:justify-start xl:w-[260px] flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Branch"
                  className="w-full max-w-[260px] h-auto object-contain rounded-lg shadow-sm border bg-slate-50 cursor-pointer hover:scale-105 transition-transform"
                  loading="lazy"
                  onClick={() => setIsFullscreenImage(true)}
                />
              ) : (
                <div className="w-full max-w-[260px] aspect-[3/4] rounded-lg shadow-sm border bg-slate-100 flex items-center justify-center text-slate-400">
                  <span></span>
                </div>
              )}
            </div>

            {/* CENTER: Summary Table */}
            <div className="flex-1 flex flex-col">
              <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-xl p-4 shadow-inner max-h-[500px] overflow-y-auto">
                <h3 className="font-bold text-slate-800 mb-2 text-base text-center flex items-center justify-center gap-2 sticky top-0 bg-slate-50/95 py-2 -mt-2 z-10 backdrop-blur-sm">
                  Dashboard
                </h3>

                {salesStart && salesEnd && (
                  <div className="text-[11px] text-center text-gray-500 mb-3 leading-relaxed">
                    <p>Sales & Withdraw period: {formatDDMMYYYY(salesStart)} - {formatDDMMYYYY(salesEnd)}</p>
                    <p>Stock : {syncDates?.stock?.updatedAt ? new Date(syncDates.stock.updatedAt).toLocaleString("th-TH") : "-"} | MinMax : {syncDates?.minMax?.updatedAt ? new Date(syncDates.minMax.updatedAt).toLocaleString("th-TH") : "-"}</p>

                    <p>Bill : {syncDates?.dashboard?.updatedAt ? new Date(syncDates.dashboard.updatedAt).toLocaleString("th-TH") : "-"} | Withdraw : {syncDates?.withdraw?.updatedAt ? new Date(syncDates.withdraw.updatedAt).toLocaleString("th-TH") : "-"}</p>

                  </div>
                )}

                <div className="grid grid-cols-4 text-xs font-semibold border-b pb-2 mb-2 bg-slate-100 px-2 py-1 rounded-t-lg">
                  <span>Shelf</span>
                  <span className="text-right text-yellow-700">Stock</span>
                  <span className="text-right text-green-700">Sales</span>
                  <span className="text-right text-red-700">Withdraw</span>
                </div>

                <div className="divide-y text-xs bg-white border rounded-lg max-h-[300px] overflow-y-auto min-h-[150px]">
                  {branchSummary.length > 0 ? (
                    branchSummary.map((s) => (
                      <div
                        key={s.shelfCode}
                        className={`grid grid-cols-4 px-2 py-2 ${s.shelfCode === "TOTAL"
                          ? "bg-slate-100 font-semibold sticky bottom-0"
                          : "hover:bg-slate-50"
                          }`}
                      >
                        <span className="font-medium">{s.shelfCode}</span>
                        <span className="text-right text-yellow-700">
                          {fmtMoney2(s.totalStockCost)}
                        </span>
                        <span className="text-right text-green-700">
                          {fmtMoney2(s.totalSales)}
                        </span>
                        <span className="text-right text-red-700">
                          {fmtMoney2(s.totalWithdraw)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[150px] text-slate-400">
                      กรุณาเลือกสาขาเพื่อดูข้อมูล
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Filter & Search Panel */}
            <div className="xl:w-[320px] 2xl:w-[380px] flex-shrink-0 flex flex-col gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-full">


                <div className="space-y-4">
                  {/* Filter */}
                  {filteredTemplate.length > 0 && !loading ? (
                    <Suspense fallback={<div className="text-sm text-gray-500">Loading filter...</div>}>
                      <ShelfFilter
                        shelves={filteredTemplate.map((t) => t.shelfCode)}
                        selectedShelves={selectedShelves}
                        onToggle={toggleShelfFilter}
                        onClear={handleClearFilter}
                      />
                    </Suspense>
                  ) : (
                    <div className="h-[100px] bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                    </div>
                  )}

                  {/* Search */}
                  <div className="pt-4 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      ค้นหาสินค้า (แบรนด์ / บาร์โค้ด)
                    </label>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder=""
                      disabled={!submittedBranchCode}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />

                    {searchText && (
                      <div className="mt-3 border rounded-lg p-2 bg-white max-h-60 overflow-y-auto text-sm shadow-inner">
                        {searchResult.length === 0 ? (
                          <div className="text-gray-500 italic text-center py-4">ไม่พบข้อมูล</div>
                        ) : (
                          searchResult.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 items-center p-2 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer rounded transition-colors"
                              onClick={() =>
                                item.shelfCode && setSelectedShelves([item.shelfCode])
                              }
                            >
                              <span className="font-semibold text-blue-700 whitespace-nowrap text-xs bg-blue-100 px-2 py-0.5 rounded">
                                {item.shelfCode}/R{item.rowNo}/I{item.index}
                              </span>

                              <span className="text-xs break-all text-slate-600">
                                {item.barcode} • {item.nameProduct} • {item.nameBrand}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

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
                duplicateCodes={duplicateCodes}
                onAdd={(item) => handleAddProduct(item)}
                onDelete={(p) => handleDelete(p)}
                onUpdateProducts={(updated) => handleUpdateProducts(updated)}
                actionLoading={actionLoading}
              />
            ))}
          </Suspense>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreenImage && imageUrl && (
        <div
          className="fixed inset-0  bg-opacity-90 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setIsFullscreenImage(false)}
        >
          <img
            src={imageUrl}
            alt="Branch Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ShelfManager;

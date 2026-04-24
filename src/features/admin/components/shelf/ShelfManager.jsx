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

const ShelfCard = lazy(() => import("./second/ShelfCard"));


// lazy load components
import ShelfHeader from "./components/ShelfHeader";
import ShelfDashboard from "./components/ShelfDashboard";
import ShelfSearchFilter from "./components/ShelfSearchFilter";
import ShelfImageOverlay from "./components/ShelfImageOverlay";
import ShelfImageThumb from "./components/ShelfImageThumb";

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

const ShelfManager = () => {
  const accessToken = useBmrStore((s) => s.accessToken);

  const {
    branches, fetchBranches, template, fetchTemplate, product, fetchProduct,
    loading, actionLoading, handleAddProduct, handleDelete, handleUpdateProducts,
    syncDates, fetchSyncDates,
    selectedBranchCode, setSelectedBranchCode,
    submittedBranchCode, setSubmittedBranchCode,
    selectedShelves, setSelectedShelves,
    filteredTemplate, setFilteredTemplate,
    okLocked, setOkLocked,
    searchText, setSearchText,
    searchResult, setSearchResult,
    isFullscreenImage, setIsFullscreenImage,
    hasLoadedInitialData, setHasLoadedInitialData
  } = useShelfStore();

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

  //  หาสินค้าที่ซ้ำกันในระดับสาขา
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

  // initial load data
  useEffect(() => {
    if (!accessToken) return;
    if (!hasLoadedInitialData) {
      fetchBranches();
      fetchTemplate();
      fetchSyncDates();
      setHasLoadedInitialData(true);
    }
  }, [accessToken, fetchBranches, fetchTemplate, fetchSyncDates, hasLoadedInitialData, setHasLoadedInitialData]);

  // Dashboard calculation
  const branchSummary = useMemo(() => {
    if (!branchProduct || branchProduct.length === 0) return [];
    const summaryMap = {};
    branchProduct.forEach((p) => {
      const shelf = p.shelfCode || p.shelf_code;
      if (!shelf) return;
      if (!summaryMap[shelf]) {
        summaryMap[shelf] = { shelfCode: shelf, totalStockCost: 0, totalSales: 0, totalWithdraw: 0 };
      }
      const stockQty = p.stockQuantity ?? p.stock_qty ?? 0;
      const purchasePrice = p.purchasePriceExcVAT ?? p.purchase_price_ex_vat ?? 0;
      const salesTotal = p.salesTotalPrice ?? p.sales_total_price ?? 0;
      const withdrawVal = p.withdrawValue ?? p.withdraw_value ?? 0;

      if (stockQty > 0) summaryMap[shelf].totalStockCost += stockQty * purchasePrice;
      summaryMap[shelf].totalSales += salesTotal;
      summaryMap[shelf].totalWithdraw += withdrawVal;
    });
    const summaryList = Object.values(summaryMap);
    const totalRow = summaryList.reduce((acc, s) => {
      acc.totalStockCost += s.totalStockCost;
      acc.totalSales += s.totalSales;
      acc.totalWithdraw += s.totalWithdraw;
      return acc;
    }, { shelfCode: "TOTAL", totalStockCost: 0, totalSales: 0, totalWithdraw: 0 });
    return [...summaryList, totalRow];
  }, [branchProduct]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedBranchCode) return;
    setOkLocked(true);
    fetchProduct(selectedBranchCode);
    const matched = (template || []).filter(item => String(item.branchCode) === String(selectedBranchCode));
    setFilteredTemplate(matched);
    setSubmittedBranchCode(selectedBranchCode);
    setSelectedShelves([]);
    setSearchText("");
    setSearchResult([]);
  };

  const toggleShelfFilter = (code) => {
    setSelectedShelves((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };

  const handleClearFilter = () => setSelectedShelves([]);

  const displayedTemplates = useMemo(() => {
    const base = selectedShelves.length > 0
      ? filteredTemplate.filter((t) => selectedShelves.includes(t.shelfCode))
      : filteredTemplate;
    return [...base].sort((a, b) => String(a.shelfCode || "").localeCompare(String(b.shelfCode || "")));
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
      .sort((a, b) => String(a.shelfCode || "").localeCompare(String(b.shelfCode || "")));
    setSearchResult(found);
  };

  const handleRefreshProduct = (branchCode) => {
    const code = branchCode || submittedBranchCode || selectedBranchCode;
    if (code) fetchProduct(code);
  };

  const imageUrl = submittedBranchCode ? `/images/branch/${submittedBranchCode}.png` : "";

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      <ShelfHeader
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        setSelectedBranchCode={setSelectedBranchCode}
        okLocked={okLocked}
        setOkLocked={setOkLocked}
        handleSubmit={handleSubmit}
        handleRefreshProduct={handleRefreshProduct}
        loading={loading}
        actionLoading={actionLoading}
      />

      <div ref={captureRef}>
        <section className="w-full print:hidden mb-6">
          <div className={`bg-white p-4 lg:p-6 rounded-xl shadow-sm border flex flex-col xl:flex-row gap-6 mx-auto w-full max-w-[1400px] ${!submittedBranchCode ? 'opacity-60 grayscale-[50%]' : ''}`}>
            
            <ShelfImageThumb 
              imageUrl={imageUrl} 
              onImageClick={() => setIsFullscreenImage(true)} 
            />

            <ShelfDashboard 
              branchSummary={branchSummary}
              salesStart={salesStart}
              salesEnd={salesEnd}
              syncDates={syncDates}
              submittedBranchCode={submittedBranchCode}
            />

            <ShelfSearchFilter 
              filteredTemplate={filteredTemplate}
              loading={loading}
              selectedShelves={selectedShelves}
              toggleShelfFilter={toggleShelfFilter}
              handleClearFilter={handleClearFilter}
              searchText={searchText}
              handleSearch={handleSearch}
              searchResult={searchResult}
              setSelectedShelves={setSelectedShelves}
              submittedBranchCode={submittedBranchCode}
            />
          </div>
        </section>

        {!loading && displayedTemplates.length > 0 && (
          <Suspense fallback={<div className="text-gray-500 text-sm mt-4">Loading shelf detail...</div>}>
            {displayedTemplates.map((t) => (
              <ShelfCard
                key={t.shelfCode}
                template={t}
                product={branchProduct}
                duplicateCodes={duplicateCodes}
                onAdd={handleAddProduct}
                onDelete={handleDelete}
                onUpdateProducts={handleUpdateProducts}
                actionLoading={actionLoading}
              />
            ))}
          </Suspense>
        )}
      </div>

      <ShelfImageOverlay 
        isFullscreenImage={isFullscreenImage}
        imageUrl={imageUrl}
        setIsFullscreenImage={setIsFullscreenImage}
      />
    </div>
  );
};

export default ShelfManager;

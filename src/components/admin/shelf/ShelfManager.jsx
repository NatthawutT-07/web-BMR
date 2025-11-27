import React, { useEffect, useState, useRef } from "react";
import useBmrStore from "../../../store/bmr_store";
import ShelfFilter from "./second/ShelfFilter";
import ShelfCard from "./second/ShelfCard";
import BranchSelector from "./second/BranchSelector";
import useShelfStore from "../../../store/shelf_store";

const ShelfManager = () => {
  const token = useBmrStore((s) => s.token);

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
    downloadTemplate,
  } = useShelfStore();

  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [submittedBranchCode, setSubmittedBranchCode] = useState("");

  const [selectedShelves, setSelectedShelves] = useState([]);
  const [filteredTemplate, setFilteredTemplate] = useState([]);

  const [branchSummary, setBranchSummary] = useState([]);

  const [okLocked, setOkLocked] = useState(false);
  const captureRef = useRef(null);

  // SEARCH
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState([]);

  // LOAD INITIAL
  useEffect(() => {
    if (token) {
      useShelfStore.getState().setToken(token);
      fetchBranches();
      fetchTemplate();
    }
  }, [token]);

  // SUMMARY (ไม่ยิง API เพิ่ม)
  useEffect(() => {
    if (!product || product.length === 0) {
      setBranchSummary([]);
      return;
    }

    const summaryMap = {};

    product.forEach((p) => {
      if (!p.shelfCode) return;

      const shelf = p.shelfCode;
      if (!summaryMap[shelf]) {
        summaryMap[shelf] = {
          shelfCode: shelf,
          totalStockCost: 0,
          totalSales: 0,
          totalWithdraw: 0,
        };
      }

      const stockCost =
        (p.stockQuantity ?? 0) * (p.purchasePriceExcVAT ?? 0);

      summaryMap[shelf].totalStockCost += stockCost;
      summaryMap[shelf].totalSales += p.salesTotalPrice ?? 0;
      summaryMap[shelf].totalWithdraw += p.withdrawValue ?? 0;
    });

    const summaryList = Object.values(summaryMap);

    // TOTAL ROW
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
  }, [product]);

  // SUBMIT BRANCH
  const handleSubmit = (e) => {
    e.preventDefault();
    setOkLocked(true);

    // ล้างข้อมูลเก่าเมื่อเปลี่ยนสาขา
    useShelfStore.setState({ product: [], template: [] });

    fetchTemplate(); // โหลด template ใหม่ทุกครั้ง
    fetchProduct(selectedBranchCode);

    const matched = template.filter(
      (item) => String(item.branchCode) === String(selectedBranchCode)
    );

    setFilteredTemplate(matched);
    setSubmittedBranchCode(selectedBranchCode);

    setSearchText("");
    setSearchResult([]);
    setSelectedShelves([]);
  };


  // FILTER — กด checkbox เท่านั้น
  const toggleShelfFilter = (code) =>
    setSelectedShelves((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );

  const handleClearFilter = () => setSelectedShelves([]);

  const displayedTemplates =
    selectedShelves.length > 0
      ? filteredTemplate.filter((t) => selectedShelves.includes(t.shelfCode))
      : filteredTemplate.sort((a, b) =>
        a.shelfCode.localeCompare(b.shelfCode)
      );

  // SEARCH — ไม่แตะ checkbox, ไม่ auto filter, ไม่ auto-open
  const handleSearch = (value) => {
    setSearchText(value);

    if (!value || !submittedBranchCode) {
      setSearchResult([]);
      return;
    }

    const text = value.toLowerCase();

    const found = product
      .filter(
        (p) =>
          p.nameBrand?.toLowerCase().includes(text) ||
          p.barcode?.toString().includes(text)
      )
      .sort((a, b) => a.shelfCode.localeCompare(b.shelfCode));

    setSearchResult(found);
  };

  const handleRefreshProduct = (branchCode) => {
    refreshDataProduct(branchCode);
  };

  const handleDownloadTemplate = (branchCode) => {
    downloadTemplate(branchCode);
  };

  const imageUrl = submittedBranchCode
    ? `/images/branch/${submittedBranchCode}.png`
    : "";

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* BRANCH SELECTOR */}
      <BranchSelector
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        onChange={(val) => {
          setSelectedBranchCode(val);
          setOkLocked(false);
        }}
        okLocked={okLocked}
        onSubmit={handleSubmit}
        onRefreshProduct={handleRefreshProduct}
        onDownload={handleDownloadTemplate}
      />

      {(loading || actionLoading) && (
        <div className="flex items-center justify-center text-gray-600 mt-4">
          <div className="animate-spin h-5 w-5 border-b-2 border-t-2 border-gray-600 rounded-full mr-2"></div>
          loading...
        </div>
      )}

      <div ref={captureRef}>
        {/* IMAGE + SUMMARY */}
        {submittedBranchCode && (
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-4 mx-auto max-w-4xl justify-center">

            {/* IMAGE */}
            <div className="flex justify-center sm:w-[260px]">
              <img
                src={imageUrl}
                alt="Branch"
                className="w-full max-w-[240px] rounded"
              />
            </div>

            {/* SUMMARY */}
            <div className="bg-gray-50 border rounded p-3 shadow-sm max-h-[450px] w-[400px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-center mb-2">Summary</h3>

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
                    className={`grid grid-cols-4 px-2 py-2 ${s.shelfCode === "TOTAL"
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
          <ShelfFilter
            shelves={filteredTemplate.map((t) => t.shelfCode)}
            selectedShelves={selectedShelves}
            onToggle={toggleShelfFilter}
            onClear={handleClearFilter}
          />
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
                      onClick={() => setSelectedShelves([item.shelfCode])}
                    >
                      <span className="font-semibold text-blue-700 whitespace-nowrap">
                        {item.shelfCode} / Row {item.rowNo} / Index {item.index}
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
        {!loading &&
          displayedTemplates.map((t) => (
            <ShelfCard
              key={t.shelfCode}
              template={t}
              product={product}
              onAdd={(item) => handleAddProduct(item)}
              onDelete={(p) => handleDelete(p)}
              onUpdateProducts={(updated) => handleUpdateProducts(updated)}
              actionLoading={actionLoading}
            />
          ))}
      </div>
    </div>
  );
};

export default ShelfManager;

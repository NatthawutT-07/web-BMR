import React from "react";
import MultiSelect from "./components/MultiSelect";
import SummaryCards from "./components/SummaryCards";
import SkuTable from "./components/SkuTable";
import MonthlyTable from "./components/MonthlyTable";
import DrillDownModal from "./components/DrillDownModal";
import SkuDrillDownModal from "./components/SkuDrillDownModal";
import { useAnalysisData } from "./hooks/useAnalysisData";
import { useAnalysisFilters } from "./hooks/useAnalysisFilters";
import { useAnalysisExport } from "./hooks/useAnalysisExport";
import { skuColumns, storeColumns, modes } from "./utils/analysisConstants";

const SkuAnalysis = () => {
    const {
        filterOpts,
        mode,
        setMode,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selBranches,
        setSelBranches,
        selBrands,
        setSelBrands,
        shelfLifeFilter,
        setShelfLifeFilter,
        rows,
        summaryMonths,
        loading,
        searched,
        handleSearch,
        drillDown,
        setDrillDown,
        drillLoading,
        handleDrillDown,
        handleSkuDrillDown,
    } = useAnalysisData();

    const {
        search,
        setSearch,
        sortKey,
        sortDir,
        handleSort,
        displayRows,
        totals,
    } = useAnalysisFilters(rows, mode, summaryMonths);

    const { exportToExcel } = useAnalysisExport(mode, displayRows, summaryMonths, totals, startDate, endDate);

    const columns = mode === "store" ? storeColumns : (mode === "brand" || mode === "storeSummary") ? [] : skuColumns;
    const infoColCount = mode === "store" ? 11 : mode === "brand" ? 2 : 7;

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto relative">
            <div className="hidden sm:block absolute top-4 right-6 text-[11px] text-gray-400 text-right">
                * ยอดตัดจ่ายกรองเฉพาะสถานะ "อนุมัติแล้ว" / ยกเว้น "เบิกเพื่อขาย"
                <br /> Bill บันทึกต่อเนื่อง
                <br /> SI บันทึกต่อเนื่อง
                <br /> Withdraw ล้างเเละบันทึกใหม่
                <br /> stock บันทึกใหม่เสมอ
                <br /> ListOfItemHold บันทึกใหม่เสมอ
                <br /> Branch หากมีเพิ่มต้องนำข้อมูลใส่เองหลังบ้าน
            </div>

            <div className="flex gap-2 mb-6 justify-center">
                {modes.map((m) => (
                    <button
                        key={m.key}
                        disabled={loading}
                        onClick={() => setMode(m.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition
                            ${mode === m.key
                                ? "bg-blue-600 text-white shadow"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">วันเริ่มต้น</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            disabled={loading} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">วันสิ้นสุด</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            disabled={loading} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    {mode !== "brand" && mode !== "storeSummary" && (
                        <MultiSelect label="สาขา" options={filterOpts.branchCodes}
                            selected={selBranches} onChange={setSelBranches} disabled={loading} />
                    )}
                    {(mode === "store" || mode === "sku") && (
                        <MultiSelect label="แบรนด์" options={filterOpts.brands}
                            selected={selBrands} onChange={setSelBrands} disabled={loading} />
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Shelf Life</label>
                        <select
                            value={shelfLifeFilter}
                            onChange={(e) => setShelfLifeFilter(e.target.value)}
                            disabled={loading}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-400 transition"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="gt15">มากกว่า 15</option>
                            <option value="lte15">น้อยกว่าเท่ากับ 15</option>
                            <option value="none">ไม่มี</option>
                        </select>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">สูงสุด 5 เดือน</p>
                </div>
                <button onClick={handleSearch}
                    disabled={loading || (mode === "store" && selBranches.length === 0 && selBrands.length === 0)}
                    className="mt-4 w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    title={mode === "store" && selBranches.length === 0 && selBrands.length === 0 ? "กรุณาเลือกฟิลเตอร์อย่างน้อย 1 รายการ" : ""}>
                    {loading ? "กำลังโหลด..." : "🔍 ค้นหา"}
                </button>
            </div>

            {searched && mode !== "storeSummary" && mode !== "brand" && (
                <SummaryCards totals={totals} />
            )}

            {searched && (
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                        <input
                            type="text"
                            placeholder="🔎 ค้นหา รหัสสินค้า, ชื่อ, แบรนด์, หรือ สาขา..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-96 border rounded-lg px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-gray-500">
                            {displayRows.length} / {rows.length} รายการ
                        </span>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export XLSX
                    </button>
                </div>
            )}

            {searched && (
                <MonthlyTable
                    mode={mode}
                    displayRows={displayRows}
                    loading={loading}
                    summaryMonths={summaryMonths}
                    totals={totals}
                    onDrillDown={mode === "storeSummary" ? handleDrillDown : mode === "sku" ? handleSkuDrillDown : null}
                    drillLoading={drillLoading}
                />
            )}

            {drillDown && drillDown.type === 'store' && (
                <DrillDownModal
                    drillDown={drillDown}
                    onClose={() => setDrillDown(null)}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}

            {drillDown && drillDown.type === 'sku' && (
                <SkuDrillDownModal
                    drillDown={drillDown}
                    onClose={() => setDrillDown(null)}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}
        </div>
    );
};

export default SkuAnalysis;

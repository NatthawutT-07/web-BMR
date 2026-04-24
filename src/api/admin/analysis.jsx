import api from "../../utils/axios";

// GET: filter options (docStatuses, reasons, branchCodes)
export const fetchAnalysisFilters = async () => {
    const res = await api.get("/analysis-filters");
    return res.data;
};

// POST: SKU analysis data
export const fetchSkuAnalysis = async ({ startDate, endDate, branchCodes, brands, reasons, shelfLifeFilter }) => {
    const res = await api.post("/analysis-sku", {
        startDate,
        endDate,
        branchCodes,
        brands,
        reasons,
        shelfLifeFilter,
    });
    // Reconstruct old format: { rows, total, range, months }
    return {
        rows: res.data,
        ...res.meta,
    };
};

// POST: Store analysis data (per branch × product)
export const fetchStoreAnalysis = async ({ startDate, endDate, branchCodes, brands, reasons, shelfLifeFilter }) => {
    const res = await api.post("/analysis-store", {
        startDate,
        endDate,
        branchCodes,
        brands,
        reasons,
        shelfLifeFilter,
    });
    return {
        rows: res.data,
        ...res.meta,
    };
};

// POST: Brand analysis data (aggregated by brand)
export const fetchBrandAnalysis = async ({ startDate, endDate, reasons, shelfLifeFilter }) => {
    const res = await api.post("/analysis-brand", {
        startDate,
        endDate,
        reasons,
        shelfLifeFilter,
    });
    return {
        rows: res.data,
        ...res.meta,
    };
};

// POST: Store Summary (aggregated per branch, monthly breakdown)
export const fetchStoreSummary = async ({ startDate, endDate, reasons, shelfLifeFilter }) => {
    const res = await api.post("/analysis-store-summary", {
        startDate,
        endDate,
        reasons,
        shelfLifeFilter,
    });
    return {
        rows: res.data,
        ...res.meta,
    };
};

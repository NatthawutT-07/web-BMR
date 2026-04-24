import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchAnalysisFilters, fetchSkuAnalysis, fetchStoreAnalysis, fetchBrandAnalysis, fetchStoreSummary } from "../../../../../api/admin/analysis";

export const useAnalysisData = () => {
    const [filterOpts, setFilterOpts] = useState({ docStatuses: [], reasons: [], branchCodes: [], brands: [] });
    const [mode, setMode] = useState("sku");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selBranches, setSelBranches] = useState([]);
    const [selBrands, setSelBrands] = useState([]);
    const [shelfLifeFilter, setShelfLifeFilter] = useState("all");
    const [rows, setRows] = useState([]);
    const [summaryMonths, setSummaryMonths] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [drillDown, setDrillDown] = useState(null);
    const [drillLoading, setDrillLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchAnalysisFilters();
                setFilterOpts(data);
            } catch {
                toast.error("โหลด filter ไม่สำเร็จ");
            }
        })();
    }, []);

    useEffect(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        setStartDate(`${y}-${m}-01`);
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        setEndDate(`${y}-${m}-${String(lastDay).padStart(2, "0")}`);
    }, []);

    const handleSearch = useCallback(async () => {
        if (!startDate || !endDate) {
            toast.error("กรุณาเลือกช่วงวันที่");
            return;
        }

        const s = new Date(startDate);
        const e = new Date(endDate);

        if (mode === "sku" || mode === "store" || mode === "brand" || mode === "storeSummary") {
            const diff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
            if (diff > 4) {
                toast.error(`${mode === "sku" ? "SKU" : mode === "store" ? "Store SKU" : mode === "brand" ? "Brand" : "Store Summary"} รองรับสูงสุด 5 เดือน`);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setSearched(true);
        try {
            let data;
            if (mode === "store") {
                data = await fetchStoreAnalysis({
                    startDate,
                    endDate,
                    branchCodes: selBranches,
                    brands: selBrands,
                    shelfLifeFilter,
                });
                setSummaryMonths(data.months || []);
            } else if (mode === "brand") {
                data = await fetchBrandAnalysis({
                    startDate,
                    endDate,
                    shelfLifeFilter,
                });
                setSummaryMonths(data.months || []);
            } else if (mode === "storeSummary") {
                data = await fetchStoreSummary({ startDate, endDate, shelfLifeFilter });
                setSummaryMonths(data.months || []);
            } else {
                data = await fetchSkuAnalysis({
                    startDate,
                    endDate,
                    branchCodes: selBranches,
                    brands: selBrands,
                    shelfLifeFilter,
                });
                console.log('SKU Analysis Response:', data);
                console.log('Months:', data.months);
                console.log('Sample Row:', data.rows?.[0]);
                console.log('Sample Row Months:', data.rows?.[0]?.months);
                console.log('Has months property?', data.rows?.[0]?.hasOwnProperty('months'));
                setSummaryMonths(data.months || []);
            }
            setRows(data.rows || []);
            toast.success(`พบ ${data.total} รายการ`);
        } catch (err) {
            toast.error("ดึงข้อมูลไม่สำเร็จ: " + (err?.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [mode, startDate, endDate, selBranches, selBrands, shelfLifeFilter]);

    const handleDrillDown = async (row) => {
        setDrillLoading(true);
        try {
            const data = await fetchStoreAnalysis({
                startDate,
                endDate,
                branchCodes: [row.branch_code],
                brands: [],
                shelfLifeFilter,
            });
            setDrillDown({
                type: 'store',
                branchCode: row.branch_code,
                branchName: row.branch_name,
                rows: (data.rows || []).filter(r =>
                    (r.sale_quantity || 0) !== 0 ||
                    (r.net_sales || 0) !== 0 ||
                    (r.withdraw_quantity || 0) !== 0 ||
                    (r.withdraw_value || 0) !== 0 ||
                    (r.si_quantity || 0) !== 0 ||
                    (r.sia_quantity || 0) !== 0
                ),
                months: data.months || [],
            });
        } catch (err) {
            toast.error("ดึงข้อมูล SKU ไม่สำเร็จ");
        } finally {
            setDrillLoading(false);
        }
    };

    const handleSkuDrillDown = async (row) => {
        setDrillLoading(true);
        try {
            const data = await fetchStoreAnalysis({
                startDate,
                endDate,
                branchCodes: selBranches,
                brands: [row.product_brand],
                shelfLifeFilter,
            });
            // กรองเฉพาะ product_code ที่ตรงกัน
            const filteredRows = (data.rows || []).filter(r => 
                r.product_code === row.product_code &&
                ((r.sale_quantity || 0) !== 0 ||
                (r.net_sales || 0) !== 0 ||
                (r.withdraw_quantity || 0) !== 0 ||
                (r.withdraw_value || 0) !== 0 ||
                (r.si_quantity || 0) !== 0 ||
                (r.sia_quantity || 0) !== 0)
            );
            setDrillDown({
                type: 'sku',
                productCode: row.product_code,
                productName: row.product_name,
                rows: filteredRows,
                months: data.months || [],
            });
        } catch (err) {
            toast.error("ดึงข้อมูลสาขาไม่สำเร็จ");
        } finally {
            setDrillLoading(false);
        }
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        setRows([]);
        setSearched(false);
    };

    return {
        filterOpts,
        mode,
        setMode: handleModeChange,
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
    };
};

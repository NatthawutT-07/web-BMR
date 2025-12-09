// src/components/admin/dashboard/DashboardSales.jsx
import React, { useEffect, useState } from "react";
import useBmrStore from "../../../../store/bmr_store";
import useDashboardSalesStore from "../../../../store/dashboard_sales_store";
import {
    getDashboard,
    getDashboardProductList,
} from "../../../../api/admin/dashboard";

import SalesChartMode from "./second/SalesChartMode";
import TopFiltersAndKpi from "./second/DateFilter";
import { Section, ProductListTable } from "./second/UISections";
import BranchMonthlySalesChart from "./second/BranchMonthlySalesChart";

// โหลด chart.js ไว้ครั้งเดียวตอน mount เพื่อไม่ให้ block การโหลดข้อมูลบ่อย ๆ
const registerChart = async () => {
    const chart = await import("chart.js");
    chart.Chart.register(
        chart.CategoryScale,
        chart.LinearScale,
        chart.BarElement,
        chart.PointElement,
        chart.LineElement,
        chart.Tooltip,
        chart.Legend
    );
};

// helper เลื่อนหน้าไปยัง section ตาม id
const scrollToSection = (id) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// filter data จาก baseData ตามช่วงวันที่ที่เลือก
const filterDashboardData = (baseData, start, end) => {
    if (!baseData) return null;

    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T23:59:59");

    const inRange = (value) => {
        if (!value) return false;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        return d >= startDate && d <= endDate;
    };

    // 1) ยอดรวมตามวัน (ใช้สำหรับกราฟหลัก + summary)
    const salesByDate = (baseData.salesByDate || []).filter((r) =>
        inRange(r.bill_date)
    );

    // 2) ยอดตามสาขา+วันที่ (ใช้สำหรับกราฟ branch)
    const salesByBranchDate = (baseData.salesByBranchDate || []).filter((r) =>
        inRange(r.bill_date)
    );

    // 3) ยอดรวมตามสาขา (ใช้สำหรับกราฟ/ตาราง branch ถ้าจะใช้ต่อในอนาคต)
    const branchMap = {};
    salesByBranchDate.forEach((r) => {
        const key = r.branch_name || r.branch_code || "-";
        const val = Number(r.total_payment || 0);
        branchMap[key] = (branchMap[key] || 0) + val;
    });
    const salesByBranch = Object.entries(branchMap).map(
        ([branch_name, branch_sales]) => ({
            branch_name,
            branch_sales,
        })
    );

    // 4) summary ที่คำนวณใหม่จาก salesByDate
    const total_payment = salesByDate.reduce(
        (sum, r) => sum + Number(r.total_payment || 0),
        0
    );
    const rounding_sum = salesByDate.reduce(
        (sum, r) => sum + Number(r.rounding_sum || 0),
        0
    );
    const discount_sum = salesByDate.reduce(
        (sum, r) => sum + Number(r.discount_sum || 0),
        0
    );
    const bill_count = salesByDate.reduce(
        (sum, r) => sum + Number(r.bill_count || 0),
        0
    );
    const sale_count_total = salesByDate.reduce(
        (sum, r) => sum + Number(r.sale_count || 0),
        0
    );
    const return_count_total = salesByDate.reduce(
        (sum, r) => sum + Number(r.return_count || 0),
        0
    );

    const net_bill_count = sale_count_total + return_count_total;

    const summary = {
        total_payment,
        rounding_sum,
        discount_sum,
        bill_count,
        net_bill_count,
    };

    return {
        summary,
        salesByDate,
        salesByBranchDate,
        salesByBranch,
    };
};

const DashboardSales = () => {
    const accessToken = useBmrStore((s) => s.accessToken);
    const logout = useBmrStore((s) => s.logout);

    const {
        start,
        end,
        data,
        baseData,
        loading,
        buttonDisabled,
        dailyAvgSales,
        setStart,
        setEnd,
        setData,
        setBaseData,
        setLoading,
        setButtonDisabled,
        setDailyAvgSales,
    } = useDashboardSalesStore();

    const MIN_DATE = "2024-01-01";
    const MAX_DATE = new Date().toISOString().split("T")[0];

    // ===== state สำหรับ dashboard "สินค้า" =====
    const [productList, setProductList] = useState(null); // { summary, rows }
    const [productListLoading, setProductListLoading] = useState(false);
    const [productListSearch, setProductListSearch] = useState("");
    const [productListSort, setProductListSort] = useState("sales_desc");
    const [productListPage, setProductListPage] = useState(1);

    const PAGE_SIZE = 10;

    // register chart.js ครั้งเดียว
    useEffect(() => {
        registerChart();
    }, []);

    // โหลด product list ทั้งหมดตามช่วงวันที่
    const loadProductList = async (startDate, endDate) => {
        if (!accessToken) return;

        setProductListLoading(true);
        try {
            const res = await getDashboardProductList(startDate, endDate);
            setProductList(res);
            setProductListPage(1);
        } catch (err) {
            console.error("Dashboard product list error:", err);
            alert("โหลดข้อมูลสินค้าทั้งหมดไม่สำเร็จ");
        } finally {
            setProductListLoading(false);
        }
    };

    // ฟังก์ชันหลัก โหลด + filter ข้อมูลยอดขาย (overview + dashboard สินค้า)
    const handleLoad = async () => {
        if (!accessToken) return;

        if (new Date(start) > new Date(end)) {
            alert("วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด");
            return;
        }

        setButtonDisabled(true);

        // ถ้ามี baseData แล้ว → filter บน frontend ไม่ยิง API ซ้ำ
        if (baseData) {
            const filtered = filterDashboardData(baseData, start, end);
            if (filtered) {
                const days =
                    (new Date(end) - new Date(start)) /
                    (1000 * 60 * 60 * 24) +
                    1;
                setDailyAvgSales(filtered.summary.total_payment / days || 0);
                setData(filtered);
            }
        } else {
            // ยังไม่มี baseData เลย → โหลดครั้งแรกจาก API ช่วงกว้างสุด
            setLoading(true);
            try {
                const res = await getDashboard(MIN_DATE, MAX_DATE);
                console.log(res)
                setBaseData(res);

                const filtered = filterDashboardData(res, start, end);
                if (filtered) {
                    const days =
                        (new Date(end) - new Date(start)) /
                        (1000 * 60 * 60 * 24) +
                        1;
                    setDailyAvgSales(
                        filtered.summary.total_payment / days || 0
                    );
                    setData(filtered);
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
                logout();
                window.location.href = "/";
            } finally {
                setLoading(false);
            }
        }

        // โหลด dashboard สินค้า ตามช่วงวันที่ที่เลือก
        await loadProductList(start, end);
    };

    // เปลี่ยนวันที่ → เปิดปุ่มใหม่ (ให้กดโหลดช่วงใหม่ได้)
    useEffect(() => {
        setButtonDisabled(false);
    }, [start, end, setButtonDisabled]);

    // ตอนเปิดหน้าครั้งแรก ถ้ามี token ให้โหลดข้อมูลทันที
    useEffect(() => {
        if (accessToken) {
            handleLoad();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    // เวลาเปลี่ยน search / sort ให้กลับไปหน้าแรก
    useEffect(() => {
        setProductListPage(1);
    }, [productListSearch, productListSort]);

    const summary = data?.summary || {
        total_payment: 0,
        rounding_sum: 0,
        discount_sum: 0,
        bill_count: 0,
        net_bill_count: 0,
    };

    // ===== เตรียมข้อมูลสำหรับ dashboard "สินค้า" =====
    const totalSalesAllProducts =
        productList?.summary?.totalSales ||
        productList?.summary?.total_sales ||
        0;

    const normalizedProductList = (productList?.rows || []).map((p, index) => {
        const productName = p.product_brand
            ? `${p.product_brand}: ${p.product_name}`
            : p.product_name;

        const sales = Number(p.sales || 0);
        const ratio =
            totalSalesAllProducts > 0 ? sales / totalSalesAllProducts : 0;

        return {
            ...p,
            index: index + 1,
            product_name: productName,
            sales_ratio: ratio,
        };
    });

    const searchTerm = productListSearch.trim().toLowerCase();
    const filteredProductList = normalizedProductList.filter((p) => {
        if (!searchTerm) return true;
        return (
            (p.product_name || "").toLowerCase().includes(searchTerm) ||
            (p.product_code || "").toLowerCase().includes(searchTerm) ||
            (p.product_brand || "").toLowerCase().includes(searchTerm)
        );
    });

    const sortedProductList = filteredProductList.slice().sort((a, b) => {
        if (productListSort === "qty_desc") {
            return Number(b.qty || 0) - Number(a.qty || 0);
        }

        if (productListSort === "discount_desc") {
            const aDiscount = Number(a.discount_total || 0);
            const bDiscount = Number(b.discount_total || 0);

            // ✅ ยอดติดลบมากที่สุด (เช่น -5000) จะขึ้นก่อน (-5000 < -1000 < -100 < 0)
            return aDiscount - bDiscount;
        }

        if (productListSort === "name_asc") {
            return (a.product_name || "").localeCompare(
                b.product_name || "",
                undefined,
                { sensitivity: "base" }
            );
        }

        // default: sales_desc
        return Number(b.sales || 0) - Number(a.sales || 0);
    });


    const totalRows = sortedProductList.length;
    const totalPages =
        totalRows > 0 ? Math.ceil(totalRows / PAGE_SIZE) : 1;
    const safePage = Math.min(Math.max(productListPage, 1), totalPages);

    const pagedProductList = sortedProductList.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    if (!accessToken) return null;

    return (
        <div className="w-full min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto py-6">
                <div className="p-4 flex justify-center">
                    <div className="w-full max-w-[1100px] space-y-8">
                        {/* Header + quick nav buttons */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                📊 Dashboard
                            </h1>

                            <div className="flex flex-wrap gap-2 text-sm">
                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollToSection("section-top-kpi")
                                    }
                                    className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                                >
                                    🎛 Filters & KPI
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollToSection("section-sales-chart")
                                    }
                                    className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                                >
                                    📈 Sales chart
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollToSection("section-branch-chart")
                                    }
                                    className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                                >
                                    🏬 Branch monthly
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollToSection("section-product-list")
                                    }
                                    className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                                >
                                    🧾 Product list
                                </button>
                            </div>
                        </div>

                        {/* DateFilter + KPI */}
                        <div id="section-top-kpi">
                            <TopFiltersAndKpi
                                start={start}
                                end={end}
                                setStart={setStart}
                                setEnd={setEnd}
                                load={handleLoad}
                                minDate={MIN_DATE}
                                maxDate={MAX_DATE}
                                disabled={buttonDisabled}
                                summary={summary}
                                dailyAvgSales={dailyAvgSales}
                                salesByDate={data?.salesByDate || []}
                            />
                        </div>

                        {/* กราฟยอดขายรวม (Daily / Weekly / Monthly) */}
                        {data?.salesByDate?.length > 0 && (
                            <div id="section-sales-chart">
                                <Section title="📈 Sales comparison chart">
                                    <SalesChartMode rows={data.salesByDate} />
                                </Section>
                            </div>
                        )}

                        {/* กราฟยอดขายตามสาขาแบบรายเดือน (ยังใช้ได้ถ้าต้องการดูภาพสาขา) */}
                        {data?.salesByBranchDate?.length > 0 && (
                            <div id="section-branch-chart">
                                <Section title="🏬 Branch sales chart (monthly)">
                                    <BranchMonthlySalesChart
                                        rows={data.salesByBranchDate}
                                    />
                                </Section>
                            </div>
                        )}

                        {/* ================= DASHBOARD สินค้า แบบง่าย ================= */}
                        <div id="section-product-list">
                            <Section title="🧾 Product dashboard">
                                <ProductListTable
                                    loading={productListLoading || loading}
                                    summary={productList?.summary}
                                    rows={pagedProductList}
                                    page={safePage}
                                    pageSize={PAGE_SIZE}
                                    totalRows={totalRows}
                                    search={productListSearch}
                                    sort={productListSort}
                                    onSearchChange={setProductListSearch}
                                    onSortChange={setProductListSort}
                                    onPageChange={setProductListPage}
                                />
                            </Section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSales;

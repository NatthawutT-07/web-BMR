// src/components/admin/dashboard/DashboardSales.jsx
import React, { useEffect, useState } from "react";
import useBmrStore from "../../../../store/bmr_store";
import useDashboardSalesStore from "../../../../store/dashboard_sales_store";
import { getDashboard, getDashboardProductList } from "../../../../api/admin/dashboard";

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

// ✅ helper แปลง Date → YYYY-MM-DD แบบใช้เวลา Local (กัน timezone เพี้ยน)
const toLocalISODate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISODate(d); // ✅ ใช้ local date
};

// filter data จาก baseData ตามช่วงวันที่ที่เลือก + โหมดเปรียบเทียบ
// compareMode:
//   - "overview"  = ใช้เฉพาะช่วง start–end ตามเดิม
//   - "range_yoy" = ใช้ช่วง start–end + ช่วงเดียวกันของปีก่อน
const filterDashboardData = (baseData, start, end, compareMode = "overview") => {
  if (!baseData) return null;

  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T23:59:59");

  let prevStartDate = null;
  let prevEndDate = null;

  if (compareMode === "range_yoy") {
    prevStartDate = new Date(startDate);
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);

    prevEndDate = new Date(endDate);
    prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
  }

  const inCurrentRange = (value) => {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    return d >= startDate && d <= endDate;
  };

  const inRange = (value) => {
    if (!value) return false;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;

    if (compareMode === "range_yoy" && prevStartDate && prevEndDate) {
      // โหมดเทียบช่วงเวลา → รวมทั้งช่วงปัจจุบัน + ช่วงเดียวกันของปีก่อน
      return (
        (d >= startDate && d <= endDate) ||
        (d >= prevStartDate && d <= prevEndDate)
      );
    }

    // โหมดปกติ → ใช้เฉพาะช่วง start–end
    return d >= startDate && d <= endDate;
  };

  // 1) ยอดรวมตามวัน (รวมทั้ง 2 ช่วงถ้าเป็น range_yoy)
  const allSalesRows = (baseData.salesByDate || []).filter((r) => inRange(r.bill_date));
  const salesByDate = allSalesRows;

  // 2) ยอดตามสาขา+วันที่
  const salesByBranchDate = (baseData.salesByBranchDate || []).filter((r) => inRange(r.bill_date));

  // 3) ยอดตามช่องทาง+วันที่ (ใช้ทำ Sales by Channel ปี/ปี)
  const salesByChannelDate = (baseData.salesByChannelDate || []).filter((r) => inRange(r.bill_date));

  // สร้าง map: { [year]: { [channelName]: totalSales } }
  const salesByChannelYear = {};

  salesByChannelDate.forEach((r) => {
    if (!r.bill_date) return;
    const d = new Date(r.bill_date);
    if (Number.isNaN(d.getTime())) return;

    const year = d.getFullYear();

    let name = r.channel_name || r.channel_code || "Unknown";
    const lower = String(name || "").trim().toLowerCase();

    // ✅ รวม Unknown + "หน้าบ้าน" → "หน้าร้าน"
    if (!name || lower === "unknown") {
      name = "หน้าร้าน";
    } else if (name === "หน้าบ้าน") {
      name = "หน้าร้าน";
    }

    const val = Number(r.total_payment || 0);

    if (!salesByChannelYear[year]) salesByChannelYear[year] = {};
    salesByChannelYear[year][name] = (salesByChannelYear[year][name] || 0) + val;
  });

  // 4) ยอดรวมตามสาขา
  const branchMap = {};
  salesByBranchDate.forEach((r) => {
    const key = r.branch_name || r.branch_code || "-";
    const val = Number(r.total_payment || 0);
    branchMap[key] = (branchMap[key] || 0) + val;
  });
  const salesByBranch = Object.entries(branchMap).map(([branch_name, branch_sales]) => ({
    branch_name,
    branch_sales,
  }));

  // 5) summary = ใช้เฉพาะ "ช่วงปัจจุบัน" ให้ตรงกับ template เดิม
  const summaryRows =
    compareMode === "range_yoy"
      ? allSalesRows.filter((r) => inCurrentRange(r.bill_date))
      : allSalesRows;

  const total_payment = summaryRows.reduce((sum, r) => sum + Number(r.total_payment || 0), 0);
  const rounding_sum = summaryRows.reduce((sum, r) => sum + Number(r.rounding_sum || 0), 0);
  const discount_sum = summaryRows.reduce((sum, r) => sum + Number(r.discount_sum || 0), 0);

  // bill_count / sale_count เฉพาะช่วงปัจจุบัน
  const bill_count_total = summaryRows.reduce((sum, r) => sum + Number(r.bill_count || 0), 0);
  const sale_count_total = summaryRows.reduce((sum, r) => sum + Number(r.sale_count || 0), 0);

  // ✅ ให้ตรงกับเงื่อนไข:
  // - Bill Count = นับบิลขายอย่างเดียว
  // - Net bill count = จำนวนบิลทั้งหมด (ขาย + คืน)
  const summary = {
    total_payment,
    rounding_sum,
    discount_sum,
    bill_count: sale_count_total,     // ใช้เฉพาะ "เอกสารขาย"
    net_bill_count: bill_count_total, // รวมขาย + คืน
  };

  return {
    summary,
    salesByDate,        // มีทั้งปัจจุบัน + ปีก่อน ตามช่วงที่เลือก
    salesByBranchDate,
    salesByBranch,
    salesByChannelYear, // ใช้เปรียบเทียบปี/ปี
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
  const MAX_DATE = getYesterdayISO(); // ✅ ดึงข้อมูลถึงเมื่อวานเท่านั้น

  // โหมดการดูข้อมูล:
  // - "overview"  = เหมือนเดิม ปีล่าสุด vs ปีก่อน ตามช่วงที่ฟิลเตอร์
  // - "range_yoy" = ช่วงวันที่ที่เลือก + ช่วงเดียวกันของปีก่อน
  const [compareMode, setCompareMode] = useState("overview");

  // ===== state สำหรับ dashboard "สินค้า" =====
  const [productList, setProductList] = useState(null); // { summary, rows, mode? }
  const [productListLoading, setProductListLoading] = useState(false);
  const [productListSearch, setProductListSearch] = useState("");
  const [productListSort, setProductListSort] = useState("sales_desc");
  const [productListPage, setProductListPage] = useState(1);

  const PAGE_SIZE = 10;

  // register chart.js ครั้งเดียว
  useEffect(() => {
    registerChart();
  }, []);

  // helper อ่านเลขจาก summary/obj หลาย key
  const getNum = (obj, keys, fallback = 0) => {
    if (!obj) return fallback;
    for (const k of keys) {
      if (obj[k] != null) return Number(obj[k] || 0);
    }
    return fallback;
  };

  // โหลด product list ตามช่วงวันที่
  // - overview  → ยิง API 1 รอบ (เหมือนเดิม)
  // - range_yoy → ยิง API 2 รอบ (ช่วงปัจจุบัน + ช่วงเดียวกันของปีก่อน) แล้ว merge เป็น *_ปี
  const loadProductList = async (startDate, endDate, mode) => {
    if (!accessToken) return;

    setProductListLoading(true);
    try {
      if (mode === "range_yoy") {
        // ช่วงปัจจุบัน
        const startD = new Date(startDate + "T00:00:00");
        const endD = new Date(endDate + "T23:59:59");

        const currentYear = startD.getFullYear();
        const prevYear = currentYear - 1;

        // ช่วงปีก่อน (วัน/เดือนเท่ากัน ปี-1)
        const prevStartD = new Date(startD);
        prevStartD.setFullYear(prevStartD.getFullYear() - 1);
        const prevEndD = new Date(endD);
        prevEndD.setFullYear(prevEndD.getFullYear() - 1);

        // ✅ ใช้ toLocalISODate ไม่ใช้ toISOString (กันหลุดไปปี 2023)
        const prevStartStr = toLocalISODate(prevStartD);
        const prevEndStr = toLocalISODate(prevEndD);

        // ยิง API 2 รอบ
        const [currentRes, prevRes] = await Promise.all([
          getDashboardProductList(startDate, endDate),
          getDashboardProductList(prevStartStr, prevEndStr),
        ]);

        const curSummary = currentRes?.summary || {};
        const prevSummary = prevRes?.summary || {};

        const totalProductsCur = getNum(curSummary, ["totalProducts", "total_products"]);
        const totalProductsPrev = getNum(prevSummary, ["totalProducts", "total_products"]);

        const totalQtyCur = getNum(curSummary, ["totalQty", "total_qty"]);
        const totalQtyPrev = getNum(prevSummary, ["totalQty", "total_qty"]);

        const totalSalesCur = getNum(curSummary, ["totalSales", "total_sales"]);
        const totalSalesPrev = getNum(prevSummary, ["totalSales", "total_sales"]);

        const totalDiscountCur = getNum(curSummary, ["totalDiscount", "total_discount"]);
        const totalDiscountPrev = getNum(prevSummary, ["totalDiscount", "total_discount"]);

        const combinedSummary = {
          currentYear,

          // fallback ค่า current
          totalProducts: totalProductsCur,
          totalQty: totalQtyCur,
          totalSales: totalSalesCur,
          totalDiscount: totalDiscountCur,

          // ✅ key แบบ current/prev ให้ UI อ่านง่าย
          totalProducts_current: totalProductsCur,
          totalQty_current: totalQtyCur,
          totalSales_current: totalSalesCur,
          totalDiscount_current: totalDiscountCur,

          totalProducts_prev: totalProductsPrev,
          totalQty_prev: totalQtyPrev,
          totalSales_prev: totalSalesPrev,
          totalDiscount_prev: totalDiscountPrev,

          // ค่ารายปี (ปีปัจจุบัน / ปีก่อน)
          [`totalProducts_${currentYear}`]: totalProductsCur,
          [`totalProducts_${prevYear}`]: totalProductsPrev,

          [`totalQty_${currentYear}`]: totalQtyCur,
          [`totalQty_${prevYear}`]: totalQtyPrev,

          [`totalSales_${currentYear}`]: totalSalesCur,
          [`totalSales_${prevYear}`]: totalSalesPrev,

          [`totalDiscount_${currentYear}`]: totalDiscountCur,
          [`totalDiscount_${prevYear}`]: totalDiscountPrev,
        };

        const curRows = currentRes?.rows || [];
        const prevRows = prevRes?.rows || [];

        const productMap = new Map();

        const makeKey = (row) =>
          row.product_code || row.productId || row.id || row.product_name;

        // ใส่ข้อมูลช่วงปัจจุบัน (✔ เซ็ตค่า ไม่บวกสะสม)
        curRows.forEach((row) => {
          const key = makeKey(row);
          if (!key) return;

          const qty = Number(row.qty || row.quantity || 0);
          const sales = Number(row.sales || 0);
          const discount = Number(row.discount_total || 0);

          const existing = productMap.get(key) || {};
          const merged = { ...existing, ...row };

          merged[`qty_${currentYear}`] = qty;
          merged[`sales_${currentYear}`] = sales;
          merged[`discount_total_${currentYear}`] = discount;

          productMap.set(key, merged);
        });

        // ใส่ข้อมูลช่วงปีก่อน (✔ เซ็ตค่า ไม่บวกสะสม)
        prevRows.forEach((row) => {
          const key = makeKey(row);
          if (!key) return;

          const qty = Number(row.qty || row.quantity || 0);
          const sales = Number(row.sales || 0);
          const discount = Number(row.discount_total || 0);

          const existing = productMap.get(key) || {};
          const merged = {
            ...row,
            ...existing, // ให้ field จากช่วงปัจจุบันทับ (ชื่อสินค้า/แบรนด์ ฯลฯ)
          };

          merged[`qty_${prevYear}`] = qty;
          merged[`sales_${prevYear}`] = sales;
          merged[`discount_total_${prevYear}`] = discount;

          productMap.set(key, merged);
        });

        const combinedRows = Array.from(productMap.values());

        // คิด % of total ของแต่ละปี + ตั้ง base field ปัจจุบัน
        combinedRows.forEach((row) => {
          const salesCur = Number(row[`sales_${currentYear}`] || 0);
          const salesPrev = Number(row[`sales_${prevYear}`] || 0);

          if (totalSalesCur > 0) row[`sales_ratio_${currentYear}`] = salesCur / totalSalesCur;
          if (totalSalesPrev > 0) row[`sales_ratio_${prevYear}`] = salesPrev / totalSalesPrev;

          row.qty = Number(row[`qty_${currentYear}`] || 0);
          row.sales = salesCur;
          row.discount_total = Number(row[`discount_total_${currentYear}`] || 0);

          // base ratio ปัจจุบันไว้ให้ UI ใช้ได้
          row.sales_ratio = row[`sales_ratio_${currentYear}`] ?? 0;
        });

        setProductList({
          mode: "range_yoy",
          summary: combinedSummary,
          rows: combinedRows,
        });
        setProductListPage(1);
      } else {
        // โหมด overview ปกติ → ยิง API รอบเดียวแบบเดิม
        const res = await getDashboardProductList(startDate, endDate);
        setProductList({
          mode: "overview",
          ...res,
        });
        setProductListPage(1);
      }
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
      const filtered = filterDashboardData(baseData, start, end, compareMode);
      if (filtered) {
        const days =
          (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) + 1;
        setDailyAvgSales(filtered.summary.total_payment / days || 0);
        setData(filtered);
      }
    } else {
      // ยังไม่มี baseData เลย → โหลดครั้งแรกจาก API ช่วงกว้างสุด
      setLoading(true);
      try {
        const res = await getDashboard(MIN_DATE, MAX_DATE);
        setBaseData(res);

        const filtered = filterDashboardData(res, start, end, compareMode);
        if (filtered) {
          const days =
            (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) + 1;
          setDailyAvgSales(filtered.summary.total_payment / days || 0);
          setData(filtered);
        }
      } catch (err) {
        // console.error("Dashboard load error:", err);
        logout();
        // window.location. = "/";
      } finally {
        setLoading(false);
      }
    }

    // โหลด dashboard สินค้า
    await loadProductList(start, end, compareMode);
  };

  // เปลี่ยนวันที่ หรือโหมด compare → เปิดปุ่มใหม่ (ให้กดโหลดช่วงใหม่ได้)
  useEffect(() => {
    setButtonDisabled(false);
  }, [start, end, compareMode, setButtonDisabled]);

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
  // ✅ ใช้ปีจาก summary ถ้ามี ไม่งั้นใช้ปีจาก start (ให้ตรงกับช่วงที่เลือก)
  const fallbackYearFromStart = new Date(start + "T00:00:00").getFullYear();
  const currentYearForProducts =
    typeof productList?.summary?.currentYear === "number"
      ? productList.summary.currentYear
      : fallbackYearFromStart;

  const prevYearForProducts = currentYearForProducts - 1;

  const totalSalesAllProducts =
    productList?.summary?.[`totalSales_${currentYearForProducts}`] ??
    productList?.summary?.totalSales ??
    productList?.summary?.total_sales ??
    0;

  const normalizedProductList = (productList?.rows || []).map((p, index) => {
    const baseName = p.product_brand
      ? `${p.product_brand}: ${p.product_name}`
      : p.product_name;

    const currentSales =
      p[`sales_${currentYearForProducts}`] ?? p.sales ?? 0;

    const ratio =
      totalSalesAllProducts > 0 ? currentSales / totalSalesAllProducts : 0;

    return {
      ...p,
      index: index + 1,
      product_name: baseName,

      // ให้ field ปัจจุบันพร้อมใช้ sort / UI
      sales: currentSales,
      sales_ratio:
        p[`sales_ratio_${currentYearForProducts}`] ??
        p.sales_ratio ??
        ratio,
      qty: p.qty ?? p[`qty_${currentYearForProducts}`] ?? 0,
      discount_total:
        p.discount_total ??
        p[`discount_total_${currentYearForProducts}`] ??
        0,
    };
  });

  // =========================
  // ✅ FILTER (search)
  // =========================
  const searchTerm = productListSearch.trim().toLowerCase();
  const filteredProductList = normalizedProductList.filter((p) => {
    if (!searchTerm) return true;
    return (
      (p.product_name || "").toLowerCase().includes(searchTerm) ||
      (p.product_code || "").toLowerCase().includes(searchTerm) ||
      (p.product_brand || "").toLowerCase().includes(searchTerm)
    );
  });

  // =========================
  // ✅ Totals ตาม FILTER
  // - Total products ต้อง "แยกปี" (แก้ปัญหา SKU รวม 2 ปี)
  // =========================
  const sumBy = (arr, picker) =>
    arr.reduce((acc, x) => acc + Number(picker(x) || 0), 0);

  const isRangeYoy = productList?.mode === "range_yoy";

  const hasYearActivity = (p, year) => {
    const qty = Number(p?.[`qty_${year}`] ?? 0);
    const sales = Number(p?.[`sales_${year}`] ?? 0);
    const disc = Number(p?.[`discount_total_${year}`] ?? 0);
    return qty !== 0 || sales !== 0 || disc !== 0;
  };

  // ✅ Total products แยกปี
  const filteredTotalProductsCur = isRangeYoy
    ? filteredProductList.filter((p) => hasYearActivity(p, currentYearForProducts)).length
    : filteredProductList.length;

  const filteredTotalProductsPrev = isRangeYoy
    ? filteredProductList.filter((p) => hasYearActivity(p, prevYearForProducts)).length
    : null;

  // ✅ totals อื่น ๆ (ค่าปัจจุบันที่โชว์อยู่)
  const filteredTotalQtyCur = sumBy(filteredProductList, (p) => p.qty);
  const filteredTotalSalesCur = sumBy(filteredProductList, (p) => p.sales);
  const filteredTotalDiscountCur = sumBy(filteredProductList, (p) => p.discount_total);

  // prev totals (เฉพาะ range_yoy)
  const filteredTotalQtyPrev = isRangeYoy
    ? sumBy(filteredProductList, (p) => p?.[`qty_${prevYearForProducts}`] ?? 0)
    : null;

  const filteredTotalSalesPrev = isRangeYoy
    ? sumBy(filteredProductList, (p) => p?.[`sales_${prevYearForProducts}`] ?? 0)
    : null;

  const filteredTotalDiscountPrev = isRangeYoy
    ? sumBy(filteredProductList, (p) => p?.[`discount_total_${prevYearForProducts}`] ?? 0)
    : null;

  // =========================
  // ✅ Rebase % of total ตาม FILTER (ให้คอลัมน์ % of total ถูกต้อง)
  // =========================
  const rebasedFilteredProductList = filteredProductList.map((p) => {
    const curSales = Number(p.sales || 0);
    const curRatio =
      filteredTotalSalesCur > 0 ? curSales / filteredTotalSalesCur : 0;

    const next = {
      ...p,
      sales_ratio: curRatio,
      [`sales_ratio_${currentYearForProducts}`]: curRatio,
    };

    if (isRangeYoy) {
      const prevSales = Number(p[`sales_${prevYearForProducts}`] || 0);
      const prevRatio =
        filteredTotalSalesPrev > 0 ? prevSales / filteredTotalSalesPrev : 0;
      next[`sales_ratio_${prevYearForProducts}`] = prevRatio;
    }

    return next;
  });

  // =========================
  // ✅ SORT
  // =========================
  const sortedProductList = rebasedFilteredProductList.slice().sort((a, b) => {
    if (productListSort === "qty_desc") {
      return Number(b.qty || 0) - Number(a.qty || 0);
    }

    if (productListSort === "discount_desc") {
      const aDiscount = Number(a.discount_total || 0);
      const bDiscount = Number(b.discount_total || 0);
      // ✅ ยอดติดลบมากที่สุดขึ้นก่อน
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

  // =========================
  // ✅ PAGINATION
  // =========================
  const totalRows = sortedProductList.length;
  const totalPages = totalRows > 0 ? Math.ceil(totalRows / PAGE_SIZE) : 1;
  const safePage = Math.min(Math.max(productListPage, 1), totalPages);

  const pagedProductList = sortedProductList.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // =========================
  // ✅ summary ที่ส่งเข้า ProductListTable (override ให้เป็นค่าตาม FILTER)
  // =========================
  const productTableSummary = {
    ...(productList?.summary || {}),

    currentYear: currentYearForProducts,
    prevYear: prevYearForProducts,

    totalProducts: filteredTotalProductsCur,
    totalQty: filteredTotalQtyCur,
    totalSales: filteredTotalSalesCur,
    totalDiscount: filteredTotalDiscountCur,

    totalProducts_current: filteredTotalProductsCur,
    totalQty_current: filteredTotalQtyCur,
    totalSales_current: filteredTotalSalesCur,
    totalDiscount_current: filteredTotalDiscountCur,

    // ✅ prev (จะแสดง "-" ถ้าเป็น null)
    totalProducts_prev: filteredTotalProductsPrev,
    totalQty_prev: filteredTotalQtyPrev,
    totalSales_prev: filteredTotalSalesPrev,
    totalDiscount_prev: filteredTotalDiscountPrev,
  };

  // ✅ key รายปี ให้ UISections อ่านได้ชัด ๆ
  productTableSummary[`totalProducts_${currentYearForProducts}`] = filteredTotalProductsCur;
  productTableSummary[`totalQty_${currentYearForProducts}`] = filteredTotalQtyCur;
  productTableSummary[`totalSales_${currentYearForProducts}`] = filteredTotalSalesCur;
  productTableSummary[`totalDiscount_${currentYearForProducts}`] = filteredTotalDiscountCur;

  // ใส่ฝั่งปีก่อนเฉพาะเมื่อ range_yoy
  if (isRangeYoy) {
    productTableSummary[`totalProducts_${prevYearForProducts}`] = filteredTotalProductsPrev;
    productTableSummary[`totalQty_${prevYearForProducts}`] = filteredTotalQtyPrev;
    productTableSummary[`totalSales_${prevYearForProducts}`] = filteredTotalSalesPrev;
    productTableSummary[`totalDiscount_${prevYearForProducts}`] = filteredTotalDiscountPrev;
  }

  if (!accessToken) return null;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-1">
        <div className="p-4 flex justify-center">
          <div className="w-full max-w-[1280px] space-y-8">
            {/* Header + quick nav buttons */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                📊 Dashboard
              </h1>

              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => scrollToSection("section-top-kpi")}
                  className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                >
                  🎛 Filters & KPI
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("section-sales-chart")}
                  className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                >
                  📈 Sales chart
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("section-branch-chart")}
                  className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition"
                >
                  🏬 Branch monthly
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("section-product-list")}
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
                // ✅ map ปี/ช่องทาง สำหรับ Sales by Channel
                salesByChannelYear={data?.salesByChannelYear || {}}
                // ✅ โหมดเปรียบเทียบ
                compareMode={compareMode}
                setCompareMode={setCompareMode}
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

            {/* กราฟยอดขายตามสาขาแบบรายเดือน */}
            {data?.salesByBranchDate?.length > 0 && (
              <div id="section-branch-chart">
                <Section title="🏬 Branch sales chart (monthly)">
                  <BranchMonthlySalesChart rows={data.salesByBranchDate} />
                </Section>
              </div>
            )}

            {/* ================= DASHBOARD สินค้า ================= */}
            <div id="section-product-list">
              <Section title="🧾 Product dashboard">
                <ProductListTable
                  loading={productListLoading || loading}
                  summary={productTableSummary}   // ✅ totals + sku แยกปีตาม filter
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
    
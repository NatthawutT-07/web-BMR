import React, { useState, useEffect, useCallback, useMemo } from "react";
import useBmrStore from "../../../../store/bmr_store";
import useSalesStore from "../../../../store/sales_store";

import {
  fetchBranchSales,
  fetchBranchSalesDay,
  fetchBranchSalesDayProduct,
  fetchBranchSalesMonthProduct,
} from "../../../../api/admin/sales";

import BranchSelectForm from "./second/BranchSelectForm";
import ProductTable from "./second/ProductTable";
import MonthlyBranchSummary from "./second/MonthlyBranchSummary";
import DailySalesSection from "./second/DailySalesSection";

/* ---------------- HELPERS ---------------- */

// ป้องกัน key ซ้ำ (ใช้ในฝั่ง month / day)
const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

/* ---------------- MAIN COMPONENT ---------------- */

const MainFilterSales = () => {
  const accessToken = useBmrStore((s) => s.accessToken);

  const { branches, fetchListBranches } = useSalesStore();

  const {
    selectedBranchCode,
    setSelectedBranchCode,
    salesData,
    setSalesData,
    productMonthData,
    setProductMonthData,
    productDayData,
    setProductDayData,
    showDay,
    setShowDay,
    showType,
    setShowType,
    date,
    setDate,
  } = useSalesStore();

  // มีได้แค่ปุ่มเดียวที่ active เช่น "1/2025:day"
  const [activeButton, setActiveButton] = useState(null);

  /* โหลดสาขา */
  useEffect(() => {
    if (accessToken && branches.length === 0) {
      fetchListBranches();
    }
  }, [accessToken, branches.length, fetchListBranches]);

  /* Reset UI ทุกอย่าง */
  const resetUI = useCallback(() => {
    setShowType("");
    setActiveButton(null);
    setSalesData([]);
    setProductMonthData([]);
    setProductDayData([]);
    setShowDay([]);
    setDate("");
  }, [
    setShowType,
    setSalesData,
    setProductDayData,
    setProductMonthData,
    setShowDay,
    setDate,
  ]);

  /* Submit เลือกสาขา */
  const handleSelectedSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      resetUI();

      if (!selectedBranchCode) return;

      try {
        const data = await fetchBranchSales(selectedBranchCode);

        const sortedData = [...data].sort((a, b) => {
          const [mA, yA] = a.monthYear.split("/").map(Number);
          const [mB, yB] = b.monthYear.split("/").map(Number);
          // ปี/เดือนใหม่อยู่บนสุด
          return yB !== yA ? yB - yA : mB - mA;
        });

        setSalesData(sortedData);
      } catch (err) {
        console.error("Fetch month sales error:", err);
      }
    },
    [selectedBranchCode, setSalesData, resetUI]
  );

  /* เมื่อคลิกปุ่ม Show ข้อมูล (Day, Month-Product, Day-Product) */
  const handleShowDataCall = useCallback(
    async (key, type) => {
      try {
        const k = normalizeKey(key);

        // กดปุ่มใหม่ → ปุ่มเก่า reset
        setActiveButton(`${k}:${type}`);
        setShowType(type);

        if (type === "day") {
          setDate("");
          setProductMonthData([]);
          setProductDayData([]);

          const data = await fetchBranchSalesDay(selectedBranchCode, key);
          setShowDay(data);
        }

        if (type === "month-product") {
          setDate(key);
          setShowDay([]);
          setProductDayData([]);

          const data = await fetchBranchSalesMonthProduct(
            selectedBranchCode,
            key
          );
          setProductMonthData(
            data.slice().sort((a, b) => b.sale_quantity - a.sale_quantity)
          );
        }

        if (type === "day-product") {
          setDate(key);
          setProductMonthData([]);

          const data = await fetchBranchSalesDayProduct(
            selectedBranchCode,
            key
          );
          setProductDayData(
            data.slice().sort((a, b) => b.sale_quantity - a.sale_quantity)
          );
        }
      } catch (err) {
        console.error("Fetch detail error:", err);
      }
    },
    [
      selectedBranchCode,
      setShowType,
      setDate,
      setShowDay,
      setProductMonthData,
      setProductDayData,
    ]
  );

  const monthRows = useMemo(() => salesData, [salesData]);

  return (
    <div className="min-h-screen bg-slate-50/80 px-3 py-4 md:px-6 md:py-6 text-sm">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}

        {/* Select Branch */}
        <BranchSelectForm
          branches={branches}
          selectedBranchCode={selectedBranchCode}
          setSelectedBranchCode={setSelectedBranchCode}
          onSubmit={handleSelectedSubmit}
        />

        {/* MONTH SUMMARY (ไฟล์ใหม่) */}
        {monthRows.length > 0 && (
          <MonthlyBranchSummary
            monthRows={monthRows}
            activeButton={activeButton}
            onShowData={handleShowDataCall}
          />
        )}

        {/* DAILY SALES (ไฟล์ใหม่) */}
        {showType === "day" && showDay.length > 0 && (
          <DailySalesSection
            date={date}
            showDay={showDay}
            activeButton={activeButton}
            onShowData={handleShowDataCall}
          />
        )}

        {/* PRODUCT TABLE */}
        {showType === "month-product" && (
          <ProductTable
            title={`Month product (${date})`}
            data={productMonthData}
          />
        )}

        {showType === "day-product" && (
          <ProductTable title={`Day product (${date})`} data={productDayData} />
        )}
      </div>
    </div>
  );
};

export default MainFilterSales;

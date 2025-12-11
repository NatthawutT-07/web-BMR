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

  const [activeButton, setActiveButton] = useState(null);

  // 🆕 ปุ่มกันสแปม submit
  const [submitLocked, setSubmitLocked] = useState(false);

  /* โหลดสาขา */
  useEffect(() => {
    if (accessToken && branches.length === 0) {
      fetchListBranches();
    }
  }, [accessToken, branches.length, fetchListBranches]);

  /* เมื่อเปลี่ยนสาขา → ปลดล็อกปุ่ม + รีเซ็ตปุ่มแสดงข้อมูล */
  useEffect(() => {
    setSubmitLocked(false);
    setActiveButton(null); // 🆕 reset ปุ่ม Viewing
  }, [selectedBranchCode]);

  /* Reset UI */
  const resetUI = useCallback(() => {
    setShowType("");
    setActiveButton(null); // 🆕 reset Viewing button
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
      if (!selectedBranchCode || submitLocked) return;

      setSubmitLocked(true); // 🆕 ล็อกปุ่มทันทีหลัง submit
      resetUI();

      try {
        const data = await fetchBranchSales(selectedBranchCode);

        const sortedData = [...data].sort((a, b) => {
          const [mA, yA] = a.monthYear.split("/").map(Number);
          const [mB, yB] = b.monthYear.split("/").map(Number);
          return yB !== yA ? yB - yA : mB - mA;
        });

        setSalesData(sortedData);

        setActiveButton(null); // 🆕 รีเซ็ตปุ่ม
      } catch (err) {
        console.error("Fetch month sales error:", err);
      }
    },
    [selectedBranchCode, submitLocked, resetUI, setSalesData]
  );

  /* คลิกปุ่ม Day / Month Product / Day Product */
  const handleShowDataCall = useCallback(
    async (key, type) => {
      try {
        const k = normalizeKey(key);

        // 🆕 เวลากดปุ่มใหม่ ให้ reset viewing ปุ่มเก่า
        setActiveButton(`${k}:${type}`);
        setShowType(type);

        // NOTE: ปุ่ม Show ไม่เกี่ยวกับ submitLocked เลย

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
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* Select Branch */}
        <BranchSelectForm
          branches={branches}
          selectedBranchCode={selectedBranchCode}
          setSelectedBranchCode={setSelectedBranchCode}
          onSubmit={handleSelectedSubmit}
          submitLocked={submitLocked}
        />

        {/* MONTH SUMMARY */}
        {monthRows.length > 0 && (
          <MonthlyBranchSummary
            monthRows={monthRows}
            activeButton={activeButton}
            onShowData={handleShowDataCall}
          />
        )}

        {/* DAILY */}
        {showType === "day" && showDay.length > 0 && (
          <DailySalesSection
            date={date}
            showDay={showDay}
            activeButton={activeButton}
            onShowData={handleShowDataCall}
          />
        )}

        {/* MONTH PRODUCT */}
        {showType === "month-product" && (
          <ProductTable
            title={`Month product (${date})`}
            data={productMonthData}
          />
        )}

        {/* DAY PRODUCT */}
        {showType === "day-product" && (
          <ProductTable
            title={`Day product (${date})`}
            data={productDayData}
          />
        )}
      </div>
    </div>
  );
};

export default MainFilterSales;

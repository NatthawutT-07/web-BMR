import React, { useState, useEffect } from 'react';
import useBmrStore from '../../../../store/bmr_store';
import useSalesStore from '../../../../store/sales_store';
import {
  fetchBranchSales,
  fetchBranchSalesDay,
  fetchBranchSalesDayProduct,
  fetchBranchSalesMonthProduct
} from '../../../../api/admin/sales';
import BranchSelectForm from './BranchSelectForm';
import ProductTable from './ProductTable';

const MainFilterSales = () => {
  const token = useBmrStore(s => s.token);
  const { branches, fetchListBranches } = useSalesStore();
  const {
    selectedBranchCode, setSelectedBranchCode,
    salesData, setSalesData,
    productMonthData, setProductMonthData,
    productDayData, setProductDayData,
    showDay, setShowDay,
    showType, setShowType,
    date, setDate
  } = useSalesStore();

  useEffect(() => {
    if (token) fetchListBranches(token);
  }, [token, fetchListBranches]);

  const handleSelectedSubmit = async (e) => {
    setShowType(""); // Reset the view type
    e.preventDefault();
    if (!selectedBranchCode) return;

    try {
      const data = await fetchBranchSales(token, selectedBranchCode);
      const sortedData = [...data].sort((a, b) => {
        const [monthA, yearA] = a.monthYear.split('/').map(Number);
        const [monthB, yearB] = b.monthYear.split('/').map(Number);
        if (yearB !== yearA) return yearB - yearA;
        return monthB - monthA;
      });
      setSalesData(sortedData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShowDataCall = async (d, type) => {
    console.log(date)
    try {
      setShowType(type); // Set the type (day, month-product, or day-product)

      if (type === "day") {
        setDate("")
        // Fetch the day data
        setProductMonthData([]);  // Clear product month data
        setProductDayData([]);    // Clear product day data
        const data = await fetchBranchSalesDay(token, selectedBranchCode, d);
        setShowDay(data);         // Store day data
      }

      if (type === "month-product") {
        setDate(d)
        // Clear all day data when switching to month-product
        setShowDay([]);            // Hide day data
        setProductDayData([]);     // Hide day-product data
        const data = await fetchBranchSalesMonthProduct(token, selectedBranchCode, d);
        const sorted = [...data].sort((a, b) => b.sale_quantity - a.sale_quantity);
        setProductMonthData(sorted); // Store month product data
      }

      if (type === "day-product") {
        setDate(d)
        // Fetch day product data
        setProductMonthData([]); // Clear month product data
        const data = await fetchBranchSalesDayProduct(token, selectedBranchCode, d);
        const sorted = [...data].sort((a, b) => b.sale_quantity - a.sale_quantity);
        setProductDayData(sorted); // Store day product data
      }
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="p-4 bg-gray-50 min-h-screen text-sm">
      <BranchSelectForm
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        setSelectedBranchCode={setSelectedBranchCode}
        onSubmit={handleSelectedSubmit}
      />

      {/* Table for Sales Data */}
      {salesData.length > 0 && (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full border border-gray-200 text-xs">
              <thead className="bg-blue-100 sticky top-0 z-10 text-xs">
                <tr>
                  <th className="border px-2 py-1 text-left">Month/Year</th>
                  <th className="border px-2 py-1 text-right">Bill</th>
                  <th className="border px-2 py-1 text-right">Total Sales</th>
                  <th className="border px-2 py-1 text-right">Per Bill</th>
                  <th className="border px-2 py-1 text-right">Total Returns</th>
                  <th className="border px-2 py-1 text-right">end_bill_discount</th>
                  <th className="border px-2 py-1 text-right">rounding</th>
                  <th className="border px-2 py-1 text-right">Net Sales</th>
                  <th className="border px-2 py-1 text-right">Day</th>
                  <th className="border px-2 py-1 text-right">Month-Product</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                    <td className="border px-2 py-1">{row.monthYear}</td>
                    <td className="border px-2 py-1 text-right">{row.billCount}</td>
                    <td className="border px-2 py-1 text-right text-green-600">{row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border px-2 py-1 text-right">{row.salesPerBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border px-2 py-1 text-right text-red-600">{row.totalReturns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border px-2 py-1 text-right text-red-600">{row.endBillDiscount}</td>
                    <td className="border px-2 py-1 text-right text-green-600">{row.rounding}</td>
                    <td className="border px-2 py-1 text-right font-semibold relative group text-green-700">
                      {row.netSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      <button type="button" onClick={() => handleShowDataCall(row.monthYear, "day")} className="text-blue-600 underline text-xs">Go</button>
                    </td>
                    <td className="border px-2 py-1 text-right">
                      <button type="button" onClick={() => handleShowDataCall(row.monthYear, "month-product")} className="text-green-600 underline text-xs">Go</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conditional Rendering for Day and Product Day */}
      {showType === 'day' && showDay.length > 0 && (
        <div className="mt-4 flex flex-col space-y-2">
          {/* Day Data Table */}
          <div className="overflow-x-auto bg-white p-2 rounded shadow-sm flex-1 text-xs">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-100 sticky top-0 text-xs">
                <tr>
                  <th className="border px-2 py-1 text-left">Day/Month/Year</th>
                  <th className="border px-2 py-1 text-right">Bill</th>
                  <th className="border px-2 py-1 text-right">Total Sales</th>
                  <th className="border px-2 py-1 text-right">Per Bill</th>
                  <th className="border px-2 py-1 text-right">Total Returns</th>
                  <th className="border px-2 py-1 text-right">end_bill_discount</th>
                  <th className="border px-2 py-1 text-right">rounding</th>
                  <th className="border px-2 py-1 text-right">Net Sales</th>
                  <th className="border px-2 py-1 text-right">Day-Product</th>
                </tr>
              </thead>
              <tbody>
                {showDay.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                    <td className="border px-2 py-1">{row.dayMonthYear}</td>
                    <td className="border px-2 py-1 text-right">{row.billCount}</td>
                    <td className="border px-2 py-1 text-right text-green-600">{row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border px-2 py-1 text-right ">{row.salesPerBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border px-2 py-1 text-right text-red-600">{row.totalReturns === 0 ? '-'
                      : row.totalReturns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-right text-red-600">{row.endBillDiscount === 0 ? '-'
                      : row.endBillDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-right text-green-700">{row.rounding === 0 ? '-'
                      : row.rounding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-right font-semibold relative group text-green-700">
                      {row.netSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      <button type="button" onClick={() => handleShowDataCall(row.dayMonthYear, "day-product")} className="text-green-600 underline text-xs">Go</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
      }

      {showType === 'month-product' && (
        <ProductTable title={`Month Product (${date})`} data={productMonthData} />
      )}

      {showType === 'day-product' && (
        <ProductTable title={`Day Product (${date})`} data={productDayData} />
      )}

    </div >
  );
};

export default MainFilterSales;

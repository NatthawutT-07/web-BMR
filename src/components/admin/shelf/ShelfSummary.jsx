import React from "react";
import { calcTotalSales, calcTotalWithdraw } from "../../../utils/shelfUtils";

const ShelfSummary = ({ shelfProducts }) => {
  const totalSalesShelf = calcTotalSales(shelfProducts);
  const totalWithdrawShelf = calcTotalWithdraw(shelfProducts);

  return (
    <div className="text-right text-sm text-blue-500 mt-4 space-y-1">
      <p>
        💰 Total Sales Amount for Shelf:{" "}
        <span className="text-green-700">{totalSalesShelf.toFixed(2)}</span>
      </p>
      <p>
        📦 Total Withdraw Amount for Shelf :{" "}
        <span className="text-orange-600">{totalWithdrawShelf.toFixed(2)}</span>
      </p>
    </div>
  );
};

export default ShelfSummary;

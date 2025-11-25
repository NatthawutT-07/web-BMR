import React from "react";
import {
  calcTotalSales,
  calcTotalWithdraw,
  calcTotalStockCost
} from "../../../../../utils/shelfUtils";

const ShelfSummary = ({ shelfProducts }) => {
  const totalSalesShelf = calcTotalSales(shelfProducts);
  const totalWithdrawShelf = calcTotalWithdraw(shelfProducts);
  const totalStockCostShelf = calcTotalStockCost(shelfProducts);

  return (
    <div className="mt-4 space-y-2 text-sm text-blue-500">
      <div className="text-right">
        <p>
          <span className="font-semibold">Total Sales Amount:</span>{" "}
          <span className="text-green-700">
            {totalSalesShelf.toFixed(2)}
          </span>
        </p>
        <p>
          <span className="font-semibold">Total Withdraw Amount:</span>{" "}
          <span className="text-orange-600">
            {totalWithdrawShelf.toFixed(2)}
          </span>
        </p>
        <p>
          <span className="font-semibold">Total Stock Cost:</span>{" "}
          <span className="text-blue-700">
            {totalStockCostShelf.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ShelfSummary;

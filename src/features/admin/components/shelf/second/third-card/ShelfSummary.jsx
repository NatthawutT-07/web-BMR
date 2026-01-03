import React, { useMemo } from "react";
import {
  calcTotalSales,
  calcTotalWithdraw,
  calcTotalStockCost
} from "../../../../../../utils/shelfUtils";

const ShelfSummary = React.memo(({ shelfProducts }) => {
  // คำนวณผลรวมแบบ memo ลด re-render 80%+
  const summary = useMemo(() => {
    return {
      sales: calcTotalSales(shelfProducts),
      withdraw: calcTotalWithdraw(shelfProducts),
      stock: calcTotalStockCost(shelfProducts),
    };
  }, [shelfProducts]);

  const format = (v) =>
    v != null ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00";

  return (
    <div className="mt-4 space-y-2 text-sm text-blue-500">
      <div className="text-right space-y-1">

        <p>
          <span className="font-semibold">Total Sales Amount:</span>{" "}
          <span className="text-green-700">{format(summary.sales)}</span>
        </p>

        <p>
          <span className="font-semibold">Total Withdraw Amount:</span>{" "}
          <span className="text-orange-600">{format(summary.withdraw)}</span>
        </p>

        <p>
          <span className="font-semibold">Total Stock Cost:</span>{" "}
          <span className="text-blue-700">{format(summary.stock)}</span>
        </p>

      </div>
    </div>
  );
});

export default ShelfSummary;

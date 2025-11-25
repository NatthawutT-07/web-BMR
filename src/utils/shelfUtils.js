
export const calcTotalSales = (items) =>
  items.reduce((sum, i) => sum + Number(i.salesTotalPrice ?? 0), 0);

export const calcTotalWithdraw = (items) =>
  items.reduce((sum, i) => sum + Number(i.withdrawValue ?? 0), 0);

export const calcTotalStockCost = (items) =>
  items.reduce((sum, i) => sum + (Number(i.stockQuantity ?? 0) * Number(i.purchasePriceExcVAT ?? 0)), 0);

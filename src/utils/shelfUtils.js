
export const calcTotalSales = (items) =>
  items.reduce((sum, i) => sum + Number(i.salesTotalPrice ?? 0), 0);

export const calcTotalWithdraw = (items) =>
  items.reduce((sum, i) => sum + Number(i.withdrawValue ?? 0), 0);

export const calcTotalStockCost = (items) =>
  items.reduce((sum, i) => {
    const qty = Number(i.stockQuantity ?? 0);
    const price = Number(i.purchasePriceExcVAT ?? 0);
    const safeQty = qty < 0 ? 0 : qty;
    return sum + (safeQty * price);
  }, 0);

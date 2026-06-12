
export const calcTotalSales = (items) =>
  items.reduce((sum, i) => sum + Number(i.total_sales_rounding_no_end_discount ?? 0), 0);

export const calcTotalWithdraw = (items) =>
  items.reduce((sum, i) => sum + Number(i.value_withdraw ?? 0), 0);

export const calcTotalStockCost = (items) =>
  items.reduce((sum, i) => {
    const qty = Number(i.quantity_stock ?? 0);
    const price = Number(i.purchasePriceExcVAT ?? 0);
    const safeQty = qty < 0 ? 0 : qty;
    return sum + (safeQty * price);
  }, 0);

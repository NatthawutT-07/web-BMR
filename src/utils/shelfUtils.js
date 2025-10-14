export const calcTotalSales = (items) =>
  items.reduce((sum, i) => sum + Number(i.salesTotalPrice ?? 0), 0);

export const calcTotalWithdraw = (items) =>
  items.reduce((sum, i) => sum + Number(i.withdrawValue ?? 0), 0);

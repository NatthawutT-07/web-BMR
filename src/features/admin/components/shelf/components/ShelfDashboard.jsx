import React from 'react';

const fmtMoney2 = (value) => {
  const n = Number(value || 0);
  if (n === 0) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDDMMYYYY = (d) => {
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatBangkokDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
};

const ShelfDashboard = ({ 
  branchSummary, 
  salesStart, 
  salesEnd, 
  syncDates
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-xl p-4 shadow-inner max-h-[500px] overflow-y-auto">
        <h3 className="font-bold text-slate-800 mb-2 text-base text-center flex items-center justify-center gap-2 sticky top-0 bg-slate-50/95 py-2 -mt-2 z-10 backdrop-blur-sm">
          Dashboard (Delay 60s)
        </h3>

        {salesStart && salesEnd && (
          <div className="text-[11px] text-center text-gray-500 mb-3 leading-relaxed">
            <p>Sales & Withdraw period: {formatDDMMYYYY(salesStart)} - {formatDDMMYYYY(salesEnd)}</p>
            <p>
              Stock : {formatBangkokDateTime(syncDates?.stock?.updatedAt)} | 
              MinMax : {formatBangkokDateTime(syncDates?.minMax?.updatedAt)}
            </p>
            <p>
              BillHeader : {formatBangkokDateTime(syncDates?.dashboard?.updatedAt)} | 
              Withdraw : {formatBangkokDateTime(syncDates?.withdraw?.updatedAt)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 text-xs font-semibold border-b pb-2 mb-2 bg-slate-100 px-2 py-1 rounded-t-lg">
          <span>Shelf</span>
          <span className="text-right text-yellow-700">Stock</span>
          <span className="text-right text-green-700">Sales</span>
          <span className="text-right text-red-700">Withdraw</span>
        </div>

        <div className="divide-y text-xs bg-white border rounded-lg max-h-[300px] overflow-y-auto min-h-[150px]">
          {branchSummary.length > 0 ? (
            branchSummary.map((s) => (
              <div
                key={s.shelf_code}
                className={`grid grid-cols-4 px-2 py-2 ${s.shelf_code === "TOTAL"
                  ? "bg-slate-100 font-semibold sticky bottom-0"
                  : "hover:bg-slate-50"
                  }`}
              >
                <span className="font-medium">{s.shelf_code}</span>
                <span className="text-right text-yellow-700">
                  {fmtMoney2(s.totalStockCost)}
                </span>
                <span className="text-right text-green-700">
                  {fmtMoney2(s.totalSales)}
                </span>
                <span className="text-right text-red-700">
                  {fmtMoney2(s.totalWithdraw)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full min-h-[150px] text-slate-400">
              กรุณาเลือกสาขาเพื่อดูข้อมูล
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelfDashboard;

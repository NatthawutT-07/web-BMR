import React from "react";

const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

const getDiffClass = (v) => {
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-500";
  return "text-slate-500";
};

const formatDiffWithPercent = (diff, prev, { isMoney = false } = {}) => {
  if (diff == null) return "-";

  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const absDiff = Math.abs(diff);

  const mainText = isMoney
    ? absDiff.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : absDiff.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  if (!prev || prev === 0) {
    if (diff === 0) return "0.00";
    return `${sign}${mainText}`;
  }

  const absPercent = Math.abs((diff / prev) * 100);
  const percentText = absPercent.toFixed(2);

  return `${sign}${mainText} (${sign}${percentText}%)`;
};

const MonthlyBranchSummary = ({ monthRows, activeButton, onShowData }) => {
  if (!monthRows || monthRows.length === 0) return null;

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200">
      <div className="px-3 py-3 md:px-4 md:py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Monthly summary by branch
          </h2>
          <p className="text-[11px] text-slate-500">
            Diff = เทียบกับเดือนก่อนหน้า แสดงจำนวน + เปอร์เซ็นต์จาก net sales / per bill
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          Rows:{" "}
          <span className="font-semibold text-slate-700">
            {monthRows.length.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr className="text-[11px] md:text-xs text-slate-600">
                <th className="py-2.5 px-2 md:px-3 text-left font-semibold border-b border-slate-200">
                  Month / Year
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Bills
                </th>
                {/* ลบ Total sales ออกแล้ว */}
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Returns
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Discount
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Rounding
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Net sales
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Net sales diff
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Per bill
                </th>
                <th className="py-2.5 px-2 md:px-3 text-right font-semibold border-b border-slate-200">
                  Per bill diff
                </th>
                <th className="py-2.5 px-2 md:px-3 text-center font-semibold border-b border-slate-200">
                  Day
                </th>
                <th className="py-2.5 px-2 md:px-3 text-center font-semibold border-b border-slate-200">
                  Product
                </th>
              </tr>
            </thead>

            <tbody>
              {monthRows.map((row, idx) => {
                const k = normalizeKey(row.monthYear);

                const prevRow = monthRows[idx + 1] || null;

                const netNow = Number(row.netSales || 0);
                const netPrev = prevRow ? Number(prevRow.netSales || 0) : null;
                const netDiff = netPrev != null ? netNow - netPrev : null;

                const perBillNow = Number(row.salesPerBill || 0);
                const perBillPrev = prevRow
                  ? Number(prevRow.salesPerBill || 0)
                  : null;
                const perBillDiff =
                  perBillPrev != null ? perBillNow - perBillPrev : null;

                return (
                  <tr
                    key={idx}
                    className={`border-b border-slate-100 last:border-b-0 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/80"
                    } hover:bg-indigo-50/70 transition-colors`}
                  >
                    <td className="px-2 md:px-3 py-2.5 text-slate-800 whitespace-nowrap">
                      <div className="font-medium">{row.monthYear}</div>
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.billCount.toLocaleString()}
                    </td>

                    {/* ไม่มี Total sales แล้ว */}

                    <td className="px-2 md:px-3 py-2.5 text-right text-red-600">
                      {row.totalReturns.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.endBillDiscount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.rounding.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right font-semibold text-emerald-800">
                      {netNow.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      className={[
                        "px-2 md:px-3 py-2.5 text-right text-[11px] md:text-xs",
                        getDiffClass(netDiff ?? 0),
                      ].join(" ")}
                    >
                      {formatDiffWithPercent(netDiff, netPrev, {
                        isMoney: true,
                      })}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {perBillNow.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      className={[
                        "px-2 md:px-3 py-2.5 text-right text-[11px] md:text-xs",
                        getDiffClass(perBillDiff ?? 0),
                      ].join(" ")}
                    >
                      {formatDiffWithPercent(perBillDiff, perBillPrev, {
                        isMoney: false,
                      })}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-center">
                      {activeButton === `${k}:day` ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                          Viewing
                        </span>
                      ) : (
                        <button
                          onClick={() => onShowData(row.monthYear, "day")}
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                          Day
                        </button>
                      )}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-center">
                      {activeButton === `${k}:month-product` ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                          Viewing
                        </span>
                      ) : (
                        <button
                          onClick={() => onShowData(row.monthYear, "month-product")}
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          Product
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default MonthlyBranchSummary;

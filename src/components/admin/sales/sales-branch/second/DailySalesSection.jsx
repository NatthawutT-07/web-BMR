import React from "react";

// ป้องกัน key ซ้ำ
const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

// แปลง "1/11/2025" → ชื่อวัน (อา–เสาร์)
const getWeekdayLabel = (dmy) => {
  if (!dmy) return "-";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "-";

  const [day, month, year] = parts.map((v) => parseInt(v, 10));
  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj.getTime())) return "-";

  const names = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];

  return names[dateObj.getDay()];
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

const DailySalesSection = ({ date, showDay, activeButton, onShowData }) => {
  if (!showDay || showDay.length === 0) return null;

  // ======= สรุป 3 ก้อน: min / max / avg net sales =======
  let minRow = null;
  let maxRow = null;
  let sumNet = 0;

  showDay.forEach((row) => {
    const net = Number(row.netSales || 0);
    sumNet += net;

    if (!minRow || net < minRow.net) {
      minRow = { net, row };
    }
    if (!maxRow || net > maxRow.net) {
      maxRow = { net, row };
    }
  });

  const avgNet = showDay.length > 0 ? sumNet / showDay.length : 0;

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-3 py-3 md:px-4 md:py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Daily sales ({date || "selected month"})
          </h2>
          <p className="text-[11px] text-slate-500">
            Diff = เทียบกับวันก่อนหน้า เฉพาะ net sales
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          Days:{" "}
          <span className="font-semibold text-slate-700">
            {showDay.length.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3 ก้อนสรุปบนหัว */}
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 text-[11px] md:text-xs">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="font-semibold text-slate-600 mb-1">
              Lowest net sales day
            </p>
            {minRow ? (
              <>
                <p className="text-slate-500">
                  Date:{" "}
                  <span className="font-semibold text-slate-800">
                    {minRow.row.dayMonthYear}
                  </span>
                </p>
                <p className="text-slate-500">
                  Net sales:{" "}
                  <span className="font-semibold text-red-600">
                    {minRow.net.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-slate-400">-</p>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="font-semibold text-slate-600 mb-1">
              Highest net sales day
            </p>
            {maxRow ? (
              <>
                <p className="text-slate-500">
                  Date:{" "}
                  <span className="font-semibold text-slate-800">
                    {maxRow.row.dayMonthYear}
                  </span>
                </p>
                <p className="text-slate-500">
                  Net sales:{" "}
                  <span className="font-semibold text-emerald-700">
                    {maxRow.net.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-slate-400">-</p>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="font-semibold text-slate-600 mb-1">
              Average net sales / day
            </p>
            <p className="text-slate-500">
              {avgNet.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ตารางรายวัน */}
      <div className="overflow-x-auto">
        <div className="max-h-[480px] overflow-y-auto text-xs md:text-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100 sticky top-0 z-10 text-[11px] md:text-xs text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-center font-semibold">
                  Weekday
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-left font-semibold">
                  Date
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Bills
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Returns
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Discount
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Rounding
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Net sales
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Net diff
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-right font-semibold">
                  Per bill
                </th>
                <th className="border-b border-slate-200 px-2 md:px-3 py-2.5 text-center font-semibold">
                  Product
                </th>
              </tr>
            </thead>

            <tbody>
              {showDay.map((row, idx) => {
                const k = normalizeKey(row.dayMonthYear);
                const weekdayLabel = getWeekdayLabel(row.dayMonthYear);

                const prevRow = idx > 0 ? showDay[idx - 1] : null;

                const netNow = Number(row.netSales || 0);
                const netPrev = prevRow ? Number(prevRow.netSales || 0) : null;
                const netDiff = netPrev != null ? netNow - netPrev : null;

                const perBillNow = Number(row.salesPerBill || 0);

                const isBelowAvg = netNow < avgNet;

                const baseBg =
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/70";
                const rowBg = isBelowAvg ? "bg-amber-50" : baseBg;

                return (
                  <tr
                    key={idx}
                    className={`border-b border-slate-100 last:border-b-0 ${rowBg} hover:bg-indigo-50/70 transition-colors`}
                  >
                    {/* WEEKDAY */}
                    <td className="px-2 md:px-3 py-2.5 text-center text-[11px] font-semibold">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] bg-slate-100 border-slate-300 text-slate-700">
                        {weekdayLabel}
                      </span>
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-slate-800 whitespace-nowrap">
                      {row.dayMonthYear}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.billCount.toLocaleString()}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-red-600">
                      {row.totalReturns
                        ? row.totalReturns.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.endBillDiscount
                        ? row.endBillDiscount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                    </td>

                    <td className="px-2 md:px-3 py-2.5 text-right text-slate-700">
                      {row.rounding
                        ? row.rounding.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "-"}
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

                    {/* Day Product Button */}
                    <td className="px-2 md:px-3 py-2.5 text-center">
                      {activeButton === `${k}:day-product` ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                          Viewing
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            onShowData(row.dayMonthYear, "day-product")
                          }
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

export default DailySalesSection;

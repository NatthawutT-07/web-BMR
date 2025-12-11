import React from "react";

const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

const getDiffClass = (v) => {
  if (v > 0) return "text-emerald-600 font-semibold";
  if (v < 0) return "text-red-500 font-semibold";
  return "text-slate-400";
};

const getArrowIcon = (v) => {
  if (v > 0) return "↑";
  if (v < 0) return "↓";
  return "–";
};

const formatDiffWithPercent = (diff, prev, { isMoney = false } = {}) => {
  if (diff == null) return "-";

  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const absDiff = Math.abs(diff);

  const mainText = absDiff.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!prev || prev === 0) {
    if (diff === 0) return "0.00";
    return `${sign}${mainText}`;
  }

  const absPercent = Math.abs((diff / prev) * 100).toFixed(2);

  return `${sign}${mainText} (${sign}${absPercent}%)`;
};

const MonthlyBranchSummary = ({ monthRows, activeButton, onShowData }) => {
  if (!monthRows || monthRows.length === 0) return null;

  // รวมยอด channel → เรียงหัวตาราง
  const channelTotals = {};
  monthRows.forEach((m) => {
    (m.salesChannels || []).forEach((c) => {
      channelTotals[c.channelName] =
        (channelTotals[c.channelName] || 0) + c.totalSales;
    });
  });

  const allChannels = Object.keys(channelTotals).sort(
    (a, b) => (channelTotals[b] || 0) - (channelTotals[a] || 0)
  );

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200">
      {/* HEADER */}
      <div className="px-4 py-4 border-b border-slate-100 flex justify-between">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Monthly summary by branch
          </h2>
          <p className="text-[11px] text-slate-500">
            Avg/day = Net ÷ จำนวนวันที่มีข้อมูลจริง
          </p>
        </div>

        <div className="text-[11px] text-slate-500">
          Rows:{" "}
          <span className="font-semibold text-slate-700">{monthRows.length}</span>
        </div>
      </div>

      {/* Scroll wrapper */}
      <div className="overflow-x-auto">
        <div className="max-h-[640px] overflow-y-auto">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-100 sticky top-0 z-20 text-slate-600 text-[11px]">
              <tr>
                {/* Sticky left column */}
                <th className="px-3 py-2.5 border-b font-semibold text-left bg-slate-100 sticky left-0 z-[25]">
                  Month / Year
                </th>

                <th className="px-3 py-2.5 border-b font-semibold text-right">Bills</th>
                <th className="px-3 py-2.5 border-b font-semibold text-right">Returns</th>
                <th className="px-3 py-2.5 border-b font-semibold text-right">Discount</th>

                {allChannels.map((chName) => (
                  <th
                    key={chName}
                    className="px-2 py-2 border-b text-right text-slate-400 lowercase"
                  >
                    {chName}
                  </th>
                ))}

                <th className="px-3 py-2.5 border-b font-semibold text-right">Net</th>
                <th className="px-1 py-2.5 border-b font-semibold text-left">Net diff</th>
                <th className="px-3 py-2.5 border-b font-semibold text-right">Per bill</th>
                <th className="px-1 py-2.5 border-b font-semibold text-left">PB diff</th>

                {/* ⭐ ช่องใหม่ Net/day */}
                <th className="px-3 py-2.5 border-b font-semibold text-right">
                  Avg / day
                </th>

                <th className="px-3 py-2.5 border-b font-semibold text-center">Day</th>
                <th className="px-3 py-2.5 border-b font-semibold text-center">Product</th>
              </tr>
            </thead>

            <tbody>
              {monthRows.map((row, idx) => {
                const prev = monthRows[idx + 1] || null;

                const netNow = Number(row.netSales || 0);
                const netPrev = prev ? Number(prev.netSales || 0) : null;
                const netDiff = netPrev != null ? netNow - netPrev : null;

                const perBillNow = Number(row.salesPerBill || 0);
                const perBillPrev = prev ? Number(prev.salesPerBill || 0) : null;
                const perBillDiff = perBillPrev != null ? perBillNow - perBillPrev : null;

                // ⭐ ใช้จำนวนวันที่มาจาก backend โดยตรง
                const realDays = Number(row.days || 1);
                const avgPerDay = netNow / realDays;

                const k = normalizeKey(row.monthYear);

                return (
                  <tr
                    key={idx}
                    className={`border-b ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                    } hover:bg-indigo-50/40`}
                  >
                    {/* Sticky left cell */}
                    <td className="px-3 py-2.5 sticky left-0 bg-white z-[15] font-medium">
                      {row.monthYear}
                    </td>

                    <td className="px-3 py-2.5 text-right">{row.billCount}</td>

                    <td className="px-3 py-2.5 text-right text-red-600">
                      {row.totalReturns.toLocaleString()}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {row.endBillDiscount}
                    </td>

                    {/* CHANNEL VALUES */}
                    {allChannels.map((chName) => {
                      const nowObj =
                        row.salesChannels?.find((c) => c.channelName === chName);
                      const nowVal = nowObj ? nowObj.totalSales : 0;

                      const prevObj =
                        prev?.salesChannels?.find((c) => c.channelName === chName);
                      const prevVal = prevObj ? prevObj.totalSales : 0;

                      const diff = nowVal - prevVal;

                      return (
                        <td key={chName} className="px-2 py-2.5 text-right text-[11px]">
                          <span className="text-slate-500 mr-1">
                            {nowVal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className={getDiffClass(diff)}>
                            {getArrowIcon(diff)}
                          </span>
                        </td>
                      );
                    })}

                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                      {netNow.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      className={`px-1 py-2.5 text-left text-[11px] ${getDiffClass(
                        netDiff ?? 0
                      )}`}
                    >
                      {formatDiffWithPercent(netDiff, netPrev, { isMoney: true })}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {perBillNow.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td
                      className={`px-1 py-2.5 text-left text-[11px] ${getDiffClass(
                        perBillDiff ?? 0
                      )}`}
                    >
                      {formatDiffWithPercent(perBillDiff, perBillPrev)}
                    </td>

                    {/* ⭐ Net/day */}
                    <td className="px-3 py-2.5 text-right font-semibold text-indigo-600">
                      {avgPerDay.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* DAY BUTTON */}
                    <td className="px-3 py-2.5 text-center">
                      {activeButton === `${k}:day` ? (
                        <span className=" py-1 text-[11px] rounded-full bg-slate-100 text-slate-500 border">
                          Viewing
                        </span>
                      ) : (
                        <button
                          onClick={() => onShowData(row.monthYear, "day")}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-indigo-50 border border-indigo-200"
                        >
                          Day
                        </button>
                      )}
                    </td>

                    {/* PRODUCT BUTTON */}
                    <td className="px-1 py-2.5 text-center">
                      {activeButton === `${k}:month-product` ? (
                        <span className="py-1 text-[11px] rounded-full bg-slate-100 text-slate-500 border">
                          Viewing
                        </span>
                      ) : (
                        <button
                          onClick={() => onShowData(row.monthYear, "month-product")}
                          className="px-1 py-1 rounded-full text-[11px] bg-emerald-50 border border-emerald-200"
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

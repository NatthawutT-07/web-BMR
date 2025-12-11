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

  // ⭐ ดึงยอดรวม channel จากทุกเดือน
  const channelTotals = {};
  monthRows.forEach((m) => {
    (m.salesChannels || []).forEach((c) => {
      channelTotals[c.channelName] =
        (channelTotals[c.channelName] || 0) + c.totalSales;
    });
  });

  // ⭐ เรียง channel ตามยอดขายรวมมาก → น้อย
  const allChannels = Object.keys(channelTotals).sort(
    (a, b) => (channelTotals[b] || 0) - (channelTotals[a] || 0)
  );

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200">

      {/* HEADER */}
      <div className="px-3 py-3 md:px-4 md:py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Monthly summary by branch
          </h2>
          <p className="text-[11px] text-slate-500">
            Diff = เทียบกับเดือนก่อนหน้า (net sales + channel)
          </p>
        </div>

        <div className="text-[11px] text-slate-500">
          Rows:{" "}
          <span className="font-semibold text-slate-700">{monthRows.length}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10 text-slate-600 text-[11px]">
            <tr>
              <th className="px-3 py-2.5 border-b font-semibold text-left">Month / Year</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Bills</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Returns</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Discount</th>
              {/* <th className="px-3 py-2.5 border-b font-semibold text-right">Rounding</th> */}

              {/* ⭐ CHANNEL HEADERS — sorted */}
              {allChannels.map((chName) => (
                <th
                  key={chName}
                  className="px-3 py-2.5 border-b text-right text-slate-400 lowercase font-normal"
                >
                  {chName}
                </th>
              ))}

              <th className="px-3 py-2.5 border-b font-semibold text-right">Net sales</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Net diff</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">Per bill</th>
              <th className="px-3 py-2.5 border-b font-semibold text-right">PB diff</th>
              <th className="px-3 py-1 border-b font-semibold text-center">Day</th>
              <th className="px-3 py-1 border-b font-semibold text-center">Product</th>
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

              const k = normalizeKey(row.monthYear);

              return (
                <tr
                  key={idx}
                  className={`border-b ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                  } hover:bg-indigo-50/40`}
                >
                  <td className="px-3 py-2.5">{row.monthYear}</td>

                  <td className="px-3 py-2.5 text-right">{row.billCount}</td>

                  <td className="px-3 py-2.5 text-right text-red-600">
                    {row.totalReturns.toLocaleString()}
                  </td>

                  <td className="px-3 py-2.5 text-right">{row.endBillDiscount}</td>

                  {/* <td className="px-3 py-2.5 text-right">{row.rounding}</td> */}

                  {/* ⭐ CHANNEL COLUMNS — sorted */}
                  {allChannels.map((chName) => {
                    const nowFound =
                      row.salesChannels?.find((c) => c.channelName === chName);
                    const nowValue = nowFound ? nowFound.totalSales : 0;

                    const prevFound =
                      prev?.salesChannels?.find((c) => c.channelName === chName);
                    const prevValue = prevFound ? prevFound.totalSales : 0;

                    const diff = nowValue - prevValue;

                    return (
                      <td key={chName} className="px-1.5 py-2.5 text-right text-[11px]">
                        <span className="text-slate-500 mr-1">
                          {nowValue.toLocaleString(undefined, {
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

                  {/* NET SALES */}
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                    {netNow.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className={`px-3 py-2.5 text-right ${getDiffClass(netDiff ?? 0)}`}>
                    {formatDiffWithPercent(netDiff, netPrev, { isMoney: true })}
                  </td>

                  {/* PER BILL */}
                  <td className="px-3 py-2.5 text-right">
                    {perBillNow.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className={`px-3 py-2.5 text-right ${getDiffClass(perBillDiff ?? 0)}`}>
                    {formatDiffWithPercent(perBillDiff, perBillPrev)}
                  </td>

                  {/* DAY BUTTON */}
                  <td className="px-3 py-2.5 text-center">
                    {activeButton === `${k}:day` ? (
                      <span className="px-2 py-1 text-[11px] rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Viewing
                      </span>
                    ) : (
                      <button
                        onClick={() => onShowData(row.monthYear, "day")}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        Day
                      </button>
                    )}
                  </td>

                  {/* PRODUCT BUTTON */}
                  <td className="px-1 py-2.5 text-center">
                    {activeButton === `${k}:month-product` ? (
                      <span className="px-2 py-1 text-[11px] rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Viewing
                      </span>
                    ) : (
                      <button
                        onClick={() => onShowData(row.monthYear, "month-product")}
                        className="px-1 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200"
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
    </section>
  );
};

export default MonthlyBranchSummary;

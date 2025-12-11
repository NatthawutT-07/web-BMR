import React from "react";

// ป้องกัน key ซ้ำ
const normalizeKey = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/^0+/, "");
};

// แปลงเป็นชื่อวัน
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

// สีของ diff
const getDiffClass = (v) => {
  if (v > 0) return "text-emerald-600 font-semibold";
  if (v < 0) return "text-red-500 font-semibold";
  return "text-slate-400";
};

// ลูกศร diff
const getArrowIcon = (v) => {
  if (v > 0) return "↑";
  if (v < 0) return "↓";
  return "–";
};

// format diff
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

const DailySalesSection = ({ date, showDay, activeButton, onShowData }) => {
  if (!showDay || showDay.length === 0) return null;

  // ⭐ รวม Channel ทั้งหมดจากข้อมูลวัน
  let allChannels = Array.from(
    new Set(
      showDay.flatMap((d) =>
        (d.salesChannels || []).map((c) => c.channelName)
      )
    )
  );

  // ⭐ จัดเรียงช่องทางตาม "ยอดรวมทั้งเดือน มาก → น้อย"
  const channelTotals = {};

  showDay.forEach((day) => {
    (day.salesChannels || []).forEach((c) => {
      channelTotals[c.channelName] =
        (channelTotals[c.channelName] || 0) + c.totalSales;
    });
  });

  allChannels = allChannels.sort(
    (a, b) => (channelTotals[b] || 0) - (channelTotals[a] || 0)
  );

  // ---------------- Summary (min max avg) ----------------

  let minRow = null;
  let maxRow = null;
  let sumNet = 0;

  showDay.forEach((row) => {
    const net = Number(row.netSales || 0);
    sumNet += net;

    if (!minRow || net < minRow.net) minRow = { net, row };
    if (!maxRow || net > maxRow.net) maxRow = { net, row };
  });

  const avgNet = showDay.length ? sumNet / showDay.length : 0;

  return (
    <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200">

      {/* HEADER */}
      <div className="px-3 py-3 md:px-4 md:py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            Daily sales ({date})
          </h2>
          <p className="text-[11px] text-slate-500">
            Diff = เทียบกับวันก่อนหน้า (net sales + channel)
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          Days: <span className="font-semibold">{showDay.length}</span>
        </div>
      </div>

      {/* SUMMARY BOXES */}
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] md:text-xs">

          {/* LOWEST */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="font-semibold text-slate-600 mb-1">Lowest net sales</p>
            {minRow ? (
              <>
                <p>Date: <span className="font-semibold">{minRow.row.dayMonthYear}</span></p>
                <p className="text-red-600 font-semibold">
                  {minRow.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </>
            ) : <p className="text-slate-400">-</p>}
          </div>

          {/* HIGHEST */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="font-semibold text-slate-600 mb-1">Highest net sales</p>
            {maxRow ? (
              <>
                <p>Date: <span className="font-semibold">{maxRow.row.dayMonthYear}</span></p>
                <p className="text-emerald-700 font-semibold">
                  {maxRow.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </>
            ) : <p className="text-slate-400">-</p>}
          </div>

          {/* AVERAGE */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
            <p className="font-semibold text-slate-600 mb-1">Average net sales</p>
            <p className="text-slate-700">
              {avgNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr className="text-[11px] text-slate-600">

              <th className="px-3 py-2.5 text-center border-b font-semibold">Weekday</th>
              <th className="px-3 py-2.5 text-left border-b font-semibold">Date</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Bills</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Returns</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Discount</th>
              {/* <th className="px-3 py-2.5 text-right border-b font-semibold">Rounding</th> */}

              {/* ⭐ SORTED CHANNEL COLUMNS */}
              {allChannels.map((chName) => (
                <th
                  key={chName}
                  className="px-1.5 py-2.5 text-right border-b text-slate-400 lowercase font-normal"
                >
                  {chName}
                </th>
              ))}

              <th className="px-3 py-2.5 text-right border-b font-semibold">Net</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Net diff</th>
              <th className="px-3 py-2.5 text-right border-b font-semibold">Per bill</th>
              <th className="px-3 py-2.5 text-center border-b font-semibold">Product</th>
            </tr>
          </thead>

          <tbody>
            {showDay.map((row, idx) => {
              const prev = idx > 0 ? showDay[idx - 1] : null;

              const netNow = Number(row.netSales || 0);
              const netPrev = prev ? Number(prev.netSales || 0) : null;
              const netDiff = netPrev != null ? netNow - netPrev : null;

              const isBelowAvg = netNow < avgNet;
              const weekdayLabel = getWeekdayLabel(row.dayMonthYear);

              const baseBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/70";
              const rowBg = isBelowAvg ? "bg-amber-50" : baseBg;

              return (
                <tr key={idx} className={`border-b ${rowBg}`}>

                  <td className="px-1.5 py-2.5 text-center font-semibold text-[11px]">
                    <span className="bg-slate-100 border px-2 py-0.5 rounded">
                      {weekdayLabel}
                    </span>
                  </td>

                  <td className="px-3 py-2.5">{row.dayMonthYear}</td>

                  <td className="px-3 py-2.5 text-right">{row.billCount}</td>

                  <td className="px-3 py-2.5 text-right text-red-600">
                    {row.totalReturns?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-3 py-2.5 text-right">{row.endBillDiscount}</td>

                  {/* <td className="px-3 py-2.5 text-right">{row.rounding}</td> */}

                  {/* ⭐ CHANNEL VALUES SORTED */}
                  {allChannels.map((chName) => {
                    const nowFound =
                      row.salesChannels?.find((c) => c.channelName === chName);
                    const nowValue = nowFound ? nowFound.totalSales : 0;

                    const prevFound =
                      prev?.salesChannels?.find((c) => c.channelName === chName);
                    const prevValue = prevFound ? prevFound.totalSales : 0;

                    const diff = nowValue - prevValue;

                    return (
                      <td key={chName} className="px-3 py-2.5 text-right text-[11px]">
                        <span className="text-slate-500 mr-1 ">
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

                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                    {netNow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className={`px-3 py-2.5 text-right text-[11px] ${getDiffClass(netDiff ?? 0)}`}>
                    {formatDiffWithPercent(netDiff, netPrev, { isMoney: true })}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    {row.salesPerBill?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onShowData(row.dayMonthYear, "day-product")}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px]"
                    >
                      Product
                    </button>
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

export default DailySalesSection;

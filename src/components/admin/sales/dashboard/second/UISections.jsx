import React, { useEffect, useMemo, useState } from "react";

// ====================== SECTION WRAPPER ======================
export const Section = ({ title, subtitle, children, className = "" }) => (
  <section
    className={`bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 ${className}`}
  >
    {title && (
      <div className="mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-semibold text-slate-800">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs md:text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
    )}
    {children}
  </section>
);

// ====================== SALES BY CHANNEL (LIST) + TIP METHODS ======================
export const SalesByChannelList = ({
  rows = [],
  titleRight = "ยอดชำระ",
  paymentMethodRows = [], // ใส่ rows ของ (channel + payment_method) เพื่อทำ Tip
}) => {
  const [openTip, setOpenTip] = useState(null); // channel ที่กำลังเปิด

  const formatMoney = (v) =>
    Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const normalizeChannel = (name, code) => {
    let n = (name || code || "Unknown").trim();
    const lower = n.toLowerCase();
    if (!n || lower === "unknown") n = "หน้าร้าน";
    if (n === "หน้าบ้าน") n = "หน้าร้าน";
    return n;
  };

  const normalizeMethod = (m) => {
    const mm = String(m || "").trim();
    if (!mm || mm.toLowerCase() === "unknown") return "Unknown";
    return mm;
  };

  // รวมยอดต่อช่องทาง
  const aggregated = useMemo(() => {
    const map = new Map();
    let grand = 0;

    rows.forEach((r) => {
      const ch = normalizeChannel(r.channel_name, r.channel_code);
      const val = Number(r.total_payment || 0);
      grand += val;
      map.set(ch, (map.get(ch) || 0) + val);
    });

    const list = Array.from(map.entries())
      .map(([channel, total]) => ({ channel, total }))
      .sort((a, b) => b.total - a.total);

    return { list, grand };
  }, [rows]);

  // Tip: รวมยอดแยกตาม payment method ต่อช่องทาง
  const methodTipMap = useMemo(() => {
    if (!paymentMethodRows?.length) return new Map();

    const channelMethods = new Map(); // channel -> Map(method -> total)
    const channelTotals = new Map(); // channel -> total

    paymentMethodRows.forEach((r) => {
      const channel = normalizeChannel(r.channel_name, r.channel_code);
      const method = normalizeMethod(r.payment_method);
      const amount = Number(r.total_payment || 0);

      channelTotals.set(channel, (channelTotals.get(channel) || 0) + amount);

      if (!channelMethods.has(channel)) channelMethods.set(channel, new Map());
      const mm = channelMethods.get(channel);
      mm.set(method, (mm.get(method) || 0) + amount);
    });

    const out = new Map();
    Array.from(channelMethods.entries()).forEach(([channel, mm]) => {
      const total = Number(channelTotals.get(channel) || 0);
      const methods = Array.from(mm.entries())
        .map(([method, totalMethod]) => ({
          method,
          total: Number(totalMethod || 0),
          pctInChannel: total > 0 ? (Number(totalMethod || 0) / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      out.set(channel, { total, methods });
    });

    return out;
  }, [paymentMethodRows]);

  const toggleTip = (channel) =>
    setOpenTip((prev) => (prev === channel ? null : channel));

  if (!rows?.length) {
    return (
      <div className="py-6 text-center text-xs text-slate-500">
        ไม่มีข้อมูลช่องทางการขาย
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500">
        รวมทั้งหมด:{" "}
        <span className="font-semibold text-slate-800">
          ฿ {formatMoney(aggregated.grand)}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
        <table className="min-w-full text-xs md:text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-slate-600">
                ช่องทางการขาย
              </th>
              <th className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                {titleRight}
              </th>
              <th className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                % of total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {aggregated.list.map((x) => {
              const pct =
                aggregated.grand > 0 ? (x.total / aggregated.grand) * 100 : 0;

              const tip = methodTipMap.get(x.channel);
              const hasTip = !!tip?.methods?.length;
              const isOpen = openTip === x.channel;

              return (
                <tr
                  key={x.channel}
                  className="bg-white hover:bg-indigo-50/60 transition-colors align-top"
                >
                  <td className="py-2.5 px-3 text-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{x.channel}</span>

                      {hasTip && (
                        <button
                          type="button"
                          onClick={() => toggleTip(x.channel)}
                          className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                          title="ดูวิธีชำระเงินในช่องทางนี้"
                        >
                          {isOpen ? "ซ่อนวิธีชำระ" : "ดูวิธีชำระ"}
                        </button>
                      )}
                    </div>

                    {hasTip && isOpen && (
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden">
                        <div className="grid grid-cols-[1fr,120px,80px] gap-2 px-3 py-2 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                          <div>วิธีชำระเงิน</div>
                          <div className="text-right">ยอดชำระ</div>
                          <div className="text-right">% ในช่องทาง</div>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {tip.methods.map((m) => {
                            const label =
                              m.method === "Unknown" ? "ไม่ระบุ" : m.method;

                            return (
                              <div
                                key={m.method}
                                className="grid grid-cols-[1fr,120px,80px] gap-2 px-3 py-2 text-xs"
                              >
                                <div className="text-slate-700 break-words">
                                  {label}
                                </div>
                                <div className="text-right tabular-nums whitespace-nowrap text-slate-800">
                                  ฿ {formatMoney(m.total)}
                                </div>
                                <div className="text-right tabular-nums whitespace-nowrap text-slate-500">
                                  {m.pctInChannel.toFixed(2)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-emerald-700 font-semibold">
                    ฿ {formatMoney(x.total)}
                  </td>

                  <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-slate-500">
                    {pct.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ====================== PRODUCT LIST TABLE (ALL PRODUCTS) ======================
export const ProductListTable = ({
  loading,
  summary,
  rows,
  page,
  pageSize,
  totalRows,
  search,
  sort,
  onSearchChange,
  onSortChange,
  onPageChange,
}) => {
  const now = new Date();
  const defaultCurrentYear = now.getFullYear();

  const currentYear =
    typeof summary?.currentYear === "number"
      ? summary.currentYear
      : defaultCurrentYear;
  const prevYear =
    typeof summary?.prevYear === "number" ? summary.prevYear : currentYear - 1;

  const currentLabel = summary?.currentLabel ?? String(currentYear);
  const prevLabel = summary?.prevLabel ?? String(prevYear);

  const rawTotalProducts = Number(summary?.totalProducts ?? summary?.total_products ?? 0);
  const rawTotalQty = Number(summary?.totalQty ?? summary?.total_qty ?? 0);
  const rawTotalSales = Number(summary?.totalSales ?? summary?.total_sales ?? 0);
  const rawTotalDiscount = Number(summary?.totalDiscount ?? summary?.total_discount ?? 0);

  const capitalize = (s) =>
    typeof s === "string" && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const getSummaryValue = (baseKey, type) => {
    const cap = capitalize(baseKey);

    if (type === "current") {
      return (
        summary?.[`${baseKey}_current`] ??
        summary?.[`current${cap}`] ??
        summary?.[`${baseKey}_${currentYear}`] ??
        summary?.[baseKey] ??
        0
      );
    }

    return (
      summary?.[`${baseKey}_prev`] ??
      summary?.[`prev${cap}`] ??
      summary?.[`${baseKey}_${prevYear}`] ??
      null
    );
  };

  const buildSummaryMetric = (baseKey, fallbackValue) => {
    const currentValue = getSummaryValue(baseKey, "current") ?? fallbackValue ?? 0;
    const prevValue = getSummaryValue(baseKey, "prev");

    const currentNum = Number(currentValue || 0);
    const prevNum = prevValue === null ? null : Number(prevValue || 0);

    let diff = null;
    let percentChange = null;

    if (prevNum === null) {
      diff = null;
      percentChange = null;
    } else {
      diff = currentNum - prevNum;
      percentChange = prevNum === 0 ? null : (diff / prevNum) * 100;
    }

    return { current: currentNum, prev: prevNum, diff, percentChange };
  };

  const productsMetric = buildSummaryMetric("totalProducts", rawTotalProducts);
  const qtyMetric = buildSummaryMetric("totalQty", rawTotalQty);
  const salesMetric = buildSummaryMetric("totalSales", rawTotalSales);
  const discountMetric = buildSummaryMetric("totalDiscount", rawTotalDiscount);

  const joinPctWithParen = (pctText, parenText) => `${pctText}\u00A0${parenText}`;

  const formatSummaryDiff = (metric, { isMoney = false } = {}) => {
    const { diff, percentChange, prev } = metric;

    if (prev === null || diff === null) return "-";

    if (prev === 0) {
      if (!diff) return "no change";
      const sign = diff > 0 ? "+" : "-";
      const absDiff = Math.abs(diff);
      const valueText = isMoney
        ? absDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : absDiff.toLocaleString();
      return `${sign}${valueText}`;
    }

    const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
    if (!percentChange && diff === 0) return "no change";

    const absPercent = Math.abs(percentChange ?? 0).toFixed(2);
    const absDiff = Math.abs(diff);
    const valueText = isMoney
      ? absDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : absDiff.toLocaleString();

    return joinPctWithParen(`${sign}${absPercent}%`, `(${sign}${valueText})`);
  };

  const getDiffClass = (diff) => {
    if (diff > 0) return "text-emerald-600";
    if (diff < 0) return "text-red-500";
    return "text-slate-500";
  };

  const totalPages = totalRows > 0 ? Math.ceil(totalRows / pageSize) : 1;

  const getRowMetric = (row, baseKey) => {
    const cap = capitalize(baseKey);

    const currentValue =
      row[`${baseKey}_current`] ??
      row[`current${cap}`] ??
      row[`${baseKey}_${currentYear}`] ??
      row[baseKey] ??
      0;

    const prevValue =
      row[`${baseKey}_prev`] ??
      row[`prev${cap}`] ??
      row[`${baseKey}_${prevYear}`] ??
      null;

    return {
      current: Number(currentValue || 0),
      prev: prevValue === null ? null : Number(prevValue || 0),
    };
  };

  const renderYearCell = (
    metric,
    { isMoney = false, isPercent = false, mainClass = "" } = {}
  ) => {
    const { current, prev } = metric;
    const diff = prev === null ? null : current - prev;
    const diffClass = getDiffClass(diff ?? 0);

    const formatMain = () => {
      if (isPercent) return `${(current * 100).toFixed(2)}%`;
      if (isMoney)
        return current.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      return current.toLocaleString();
    };

    const formatPrev = () => {
      if (prev === null) return "-";
      if (isPercent) return `${(prev * 100).toFixed(2)}%`;
      if (isMoney)
        return prev.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      return prev.toLocaleString();
    };

    const formatDiff = () => {
      if (prev === null || diff === null) return "-";

      if (isPercent) {
        const currPct = current * 100;
        const prevPct = prev * 100;
        const diffPts = currPct - prevPct;

        if (prevPct === 0) {
          if (!diffPts) return "no change";
          const sign = diffPts > 0 ? "+" : "-";
          return `${sign}${Math.abs(diffPts).toFixed(2)} pts`;
        }

        const percentChange = (diffPts / prevPct) * 100;
        const sign = diffPts > 0 ? "+" : "-";
        return joinPctWithParen(
          `${sign}${Math.abs(percentChange).toFixed(2)}%`,
          `(${sign}${Math.abs(diffPts).toFixed(2)})`
        );
      }

      if (prev === 0) {
        if (!diff) return "no change";
        const sign = diff > 0 ? "+" : "-";
        const absDiff = Math.abs(diff);
        const valueText = isMoney
          ? absDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : absDiff.toLocaleString();
        return `${sign}${valueText}`;
      }

      const percentChange = (diff / prev) * 100;
      const sign = diff > 0 ? "+" : "-";
      const absPercent = Math.abs(percentChange).toFixed(2);
      const absDiff = Math.abs(diff);
      const valueText = isMoney
        ? absDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : absDiff.toLocaleString();

      return joinPctWithParen(`${sign}${absPercent}%`, `(${sign}${valueText})`);
    };

    return (
      <div className="grid grid-cols-[1fr,1fr] grid-rows-2 gap-x-1 min-w-0">
        <div className={`row-span-2 flex items-center justify-end font-medium tabular-nums min-w-0 ${mainClass}`}>
          <span className="whitespace-nowrap">{formatMain()}</span>
        </div>

        <div className="col-span-1 text-[10px] text-slate-500 text-right tabular-nums whitespace-nowrap min-w-max">
          {prevLabel}: {formatPrev()}
        </div>

        <div
          className={`col-span-1 text-[10px] text-right tabular-nums min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${diffClass}`}
          title={formatDiff()}
        >
          {formatDiff()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1 text-xs md:text-sm">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Total products</p>
          <div className="mt-1 grid grid-cols-[1.4fr,1.6fr] gap-x-2 items-center min-w-0">
            <div className="text-lg font-semibold text-slate-800 tabular-nums whitespace-nowrap">
              {productsMetric.current.toLocaleString()}
            </div>
            <div className="flex flex-col items-end text-[11px] min-w-0">
              <span className="text-slate-500 whitespace-nowrap">
                {prevLabel}: {productsMetric.prev === null ? "-" : productsMetric.prev.toLocaleString()}
              </span>
              <span
                className={`mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${getDiffClass(productsMetric.diff ?? 0)}`}
                title={formatSummaryDiff(productsMetric, { isMoney: false })}
              >
                {formatSummaryDiff(productsMetric, { isMoney: false })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Total quantity</p>
          <div className="mt-1 grid grid-cols-[1.4fr,1.6fr] gap-x-2 items-center min-w-0">
            <div className="text-lg font-semibold text-slate-800 tabular-nums whitespace-nowrap">
              {qtyMetric.current.toLocaleString()}
            </div>
            <div className="flex flex-col items-end text-[11px] min-w-0">
              <span className="text-slate-500 whitespace-nowrap">
                {prevLabel}: {qtyMetric.prev === null ? "-" : qtyMetric.prev.toLocaleString()}
              </span>
              <span
                className={`mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${getDiffClass(qtyMetric.diff ?? 0)}`}
                title={formatSummaryDiff(qtyMetric, { isMoney: false })}
              >
                {formatSummaryDiff(qtyMetric, { isMoney: false })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Total sales</p>
          <div className="mt-1 grid grid-cols-[1.4fr,1.6fr] gap-x-2 items-center min-w-0">
            <div className="text-lg font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
              {salesMetric.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex flex-col items-end text-[11px] min-w-0">
              <span className="text-slate-500 whitespace-nowrap">
                {prevLabel}:{" "}
                {salesMetric.prev === null
                  ? "-"
                  : salesMetric.prev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${getDiffClass(salesMetric.diff ?? 0)}`}
                title={formatSummaryDiff(salesMetric, { isMoney: true })}
              >
                {formatSummaryDiff(salesMetric, { isMoney: true })}
              </span>
            </div>
          </div>

          <div className="mt-1 text-[11px] min-w-0">
            <div className="text-red-500 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
              Discount {currentLabel}:{" "}
              {discountMetric.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-slate-500 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
              {prevLabel}:{" "}
              {discountMetric.prev === null
                ? "-"
                : discountMetric.prev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`${getDiffClass(discountMetric.diff ?? 0)} mt-0.5 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis`}
              title={formatSummaryDiff(discountMetric, { isMoney: true })}
            >
              {formatSummaryDiff(discountMetric, { isMoney: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาสินค้า / รหัส / แบรนด์"
            className="w-full md:w-72 rounded-lg border border-slate-200 px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-[11px] text-slate-500 hover:text-slate-700"
            >
              clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2">
          <label className="text-[11px] text-slate-500">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="sales_desc">Sales (high → low)</option>
            <option value="qty_desc">Qty (high → low)</option>
            <option value="discount_desc">Discount (most negative first)</option>
            <option value="name_asc">Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500">Loading products...</div>
        ) : rows && rows.length > 0 ? (
          <table className="min-w-full table-fixed text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="w-12 py-2.5 px-3 text-left text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  #
                </th>
                <th className="w-[38%] py-2.5 px-3 text-left text-[11px] font-semibold text-slate-600">
                  สินค้า
                </th>
                <th className="w-[15%] py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  จำนวน
                </th>
                <th className="w-[17%] py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  ยอดขาย
                </th>
                <th className="w-[15%] py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  ส่วนลด
                </th>
                <th className="w-[15%] py-2.5 px-3 text-right text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  % of total
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p, i) => {
                const qtyMetricRow = getRowMetric(p, "qty");
                const salesMetricRow = getRowMetric(p, "sales");
                const discountMetricRow = getRowMetric(p, "discount_total");
                const ratioMetricRow = getRowMetric(p, "sales_ratio");

                return (
                  <tr
                    key={`${p.product_code}-${i}`}
                    className="border-b last:border-0 border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/60 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {(page - 1) * pageSize + i + 1}
                    </td>

                    <td className="py-2.5 px-3 text-slate-800">
                      <div className="font-medium break-words">{p.product_name}</div>
                      <div className="text-[11px] text-slate-500 break-words">
                        {p.product_code}
                        {p.product_brand ? ` • ${p.product_brand}` : ""}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">{renderYearCell(qtyMetricRow)}</td>

                    <td className="py-2.5 px-3">
                      {renderYearCell(salesMetricRow, { isMoney: true, mainClass: "text-blue-700" })}
                    </td>

                    <td className="py-2.5 px-3">
                      {renderYearCell(discountMetricRow, { isMoney: true, mainClass: "text-red-500" })}
                    </td>

                    <td className="py-2.5 px-3">{renderYearCell(ratioMetricRow, { isPercent: true })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            ไม่มีข้อมูลสินค้าในช่วงวันที่ที่เลือก
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-1">
        <div className="text-[11px] text-slate-500">
          Showing{" "}
          <span className="font-medium">{totalRows === 0 ? 0 : (page - 1) * pageSize + 1}</span> –{" "}
          <span className="font-medium">{Math.min(page * pageSize, totalRows)}</span> of{" "}
          <span className="font-medium">{totalRows.toLocaleString()}</span> products
        </div>

        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
};

// ====================== PAGINATION CONTROLS ======================
const PaginationControls = ({ page: currentPage, totalPages, onPageChange }) => {
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const goPrev = () => {
    if (currentPage <= 1) return;
    onPageChange(currentPage - 1);
  };

  const goNext = () => {
    if (currentPage >= totalPages) return;
    onPageChange(currentPage + 1);
  };

  const applyInputPage = () => {
    let num = parseInt(inputValue, 10);

    if (isNaN(num)) {
      setInputValue(String(currentPage));
      return;
    }

    if (num < 1) num = 1;
    if (num > totalPages) num = totalPages;

    onPageChange(num);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyInputPage();
    }
  };

  const handleBlur = () => {
    applyInputPage();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={goPrev}
        className={`px-2.5 py-1 rounded-lg border text-[11px] ${
          currentPage <= 1
            ? "border-slate-200 text-slate-300 cursor-default"
            : "border-slate-300 text-slate-700 hover:bg-slate-100"
        }`}
      >
        Back
      </button>

      <div className="flex items-center gap-1 text-[11px] text-slate-500">
        <span>Page</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-12 px-1.5 py-1 border border-slate-300 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <span>/</span>
        <span className="font-medium text-slate-800">{totalPages}</span>
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={goNext}
        className={`px-2.5 py-1 rounded-lg border text-[11px] ${
          currentPage >= totalPages
            ? "border-slate-200 text-slate-300 cursor-default"
            : "border-slate-300 text-slate-700 hover:bg-slate-100"
        }`}
      >
        Next
      </button>
    </div>
  );
};

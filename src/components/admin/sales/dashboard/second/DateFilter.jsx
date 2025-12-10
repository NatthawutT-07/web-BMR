import React, { useMemo } from "react";

// Helper แปลง Date → YYYY-MM-DD แบบใช้เวลา Local (กัน timezone เพี้ยน)
const toLocalISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// แปลง "2025-12-06" → "06/12/2025"
const formatDisplayDate = (isoStr) => {
    if (!isoStr) return "";
    const [y, m, d] = isoStr.split("-");
    if (!y || !m || !d) return isoStr;
    return `${d}/${m}/${y}`;
};

// =================== Date Filter ===================
const DateFilter = ({
    start,
    end,
    setStart,
    setEnd,
    load,
    minDate,
    maxDate,
    disabled,
}) => {
    const clampDate = (dateStr) => {
        if (!dateStr) return dateStr;
        const d = new Date(dateStr);
        const min = minDate ? new Date(minDate) : null;
        const max = maxDate ? new Date(maxDate) : null;

        if (min && d < min) return minDate;
        if (max && d > max) return maxDate;
        return toLocalISO(d);
    };

    const applyPreset = (type) => {
        const now = new Date();
        // end = วันนี้ - 1 เสมอ
        const endBase = new Date(now);
        endBase.setDate(endBase.getDate() - 1);

        let startDate = new Date(endBase);
        let endDate = new Date(endBase);

        if (type === "7d") {
            startDate.setDate(endBase.getDate() - 6); // รวม 7 วัน
        } else if (type === "30d") {
            startDate.setDate(endBase.getDate() - 29); // รวม 30 วัน
        } else if (type === "60d") {
            startDate.setDate(endBase.getDate() - 59); // รวม 60 วัน
        } else if (type === "90d") {
            startDate.setDate(endBase.getDate() - 89); // รวม 90 วัน
        } else if (type === "month") {
            // เดือนนี้ = ตั้งแต่วันที่ 1 ของเดือนปัจจุบัน ถึง เมื่อวาน
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (type === "year") {
            // ปีนี้ = 1 ม.ค. ปีปัจจุบัน ถึง เมื่อวาน
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (type === "all") {
            // ทั้งหมด = 1/1/2024 - ปัจจุบัน - 1
            if (minDate) {
                startDate = new Date(minDate);
            } else {
                startDate = new Date(2024, 0, 1); // 1 ม.ค. 2024
            }
        }

        const startStr = clampDate(toLocalISO(startDate));
        const endStr = clampDate(toLocalISO(endDate));

        setStart(startStr);
        setEnd(endStr);
    };

    return (
        <div className="bg-white/90 backdrop-blur shadow-sm rounded-xl border border-slate-200 px-4 py-3 md:px-6 md:py-4">
            <div className="space-y-3">
                {/* แถว: วันที่เริ่มต้น + วันที่สิ้นสุด + ปุ่มแสดงข้อมูล (ชิดกัน) */}
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-slate-600 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={start}
                            min={minDate}
                            max={maxDate}
                            onChange={(e) => setStart(e.target.value)}
                            className="border border-slate-200 px-3 py-2 rounded-lg w-full shadow-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-slate-600 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={end}
                            min={minDate}
                            max={maxDate}
                            onChange={(e) => setEnd(e.target.value)}
                            className="border border-slate-200 px-3 py-2 rounded-lg w-full shadow-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                        />
                    </div>

                    {/* ปุ่มแสดงข้อมูล อยู่ข้าง ๆ ช่องวันที่ */}
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-transparent mb-1">
                            .
                        </label>
                        <button
                            onClick={load}
                            disabled={disabled}
                            className={`inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all
                                ${disabled
                                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                                }`}
                        >
                            Show Data
                        </button>
                    </div>
                </div>

                {/* แสดงช่วงวันที่ในรูปแบบ วัน/เดือน/ปี */}
                <div className="text-[11px] text-slate-500">
                    ช่วงวันที่ที่เลือก:{" "}
                    <span className="font-medium text-slate-700">
                        {formatDisplayDate(start)} - {formatDisplayDate(end)}
                    </span>
                </div>

                {/* ปุ่มลัดช่วงวันที่ */}
                <div className="flex flex-wrap gap-2 text-xs mt-1">
                    <span className="self-center text-[11px] text-slate-500 mr-1">
                        Quick Range :
                    </span>

                    <button
                        type="button"
                        onClick={() => applyPreset("7d")}
                        className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-xs"
                    >
                        Last 7 Days
                    </button>

                    <button
                        type="button"
                        onClick={() => applyPreset("30d")}
                        className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-xs"
                    >
                        Last 30 Days
                    </button>

                    <button
                        type="button"
                        onClick={() => applyPreset("60d")}
                        className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-xs"
                    >
                        Last 60 Days
                    </button>

                    <button
                        type="button"
                        onClick={() => applyPreset("90d")}
                        className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-xs"
                    >
                        Last 90 Days
                    </button>

                    <button
                        type="button"
                        onClick={() => applyPreset("month")}
                        className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-xs"
                    >
                        This Month
                    </button>

                    <button
                        type="button"
                        onClick={() => applyPreset("year")}
                        className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-xs"
                    >
                        This Year
                    </button>

                    <button
                        type="button"
                        onClick={() => applyPreset("all")}
                        className="px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition text-xs"
                    >
                        All
                    </button>
                </div>
            </div>
        </div>
    );
};

// =================== Helper สำหรับ KPI รายปี ===================
const buildYearStats = (salesByDate) => {
    const stats = {};

    if (!Array.isArray(salesByDate)) {
        return { years: [], latestYear: null, prevYear: null, stats: {} };
    }

    salesByDate.forEach((row) => {
        if (!row.bill_date) return;
        const d = new Date(row.bill_date);
        if (Number.isNaN(d.getTime())) return;
        const y = d.getFullYear();

        if (!stats[y]) {
            stats[y] = {
                total_payment: 0,
                discount_sum: 0,
                rounding_sum: 0,
                bill_count: 0,
                net_bill_count: 0,
            };
        }

        const total = Number(row.total_payment || 0);
        const discount = Number(row.discount_sum || 0);
        const rounding = Number(row.rounding_sum || 0);
        const billCount = Number(row.bill_count || 0);
        const saleCount = Number(row.sale_count || 0);
        const returnCount = Number(row.return_count || 0);

        stats[y].total_payment += total;
        stats[y].discount_sum += discount;
        stats[y].rounding_sum += rounding;

        // ✅ Bill Count = นับเฉพาะบิลขาย (ให้ตรงกับ backend summary.bill_count)
        stats[y].bill_count += saleCount;

        // ✅ net_bill_count = บิลขาย + บิลคืน (ใช้เป็น “จำนวนบิลทั้งหมด”)
        stats[y].net_bill_count += saleCount + returnCount;

    });

    const years = Object.keys(stats)
        .map((y) => parseInt(y, 10))
        .sort((a, b) => a - b);
    const latestYear = years.length ? years[years.length - 1] : null;
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    return { years, latestYear, prevYear, stats };
};

const getYearMetric = (yearInfo, key) => {
    if (!yearInfo || !yearInfo.latestYear) return null;

    const { latestYear, prevYear, stats } = yearInfo;
    const currentYearData = stats[latestYear] || {};
    const prevYearData = prevYear != null ? stats[prevYear] || {} : {};

    const current = Number(currentYearData[key] || 0);
    const prev = prevYear != null ? Number(prevYearData[key] || 0) : null;

    let diff = null;
    let pct = null;

    if (prevYear != null && prev !== 0) {
        diff = current - prev;
        pct = (diff / prev) * 100;
    }

    return {
        latestYear,
        prevYear,
        current,
        prev,
        diff,
        pct,
    };
};

// ✅ Daily Average Sales per year: คิดเฉลี่ยรายวันแบบปีต่อปี + เทียบย้อนหลัง
const buildDailyAvgYearMetric = (salesByDate) => {
    if (!Array.isArray(salesByDate) || salesByDate.length === 0) return null;

    const perYear = {};

    salesByDate.forEach((row) => {
        if (!row.bill_date) return;
        const d = new Date(row.bill_date);
        if (Number.isNaN(d.getTime())) return;

        const y = d.getFullYear();
        const dayKey = d.toISOString().slice(0, 10); // ใช้เฉพาะ YYYY-MM-DD กันซ้ำ

        if (!perYear[y]) {
            perYear[y] = {
                totalSales: 0,
                days: new Set(),
            };
        }

        perYear[y].totalSales += Number(row.total_payment || 0);
        perYear[y].days.add(dayKey);
    });

    const years = Object.keys(perYear)
        .map((y) => parseInt(y, 10))
        .sort((a, b) => a - b);

    if (!years.length) return null;

    const latestYear = years[years.length - 1];
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    const currentTotal = perYear[latestYear].totalSales;
    const currentDays = perYear[latestYear].days.size || 1;
    const currentAvg = currentTotal / currentDays;

    let prevAvg = null;
    if (prevYear != null) {
        const prevTotal = perYear[prevYear].totalSales;
        const prevDays = perYear[prevYear].days.size || 1;
        prevAvg = prevTotal / prevDays;
    }

    let diff = null;
    let pct = null;
    if (prevAvg != null && prevAvg !== 0) {
        diff = currentAvg - prevAvg;
        pct = (diff / prevAvg) * 100;
    }

    return {
        latestYear,
        prevYear,
        current: currentAvg,
        prev: prevAvg,
        diff,
        pct,
    };
};

// =================== KPI Card ===================
const KpiCard = ({ title, metric, format, highlight, variant }) => {
    if (!metric) {
        return (
            <div className="relative overflow-hidden rounded-xl border bg-white border-slate-200 text-sm shadow-sm p-4 md:p-5">
                <div className="text-slate-500 text-xs font-medium mb-1">
                    {title}
                </div>
                <div className="mt-2 text-lg md:text-xl font-semibold text-slate-400">
                    -
                </div>
            </div>
        );
    }

    const { latestYear, prevYear, current, prev, diff, pct } = metric;

    // ฟอร์แมตค่าหลัก
    const currentText =
        format && typeof current === "number"
            ? format(current)
            : typeof current === "number"
                ? current.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                : "-";

    const prevText =
        prevYear != null && typeof prev === "number"
            ? format
                ? format(prev)
                : prev.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            : "-";

    // ฟอร์แมต diff text
    const diffAmountFormatted =
        diff != null
            ? format
                ? format(diff)
                : diff.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            : null;

    const diffText =
        pct == null
            ? "-"
            : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%${diffAmountFormatted != null
                ? ` (${diff > 0 ? "+" : ""}${diffAmountFormatted})`
                : ""
            }`;

    // กำหนดสี diff ตาม variant
    let diffColor = "text-slate-500";

    if (variant === "rounding") {
        // Rounding = สีขาว/เทา กลาง ๆ ไม่บอกดี/แย่
        diffColor = "text-slate-400";
    } else if (variant === "discount") {
        // Total Discounts: ถ้ายอดติดลบน้อยลง = ดีขึ้น → เขียว
        if (
            prevYear != null &&
            typeof current === "number" &&
            typeof prev === "number"
        ) {
            let improved = false;

            if (prev < 0 && current < 0) {
                // ทั้งคู่ติดลบ → ดูว่า magnitude ลดลงไหม
                improved = Math.abs(current) < Math.abs(prev);
            } else if (prev < 0 && current >= 0) {
                // จากติดลบ → เป็น 0 หรือบวก → ดีขึ้นแน่นอน
                improved = true;
            } else if (prev >= 0 && current >= 0) {
                // ส่วนลดเป็นบวกทั้งคู่ → ถ้า current < prev = ลดส่วนลดลง → ดีขึ้น
                improved = current < prev;
            } else if (prev >= 0 && current < 0) {
                // จากไม่ติดลบ → กลายเป็นติดลบ → แย่ลง
                improved = false;
            }

            if (improved && pct !== 0) {
                diffColor = "text-emerald-600 font-semibold";
            } else if (!improved && pct !== 0) {
                diffColor = "text-red-500 font-semibold";
            } else {
                diffColor = "text-slate-500";
            }
        }
    } else {
        // default KPI: เขียว = เพิ่มดี, แดง = ลดลง
        if (pct == null) diffColor = "text-slate-500";
        else if (pct > 0) diffColor = "text-emerald-600 font-semibold";
        else if (pct < 0) diffColor = "text-red-500 font-semibold";
        else diffColor = "text-slate-500";
    }

    return (
        <div
            className={`relative overflow-hidden rounded-xl border text-sm shadow-sm p-4 md:p-5
        ${highlight
                    ? "bg-gradient-to-br from-blue-50 via-emerald-50 to-white border-blue-100"
                    : "bg-white border-slate-200"
                }`}
        >
            {highlight && (
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100/60" />
            )}

            {/* ปีปัจจุบัน + ค่าหลัก อยู่ด้านซ้ายกลาง */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-slate-500 text-xs font-medium mb-1">
                        {title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        ปีล่าสุด:{" "}
                        <span className="font-semibold text-slate-700">
                            {latestYear ?? "-"}
                        </span>
                    </div>
                    <div
                        className="mt-1 text-xl md:text-2xl font-semibold text-gray-900"
                        style={{ wordBreak: "break-word" }}
                    >
                        {currentText}
                    </div>
                </div>

                {/* มุมบนขวา: ข้อมูลปีที่ผ่านมา + diff */}
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        {prevYear != null ? `ปี ${prevYear}` : "ปีที่ผ่านมา"}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600">
                        {prevText}
                    </div>
                    <div className={`mt-1 text-[11px] ${diffColor}`}>
                        {diffText}
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================== MAIN COMPONENT ===================
const TopFiltersAndKpi = ({
    start,
    end,
    setStart,
    setEnd,
    load,
    minDate,
    maxDate,
    disabled,
    summary,
    dailyAvgSales, // ยังรับไว้เผื่อใช้ต่อ แต่ logic ตอนนี้ไม่พึ่งค่า store แล้ว
    salesByDate,
}) => {
    // สร้างข้อมูลรายปีจาก salesByDate (ใช้ทำ KPI แบบรายปี)
    const yearInfo = useMemo(
        () => buildYearStats(salesByDate || []),
        [salesByDate]
    );

    const netSalesMetric = getYearMetric(yearInfo, "total_payment");
    const billCountMetric = getYearMetric(yearInfo, "bill_count");
    const discountMetric = getYearMetric(yearInfo, "discount_sum");
    const roundingMetric = getYearMetric(yearInfo, "rounding_sum");

    // ✅ Daily Average Sales แบบปีต่อปี + มีย้อนหลังเหมือนบล็อกอื่น
    const dailyAvgMetric = useMemo(
        () => buildDailyAvgYearMetric(salesByDate || []),
        [salesByDate]
    );

    // Average per Bill: ใช้ยอดขาย / จำนวนบิล ของแต่ละปี แล้วเปรียบเทียบ diff/pct
    const avgPerBillMetric =
        netSalesMetric && billCountMetric
            ? (() => {
                const { latestYear, prevYear } = netSalesMetric;
                const currentBills = billCountMetric.current || 0;
                const prevBills =
                    billCountMetric.prev != null
                        ? billCountMetric.prev
                        : null;

                const currentAvg =
                    currentBills > 0
                        ? netSalesMetric.current / currentBills
                        : 0;

                let prevAvg = null;
                if (prevYear != null && prevBills && prevBills > 0) {
                    prevAvg = netSalesMetric.prev / prevBills;
                }

                let diff = null;
                let pct = null;
                if (prevAvg != null && prevAvg !== 0) {
                    diff = currentAvg - prevAvg;
                    pct = (diff / prevAvg) * 100;
                }

                return {
                    latestYear,
                    prevYear,
                    current: currentAvg,
                    prev: prevAvg,
                    diff,
                    pct,
                };
            })()
            : null;

    return (
        <div className="space-y-6">
            {/* Date Filter */}
            <DateFilter
                start={start}
                end={end}
                setStart={setStart}
                setEnd={setEnd}
                load={load}
                minDate={minDate}
                maxDate={maxDate}
                disabled={disabled}
            />

            {/* KPI Cards แบบรายปี */}
            {summary && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <KpiCard
                            title="Net Sales"
                            metric={netSalesMetric}
                            highlight
                        />

                        <KpiCard
                            title="Bill Count"
                            metric={billCountMetric}
                            format={(v) =>
                                v.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                })
                            }
                        />

                        <KpiCard
                            title="Average per Bill"
                            metric={avgPerBillMetric}
                        />

                        <KpiCard
                            title="Total Discounts"
                            metric={discountMetric}
                            variant="discount"
                        />

                        <KpiCard
                            title="Total Rounding"
                            metric={roundingMetric}
                            variant="rounding"
                        />

                        <KpiCard
                            title="Daily Average Sales"
                            metric={dailyAvgMetric}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopFiltersAndKpi;

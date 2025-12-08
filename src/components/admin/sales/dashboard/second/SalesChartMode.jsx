import React, { useState, Suspense, useMemo, useEffect } from "react";

const LazyLine = React.lazy(() =>
    import("react-chartjs-2").then((m) => ({ default: m.Line }))
);

// ======================= CONSTANT =======================
const thaiDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const thaiMonths = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


const COLORS = [
    "rgba(54, 162, 235, 1)",  // ปี 1
    "rgba(255, 159, 64, 1)",  // ปี 2
    "rgba(75, 192, 192, 1)",  // ปี 3
    "rgba(153, 102, 255, 1)", // ปี 4
    "rgba(255, 99, 132, 1)",  // ปี 5
    "rgba(255, 205, 86, 1)",  // ปี 6
];

const getISO = (row) => row.bill_date.split("T")[0];
const getDM = (iso) => iso.slice(5); // MM-DD
const getWeekOfMonth = (date) => Math.ceil(new Date(date).getDate() / 7);

// ======================= MAIN =======================
const SalesChartMode = ({ rows }) => {
    const [mode, setMode] = useState("day");

    if (!rows || rows.length === 0)
        return (
            <div className="p-3 text-sm text-slate-500">
                ไม่มีข้อมูลกราฟสำหรับช่วงวันที่นี้
            </div>
        );

    // ปีทั้งหมดจากข้อมูล (รองรับ 2026+ อัตโนมัติ)
    const years = useMemo(
        () =>
            [...new Set(rows.map((r) => new Date(r.bill_date).getFullYear()))].sort(
                (a, b) => a - b
            ),
        [rows]
    );

    const latestYear = years[years.length - 1];
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    // สีประจำปี
    const yearColorMap = useMemo(() => {
        const map = {};
        years.forEach((y, idx) => {
            map[y] = COLORS[idx % COLORS.length];
        });
        return map;
    }, [years]);

    // ปุ่มเปิด/ปิดเส้นกราฟ
    const [activeYears, setActiveYears] = useState(years);

    useEffect(() => {
        // ถ้าช่วงข้อมูลเปลี่ยน (rows เปลี่ยน) → รีเซ็ตให้เปิดทุกปี
        setActiveYears(years);
    }, [rows, years]);

    const toggleYear = (year) => {
        setActiveYears((prev) => {
            if (prev.includes(year)) {
                // ปิดปีนั้น
                return prev.filter((y) => y !== year);
            } else {
                // เปิดเพิ่ม
                return [...prev, year].sort((a, b) => a - b);
            }
        });
    };

    // Helper: เอายอดของ "เดือนก่อนหน้า" สำหรับปี/เดือนนั้น (รองรับข้ามปี)
    const getPrevMonthValue = (year, month, grouped) => {
        let y = year;
        let m = month - 1;
        if (m === 0) {
            y -= 1;
            m = 12;
        }
        const val = grouped[y]?.month?.[m];
        return typeof val === "number" ? val : null;
    };


    // ================= GROUP ข้อมูล =================
    const grouped = useMemo(() => {
        const g = {};
        rows.forEach((r) => {
            const iso = getISO(r);
            const d = new Date(r.bill_date);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const w = getWeekOfMonth(d);
            const dm = getDM(iso);

            if (!g[y]) g[y] = { day: {}, week: {}, month: {}, year: 0 };

            g[y].day[dm] = (g[y].day[dm] || 0) + r.total_payment;
            g[y].week[`${m}-${w}`] = (g[y].week[`${m}-${w}`] || 0) + r.total_payment;
            g[y].month[m] = (g[y].month[m] || 0) + r.total_payment;
            g[y].year += r.total_payment;
        });
        return g;
    }, [rows]);

    let labels = [];
    let datasets = [];
    let monthTableRows = [];

    const visibleYears = activeYears.length ? activeYears : years;

    // ============================================================
    // ⭐ MODE: DAY
    // ============================================================
    if (mode === "day") {
        let dmList = [...new Set(rows.map((r) => getDM(getISO(r))))];
        dmList.sort((a, b) => new Date("2000-" + a) - new Date("2000-" + b));

        const filtered = dmList.filter((dm) =>
            years.some((y) => grouped[y]?.day?.[dm] > 0)
        );

        labels = filtered;

        datasets = years
            .filter((year) => visibleYears.includes(year))
            .map((year) => ({
                label: ` ${year}`,
                data: labels.map((dm) => grouped[year]?.day?.[dm] ?? null),
                borderColor: yearColorMap[year],
                pointRadius: (ctx) => (ctx.raw ? 2 : 0),
                borderWidth: 1.4,
                tension: 0.25,
                spanGaps: true,
            }));
    }

    // ============================================================
    // ⭐ MODE: WEEK
    // ============================================================
    if (mode === "week") {
        let weekKeys = [
            ...new Set(
                rows.map((r) => {
                    const d = new Date(r.bill_date);
                    return `${d.getMonth() + 1}-${getWeekOfMonth(d)}`;
                })
            ),
        ];

        weekKeys.sort((a, b) => {
            const [ma, wa] = a.split("-").map(Number);
            const [mb, wb] = b.split("-").map(Number);
            return ma !== mb ? ma - mb : wa - wb;
        });

        const filtered = weekKeys.filter((k) =>
            years.some((y) => grouped[y]?.week?.[k] > 0)
        );

        labels = filtered.map((k) => {
            const [m, w] = k.split("-");
            return `${thaiMonths[m]} - W${w}`;
        });

        datasets = years
            .filter((year) => visibleYears.includes(year))
            .map((year) => ({
                label: ` ${year}`,
                data: filtered.map((k) => grouped[year]?.week?.[k] ?? null),
                borderColor: yearColorMap[year],
                borderWidth: 1.4,
                tension: 0.25,
                pointRadius: (ctx) => (ctx.raw ? 2 : 0),
                spanGaps: true,
            }));
    }

    // ============================================================
    // ⭐ MODE: MONTH (ทุกปี + ตารางสวย ๆ)
    // ============================================================
    if (mode === "month") {
        labels = thaiMonths.slice(1); // ["ม.ค.", ... "ธ.ค."]

        // datasets: ปีทั้งหมด (ที่เปิดแสดง)
        datasets = years
            .filter((year) => visibleYears.includes(year))
            .map((year) => {
                const data = Array.from({ length: 12 }, (_, i) => {
                    const m = i + 1;
                    return grouped[year]?.month?.[m] ?? null;
                });
                return {
                    label: ` ${year}`,
                    data,
                    borderColor: yearColorMap[year],
                    pointRadius: (ctx) => (ctx.raw ? 3 : 0),
                    borderWidth: 1.7,
                    tension: 0.2,
                    spanGaps: true,
                };
            });

        // ตารางรายเดือน
        monthTableRows = labels.map((label, i) => {
            const month = i + 1;

            const valuesByYear = years.map(
                (y) => grouped[y]?.month?.[month] || 0
            );

            let diffAmount = null;
            let diffPct = null;

            if (prevYear != null) {
                const latestVal =
                    grouped[latestYear]?.month?.[month] || 0;
                const prevVal =
                    grouped[prevYear]?.month?.[month] || 0;

                if (prevVal > 0) {
                    diffAmount = latestVal - prevVal;
                    diffPct = (diffAmount / prevVal) * 100;
                }
            }

            return {
                label,
                valuesByYear,
                diffAmount,
                diffPct,
            };
        });
    }

    // ===== Helper: tooltip title ใน mode "day" เป็นภาษาไทย =====
    const getDayTitle = (item) => {
        const dm = item.label; // "MM-DD"
        if (!dm) return "";
        const [mStr, dStr] = dm.split("-");
        const yearMatch = item.dataset?.label?.match?.(/\d{4}/);
        if (!yearMatch || !mStr || !dStr) return dm;

        const y = parseInt(yearMatch[0], 10);
        const iso = `${y}-${mStr}-${dStr}`;
        const date = new Date(iso + "T00:00:00");
        if (Number.isNaN(date.getTime())) return dm;

        const dayName = thaiDays[date.getDay()];
        const monthName = thaiMonths[parseInt(mStr, 10)] || "";
        const dayNum = parseInt(dStr, 10);

        return `${dayName} ${dayNum} ${monthName} ${y}`;
    };

    // ===== Diff header label =====
    const diffHeaderLabel =
        prevYear != null
            ? `Diff % (${latestYear}/${prevYear})`
            : "Diff %";

    // ===== รวมยอดทั้งปีเพื่อใช้ในแถว Sum =====
    let totalByYear = {};
    if (mode === "month") {
        years.forEach((y) => {
            totalByYear[y] = Object.values(grouped[y]?.month || {}).reduce(
                (sum, v) => sum + (v || 0),
                0
            );
        });
    }

    // ======================= RENDER =======================
    return (
        <div className="space-y-4">
            {/* HEADER & MODE TOGGLE */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                 
                </div>

                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/70 p-1 text-xs md:text-sm">
                    {["day", "week", "month"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap
                                ${mode === m
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-white"
                                }`}
                        >
                            {m === "day" && "Day"}
                            {m === "week" && "Week"}
                            {m === "month" && "Month"}
                        </button>
                    ))}
                </div>
            </div>

            {/* TOGGLE ปี (เปิด/ปิดเส้นกราฟ) */}
            {years.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs mb-1">
                    {years.map((y) => {
                        const active = activeYears.includes(y);
                        return (
                            <button
                                key={y}
                                type="button"
                                onClick={() => toggleYear(y)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs md:text-[13px] transition
                                    ${active
                                        ? "bg-blue-100 text-slate-700 border-blue-300 shadow-sm"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <span
                                    className="inline-block w-2 h-2 rounded-full"
                                    style={{ backgroundColor: yearColorMap[y] }}
                                />
                                <span>{y}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* CHART */}
            <div className="w-full overflow-x-auto pb-2">
                <Suspense fallback={<div className="text-sm text-slate-500">Loading chart...</div>}>
                    <div className="min-w-[280px]">
                        <LazyLine
                            data={{ labels, datasets }}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                plugins: {
                                    legend: { position: "bottom" },
                                    tooltip: {
                                        callbacks: {
                                            title: (items) => {
                                                const item = items?.[0];
                                                if (!item) return "";
                                                if (mode !== "day") {
                                                    return item.label || "";
                                                }
                                                return getDayTitle(item);
                                            },
                                            label: (ctx) => {
                                                const value = Number(
                                                    ctx.raw ?? 0
                                                ).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                });
                                                return `${ctx.dataset.label}: ${value}`;
                                            },
                                        },
                                    },
                                },
                                scales: {
                                    x: {
                                        ticks: {
                                            maxRotation: 0,
                                            minRotation: 0,
                                            autoSkip: true,
                                        },
                                    },
                                },
                            }}
                            height={320}
                        />
                    </div>
                </Suspense>
            </div>

            {/* ======================= TABLE — MONTH ======================= */}
            {mode === "month" && (
                <div className="mt-2 border-2 border-slate-300 rounded-xl bg-white/95 w-full overflow-x-auto">
                    <div className="px-3 py-2 border-b border-slate-300 bg-slate-50/90">
                        <h3 className="text-xs md:text-sm font-semibold text-slate-800">
                            📊 Monthly Sales Comparison
                        </h3>
                       
                    </div>
                    {(() => {
                        // ==== เตรียมข้อมูลสำหรับ Avg (ถึงเดือนล่าสุด - 1) และ Sum ====
                        let totalByYear = {};
                        let avgByYear = {};
                        let avgTargetMonth = null;

                        // รวมยอดทั้งปี
                        years.forEach((y) => {
                            totalByYear[y] = Object.values(grouped[y]?.month || {}).reduce(
                                (sum, v) => sum + (v || 0),
                                0
                            );
                        });

                        if (rows.length > 0) {
                            const lastRow = rows[rows.length - 1];
                            const lastMonth = new Date(lastRow.bill_date).getMonth() + 1;
                            const targetMonth = Math.max(0, lastMonth - 1);
                            avgTargetMonth = targetMonth;

                            years.forEach((y) => {
                                if (targetMonth === 0) {
                                    avgByYear[y] = 0;
                                    return;
                                }
                                let sum = 0;
                                let count = 0;
                                for (let m = 1; m <= targetMonth; m++) {
                                    const v = grouped[y]?.month?.[m];
                                    if (typeof v === "number") {
                                        sum += v;
                                        count++;
                                    }
                                }
                                avgByYear[y] = count > 0 ? sum / count : 0;
                            });
                        }

                        const diffHeaderLabel =
                            prevYear != null
                                ? `Diff % (${latestYear}/${prevYear})`
                                : "Diff %";

                        return (
                            <table className="w-full text-xs md:text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-center text-slate-600 border-b border-slate-300">
                                        <th className="border border-slate-200 px-2 py-1 text-left font-semibold">
                                            Month
                                        </th>
                                        {years.map((y) => (
                                            <th
                                                key={y}
                                                className="border border-slate-200 px-2 py-1 text-right font-semibold"
                                            >
                                                {y}
                                            </th>
                                        ))}
                                        <th className="border border-slate-200 px-2 py-1 text-right font-semibold">
                                            {diffHeaderLabel}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthTableRows.map((row, idx) => {
                                        const { label, valuesByYear, diffAmount, diffPct } = row;

                                        let diffColor = "text-slate-500";
                                        if (diffPct != null) {
                                            if (diffPct > 0)
                                                diffColor = "text-emerald-600 font-semibold";
                                            else if (diffPct < 0)
                                                diffColor = "text-red-500 font-semibold";
                                        }

                                        const diffText =
                                            diffPct != null
                                                ? `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(
                                                    2
                                                )}% (${diffAmount > 0 ? "+" : ""
                                                }${diffAmount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })})`
                                                : "-";

                                        const monthIndex = idx + 1; // 1–12 ใช้หา MoM

                                        return (
                                            <tr
                                                key={idx}
                                                className="bg-white even:bg-slate-50/70 text-center"
                                            >
                                                <td className="border border-slate-200 px-2 py-1 text-left">
                                                    <span className="text-xs md:text-sm font-medium">
                                                        {label}
                                                    </span>
                                                </td>

                                                {valuesByYear.map((val, i) => {
                                                    const year = years[i];
                                                    const prevVal = getPrevMonthValue(
                                                        year,
                                                        monthIndex,
                                                        grouped
                                                    );

                                                    let momPct = null;
                                                    if (
                                                        prevVal != null &&
                                                        prevVal > 0 &&
                                                        val > 0
                                                    ) {
                                                        momPct =
                                                            ((val - prevVal) / prevVal) *
                                                            100;
                                                    }

                                                    let momColor = "text-slate-500";
                                                    if (momPct != null) {
                                                        if (momPct > 0)
                                                            momColor =
                                                                "text-emerald-600 font-semibold";
                                                        else if (momPct < 0)
                                                            momColor =
                                                                "text-red-500 font-semibold";
                                                    }

                                                    return (
                                                        <td
                                                            key={`${label}-${year}`}
                                                            className="border border-slate-200 px-2 py-1 text-right align-top"
                                                        >
                                                            <div className="flex flex-col items-end gap-0.5">
                                                                {/* MoM diff (เดือนต่อเดือน) */}
                                                                {momPct != null && (
                                                                    <span className={`text-[11px] ${momColor}`}>
                                                                        {momPct > 0 ? "+" : ""}
                                                                        {momPct.toFixed(1)}%
                                                                    </span>
                                                                )}

                                                                {/* ยอดเดือนนั้น */}
                                                                <span className="text-xs md:text-sm font-semibold text-slate-800">
                                                                    {val
                                                                        ? val.toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })
                                                                        : "-"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                })}

                                                {/* Diff YoY (ปีล่าสุด vs ปีก่อนล่าสุด) */}
                                                <td
                                                    className={`border border-slate-200 px-2 py-1 text-right ${diffColor}`}
                                                >
                                                    <span className="text-xs md:text-sm">
                                                        {diffText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Avg row (ถึงเดือนล่าสุด -1) */}
                                    {avgTargetMonth && avgTargetMonth > 0 && (
                                        <tr className="bg-slate-50 text-center font-semibold">
                                            <td className="border border-slate-200 px-2 py-2 text-left">
                                                <span className="text-xs md:text-sm">
                                                    Avg
                                                </span>
                                            </td>
                                            {years.map((y) => (
                                                <td
                                                    key={`avg-${y}`}
                                                    className="border border-slate-200 px-2 py-1 text-right text-blue-700"
                                                >
                                                    <span className="text-xs md:text-sm">
                                                        {avgByYear[y]?.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }) || "-"}
                                                    </span>
                                                </td>
                                            ))}

                                            {/* Diff Avg ปีล่าสุด vs ปีก่อน */}
                                            {(() => {
                                                let avgDiffText = "-";
                                                let avgDiffColor = "text-slate-500";

                                                if (prevYear != null && avgTargetMonth > 0) {
                                                    const latestAvg = avgByYear[latestYear] || 0;
                                                    const prevAvg = avgByYear[prevYear] || 0;
                                                    if (prevAvg > 0) {
                                                        const diffAmt = latestAvg - prevAvg;
                                                        const diffPct =
                                                            (diffAmt / prevAvg) * 100;

                                                        avgDiffText = `${diffPct > 0 ? "+" : ""
                                                            }${diffPct.toFixed(2)}% (${diffAmt > 0 ? "+" : ""
                                                            }${diffAmt.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })})`;

                                                        if (diffPct > 0)
                                                            avgDiffColor =
                                                                "text-emerald-700 font-semibold";
                                                        else if (diffPct < 0)
                                                            avgDiffColor =
                                                                "text-red-600 font-semibold";
                                                    }
                                                }

                                                return (
                                                    <td
                                                        className={`border border-slate-200 px-2 py-1 text-right ${avgDiffColor}`}
                                                    >
                                                        <span className="text-xs md:text-sm">
                                                            {avgDiffText}
                                                        </span>
                                                    </td>
                                                );
                                            })()}
                                        </tr>
                                    )}

                                    {/* Sum row */}
                                    {years.length > 0 && (
                                        <tr className="bg-slate-100 text-center font-semibold">
                                            <td className="border border-slate-200 px-2 py-1 text-left">
                                                <span className="text-xs md:text-sm">Sum</span>
                                            </td>
                                            {years.map((y) => (
                                                <td
                                                    key={`sum-${y}`}
                                                    className="border border-slate-200 px-2 py-2 text-right text-blue-700"
                                                >
                                                    <span className="text-xs md:text-sm">
                                                        {totalByYear[y]?.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }) || "-"}
                                                    </span>
                                                </td>
                                            ))}

                                            {(() => {
                                                let totalDiffText = "-";
                                                let totalDiffColor = "text-slate-500";

                                                if (prevYear != null) {
                                                    const totalLatest =
                                                        totalByYear[latestYear] || 0;
                                                    const totalPrev = totalByYear[prevYear] || 0;
                                                    if (totalPrev > 0) {
                                                        const diffAmt =
                                                            totalLatest - totalPrev;
                                                        const diffPct =
                                                            (diffAmt / totalPrev) * 100;

                                                        totalDiffText = `${diffPct > 0 ? "+" : ""
                                                            }${diffPct.toFixed(2)}% (${diffAmt > 0 ? "+" : ""
                                                            }${diffAmt.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })})`;

                                                        if (diffPct > 0)
                                                            totalDiffColor =
                                                                "text-emerald-700 font-semibold";
                                                        else if (diffPct < 0)
                                                            totalDiffColor =
                                                                "text-red-600 font-semibold";
                                                    }
                                                }

                                                return (
                                                    <td
                                                        className={`border border-slate-200 px-2 py-1 text-right ${totalDiffColor}`}
                                                    >
                                                        <span className="text-xs md:text-sm">
                                                            {totalDiffText}
                                                        </span>
                                                    </td>
                                                );
                                            })()}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>
            )}

        </div>
    );
};

export default SalesChartMode;

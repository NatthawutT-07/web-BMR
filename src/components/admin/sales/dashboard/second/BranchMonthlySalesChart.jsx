import React, { useMemo, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";

// register chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

// label เดือน (index 1–12)
const THAI_MONTHS = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const COLORS = [
    "rgba(59,130,246,1)", // ฟ้า
    "rgba(16,185,129,1)", // เขียว
    "rgba(249,115,22,1)", // ส้ม
    "rgba(236,72,153,1)", // ชมพู
    "rgba(139,92,246,1)", // ม่วง
    "rgba(245,158,11,1)", // เหลือง
    "rgba(34,197,94,1)",  // เขียวสด
    "rgba(239,68,68,1)",  // แดง
];

/**
 * Plugin วาด %diff บนจุดของกราฟ
 * ใช้ค่า dataset._diffPct ที่เราใส่ไว้ตอนสร้าง datasets
 */
// ================= CUSTOM PLUGIN: แสดง %diff บนจุด และกันชนกันตามเดือน =================
const diffLabelPlugin = {
    id: "diffLabelPlugin",
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        const datasets = data.datasets || [];
        if (!datasets.length) return;

        // 1) รวมทุกจุดตาม index เดือน (dataIndex)
        const perIndex = {}; // key = dataIndex, value = [{ point, diff, datasetIndex }]

        datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta || meta.hidden) return;

            const points = meta.data || [];
            const diffArr = dataset._diffPct; // array ที่เราคำนวณไว้ตอนสร้าง datasets
            if (!diffArr || !Array.isArray(diffArr)) return;

            points.forEach((point, i) => {
                const diff = diffArr[i];
                if (diff == null || !point) return;

                if (!perIndex[i]) perIndex[i] = [];
                perIndex[i].push({ point, diff, datasetIndex });
            });
        });

        ctx.save();

        // 2) วาดตามแต่ละเดือน (แต่ละ index)
        Object.keys(perIndex).forEach((key) => {
            const items = perIndex[key];

            // sort ตาม datasetIndex ให้ตำแหน่งเดิม ๆ เสมอ
            items.sort((a, b) => a.datasetIndex - b.datasetIndex);

            items.forEach((item, idxInColumn) => {
                const { point, diff } = item;
                const x = point.x;
                const y = point.y;

                const label = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;

                // สลับบน/ล่าง + ไล่ระดับ: 0 = บน, 1 = ล่าง, 2 = บนสูงขึ้น, 3 = ล่างต่ำลง ...
                const baseOffset = 14;      // ระยะเริ่มต้นจากจุด
                const stepOffset = 10;      // ระยะเพิ่มต่อระดับ
                const direction = idxInColumn % 2 === 0 ? -1 : 1; // คู่ = บน, คี่ = ล่าง
                const level = Math.floor(idxInColumn / 2);        // ระดับที่เท่าไหร่
                const totalOffset = baseOffset + level * stepOffset;

                const yPos = y + direction * totalOffset;

                const textColor =
                    diff > 0
                        ? "#16a34a" // เขียว
                        : diff < 0
                            ? "#dc2626" // แดง
                            : "#6b7280"; // เทา

                ctx.font = "10px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const paddingX = 3;
                const paddingY = 2;
                const textWidth = ctx.measureText(label).width;
                const boxWidth = textWidth + paddingX * 2;
                const boxHeight = 10 + paddingY * 2;

                const boxX = x - boxWidth / 2;
                const boxY = yPos - boxHeight / 2;

                // กล่องพื้นหลัง
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

                // เส้นขอบ
                ctx.strokeStyle = "rgba(148,163,184,0.7)";
                ctx.lineWidth = 0.5;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                // ตัวเลข
                ctx.fillStyle = textColor;
                ctx.fillText(label, x, yPos);
            });
        });

        ctx.restore();
    },
};



// ลงทะเบียน plugin
ChartJS.register(diffLabelPlugin);

const BranchMonthlySalesChart = ({ rows }) => {
    if (!rows || rows.length === 0) {
        return (
            <p className="text-xs md:text-sm text-slate-500">
                ไม่มีข้อมูลยอดขายสาขาสำหรับช่วงวันที่นี้
            </p>
        );
    }

    // =========================
    // รวมยอดขายต่อสาขา + เตรียมสรุปรายปีทุกสาขา
    // =========================
    const { branchTotals, branchList, years, branchYearMap } = useMemo(() => {
        const totals = {};
        const branches = new Set();
        const yearsSet = new Set();
        const byBranchYear = {};

        rows.forEach((r) => {
            const branchKey = `${r.branch_code} : ${r.branch_name}`;
            const val = Number(r.total_payment || 0);
            branches.add(branchKey);
            totals[branchKey] = (totals[branchKey] || 0) + val;

            const d = new Date(r.bill_date);
            if (Number.isNaN(d.getTime())) return;
            const year = d.getFullYear();
            yearsSet.add(year);

            if (!byBranchYear[branchKey]) byBranchYear[branchKey] = {};
            byBranchYear[branchKey][year] =
                (byBranchYear[branchKey][year] || 0) + val;
        });

        const branchListSorted = Array.from(branches).sort(
            (a, b) => (totals[b] || 0) - (totals[a] || 0)
        );
        const yearsSorted = Array.from(yearsSet).sort((a, b) => a - b);

        return {
            branchTotals: totals,
            branchList: branchListSorted,
            years: yearsSorted,
            branchYearMap: byBranchYear,
        };
    }, [rows]);

    // สาขาเริ่มต้น = ยอดรวมสูงสุด
    const [selectedBranch, setSelectedBranch] = useState(branchList[0] || "");
    const [showTable, setShowTable] = useState(false);

    // ถ้า rows เปลี่ยน (ช่วงวันที่เปลี่ยน) แล้ว branch เดิมหายไป → reset เป็นสาขา top ใหม่
    useEffect(() => {
        if (!selectedBranch || !branchTotals[selectedBranch]) {
            setSelectedBranch(branchList[0] || "");
        }
    }, [branchList, branchTotals, selectedBranch]);

    // รวมยอดราย "เดือน-ปี" ตามสาขาที่เลือก (ใช้ทำกราฟด้านบน)
    const { labels, datasets } = useMemo(() => {
        if (!selectedBranch) {
            return { labels: [], datasets: [] };
        }

        // map: year -> { month(1-12) -> sum }
        const byYearMonth = {};

        rows.forEach((r) => {
            const branchKey = `${r.branch_code} : ${r.branch_name}`;
            if (branchKey !== selectedBranch) return;

            const d = new Date(r.bill_date);
            if (Number.isNaN(d.getTime())) return;

            const year = d.getFullYear();
            const month = d.getMonth() + 1; // 1-12
            if (!byYearMonth[year]) byYearMonth[year] = {};
            byYearMonth[year][month] =
                (byYearMonth[year][month] || 0) + Number(r.total_payment || 0);
        });

        const yearsForSelected = Object.keys(byYearMonth)
            .map((y) => parseInt(y, 10))
            .sort((a, b) => a - b);

        // จำกัดแกน X เป็น 12 เดือน Jan–Dec (index 1–12)
        const labels = THAI_MONTHS.slice(1); // ["Jan", ..., "Dec"]

        const datasets = yearsForSelected.map((year, idx) => {
            const valByMonth = byYearMonth[year] || {};
            const data = Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return valByMonth[month] ?? null;
            });

            // คำนวณ %diff ต่อเดือน (เทียบเดือนก่อนหน้าในปีเดียวกัน)
            const diffPctArr = data.map((val, i) => {
                if (i === 0) return null; // เดือนแรกไม่มีเดือนก่อนหน้า
                const prev = data[i - 1];
                if (prev == null || prev === 0 || val == null) return null;
                return ((val - prev) / prev) * 100;
            });

            return {
                label: ` - ${year}`,
                data,
                borderColor: COLORS[idx % COLORS.length],
                pointRadius: 3,
                borderWidth: 1.8,
                tension: 0.25,
                spanGaps: true,
                _diffPct: diffPctArr, // แนบค่า diff ไว้ให้ plugin ใช้
            };
        });

        return { labels, datasets };
    }, [rows, selectedBranch]);

    const chartData = { labels, datasets };

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 10,
                    usePointStyle: true,
                },
            },
            tooltip: {
                callbacks: {
                    title: (items) => {
                        const item = items?.[0];
                        if (!item) return "";
                        const label = item.label || "";
                        const dsLabel = item.dataset?.label || "";
                        return `${label}${dsLabel}`;
                    },
                    label: (ctx) => {
                        const valueNum = Number(ctx.raw ?? 0);
                        const value = valueNum.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });

                        const lines = [`sales : ${value}`];

                        // ====== เพิ่มบรรทัด diff vs prev month ======
                        const dataset = ctx.dataset;
                        const idx = ctx.dataIndex;
                        const diffPctArr = dataset._diffPct;

                        if (diffPctArr && Array.isArray(diffPctArr)) {
                            const pct = diffPctArr[idx];
                            if (pct != null) {
                                const currentVal =
                                    typeof valueNum === "number" ? valueNum : null;
                                const prevVal =
                                    idx > 0 && dataset.data
                                        ? dataset.data[idx - 1]
                                        : null;

                                let diffVal = null;
                                if (
                                    currentVal != null &&
                                    prevVal != null &&
                                    !Number.isNaN(prevVal)
                                ) {
                                    diffVal = currentVal - Number(prevVal);
                                }

                                const pctText = `${pct > 0 ? "+" : ""}${pct.toFixed(
                                    1
                                )}%`;

                                let diffText = pctText;
                                if (diffVal != null) {
                                    diffText += ` (${diffVal > 0 ? "+" : ""
                                        }${diffVal.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })})`;
                                }

                                lines.push(`diff : ${diffText}`);
                            }
                        }

                        return lines;
                    },
                },
            },
            // ใช้ plugin diffLabelPlugin ตามเดิม
            diffLabelPlugin: {},
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 0,
                    minRotation: 0,
                    font: { size: 10 },
                },
            },
            y: {
                ticks: {
                    callback: (val) =>
                        Number(val).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                        }),
                },
            },
        },
    };


    return (
        <div className="space-y-3">
            {/* ตัวเลือกสาขา */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="text-xs md:text-sm text-slate-700">
                    Current Branch :{" "}
                </div>
                <select
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs md:text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                >
                    {branchList.map((b) => (
                        <option key={b} value={b}>
                            {b}
                        </option>
                    ))}
                </select>
            </div>

            {/* กราฟ */}
            <div className="w-full overflow-x-auto pb-1">
                <div className="min-w-[320px] h-[260px] md:h-[300px]">
                    <Line data={chartData} options={options} />
                </div>
            </div>

            {/* ปุ่มเปิด/ปิด ตารางสรุปยอดขายทุกสาขา */}
            {years.length > 0 && (
                <div className="mt-2">
                    <button
                        type="button"
                        onClick={() => setShowTable((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] md:text-xs text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                        <span>
                            {showTable ? "Hide" : "Show"} Annual Total Sales
                            Summary (All Branches)
                        </span>
                        <span className="text-slate-400">
                            {showTable ? "▲" : "▼"}
                        </span>
                    </button>

                    {showTable && (
                        <div className="mt-2 border-2 border-slate-300 rounded-xl bg-white/90">
                            {/* เลื่อนแนวนอน + จำกัดความสูงให้เลื่อนแนวตั้ง (ประมาณ 25 แถว) */}
                            <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 text-center border-b border-slate-300">
                                            <th className="px-2 py-1 text-left font-semibold">
                                                Branch
                                            </th>
                                            {years.map((y) => (
                                                <th
                                                    key={y}
                                                    className="px-1.5 py-1 text-right font-semibold"
                                                >
                                                    {y}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branchList.map((branch) => {
                                            const isActive =
                                                branch === selectedBranch;

                                            return (
                                                <tr
                                                    key={branch}
                                                    onClick={() =>
                                                        setSelectedBranch(
                                                            branch
                                                        )
                                                    }
                                                    className={`border-t border-slate-200 cursor-pointer transition-colors ${isActive
                                                        ? "bg-blue-50"
                                                        : "odd:bg-white even:bg-slate-50/60 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    <td className="px-2 py-1 text-left truncate ">
                                                        {branch}
                                                    </td>

                                                    {years.map(
                                                        (year, idx) => {
                                                            const total =
                                                                branchYearMap[
                                                                branch
                                                                ]?.[year] || 0;

                                                            let diffAmount =
                                                                null;
                                                            let diffPct = null;
                                                            let prevYear =
                                                                null;
                                                            let prevTotal =
                                                                null;

                                                            if (idx > 0) {
                                                                prevYear =
                                                                    years[
                                                                    idx - 1
                                                                    ];
                                                                prevTotal =
                                                                    branchYearMap[
                                                                    branch
                                                                    ]?.[
                                                                    prevYear
                                                                    ] || 0;

                                                                if (
                                                                    prevTotal >
                                                                    0
                                                                ) {
                                                                    diffAmount =
                                                                        total -
                                                                        prevTotal;
                                                                    diffPct =
                                                                        ((total -
                                                                            prevTotal) /
                                                                            prevTotal) *
                                                                        100;
                                                                }
                                                            }

                                                            const diffColor =
                                                                diffAmount ==
                                                                    null
                                                                    ? "text-slate-400"
                                                                    : diffAmount >
                                                                        0
                                                                        ? "text-emerald-600"
                                                                        : diffAmount <
                                                                            0
                                                                            ? "text-red-500"
                                                                            : "text-slate-500";

                                                            const titleText =
                                                                diffAmount !=
                                                                    null &&
                                                                    prevYear != null
                                                                    ? `เทียบปี ${prevYear}\nเปลี่ยนแปลง: ${diffAmount >
                                                                        0
                                                                        ? "+"
                                                                        : ""
                                                                    }${diffAmount.toLocaleString(
                                                                        undefined,
                                                                        {
                                                                            maximumFractionDigits: 0,
                                                                        }
                                                                    )}\nคิดเป็น: ${diffPct >
                                                                        0
                                                                        ? "+"
                                                                        : ""
                                                                    }${diffPct.toFixed(
                                                                        1
                                                                    )}%`
                                                                    : idx === 0
                                                                        ? "ปีแรกสุด (ไม่มีปีให้เทียบ)"
                                                                        : "ไม่มีข้อมูลเพียงพอให้เทียบ";

                                                            return (
                                                                <td
                                                                    key={`${branch}-${year}`}
                                                                    className="px-1.5 py-1 text-right align-top"
                                                                    title={
                                                                        titleText
                                                                    }
                                                                >
                                                                    <div className="leading-tight">
                                                                        <div className="text-xs md:text-sm font-semibold">
                                                                            {total
                                                                                ? total.toLocaleString(
                                                                                    undefined,
                                                                                    {
                                                                                        maximumFractionDigits: 0,
                                                                                    }
                                                                                )
                                                                                : "-"}
                                                                        </div>
                                                                        {idx >
                                                                            0 && (
                                                                                <div
                                                                                    className={`mt-0.5 text-[11px] md:text-xs font-semibold ${diffColor}`}
                                                                                >
                                                                                    {diffAmount !=
                                                                                        null ? (
                                                                                        <>
                                                                                            {diffPct >
                                                                                                0
                                                                                                ? "+"
                                                                                                : ""}
                                                                                            {diffPct.toFixed(
                                                                                                1
                                                                                            )}
                                                                                            %{" ("}
                                                                                            {diffAmount >
                                                                                                0
                                                                                                ? "+"
                                                                                                : ""}
                                                                                            {diffAmount.toLocaleString(
                                                                                                undefined,
                                                                                                {
                                                                                                    maximumFractionDigits: 0,
                                                                                                }
                                                                                            )}
                                                                                            {")"}
                                                                                        </>
                                                                                    ) : (
                                                                                        "-"
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BranchMonthlySalesChart;

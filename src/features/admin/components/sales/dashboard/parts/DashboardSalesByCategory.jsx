// src/components/admin/dashboard/parts/DashboardSalesByCategory.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDashboardProductList } from "../../../../../../api/admin/dashboard";

/* ============== Helpers ============== */
const fmtMoney = (v) =>
    Number(v || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const fmtPct = (ratio) => `${(Number(ratio || 0) * 100).toFixed(2)}%`;

const safeDiv = (a, b) => {
    const x = Number(a || 0);
    const y = Number(b || 0);
    return y ? x / y : 0;
};

const Spinner = ({ className = "" }) => (
    <span
        className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
    />
);

/* ============== Color Helpers ============== */
const BRAND_COLORS = [
    "bg-blue-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-violet-400",
    "bg-cyan-400",
    "bg-lime-400",
    "bg-rose-400",
    "bg-indigo-400",
];


const GROUP_COLORS = [
    "bg-blue-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-violet-400",
    "bg-cyan-400",
    "bg-lime-400",
    "bg-rose-400",
    "bg-indigo-400",
];



/* ============== Mini Bar Chart ============== */
const MiniBarChart = ({ items, colorSet = "brand" }) => {
    const colors = colorSet === "brand" ? BRAND_COLORS : GROUP_COLORS;
    const total = items.reduce((sum, i) => sum + i.value, 0);
    if (total === 0) return null;

    return (
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
            {items.map((item, idx) => {
                const pct = safeDiv(item.value, total) * 100;
                if (pct < 0.5) return null;
                return (
                    <div
                        key={item.name}
                        className={`${colors[idx % colors.length]} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                        title={`${item.name}: ${fmtMoney(item.value)} (${fmtPct(pct / 100)})`}
                    />
                );
            })}
        </div>
    );
};

/* ============== Brand Card with Products ============== */
const BrandCard = ({ title, items, colorSet, totalSales, productsByBrand }) => {
    const colors = colorSet === "brand" ? BRAND_COLORS : GROUP_COLORS;
    const [expandedBrand, setExpandedBrand] = useState(null);

    const toggleBrand = (brandName) => {
        setExpandedBrand(expandedBrand === brandName ? null : brandName);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                <span className="text-xs text-slate-500">{items.length} รายการ</span>
            </div>

            <MiniBarChart items={items} colorSet={colorSet} />

            <div className="mt-3 max-h-[400px] overflow-y-auto pr-1 space-y-1">
                {items.map((item, idx) => {
                    const pct = safeDiv(item.value, totalSales);
                    const isExpanded = expandedBrand === item.name;
                    const products = productsByBrand.get(item.name) || [];

                    return (
                        <div key={item.name}>
                            <div
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                                onClick={() => toggleBrand(item.name)}
                            >
                                <div
                                    className={`w-3 h-3 rounded-sm flex-shrink-0 ${colors[idx % colors.length]}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
                                            <span className="text-sm text-slate-700 truncate max-w-[200px] sm:max-w-[400px]" title={item.name}>
                                                {item.name || "(ไม่ระบุ)"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                ({products.length})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm font-semibold text-slate-800 tabular-nums">
                                                {fmtMoney(item.value)}
                                            </span>
                                            <span className="text-xs text-slate-500 tabular-nums w-16 text-right">
                                                {fmtPct(pct)}
                                            </span>
                                            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className={`h-full ${colors[idx % colors.length]} transition-all duration-300`}
                                            style={{ width: `${Math.min(pct * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Products */}
                            {isExpanded && products.length > 0 && (
                                <div className="ml-5 mt-1 mb-2 pl-3 border-l-2 border-slate-200 space-y-1 max-h-[200px] overflow-y-auto">
                                    {products.map((p, pIdx) => (
                                        <div key={p.product_code} className="flex items-center justify-between py-1 text-xs">
                                            <span className="text-slate-600 truncate flex-1" title={p.product_name}>
                                                {p.product_code}: {p.product_name || "-"}
                                            </span>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                <span className="font-medium text-slate-700 tabular-nums">
                                                    {fmtMoney(p.sales)}
                                                </span>
                                                <span className="text-slate-400 tabular-nums w-14 text-right">
                                                    {fmtPct(safeDiv(p.sales, totalSales))}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ============== Group Card with Brands ============== */
const GroupCard = ({ title, items, colorSet, totalSales, brandsByGroup }) => {
    const colors = colorSet === "group" ? GROUP_COLORS : BRAND_COLORS;
    const [expandedGroup, setExpandedGroup] = useState(null);

    const toggleGroup = (groupName) => {
        setExpandedGroup(expandedGroup === groupName ? null : groupName);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                <span className="text-xs text-slate-500">{items.length} รายการ</span>
            </div>

            <MiniBarChart items={items} colorSet={colorSet} />

            <div className="mt-3 max-h-[400px] overflow-y-auto pr-1 space-y-1">
                {items.map((item, idx) => {
                    const pct = safeDiv(item.value, totalSales);
                    const isExpanded = expandedGroup === item.name;
                    const brands = brandsByGroup.get(item.name) || [];

                    return (
                        <div key={item.name}>
                            <div
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                                onClick={() => toggleGroup(item.name)}
                            >
                                <div
                                    className={`w-3 h-3 rounded-sm flex-shrink-0 ${colors[idx % colors.length]}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
                                            <span className="text-xs text-slate-700 truncate max-w-[200px] sm:max-w-[400px]" title={item.name}>
                                                {item.name || "(ไม่ระบุ)"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                ({brands.length})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm font-semibold text-slate-800 tabular-nums">
                                                {fmtMoney(item.value)}
                                            </span>
                                            <span className="text-xs text-slate-500 tabular-nums w-16 text-right">
                                                {fmtPct(pct)}
                                            </span>
                                            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className={`h-full ${colors[idx % colors.length]} transition-all duration-300`}
                                            style={{ width: `${Math.min(pct * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Brands */}
                            {isExpanded && brands.length > 0 && (
                                <div className="ml-5 mt-1 mb-2 pl-3 border-l-2 border-slate-200 space-y-1 max-h-[200px] overflow-y-auto">
                                    {brands.map((b, bIdx) => (
                                        <div key={b.name} className="flex items-center justify-between py-1 text-xs">
                                            <span className="text-slate-600 truncate flex-1" title={b.name}>
                                                {b.name || "(ไม่ระบุแบรนด์)"}
                                            </span>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                <span className="font-medium text-slate-700 tabular-nums">
                                                    {fmtMoney(b.value)}
                                                </span>
                                                <span className="text-slate-400 tabular-nums w-14 text-right">
                                                    {fmtPct(safeDiv(b.value, totalSales))}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ============== Main Component ============== */
export default function DashboardSalesByCategory({
    mode,
    primaryStart,
    primaryEnd,
    compareStart,
    compareEnd,
    disabled,
}) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [primaryPayload, setPrimaryPayload] = useState(null);

    const reqIdRef = useRef(0);

    useEffect(() => {
        if (!primaryStart || !primaryEnd) return;

        const myId = ++reqIdRef.current;
        let alive = true;

        const run = async () => {
            setErr("");
            setLoading(true);

            try {
                const p = await getDashboardProductList(primaryStart, primaryEnd);
                if (!alive || reqIdRef.current !== myId) return;
                setPrimaryPayload(p || null);
            } catch (e) {
                if (!alive || reqIdRef.current !== myId) return;
                setPrimaryPayload(null);
                setErr("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
            } finally {
                if (alive && reqIdRef.current === myId) setLoading(false);
            }
        };

        run();
        return () => {
            alive = false;
        };
    }, [primaryStart, primaryEnd]);

    const primaryRows = primaryPayload?.rows || [];
    const totalSales = Number(primaryPayload?.summary?.totalSales || 0);

    // Aggregate by Brand
    const brandSales = useMemo(() => {
        const map = new Map();
        for (const r of primaryRows) {
            const brand = r.product_brand && r.product_brand.toLowerCase() !== "unknown"
                ? r.product_brand
                : "(ไม่ระบุแบรนด์)";
            const sales = Number(r.sales || 0);
            map.set(brand, (map.get(brand) || 0) + sales);
        }
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [primaryRows]);

    // Aggregate by Group
    const groupSales = useMemo(() => {
        const map = new Map();
        for (const r of primaryRows) {
            const group = r.groupName && r.groupName.toLowerCase() !== "unknown"
                ? r.groupName
                : "(ไม่ระบุกลุ่ม)";
            const sales = Number(r.sales || 0);
            map.set(group, (map.get(group) || 0) + sales);
        }
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [primaryRows]);

    // Products by Brand (for drilling down)
    const productsByBrand = useMemo(() => {
        const map = new Map();
        for (const r of primaryRows) {
            const brand = r.product_brand && r.product_brand.toLowerCase() !== "unknown"
                ? r.product_brand
                : "(ไม่ระบุแบรนด์)";
            if (!map.has(brand)) map.set(brand, []);
            map.get(brand).push({
                product_code: r.product_code,
                product_name: r.product_name,
                sales: Number(r.sales || 0),
            });
        }
        // Sort products by sales descending
        for (const [, products] of map) {
            products.sort((a, b) => b.sales - a.sales);
        }
        return map;
    }, [primaryRows]);

    // Brands by Group (for drilling down)
    const brandsByGroup = useMemo(() => {
        const map = new Map();
        for (const r of primaryRows) {
            const group = r.groupName && r.groupName.toLowerCase() !== "unknown"
                ? r.groupName
                : "(ไม่ระบุกลุ่ม)";
            const brand = r.product_brand && r.product_brand.toLowerCase() !== "unknown"
                ? r.product_brand
                : "(ไม่ระบุแบรนด์)";
            const sales = Number(r.sales || 0);

            if (!map.has(group)) map.set(group, new Map());
            const brandMap = map.get(group);
            brandMap.set(brand, (brandMap.get(brand) || 0) + sales);
        }

        // Convert to array format and sort
        const result = new Map();
        for (const [group, brandMap] of map) {
            const brands = Array.from(brandMap.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            result.set(group, brands);
        }
        return result;
    }, [primaryRows]);

    if (loading) {
        return (
            <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                <div className="flex items-center gap-2 text-slate-600">
                    <Spinner />
                    <span className="text-sm">กำลังโหลดข้อมูลยอดขายตามหมวดหมู่...</span>
                </div>
            </section>
        );
    }

    if (err) {
        return (
            <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-rose-200 p-4 md:p-6">
                <div className="text-rose-700 text-sm">{err}</div>
            </section>
        );
    }

    if (!primaryPayload || primaryRows.length === 0) {
        return null;
    }

    return (
        <section className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <div className="mb-4">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">
                    ยอดขายตามหมวดหมู่
                </h2>
                <p className="mt-1 text-xs md:text-sm text-slate-500">
                    ช่วงวันที่:{" "}
                    <span className="font-medium text-slate-700">
                        {primaryStart} → {primaryEnd}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    ยอดขายรวม:{" "}
                    <span className="font-semibold text-slate-800">{fmtMoney(totalSales)}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">คลิกเพื่อดูรายละเอียด</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BrandCard
                    title="🏷️ ยอดขายตามแบรนด์"
                    items={brandSales}
                    colorSet="brand"
                    totalSales={totalSales}
                    productsByBrand={productsByBrand}
                />
                <GroupCard
                    title="📦 ยอดขายตามกลุ่มสินค้า"
                    items={groupSales}
                    colorSet="group"
                    totalSales={totalSales}
                    brandsByGroup={brandsByGroup}
                />
            </div>
        </section>
    );
}

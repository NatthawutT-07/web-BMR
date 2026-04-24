import { useState, useMemo } from "react";

export const useAnalysisFilters = (rows, mode, summaryMonths) => {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("product_code");
    const [sortDir, setSortDir] = useState("asc");

    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("asc"); }
    };

    const displayRows = useMemo(() => {
        let list = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    r.product_code?.toLowerCase().includes(q) ||
                    r.product_name?.toLowerCase().includes(q) ||
                    r.product_brand?.toLowerCase().includes(q) ||
                    r.brand?.toLowerCase().includes(q) ||
                    r.branch_code?.toLowerCase().includes(q) ||
                    r.branch_name?.toLowerCase().includes(q)
            );
        }
        list = [...list].sort((a, b) => {
            if (mode === "brand") {
                const cA = String(a.consing_item || "");
                const cB = String(b.consing_item || "");
                if (cA !== cB) return cB.localeCompare(cA, "th");

                let sA = 0, sB = 0;
                if (summaryMonths && summaryMonths.length > 0) {
                    const sortedMonths = [...summaryMonths].sort();
                    const latestMonth = sortedMonths[sortedMonths.length - 1];
                    sA = a.months?.[latestMonth]?.sales || 0;
                    sB = b.months?.[latestMonth]?.sales || 0;
                }
                return sB - sA;
            }

            const va = a[sortKey] ?? "";
            const vb = b[sortKey] ?? "";
            if (typeof va === "number" && typeof vb === "number")
                return sortDir === "asc" ? va - vb : vb - va;
            return sortDir === "asc"
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
        return list;
    }, [rows, search, sortKey, sortDir, mode, summaryMonths]);

    const totals = useMemo(() => {
        if (mode === "brand" || mode === "storeSummary" || mode === "store" || mode === "sku") {
            const monthTotals = {};
            for (const m of summaryMonths) {
                monthTotals[m] = { sales: 0, withdraw: 0, sale_quantity: 0, net_sales: 0, withdraw_quantity: 0, withdraw_value: 0, si_quantity: 0, sia_quantity: 0 };
            }
            for (const r of displayRows) {
                for (const m of summaryMonths) {
                    if (r.months?.[m]) {
                        monthTotals[m].sales += r.months[m].sales || 0;
                        monthTotals[m].withdraw += r.months[m].withdraw || 0;
                        monthTotals[m].sale_quantity += r.months[m].sale_quantity || 0;
                        monthTotals[m].net_sales += r.months[m].net_sales || 0;
                        monthTotals[m].withdraw_quantity += r.months[m].withdraw_quantity || 0;
                        monthTotals[m].withdraw_value += r.months[m].withdraw_value || 0;
                        monthTotals[m].si_quantity += r.months[m].si_quantity || 0;
                        monthTotals[m].sia_quantity += r.months[m].sia_quantity || 0;
                    }
                }
            }
            if (mode === "brand" || mode === "storeSummary") return { months: monthTotals };

            const storeTotals = displayRows.reduce(
                (acc, r) => {
                    acc.sale_quantity += r.sale_quantity || 0;
                    acc.net_sales += r.net_sales || 0;
                    acc.withdraw_quantity += r.withdraw_quantity || 0;
                    acc.withdraw_value += r.withdraw_value || 0;
                    acc.si_quantity += r.si_quantity || 0;
                    acc.sia_quantity += r.sia_quantity || 0;
                    acc.stock_quantity += r.stock_quantity || 0;
                    return acc;
                },
                { sale_quantity: 0, net_sales: 0, withdraw_quantity: 0, withdraw_value: 0, si_quantity: 0, sia_quantity: 0, stock_quantity: 0, months: monthTotals }
            );
            return storeTotals;
        }
        return displayRows.reduce(
            (acc, r) => {
                acc.sale_quantity += r.sale_quantity || 0;
                acc.net_sales += r.net_sales || 0;
                acc.withdraw_quantity += r.withdraw_quantity || 0;
                acc.withdraw_value += r.withdraw_value || 0;
                acc.si_quantity += r.si_quantity || 0;
                acc.sia_quantity += r.sia_quantity || 0;
                acc.stock_quantity += r.stock_quantity || 0;
                return acc;
            },
            { sale_quantity: 0, net_sales: 0, withdraw_quantity: 0, withdraw_value: 0, si_quantity: 0, sia_quantity: 0, stock_quantity: 0 }
        );
    }, [displayRows, mode, summaryMonths]);

    return {
        search,
        setSearch,
        sortKey,
        sortDir,
        handleSort,
        displayRows,
        totals,
    };
};

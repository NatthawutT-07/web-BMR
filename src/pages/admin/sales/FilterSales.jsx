import React, { useState } from "react";
import MainFilterSales from "../../../components/admin/sales/sales-branch/MainFilterSales";
import DashboardSales from "../../../components/admin/sales/dashboard/DashboardSales";
import MainSalesProduct from "../../../components/admin/sales/product/MainSalesProduct";
import CalculatorSales from "../../../components/admin/sales/calculator/CalculatorSales";

const FilterSales = () => {
    const [activePage, setActivePage] = useState("sales");

    const tabs = [
        { id: "dashboard-sales", label: "Dashboard" },
        { id: "sales", label: "Sales by branch" },
        { id: "product-sales", label: "Product sales" },
        { id: "calculator-sales", label: "Calculator" },
    ];

    return (
        <div className="min-h-screen bg-slate-50/80 flex flex-col !mt-0">
            
            {/* Top nav always stick top 0 with no gap */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="px-3 md:px-6 py-2 md:py-1.5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        
                        {/* Title */}
                        <h1 className="text-base md:text-lg font-semibold text-slate-800">
                            Sales tools
                        </h1>

                        {/* Tabs */}
                        <nav>
                            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar py-1">
                                {tabs.map((tab) => {
                                    const isActive = activePage === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActivePage(tab.id)}
                                            className={[
                                                "px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm whitespace-nowrap",
                                                "transition-all duration-150 border",
                                                isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",
                                            ].join(" ")}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-3 md:px-6 py-4 md:py-6">
                {activePage === "dashboard-sales" && <DashboardSales />}
                {activePage === "sales" && <MainFilterSales />}
                {activePage === "product-sales" && <MainSalesProduct />}
                {activePage === "calculator-sales" && <CalculatorSales />}
            </main>
        </div>
    );
};

export default FilterSales;

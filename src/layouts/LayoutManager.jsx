import React, { useState } from "react";
import useBmrStore from "../store/bmr_store";
import DashboardSales from "../components/admin/sales/dashboard/DashboardSales";
import MainFilterSales from "../components/admin/sales/sales-branch/MainFilterSales";
import MainSalesProduct from "../components/admin/sales/product/MainSalesProduct";
import CalculatorSales from "../components/admin/sales/calculator/CalculatorSales";

const LayoutManager = () => {
    const [activePage, setActivePage] = useState("sales");
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // ดึงข้อมูล user + logout จาก store
    const logout = useBmrStore((s) => s.logout);
    const user = useBmrStore((s) => s.user);

    const tabs = [
        { id: "dashboard-sales", label: "Dashboard" },
        { id: "sales", label: "Sales by branch" },
        { id: "product-sales", label: "Product Quantity" },
        { id: "calculator-sales", label: "Calculator" },
    ];

    const toggleUserMenu = () => {
        setUserMenuOpen((prev) => !prev);
    };

    const handleLogout = () => {
        setUserMenuOpen(false);
        logout();
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

    return (
        <div className="min-h-screen bg-slate-50/80 flex flex-col !mt-0">
            {/* Top nav */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="px-3 md:px-6 py-2 md:py-1.5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        {/* Title */}
                        <h1 className="text-base md:text-lg font-semibold text-slate-800">
                            Sales tools
                        </h1>

                        {/* Tabs + User menu */}
                        <div className="flex items-center justify-between md:justify-end gap-3">
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

                            {/* User menu (ชื่อมุมขวา → กดแล้วเห็น Logout) */}
                            {user && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={toggleUserMenu}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-xs md:text-sm text-slate-700 transition"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                            {userInitial}
                                        </div>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="font-medium max-w-[120px] md:max-w-[180px] truncate">
                                                {user.name}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wide text-slate-400">
                                                manager
                                            </span>
                                        </div>
                                        <span className="text-slate-400 text-xs md:text-sm">
                                            {userMenuOpen ? "▴" : "▾"}
                                        </span>
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-md py-1 text-xs md:text-sm z-40">
                                            <div className="px-3 py-2 border-b border-slate-100">
                                                <div className="text-[11px] text-slate-400">
                                                    Signed in as
                                                </div>
                                                <div className="text-[12px] font-medium text-slate-700 truncate">
                                                    {user.name}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-[12px]"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1">
                {activePage === "dashboard-sales" && <DashboardSales />}
                {activePage === "sales" && <MainFilterSales />}
                {activePage === "product-sales" && <MainSalesProduct />}
                {activePage === "calculator-sales" && <CalculatorSales />}
            </main>
        </div>
    );
};

export default LayoutManager;

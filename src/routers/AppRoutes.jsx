import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Pages & Layouts
import Home from "../pages/user/Home";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Dashboard from "../pages/admin/Dashboard";
import LayoutUser from "../layouts/LayoutUser";
import LoginPage from "../pages/auth/LoginPage";
import LayoutAudit from "../layouts/LayoutAudit";

// Protect
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectGuest from "./ProtectGuest";
import ProtectRouteManager from "./ProtectRouteManager";
import ProtectRouteAudit from "./ProtectRouteAudit";

// Admin Components
import Upload from "../pages/admin/Upload";
import Template from "../pages/admin/Template";
import FilterSales from "../pages/admin/sales/FilterSales";
import DashboardSales from "../components/admin/sales/dashboard/DashboardSales";
import MainSalesProduct from "../components/admin/sales/product/MainSalesProduct";
import { Calculator } from "lucide-react";
import LayoutManager from "../layouts/LayoutManager";
import Stock from "../pages/admin/Stock";

const router = createBrowserRouter([
    // หน้า Login
    {
        path: "/",
        children: [
            {
                index: true,
                element: <ProtectGuest element={<LoginPage />} />,
            },
        ],
    },

    // Manager → ดู dashboard admin อย่างเดียว (ตัวอย่างใช้ Dashboard)
    {
        path: "/manager",
        element: <ProtectRouteManager element={<LayoutManager />} />,
        // children: [
        // { index: true, element: <DashboardSales /> },
        // ถ้าต้องการให้ manager ดูแค่บางหน้าก็เพิ่ม route แยกเฉพาะที่นี่
        // เช่น { path: "dashboard-sales", element: <DashboardSales /> },
        // ],
    },

    // Admin เต็มสิทธิ์
    {
        path: "/admin",
        element: <ProtectRouteAdmin element={<LayoutAdmin />} />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: "shelf", element: <Template /> },
            { path: "upload", element: <Upload /> },
            { path: "sales", element: <FilterSales /> },
            { path: "dashboard-sales", element: <DashboardSales /> },
            { path: "product-sales", element: <MainSalesProduct /> },
            { path: "calculator-sales", element: <Calculator /> },
            { path: "stock", element: <Stock /> },
        ],
    },

    // Audit → จัดการ shelf ตาม LayoutAudit
    {
        path: "/audit",
        element: <ProtectRouteAudit element={<LayoutAudit />} />,
        children: [
            // ใส่หน้า child ของ audit ที่ต้องใช้เพิ่มได้
            // เช่น { index: true, element: <AuditShelf /> }
        ],
    },

    // User → store ตามสาขา
    {
        path: "/store/:storecode",
        element: <ProtectRouteUser element={<LayoutUser />} />,
        children: [{ index: true, element: <Home /> }],
    },
]);

const AppRoutes = () => {
    return <RouterProvider router={router} />;
};

export default AppRoutes;

import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Pages & Layouts
import Home from "../features/user/pages/Home";
import LayoutAdmin from "../features/admin/layouts/LayoutAdmin";
import Dashboard from "../features/admin/pages/Dashboard";
import LayoutUser from "../features/user/layouts/LayoutUser";
import LoginPage from "../features/auth/pages/LoginPage";

// Protect
import ProtectRouteAdmin from "../routes/ProtectRouteAdmin";
import ProtectRouteUser from "../routes/ProtectRouteUser";
import ProtectGuest from "../routes/ProtectGuest";

// Admin Components
import Upload from "../features/admin/pages/Upload";
import Template from "../features/admin/pages/Template";
import FilterSales from "../features/admin/pages/sales/FilterSales";
import Stock from "../features/admin/pages/Stock";
import ShelfDashboard from "../features/admin/pages/ShelfDashboard";

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

    // Admin เต็มสิทธิ์
    {
        path: "/admin",
        element: <ProtectRouteAdmin element={<LayoutAdmin />} />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: "shelf", element: <Template /> },
            { path: "dashboard-shelf", element: <ShelfDashboard /> },
            { path: "upload", element: <Upload /> },
            // { path: "sales", element: <FilterSales /> },
            // { path: "dashboard-sales", element: <DashboardSales /> },
            // { path: "product-sales", element: <MainSalesProduct /> },
            // { path: "calculator-sales", element: <Calculator /> },
            { path: "stock", element: <Stock /> },
            // { path: "member", element: <Member /> },
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

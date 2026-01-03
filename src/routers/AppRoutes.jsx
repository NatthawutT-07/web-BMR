import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Pages & Layouts
import Home from "../pages/user/Home";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Dashboard from "../pages/admin/Dashboard";
import LayoutUser from "../layouts/LayoutUser";
import LoginPage from "../pages/auth/LoginPage";

// Protect
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectGuest from "./ProtectGuest";

// Admin Components
import Upload from "../pages/admin/Upload";
import Template from "../pages/admin/Template";
import FilterSales from "../pages/admin/sales/FilterSales";
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

    // Admin เต็มสิทธิ์
    {
        path: "/admin",
        element: <ProtectRouteAdmin element={<LayoutAdmin />} />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: "shelf", element: <Template /> },
            { path: "upload", element: <Upload /> },
            { path: "sales", element: <FilterSales /> },
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

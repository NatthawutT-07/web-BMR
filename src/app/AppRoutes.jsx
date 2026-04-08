import React, { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Components
import LayoutAdmin from "../features/admin/layouts/LayoutAdmin";
import LayoutUser from "../features/user/layouts/LayoutUser";
import LoginPage from "../features/auth/pages/LoginPage";

// Protect
import ProtectRouteAdmin from "../routes/ProtectRouteAdmin";
import ProtectRouteUser from "../routes/ProtectRouteUser";
import ProtectGuest from "../routes/ProtectGuest";

// Lazy Loaded Pages
const Home = lazy(() => import("../features/user/pages/Home"));
const Dashboard = lazy(() => import("../features/admin/pages/Dashboard"));
const Upload = lazy(() => import("../features/admin/pages/Upload"));
const Template = lazy(() => import("../features/admin/pages/Template"));
const FilterSales = lazy(() => import("../features/admin/pages/sales/FilterSales"));
const Stock = lazy(() => import("../features/admin/pages/Stock"));
const ShelfDashboard = lazy(() => import("../features/admin/pages/ShelfDashboard"));
const DashboardSales = lazy(() => import("../features/admin/components/sales/dashboard/DashboardSales"));
const PogRequests = lazy(() => import("../features/admin/pages/PogRequests"));
const BranchAckStatus = lazy(() => import("../features/admin/pages/BranchAckStatus"));
const Analysis = lazy(() => import("../features/admin/pages/Analysis"));
const Management = lazy(() => import("../features/admin/pages/Management"));

// Loading Component
const PageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            <p className="mt-4 text-sm font-medium text-slate-500">กำลังโหลดข้อมูล...</p>
        </div>
    </div>
);

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
        path: "/sys-ahFvi1hmPw3iKCn",
        element: <ProtectRouteAdmin element={<LayoutAdmin />} />,
        children: [
            { index: true, element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
            { path: "qW3eR7tY2u", element: <Suspense fallback={<PageLoader />}><Template /></Suspense> },
            { path: "pA9sD4fG6h", element: <Suspense fallback={<PageLoader />}><ShelfDashboard /></Suspense> },
            { path: "zX5cV8bN1m", element: <Suspense fallback={<PageLoader />}><Upload /></Suspense> },
            { path: "lK2jH7gF3d", element: <Suspense fallback={<PageLoader />}><FilterSales /></Suspense> },
            { path: "oI9uY4tR6e", element: <Suspense fallback={<PageLoader />}><DashboardSales /></Suspense> },
            { path: "mN1bV8cX5z", element: <Suspense fallback={<PageLoader />}><Stock /></Suspense> },
            { path: "aS3dF7gH2j", element: <Suspense fallback={<PageLoader />}><PogRequests /></Suspense> },
            { path: "qA8zW2sX7e", element: <Suspense fallback={<PageLoader />}><BranchAckStatus /></Suspense> },
            { path: "pL5kO9iJ4u", element: <Suspense fallback={<PageLoader />}><Analysis /></Suspense> },
            { path: "vB6nM2vC8x", element: <Suspense fallback={<PageLoader />}><Management /></Suspense> },
        ],
    },

    // User → store ตามสาขา
    {
        path: "/store/:storecode",
        element: <ProtectRouteUser element={<LayoutUser />} />,
        children: [{ index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> }],
    },
]);

const AppRoutes = () => {
    return <RouterProvider router={router} />;
};

export default AppRoutes;

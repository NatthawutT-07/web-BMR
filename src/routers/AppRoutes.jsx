import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from '../pages/user/Home'
import LayoutAdmin from '../layouts/LayoutAdmin'
import Dashboard from '../pages/admin/Dashboard'
import LayoutUser from '../layouts/LayoutUser'
import LoginPage from '../pages/auth/LoginPage'
import ProtectRouteAdmin from './ProtectRouteAdmin'
import ProtectRouteUser from './ProtectRouteUser'
import Manage from '../pages/admin/Manage'
import Partner from '../pages/admin/Partner'
import Product from '../pages/admin/Product'
import ShowStation from '../components/admin/ShowStation'
import Upload from '../pages/admin/Upload'
import Tamplate from '../pages/admin/Tamplate'

const router = createBrowserRouter([
    {
        path: '/',
        children: [
            { index: true, element: <LoginPage /> },
        ],

    },
    {
        path: '/admin',
        element: <ProtectRouteAdmin element={<LayoutAdmin />} />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: "manage", element: <Manage /> },
            { path: "partner", element: <Partner /> },
            { path: "product", element: <Product /> },
            { path: "station", element: <ShowStation /> },
            { path: "edit-station", element: <Tamplate /> },
            // {path : "stock" , element : </>},
            { path: "upload", element: <Upload /> }

        ]
    },
    {
        path: '/user',
        element: <ProtectRouteUser element={<LayoutUser />} />,
        children: [
            { index: true, element: <Home /> }
        ]
    }
])

const AppRoutes = () => {
    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default AppRoutes

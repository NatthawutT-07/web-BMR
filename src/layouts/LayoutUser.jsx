import React from 'react'
import { Outlet } from 'react-router-dom'
import MainNav from '../components/user/MainNav'

const LayoutUser = () => {
    return (
        <div>
            <MainNav />

            <hr />
            <main>
                <Outlet />
            </main>
        </div>
    )
}

export default LayoutUser

import React from 'react'
import { Link } from 'react-router-dom'

function MainNav() {
    return (
        <nav className='bg-green-300'>
            <div  className='mx-auto px-5'>
                <div className='flex justify-between h-16'>
                    <div className='flex items-center gap-4'>
                        <Link to={'/'}> Home </Link>
                    </div>
                    <div className='flex items-center gap-4'>
                        <Link to={'/logout'}>logout</Link>
                    </div>
                </div>
            </div>
        </nav>

    )
}

export default MainNav

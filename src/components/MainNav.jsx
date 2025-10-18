import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useBmrStore from '../store/bmr_store';

function MainNav() {
    const navigate = useNavigate();

    
    const clearStorageAndLogout = () => {
        useBmrStore.persist.clearStorage(); //  localStorage
        useBmrStore.getState().logout();    //  store
        navigate('/');
    }

    return (
        <nav className='bg-green-200'>
            <div className='mx-auto px-5'>
                <div className='flex justify-between h-16'>
                    <div className='flex items-center gap-4'>
                        <Link to={'/user'}> Home </Link>
                    </div>
                    <div className='flex items-center gap-4'>
                        <button
                            type='button' onClick={clearStorageAndLogout}
                            className="w-full py-2 px-2  bg-red-000 text-white rounded-lg  hover:bg-red-500 transition duration-100"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

    )
}

export default MainNav

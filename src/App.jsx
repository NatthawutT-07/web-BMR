import React from 'react'
import AppRoutes from './routers/AppRoutes'
import './index.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';




const App = () => {
  return (

    <>
      <ToastContainer />
      <AppRoutes />
    </>
  )
}

export default App

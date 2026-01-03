import React from "react";
import { ToastContainer } from "react-toastify";
import AppRoutes from "./AppRoutes";
import "../index.css";
import "react-toastify/dist/ReactToastify.css";

const App = () => (
  <>
    <ToastContainer />
    <AppRoutes />
  </>
);

export default App;

import React from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectRouteAdmin = ({ element }) => {
  const { user, accessToken } = useBmrStore.getState();

  if (!accessToken || !user) return <Navigate to="/" replace />;

  // อนุญาตเฉพาะ admin
  if (user.role === "admin") {
    return element;
  }

  // role อื่นเด้งไปหน้าตัวเอง
  if (user.role === "manager") return <Navigate to="/manager" replace />;
  if (user.role === "audit") return <Navigate to="/audit" replace />;
  if (user.role === "user") return <Navigate to={`/store/${user.storecode}`} replace />;

  return <Navigate to="/" replace />;
};

export default ProtectRouteAdmin;

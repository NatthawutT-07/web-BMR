import React from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectRouteAdmin = ({ element }) => {
  const user = useBmrStore((state) => state.user);
  const accessToken = useBmrStore((state) => state.accessToken);

  if (!accessToken || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to={`/store/${user.storecode}`} replace />;
  }

  return element;
};

export default ProtectRouteAdmin;

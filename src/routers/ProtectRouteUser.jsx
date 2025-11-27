import React from "react";
import { Navigate, useParams } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectRouteUser = ({ element }) => {
  const user = useBmrStore((state) => state.user);
  const accessToken = useBmrStore((state) => state.accessToken);
  const { storecode } = useParams();

  if (!accessToken || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "user") {
    return <Navigate to="/admin" replace />;
  }

  if (user.storecode !== storecode) {
    return <Navigate to={`/store/${user.storecode}`} replace />;
  }

  return element;
};

export default ProtectRouteUser;

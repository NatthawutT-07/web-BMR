import React from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectRouteManager = ({ element }) => {
    const { user, accessToken } = useBmrStore.getState();

    if (!accessToken || !user) return <Navigate to="/" replace />;

    // อนุญาตเฉพาะ manager
    if (user.role === "manager") {
        return element;
    }

    if (user.role === "admin") {
        return element;
    }

    if (user.role === "audit") {
        return <Navigate to="/audit" replace />;
    }
    if (user.role === "user") {
        return <Navigate to={`/store/${user.storecode}`} replace />;
    }

    return <Navigate to="/" replace />;
};

export default ProtectRouteManager;

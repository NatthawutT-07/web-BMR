import React from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectRouteAudit = ({ element }) => {
    const { user, accessToken } = useBmrStore.getState();

    if (!accessToken || !user) return <Navigate to="/" replace />;

    // อนุญาตเฉพาะ audit (ถ้าอยากให้ admin เข้าได้ด้วย ค่อยเพิ่มเงื่อนไข)
    if (user.role === "audit") {
        return element;
    }

    if (user.role === "admin") {
        return element;
    }
    
    if (user.role === "manager") {
        return <Navigate to="/manager" replace />;
    }
    if (user.role === "user") {
        return <Navigate to={`/store/${user.storecode}`} replace />;
    }

    return <Navigate to="/" replace />;
};

export default ProtectRouteAudit;

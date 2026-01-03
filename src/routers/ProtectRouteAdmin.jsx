// C:\BMR\bmr_data\edit\web-BMR\src\routers\ProtectRouteAdmin.jsx
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteAdmin = ({ element }) => {
  const user = useBmrStore((s) => s.user);
  const accessToken = useBmrStore((s) => s.accessToken);

  const hasHydrated = useBmrStore((s) => s.hasHydrated);
  const authReady = useBmrStore((s) => s.authReady);
  const initAuth = useBmrStore((s) => s.initAuth);

  useEffect(() => {
    if (hasHydrated && !authReady) initAuth();
  }, [hasHydrated, authReady, initAuth]);

  if (!hasHydrated || !authReady) return <LoadingToRedirect />;

  if (!accessToken || !user) return <Navigate to="/" replace />;

  // อนุญาตเฉพาะ admin
  if (user.role === "admin") return element;

  if (user.role === "user") return <Navigate to={`/store/${user.storecode}`} replace />;

  return <Navigate to="/" replace />;
};

export default ProtectRouteAdmin;

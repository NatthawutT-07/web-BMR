// C:\BMR\bmr_data\edit\web-BMR\src\routers\ProtectRouteUser.jsx
import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import useBmrStore from "../store/bmr_store";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteUser = ({ element }) => {
  const user = useBmrStore((s) => s.user);
  const accessToken = useBmrStore((s) => s.accessToken);

  const hasHydrated = useBmrStore((s) => s.hasHydrated);
  const authReady = useBmrStore((s) => s.authReady);
  const initAuth = useBmrStore((s) => s.initAuth);

  const { storecode } = useParams();

  useEffect(() => {
    if (hasHydrated && !authReady) initAuth();
  }, [hasHydrated, authReady, initAuth]);

  if (!hasHydrated || !authReady) return <LoadingToRedirect />;

  if (!accessToken || !user) return <Navigate to="/" replace />;

  // 🟢 admin เข้าได้ทุก store page
  if (user.role === "admin") return element;

  // manager / audit → เด้งไปหน้าของตัวเอง
  if (user.role === "manager") return <Navigate to="/manager" replace />;
  if (user.role === "audit") return <Navigate to="/audit" replace />;

  // อนุญาตเฉพาะ user ปกติ
  if (user.role !== "user") return <Navigate to="/" replace />;

  // กันเคส user พิมพ์ /store/สาขาอื่นเอง
  if (user.storecode !== storecode) {
    return <Navigate to={`/store/${user.storecode}`} replace />;
  }

  return element;
};

export default ProtectRouteUser;

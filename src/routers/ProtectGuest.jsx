// C:\BMR\bmr_data\edit\web-BMR\src\routers\ProtectGuest.jsx
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectGuest = ({ element }) => {
  const token = useBmrStore((s) => s.accessToken);
  const user = useBmrStore((s) => s.user);

  const hasHydrated = useBmrStore((s) => s.hasHydrated);

  // ✅ รอ hydrate ให้เสร็จก่อน (กันกระพริบ)
  if (!hasHydrated) {
    return <LoadingToRedirect />;
  }

  // ถ้ามี token + user แล้ว → ส่งตาม role
  if (token && user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "manager") return <Navigate to="/manager" replace />;
    if (user.role === "audit") return <Navigate to="/audit" replace />;
    if (user.role === "user") return <Navigate to={`/store/${user.storecode}`} replace />;
    return <Navigate to="/" replace />;
  }

  // ยังไม่ล็อกอิน → ให้เข้า login ได้ปกติ
  return element;
};

export default ProtectGuest;

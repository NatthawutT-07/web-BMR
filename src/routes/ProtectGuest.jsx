import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectGuest = ({ element }) => {
  const token = useBmrStore((s) => s.accessToken);
  const user = useBmrStore((s) => s.user);

  const hasHydrated = useBmrStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return <LoadingToRedirect />;
  }

  if (token && user) {
    if (user.role === "admin") return <Navigate to="/sys-ahFvi1hmPw3iKCn" replace />;
    if (user.role === "user") return <Navigate to={`/xY7zA3bC9d/${user.storecode}`} replace />;
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectGuest;

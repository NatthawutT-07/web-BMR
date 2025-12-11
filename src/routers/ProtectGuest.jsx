import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectGuest = ({ element }) => {
    const token = useBmrStore((state) => state.accessToken);
    const user = useBmrStore((state) => state.user);

    // ถ้ามี token + user แล้ว → ส่งตาม role
    if (token && user) {
        // admin → หน้า admin dashboard
        if (user.role === "admin") {
            return <Navigate to="/admin" replace />;
        }

        // manager → หน้า manager dashboard
        if (user.role === "manager") {
            return <Navigate to="/manager" replace />;
        }

        // audit → หน้า audit
        if (user.role === "audit") {
            return <Navigate to="/audit" replace />;
        }

        // user → หน้า store ของตัวเอง
        if (user.role === "user") {
            return <Navigate to={`/store/${user.storecode}`} replace />;
        }

        // กัน role แปลก ๆ
        return <Navigate to="/" replace />;
    }

    // ยังไม่ล็อกอิน → ให้เข้า login ได้ปกติ
    return element;
};

export default ProtectGuest;

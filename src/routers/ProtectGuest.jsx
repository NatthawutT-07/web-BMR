import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectGuest = ({ element }) => {
    const token = useBmrStore((state) => state.accessToken);
    const user = useBmrStore((state) => state.user);

    if (token && user) {
        if (user.role === "admin") return <Navigate to="/admin" replace />;
        return <Navigate to={`/store/${user.storecode}`} replace />;
    }

    return element;
};


export default ProtectGuest;

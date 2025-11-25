import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const ProtectGuest = ({ element }) => {
    const token = useBmrStore((state) => state.token);
    const user = useBmrStore((state) => state.user);

    if (token && user) {
        const path = user.role === "admin" ? "/admin" : "/user";
        return <Navigate to={path} replace />;
    }

    return element;
};

export default ProtectGuest;




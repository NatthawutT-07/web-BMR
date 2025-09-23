import React, { useState, useEffect } from "react";
import useBmrStore from "../store/bmr_store";
import { currentUser } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteUser = ({ element }) => {
  const [ok, setOk] = useState(false);
  const user = useBmrStore((state) => state.user);
  const token = useBmrStore((state) => state.token);

  useEffect(() => {
    if (user && token) {
      currentUser(token)
        .then(() => setOk(true))
        .catch(() => setOk(false));
    }


  }, []);
  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRouteUser;

import React, { useState, useEffect } from "react";

import LoadingToRedirect from "./LoadingToRedirect";
import { currentAdmin } from "../api/auth";
import useBmrStore from "../store/bmr_store";

const ProtectRouteAdmin = ({ element }) => {
  const [ok, setOk] = useState(false);
  const user = useBmrStore((state) => state.user);
  const token = useBmrStore((state) => state.token);

  useEffect(() => {
    if (user && token) {
      currentAdmin(token)
        .then((res) => {
          setOk(true);
          return ok ? element : <LoadingToRedirect />;
        })
        .catch((err) => {
          setOk(false);
        });

    }
  }, []);

  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRouteAdmin;

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

// import React, { useState, useEffect } from "react";
// import useEconStore from "../store/ecom-store";
// import { currentAdmin } from "../api/auth";
// import LoadingToRedirect from "./LoadingToRedirect";

// const ProtectRouteAdmin = ({ element }) => {
//   const [ok, setOk] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const user = useEconStore((state) => state.user);
//   const token = useEconStore((state) => state.token);

//   useEffect(() => {
//     if (user && token) {
//       currentAdmin(token)
//         .then((res) => {
//         console.log("currentAdmin result:", res);
//         setOk(true);
//       })
//       .catch((err) => {
//         console.error("currentAdmin error:", err);
//         setOk(false);
//       })
//         .finally(() => {
//           setLoading(false);
//         });
//     } else {
//       setLoading(false);
//     }
//   }, [user, token]);

//   if (loading) return <LoadingToRedirect />;

//   return ok ? element : <LoadingToRedirect />;
// };

// export default ProtectRouteAdmin;

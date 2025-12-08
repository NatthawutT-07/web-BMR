import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const LoadingToRedirect = () => {
  const accessToken = useBmrStore((state) => state.accessToken);
  const logout = useBmrStore((state) => state.logout);

  const [count, setCount] = useState(5);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    // ไม่มี accessToken → เด้งไป login ทันที
    if (!accessToken) {
      setRedirect(true);
      return;
    }

    // ถ้าโดนใช้ในหน้า error หรือ token พัง → นับถอยหลัง
    const interval = setInterval(() => {
      setCount((c) => {
        if (c === 0) {
          logout();
          clearInterval(interval);
          setRedirect(true);
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken, logout]);

  // redirect ถ้าไม่มี token หรือ countdown จบ
  if (redirect) return <Navigate to="/" replace />;

  // ถ้าไม่มี token ไม่ต้องโชว์ UI
  if (!accessToken) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <p className="text-lg text-gray-700">
          Redirecting in <span className="font-semibold">{count}</span> seconds...
        </p>
      </div>
    </div>
  );
};

export default LoadingToRedirect;

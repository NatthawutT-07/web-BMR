import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const LoadingToRedirect = ({ to = "/", seconds = 0, forceRedirect = false }) => {
  const accessToken = useBmrStore((s) => s.accessToken);
  const authReady = useBmrStore((s) => s.authReady);
  const refreshing = useBmrStore((s) => s.refreshing);

  const [count, setCount] = useState(seconds);
  const [redirect, setRedirect] = useState(false);

  // ✅ ใช้เฉพาะกรณี “อยากให้มันนับถอยหลังแล้วเด้งจริง ๆ”
  useEffect(() => {
    if (!forceRedirect) return;
    setCount(seconds);

    if (seconds <= 0) {
      setRedirect(true);
      return;
    }

    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setRedirect(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [forceRedirect, seconds]);

  if (redirect) return <Navigate to={to} replace />;

  // ✅ หน้ารอเช็ค token (กันกระพริบไปหน้า login)
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg w-[92%] max-w-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          <p className="text-lg text-gray-700 font-medium">
            {/* กำลังตรวจสอบสิทธิ์... */}
          </p>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          {!authReady || refreshing ? (
            <span></span>
            // <span>กำลังเช็คโทเคน / รีเฟรชโทเคน</span>
          ) : accessToken ? (
            <span></span>
            // <span>พร้อมใช้งาน</span>
          ) : (
            <span></span>
            // <span>ไม่พบโทเคน (กำลังพาไปหน้าเข้าสู่ระบบ)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingToRedirect;

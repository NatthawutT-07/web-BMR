import React, { useState, useEffect } from "react"; 
import { Navigate } from "react-router-dom";
import useBmrStore from "../store/bmr_store";

const LoadingToRedirect = () => {
  const { token, logout } = useBmrStore(); // ดึง token และ logout จาก store
  const [count, setCount] = useState(9);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    // ถ้าไม่มี token ให้รีไดเรกไปหน้า login ทันที
    if (!token) {
      setRedirect(true);
      return;
    }

    const interval = setInterval(() => {
      setCount((currentCount) => {
        if (currentCount === 0) {
          // ล้าง store แบบ logout ก่อน redirect
          logout();
          clearInterval(interval);
          setRedirect(true);
        }
        return currentCount - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [token, logout]);

  // รีไดเรกถ้าไม่มี token หรือ countdown จบ
  if (redirect) {
    return <Navigate to={"/"} />;
  }

  // ถ้าไม่มี token ไม่ต้องโชว์ตัวเลข
  if (!token) {
    return null;
  }

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

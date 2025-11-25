import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBmrStore from "../../store/bmr_store";
import logger from "../../utils/logger";

function LoginPage() {
  const actionLogin = useBmrStore((state) => state.actionLogin);
  const token = useBmrStore((state) => state.token);
  const user = useBmrStore((state) => state.user);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", password: "" });
  const [errorMsg, setErrorMsg] = useState(""); // ✅ เก็บ error message

  // ถ้ามี token แล้ว ไม่ให้เข้าหน้า Login
  useEffect(() => {
    if (token && user) {
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "user") navigate("/user", { replace: true });
    }
    // console.log("MODE:", import.meta.env.MODE);

  }, [token, user, navigate]);

  const clearStorageAndLogout = () => {
    useBmrStore.persist.clearStorage();
    useBmrStore.getState().logout();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await actionLogin(form);
      const role = res.data.payload.role;
      roleRedirect(role);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Login failed";
      setErrorMsg(errMsg);
    }
  };

  const roleRedirect = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "user") navigate("/user");
  };

  return (
    <div className="login-container">
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative z-10 w-full max-w-md shadow-lg bg-white p-8 rounded-xl">
          <img src="/Bringmindlogo.png" alt="Logo" className="mx-auto h-60" />

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Email Input */}
              <input
                placeholder="User"
                onChange={handleChange}
                value={form.name}
                type="text"
                name="name"
                autoComplete="username"
                className="w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />

              {/* Password Input */}
              <input
                placeholder="Password"
                onChange={handleChange}
                value={form.password}
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />

              {/* ✅ แสดง error message ถ้ามี */}
              {errorMsg && (
                <p className="text-red-500 text-sm text-center">{errorMsg}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
              >
                Login
              </button>

              {/* ปุ่ม clear (optional) */}
              {/* <button
                type="button"
                onClick={clearStorageAndLogout}
                className="w-full py-3 mt-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
              >
                Clear
              </button> */}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

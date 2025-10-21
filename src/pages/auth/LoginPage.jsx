import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBmrStore from "../../store/bmr_store";

function LoginPage() {
  const actionLogin = useBmrStore((state) => state.actionLogin);
  const token = useBmrStore((state) => state.token);
  const user = useBmrStore((state) => state.user);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    password: "",
  });

  // login อยู่แล้ว ไม่ให้เข้าหน้า Login
  useEffect(() => {
    if (token && user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "user") {
        navigate("/user", { replace: true });
      }
    }
  }, [token, user, navigate]);

  const clearStorageAndLogout = () => {
    useBmrStore.persist.clearStorage(); // ลบ localStorage
    useBmrStore.getState().logout();    // ล้าง store
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // console.log("API URL:", import.meta.env.VITE_API_URL);

      const res = await actionLogin(form);
      const role = res.data.payload.role;
      roleRedirect(role);
    } catch (err) {
      const errMsg = err.response?.data?.msg;
      console.log(errMsg);
    }
  };

  const roleRedirect = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "user") {
      navigate("/user");
    }
  };


  return (
    <div className="login-container">
      <div
        className="min-h-screen relative flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      >
        <div className="absolute inset-0 bg-black opacity-40 z-0"></div>
        <div className="relative z-10 w-full max-w-md shadow-lg bg-white p-8 rounded-xl">
          <img
            src="/Bringmindlogo.png"
            alt="Logo"
            className="mx-auto h-60"
          />
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Email Input */}
              <div className="relative">
                <input
                  placeholder="Email"
                  onChange={handleChange}
                  value={form.username}  // ทำให้ input ควบคุมด้วย state
                  type="name"
                  name="name"  // ใช้ name ที่ตรงกับ key ใน state
                  className="w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  placeholder="Password"
                  onChange={handleChange}
                  value={form.password}  // ทำให้ input ควบคุมด้วย state
                  type="password"
                  name="password"  // ใช้ name ที่ตรงกับ key ใน state
                  className="w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
              >
                Login
              </button>

              {/* Additional Actions */}
              {/* <div className="flex justify-end mt-4">
                <a
                  href="/register"
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  Create an Account
                </a>
              </div> */}
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
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBmrStore from "../../store/bmr_store";

function LoginPage() {
  const actionLogin = useBmrStore((state) => state.actionLogin);
  const accessToken = useBmrStore((state) => state.accessToken);
  const user = useBmrStore((state) => state.user);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (accessToken && user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "user") {
        navigate(`/store/${user.storecode}`, { replace: true });
      }
    }
  }, [accessToken, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await actionLogin(form);
      const role = res.data.payload.role;

      if (role === "admin") navigate("/admin");
      else navigate(`/store/${form.name}`);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Login failed";
      setErrorMsg(errMsg);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md shadow-lg bg-white p-8 rounded-xl">
        <img src="/Bringmindlogo.png" alt="Logo" className="mx-auto h-60" />

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <input
              placeholder="Branch Code"
              onChange={handleChange}
              value={form.name}
              type="text"
              name="name"
              className="w-full px-4 py-3 border rounded-md bg-gray-50"
            />

            <input
              placeholder="Password"
              onChange={handleChange}
              value={form.password}
              type="password"
              name="password"
              className="w-full px-4 py-3 border rounded-md bg-gray-50"
            />

            {errorMsg && (
              <p className="text-red-500 text-sm text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

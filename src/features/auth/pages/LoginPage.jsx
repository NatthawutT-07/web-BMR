import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBmrStore from "../../../store/bmr_store";

function LoginPage() {
  const actionLogin = useBmrStore((s) => s.actionLogin);

  const accessToken = useBmrStore((s) => s.accessToken);
  const user = useBmrStore((s) => s.user);

  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ ถ้าล็อกอินค้างอยู่แล้ว → เด้งตาม role
  useEffect(() => {
    if (accessToken && user) {
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "user") navigate(`/store/${user.storecode}`, { replace: true });
      else navigate("/", { replace: true });
    }
  }, [accessToken, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setIsSubmitting(true);
      const res = await actionLogin(form);
      const role = res?.data?.payload?.role;

      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "user") navigate(`/store/${form.name}`, { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      const errMsg = err?.response?.data?.msg || "Login failed";
      setErrorMsg(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errorMsg) setErrorMsg("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <img src="/Bringmindlogo.png" alt="Logo" className="h-40 sm:h-48" />
        </div>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <input
              placeholder="รหัสสาขา ST001"
              onChange={handleChange}
              value={form.name}
              type="text"
              name="name"
              autoComplete="username"
              className=" w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <input
              placeholder="••••••••"
              onChange={handleChange}
              value={form.password}
              type="password"
              name="password"
              autoComplete="current-password"
              className=" w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {errorMsg && (
            <div className="   text-sm text-rose-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          เคล็ดลับ: หากพิมพ์รหัสแล้วเข้าสู่ระบบไม่ได้ ให้ตรวจสอบตัวอักษรและตัวเลขอีกครั้ง
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

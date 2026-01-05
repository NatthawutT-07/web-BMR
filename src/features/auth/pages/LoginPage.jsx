import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBmrStore from "../../../store/bmr_store";

function LoginPage() {
  const actionLogin = useBmrStore((s) => s.actionLogin);

  const accessToken = useBmrStore((s) => s.accessToken);
  const user = useBmrStore((s) => s.user);

  const navigate = useNavigate();

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loginMode, setLoginMode] = useState("branch");
  const [manualUser, setManualUser] = useState("");
  const [manualPassword, setManualPassword] = useState("");

  const quickBranches = [
    { code: "ST001", label: "ST001 - Mega Bangna / เมกาบางนา" },
    { code: "ST002", label: "ST002 - Liangmuengnon / เลี่ยงเมืองนนท์" },
    { code: "ST003", label: "ST003 - The Circle Ratchapruk / เดอะเซอร์เคิล ราชพฤกษ์" },
  ];

  const handleBranchLogin = async (code) => {
    const branchCode = String(code || "").trim().toUpperCase();
    if (!branchCode) return;

    setErrorMsg("");

    try {
      setIsSubmitting(true);
      const branchPassword = `POG@${branchCode}`;
      const res = await actionLogin({
        name: branchCode,
        password: branchPassword,
        storecode: branchCode,
      });
      const role = res?.data?.payload?.role;

      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "user") navigate(`/store/${branchCode}`, { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      const payload = err?.response?.data;
      let errMsg =
        payload?.message ||
        payload?.msg ||
        (typeof payload === "string" ? payload : "") ||
        err?.userMessage ||
        err?.message ||
        "เข้าสู่ระบบไม่สำเร็จ";

      const lowered = String(errMsg || "").toLowerCase();
      if (lowered.includes("user not found") || lowered.includes("not enabled")) {
        errMsg = "ไม่พบผู้ใช้หรือยังไม่เปิดใช้งาน";
      } else if (lowered.includes("password invalid")) {
        errMsg = "รหัสผ่านไม่ถูกต้อง";
      }

      setErrorMsg(String(errMsg || "เข้าสู่ระบบไม่สำเร็จ"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualLogin = async (name, password) => {
    const cleanName = String(name || "").trim();
    const cleanPassword = String(password || "").trim();
    if (!cleanName || !cleanPassword) {
      setErrorMsg("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setErrorMsg("");

    try {
      setIsSubmitting(true);
      const res = await actionLogin({
        name: cleanName,
        password: cleanPassword,
      });
      const role = res?.data?.payload?.role;

      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "user") navigate(`/store/${res?.data?.payload?.storecode}`, { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      const payload = err?.response?.data;
      let errMsg =
        payload?.message ||
        payload?.msg ||
        (typeof payload === "string" ? payload : "") ||
        err?.userMessage ||
        err?.message ||
        "เข้าสู่ระบบไม่สำเร็จ";

      const lowered = String(errMsg || "").toLowerCase();
      if (lowered.includes("user not found") || lowered.includes("not enabled")) {
        errMsg = "ไม่พบผู้ใช้หรือยังไม่เปิดใช้งาน";
      } else if (lowered.includes("password invalid")) {
        errMsg = "รหัสผ่านไม่ถูกต้อง";
      }

      setErrorMsg(String(errMsg || "เข้าสู่ระบบไม่สำเร็จ"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ ถ้าล็อกอินค้างอยู่แล้ว → เด้งตาม role
  useEffect(() => {
    if (accessToken && user) {
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "user") navigate(`/store/${user.storecode}`, { replace: true });
      else navigate("/", { replace: true });
    }
  }, [accessToken, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-5">
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <img src="/Bringmindlogo.png" alt="Logo" className="h-40 sm:h-48" />
        </div>
        <div className=" rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="space-y-3">
            {loginMode === "branch" && (
              <>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">-- เลือกสาขา --</option>
                  {quickBranches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </>
            )}

            {loginMode === "manual" && (
              <>
                <input
                  type="text"
                  placeholder="ชื่อผู้ใช้"
                  value={manualUser}
                  onChange={(e) => {
                    setManualUser(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  autoComplete="off"
                  data-lpignore="true"
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <input
                  type="password"
                  placeholder="ใส่รหัสผู้ใช้"
                  value={manualPassword}
                  onChange={(e) => {
                    setManualPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  autoComplete="off"
                  data-lpignore="true"
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </>
            )}

            {errorMsg && (
              <div className="text-sm text-rose-700">{errorMsg}</div>
            )}

            <button
              type="button"
              disabled={
                isSubmitting ||
                (loginMode === "branch" && !selectedBranch) ||
                (loginMode === "manual" && (!manualUser || !manualPassword))
              }
              onClick={() => {
                if (loginMode === "branch") {
                  handleBranchLogin(selectedBranch);
                } else {
                  handleManualLogin(manualUser, manualPassword);
                }
              }}
              className="w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-700">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("branch");
                  setErrorMsg("");
                }}
                className="underline-offset-2 hover:underline"
              >
                เลือกสาขา
              </button>
              <span aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("manual");
                  setErrorMsg("");
                }}
                className="underline-offset-2 hover:underline"
              >
                รหัสผ่าน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

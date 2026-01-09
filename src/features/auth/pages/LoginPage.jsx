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

  // ✅ State สำหรับควบคุม Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const quickBranches = [
    { code: "ST001", label: "ST001 - เมกาบางนา" },
    { code: "ST002", label: "ST002 - เลี่ยงเมืองนนท์" },
    { code: "ST003", label: "ST003 - เดอะเซอร์เคิล ราชพฤกษ์" },
    { code: "ST004", label: "ST004 - เซ็นทรัลอิสวิลล์" },
    { code: "ST005", label: "ST005 - เมอร์คิวรี่วิลล์แอดชิดลม" },
    { code: "ST006", label: "ST006 - พาราไดซ์ พาร์ค" },
    { code: "ST007", label: "ST007 - เซ็นทรัลพระราม 3" },
    { code: "ST008", label: "ST008 - เกษร ทาวเวอร์" },
    { code: "ST009", label: "ST009 - จามจุรีสแควร์" },
    { code: "ST010", label: "ST010 - ออลซีซั่นเพลส" },
    { code: "ST011", label: "ST011 - เซ็นทรัลแจ้งวัฒนะ" },
    { code: "ST012", label: "ST012 - เดอะพรอมานาด" },
    { code: "ST013", label: "ST013 - เดอะมอลล์งามวงศ์วาน" },
    { code: "ST014", label: "ST014 - ฟิวเจอร์พาร์ค รังสิต" },
    { code: "ST015", label: "ST015 - เซ็นทรัล เวสเกต" },
    { code: "ST016", label: "ST016 - เซ็นทรัล บางนา" },
    { code: "ST017", label: "ST017 - จี ทาวเวอร์" },
    { code: "ST018", label: "ST018 - ไลฟ์เซ็นเตอร์ (คิวเฮ้าส์)" },
    { code: "ST019", label: "ST019 - สิงห์คอมเพล็กซ์" },
    { code: "ST020", label: "ST020 - เดอะพาร์ค" },
    { code: "ST021", label: "ST021 - ลาวิลล่า อารีย์" },
    { code: "ST022", label: "ST022 - เซ็นทรัล พระราม 2" },
    // { code: "ST023", label: "ST023 - เดอะพาสิโอ พาร์ค" },
    { code: "ST024", label: "ST024 - เดอะไนน์" },
    // { code: "ST025", label: "ST025 - เซ็นทรัล รัตนาธิเบศร์" },
    { code: "ST026", label: "ST026 - เกทเวย์ เอกมัย" },
    { code: "ST027", label: "ST027 - วชิระพยาบาล" },
    // { code: "ST028", label: "ST028 - เทอมินอล 21 พระราม 3" },
    { code: "ST029", label: "ST029 - ปตท.พระราม 4" },
    // { code: "ST030", label: "ST030 - ปตท.เกษตร นวมินทร์" },
    { code: "ST031", label: "ST031 - เค วิลเลจ สุขุมวิท 26" },
    { code: "ST032", label: "ST032 - เอ็มไพร์ ทาวเวอร์" },
    { code: "ST033", label: "ST033 - โรงพยาบาลกรุงเทพ ซ.ศูนย์วิจัย" },
    { code: "ST034", label: "ST034 - เอท ทองหล่อ" },
    // { code: "ST035", label: "ST035 -ปตท.เหรียญทอง ราชพฤกษ์" },
    { code: "ST038", label: "ST038 - เซ็นทรัล เวิลด์" },
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
          <div
            className="h-40 sm:h-48 w-full bg-contain bg-center bg-no-repeat select-none pointer-events-none"
            style={{ backgroundImage: "url('/Bringmindlogo.png')" }}
            aria-label="Logo"
          />
        </div>
        <div className=" rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="space-y-3">
            {loginMode === "branch" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-3 text-left text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 flex items-center justify-between"
                >
                  <span className={!selectedBranch ? "text-slate-500" : ""}>
                    {selectedBranch
                      ? quickBranches.find((b) => b.code === selectedBranch)?.label
                      : "-- เลือกสาขา --"}
                  </span>
                  <span className="text-emerald-400 text-xs ml-2">▼</span>
                </button>

                {/* ✅ Custom Scrollable Dropdown */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-emerald-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {quickBranches.map((b) => (
                        <li
                          key={b.code}
                          className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-emerald-50 ${selectedBranch === b.code ? 'text-emerald-900 bg-emerald-50' : 'text-slate-700'
                            }`}
                          onClick={() => {
                            setSelectedBranch(b.code);
                            setErrorMsg("");
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span className={`block truncate ${selectedBranch === b.code ? 'font-semibold' : 'font-normal'}`}>
                            {b.label}
                          </span>
                          {selectedBranch === b.code && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600">
                              ✓
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
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
        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Planogram Management System
        </p>
      </div>

    </div>
  );
}

export default LoginPage;

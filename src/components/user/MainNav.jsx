// MainNav.jsx  (ทุกอย่างเหมือนเดิม + เพิ่มโชว์เวลา Stock อัปเดตล่าสุด)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBmrStore from "../../store/bmr_store";
import { getStockLastUpdate } from "../../api/users/home";

const formatBangkokTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
};


function MainNav() {
  const navigate = useNavigate();
  const user = useBmrStore((state) => state.user);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ✅ NEW: เวลา Stock อัปเดตล่าสุด (1 ค่า)
  const [stockUpdatedAt, setStockUpdatedAt] = useState(null);
  const [loadingStockMeta, setLoadingStockMeta] = useState(false);
  const menuRef = useRef(null);

  const clearStorageAndLogout = () => {
    // เคลียร์ localStorage + Zustand (ตามของเดิม)
    if (useBmrStore.persist?.clearStorage) {
      useBmrStore.persist.clearStorage();
    }
    useBmrStore.getState().logout();

    navigate("/", { replace: true });
  };

  const toggleUserMenu = () => {
    setUserMenuOpen((prev) => !prev);
  };

  const displayName = user?.storecode || user?.name || "Unknown";
  const initial = displayName.charAt(0).toUpperCase();

  // ✅ ปิด dropdown เมื่อคลิกนอกเมนู (กันค้าง)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  // ✅ NEW: โหลดเวลา stock อัปเดตล่าสุด (ดึงครั้งแรก + รีเฟรชทุก 30 วิ)
  useEffect(() => {
    if (!user) return;

    let alive = true;
    let timer = null;

    const loadMeta = async () => {
      setLoadingStockMeta(true);
      try {
        const meta = await getStockLastUpdate(); // { updatedAt, rowCount }
        if (!alive) return;
        setStockUpdatedAt(meta?.updatedAt || null);
      } catch (e) {
        if (!alive) return;
        setStockUpdatedAt(null);
      } finally {
        if (!alive) return;
        setLoadingStockMeta(false);
      }
    };

    loadMeta();
    timer = setInterval(loadMeta, 30_000);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [user]);

  const stockTimeText = useMemo(() => {
    if (loadingStockMeta) return "กำลังเช็ค...";
    return formatBangkokTime(stockUpdatedAt);
  }, [loadingStockMeta, stockUpdatedAt]);

  return (
    <nav className="bg-emerald-600 text-white shadow-md print:hidden">
      <div className="max-w-8xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* ซ้าย: โลโก้ + ชื่อระบบ + เวลา stock */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center">
              <img
                src="/icon.png"
                alt="Shelf Check Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm object-contain border border-white/40"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-sm sm:text-base font-semibold tracking-tight">
                Shelf Check System
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-emerald-100">
                  ตรวจสินค้า & สต็อกหน้าร้าน
                </span>

                {/* ✅ NEW: เวลาอัปเดต Stock ล่าสุด */}
                <span className="text-[10px] sm:text-xs text-emerald-100/90">
                  • Stock ล่าสุด {stockTimeText}
                </span>
              </div>
            </div>
          </div>

          {/* ขวา: เมนูผู้ใช้ + Logout ใน dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm transition"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-emerald-700 flex items-center justify-center text-xs font-semibold">
                    {initial}
                  </div>
                  <div className="flex flex-col items-start leading-tight max-w-[120px] sm:max-w-[160px]">
                    <span className="font-medium truncate">{displayName}</span>
                    <span className="text-[10px] uppercase tracking-wide text-emerald-100">
                      {user.role || "user"}
                    </span>
                  </div>
                  <span className="text-emerald-100 text-xs sm:text-sm">
                    {userMenuOpen ? "▴" : "▾"}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white text-slate-700 rounded-lg shadow-lg border border-slate-200 py-1 z-40">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-[11px] text-slate-400">Signed in as</div>
                      <div className="text-[12px] font-medium truncate">{displayName}</div>
                    </div>

                    <button
                      type="button"
                      onClick={clearStorageAndLogout}
                      className="w-full text-left px-3 py-2 text-[12px] text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MainNav;

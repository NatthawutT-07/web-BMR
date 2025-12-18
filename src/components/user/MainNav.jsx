  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import useBmrStore from "../../store/bmr_store";

  function MainNav() {
    const navigate = useNavigate();
    const user = useBmrStore((state) => state.user);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

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

    return (
      <nav className="bg-emerald-600 text-white shadow-md print:hidden">
        <div className="max-w-8xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* ซ้าย: โลโก้ + ชื่อระบบ */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* โลโก้จาก public/icon.png */}
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
                <span className="text-[10px] sm:text-xs text-emerald-100">
                  ตรวจสินค้า & สต็อกหน้าร้าน
                </span>
              </div>
            </div>

            {/* ขวา: เมนูผู้ใช้ + Logout ใน dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <div className="relative">
                  {/* ปุ่มโปรไฟล์ (กดแล้วโชว์เมนู) */}
                  <button
                    type="button"
                    onClick={toggleUserMenu}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-white text-emerald-700 flex items-center justify-center text-xs font-semibold">
                      {initial}
                    </div>
                    <div className="flex flex-col items-start leading-tight max-w-[120px] sm:max-w-[160px]">
                      <span className="font-medium truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-emerald-100">
                        {user.role || "user"}
                      </span>
                    </div>
                    <span className="text-emerald-100 text-xs sm:text-sm">
                      {userMenuOpen ? "▴" : "▾"}
                    </span>
                  </button>

                  {/* Dropdown เมนู */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white text-slate-700 rounded-lg shadow-lg border border-slate-200 py-1 z-40">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="text-[11px] text-slate-400">
                          Signed in as
                        </div>
                        <div className="text-[12px] font-medium truncate">
                          {displayName}
                        </div>
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

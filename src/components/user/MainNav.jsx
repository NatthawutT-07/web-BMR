import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useBmrStore from '../../store/bmr_store';

function MainNav() {
  const navigate = useNavigate();

  const clearStorageAndLogout = () => {
    // เคลียร์ localStorage + Zustand
    useBmrStore.persist.clearStorage();
    useBmrStore.getState().logout();

    navigate('/', { replace: true });
  };

  return (
    <nav className="bg-emerald-600 text-white shadow-md print:hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* ซ้าย: โลโก้ / ชื่อระบบ */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-xs font-bold">
              POG
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm sm:text-base font-semibold">
                Shelf Check System
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-100">
                สำหรับตรวจสอบสินค้าและสต็อกหน้าร้าน
              </span>
            </div>
          </div>

          {/* ขวา: ปุ่ม Home + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 transition-colors"
            >
              Home
            </Link>

            <button
              type="button"
              onClick={clearStorageAndLogout}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-xs sm:text-sm rounded-md font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MainNav;

// MainNav.jsx  (ทุกอย่างเหมือนเดิม + เพิ่มโชว์เวลา Stock อัปเดตล่าสุด)
// ปรับ: ยิง stock meta แค่ครั้งเดียว (ใช้ useStockMetaStore.loadOnce)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import useBmrStore from "../../../store/bmr_store";
import useStockMetaStore from "../../../store/stock_meta_store";
import api from "../../../utils/axios";
import PogRequestHistoryModal from "./PogRequestHistoryModal";
import ShelfChangeNotification from "./ShelfChangeNotification";

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // ดึงจาก store (ยิงครั้งเดียวทั้งแอป)
  const stockUpdatedAt = useStockMetaStore((s) => s.updatedAt);
  const stockStatus = useStockMetaStore((s) => s.status); // idle | loading | loaded | error
  const loadStockMetaOnce = useStockMetaStore((s) => s.loadOnce);
  const refreshStockMeta = useStockMetaStore((s) => s.refresh);

  const [confirmModal, setConfirmModal] = useState({ open: false, file: null });
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [now, setNow] = useState(new Date());

  // อัปเดตเวลา 'now' ทุก 1 นาที เพื่อให้ countdown เดิน
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // 1 นาที
    return () => clearInterval(timer);
  }, []);

  // ตรวจสอบ Cooldown 1 ชั่วโมง (ยกเว้น Admin)
  const cooldownRemaining = useMemo(() => {
    if (!user || user.role === "admin") return 0;
    if (!stockUpdatedAt) return 0;
    const last = new Date(stockUpdatedAt);
    const diffMs = now.getTime() - last.getTime();
    const oneHourMs = 60 * 60 * 1000;
    if (diffMs < oneHourMs) {
      // คืนค่าเป็นวินาทีเพื่อให้คำนวณแม่นยำขึ้น
      return Math.max(0, Math.ceil((oneHourMs - diffMs) / 1000));
    }
    return 0;
  }, [stockUpdatedAt, user, now]);

  // ตัวแปรสำหรับแสดงผลนาที
  const cooldownMin = Math.ceil(cooldownRemaining / 60);

  const [validating, setValidating] = useState(false);

  const handleStockUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (cooldownMin > 0) {
      toast.warning(`กรุณารออีก ${cooldownMin} นาที จึงจะอัปโหลดได้ใหม่`);
      return;
    }

    // --- Pre-validation: ตรวจสอบจำนวนสาขาในไฟล์ก่อนอัปโหลด ---
    setValidating(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      // หา header row ที่มีคอลัมน์ "รหัสสาขา"
      const headerRowIndex = raw.findIndex(row =>
        row.includes("รหัสสินค้า") &&
        row.includes("รหัสสาขา") &&
        row.includes("จำนวนคงเหลือ")
      );

      if (headerRowIndex === -1) {
        toast.error("รูปแบบไฟล์ไม่ถูกต้อง: ไม่พบหัวตาราง (รหัสสินค้า, รหัสสาขา, จำนวนคงเหลือ)");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const header = raw[headerRowIndex];
      const branchColIndex = header.indexOf("รหัสสาขา");
      const dataRows = raw.slice(headerRowIndex + 1);

      // ดึง unique branch codes จากไฟล์
      const uniqueBranches = [
        ...new Set(
          dataRows
            .map(r => (r[branchColIndex] || "").toString().trim())
            .filter(Boolean)
        ),
      ];

      if (uniqueBranches.length === 0) {
        toast.error("ไม่พบข้อมูลสาขาในไฟล์");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (uniqueBranches.length > 1) {
        toast.error(
          `ไฟล์นี้มีข้อมูลมากกว่า 1 สาขา (${uniqueBranches.join(", ")}) กรุณาอัปโหลดไฟล์ที่มีสาขาเดียวเท่านั้น`,
          { autoClose: 6000 }
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // ตรวจสอบว่าสาขาในไฟล์ตรงกับสาขาของ user หรือไม่
      if (user?.role !== "admin" && uniqueBranches[0] !== user?.storecode) {
        toast.error(
          `สาขาในไฟล์ (${uniqueBranches[0]}) ไม่ตรงกับสาขาของคุณ (${user?.storecode})`,
          { autoClose: 6000 }
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } catch (err) {
      console.error("Pre-validation error:", err);
      toast.error("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบไฟล์ .xlsx ของคุณ");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    } finally {
      setValidating(false);
    }

    // ผ่านการตรวจสอบแล้ว → แสดง Confirm Modal
    setConfirmModal({ open: true, file });
  };

  const executeUpload = async () => {
    const file = confirmModal.file;
    if (!file) return;

    setConfirmModal({ open: false, file: null });
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/upload-stock", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("อัปโหลดข้อมูล Stock สำเร็จ");
      // ไม่รีเฟรช meta ทันที แต่ให้ user กด Refresh หน้าเอง
      setShowRefreshModal(true);
    } catch (err) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.error || "อัปโหลดล้มเหลว";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelUpload = () => {
    setConfirmModal({ open: false, file: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  // ปิด dropdown เมื่อคลิกนอกเมนู (กันค้าง)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  // โหลด stock meta แค่ครั้งเดียวตอนเข้าระบบ/มี user
  useEffect(() => {
    if (!user) return;
    loadStockMetaOnce?.(); // store จะกันยิงซ้ำให้เอง (loadedOnce / loading)
  }, [user, loadStockMetaOnce]);

  const stockTimeText = useMemo(() => {
    if (stockStatus === "loading") return "กำลังเช็ค...";
    if (stockStatus === "error") return "-";

    // Intl.DateTimeFormat with timeZone: "Asia/Bangkok" handles the conversion correctly
    if (!stockUpdatedAt) return "-";
    const adjustedDate = new Date(stockUpdatedAt);
    return formatBangkokTime(adjustedDate);
  }, [stockStatus, stockUpdatedAt]);

  return (
    <>
      <nav className="bg-emerald-600 text-white shadow-md print:hidden">
        <div className="max-w-8xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* ซ้าย: โลโก้ + ชื่อระบบ + เวลา stock */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex shrink-0">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-contain bg-center bg-no-repeat select-none pointer-events-none"
                  style={{ backgroundImage: "url('/icon.png')" }}
                  aria-label="Shelf Check Logo"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-sm sm:text-base font-semibold tracking-tight truncate whitespace-nowrap">
                  Shelf Check System
                </span>

                <span className="hidden sm:inline text-emerald-200/70">•</span>

                {/* เวลาอัปเดต Stock ล่าสุด — Badge เด่น */}
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-[10px] sm:text-xs font-semibold text-white truncate shrink-0">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    Stock: {stockTimeText}
                  </span>

                  {/* ปุ่ม Upload สำหรับ User (โชว์เมื่อไม่ใช่ admin) */}
                  {user && user.role !== "admin" && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx"
                        onChange={handleStockUpload}
                      />
                      <button
                        type="button"
                        disabled={uploading || validating || cooldownRemaining > 0}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${
                          cooldownRemaining > 0
                            ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                            : "bg-white/10 hover:bg-white/30 border-white/20 text-white animate-in zoom-in duration-300"
                        }`}
                        title={cooldownRemaining > 0 ? `กรุณารออีก ${cooldownMin} นาที` : "อัปโหลดไฟล์ Stock (.xlsx)"}
                      >
                        {uploading || validating ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                            {cooldownMin > 0 && <span className="text-[10px] font-bold">{cooldownMin}m</span>}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ขวา: เมนูผู้ใช้ + Logout ใน dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <>
                  <ShelfChangeNotification branchCode={user.storecode} />
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={toggleUserMenu}
                      className="flex items-center gap-2 sm:px-2.5 sm:py-1.5 p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm transition ml-auto"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0">
                        {initial}
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-tight max-w-[160px]">
                        <span className="font-medium truncate w-full text-left">{displayName}</span>
                        <span className="text-[10px] uppercase tracking-wide text-emerald-100">
                          {user.role || "user"}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-emerald-100 text-sm">
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
                          onClick={() => {
                            setUserMenuOpen(false);
                            setHistoryOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-[12px] text-blue-600 hover:bg-blue-50"
                        >
                          ประวัติคำขอเปลี่ยนแปลง
                        </button>
                        <button
                          type="button"
                          onClick={clearStorageAndLogout}
                          className="w-full text-left px-3 py-2 text-[12px] text-red-600 hover:bg-red-50"
                        >
                          ออกจากระบบ
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pog Request History Modal */}
      <PogRequestHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        branchCode={user?.storecode}
      />

      {/* Custom Confirmation Modal for Stock Upload */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={cancelUpload}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header / Icon */}


            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการอัปโหลด Stock</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการอัปโหลดไฟล์ <span className="font-semibold text-emerald-600">"{confirmModal.file?.name}"</span> สำหรับสาขา <span className="font-bold text-slate-700">{user?.storecode}</span>
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={executeUpload}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  ยืนยันและอัปโหลด
                </button>
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Blocking Overlay during Upload */}
      {uploading && (
        <div className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6">
          <div className="w-20 h-20 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold mb-2">กำลังอัปโหลดข้อมูล Stock...</h2>
          <p className="text-slate-400 animate-pulse text-center max-w-sm">
            กรุณารอสักครู่ ระบบกำลังประมวลผลและอัปเดตข้อมูลสาขาของคุณ ห้ามปิดหน้านี้หรือรีเฟรชเบราว์เซอร์
          </p>
        </div>
      )}

      {/* Success & Refresh Prompt Modal */}
      {showRefreshModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">อัปโหลดสำเร็จ!</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              ข้อมูล Stock ของสาขาคุณถูกอัปเดตเรียบร้อยแล้ว กรุณารีเฟรชหน้าเว็บเพื่อให้ข้อมูลใหม่แสดงผลทั้งระบบ
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              รีเฟรชหน้าเว็บทันที
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MainNav;

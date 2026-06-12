import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../utils/axios";
import { getBranches } from "../../../api/admin/branch";

// upload APIs
import {
  uploadWithdrawXLSX,
  uploadStockXLSX,
  uploadTemplateXLSX,
  uploadItemSKUXLSX,
  uploadItemMinMaxXLSX,
  uploadMasterItemXLSX,
  uploadBillXLSX,
  uploadGourmetXLSX,
  getSyncDates,
  clearStock,
  clearSku,
  clearTemplate,
  clearMinMax,
} from "../../../api/admin/upload";

// download APIs
import { downloadSKU, downloadTemplate } from "../../../api/admin/download";

// sub-components
import SyncStatusInfo from "./upload/SyncStatusInfo";
import FileNotes from "./upload/FileNotes";
import { FILE_TYPE_CONFIG } from "./upload/uploadConfig";

const uploadFunctions = {
  withdraw: uploadWithdrawXLSX,
  stock: uploadStockXLSX,
  Template: uploadTemplateXLSX,
  SKU: uploadItemSKUXLSX,
  minMax: uploadItemMinMaxXLSX,
  masterItem: uploadMasterItemXLSX,
  bill: uploadBillXLSX,
  gourmet: uploadGourmetXLSX,
};

const UploadCSV = () => {
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState({
    label: "",
    current: 0,
    total: 0,
    fileName: "",
  });
  const [progress, setProgress] = useState({
    filePercent: 0,
    overallPercent: 0,
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [activebranch_codes, setActivebranch_codes] = useState([]);
  const [syncDates, setSyncDates] = useState({});
  const [uploadResult, setUploadResult] = useState(null);

  const fetchSyncDates = async () => {
    try {
      const dates = await getSyncDates();
      setSyncDates(dates || {});
    } catch (err) {
      console.error("Failed to fetch sync dates", err);
    }
  };

  useEffect(() => {
    fetchSyncDates();

    const fetchBranches = async () => {
      try {
        const branchList = await getBranches();
        setBranches(Array.isArray(branchList) ? branchList : []);
      } catch (error) {
        console.error("Failed to fetch branches", error);
      }
    };

    const fetchActiveUsers = async () => {
      try {
        const res = await api.get("/users");
        const activeUsers = res.data.filter(u => u.enabled).map(u => u.name);
        setActivebranch_codes(activeUsers);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    const interval = setInterval(fetchSyncDates, 60000); // refresh every minute

    fetchBranches();
    fetchActiveUsers();
    return () => clearInterval(interval);
  }, []);

  const filteredBranches = branches.filter(b => activebranch_codes.includes(b.branch_code));

  const fileInputRef = useRef(null);

  // เลือกประเภทไฟล์
  const handleSelectFileType = (type) => {
    if (loading) return;
    setSelectedFileType(type);
    setFiles([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // โหลดไฟล์ XLSX (Dynamic Import → ลด bundle)
  const loadXLSX = async () => {
    const XLSX = await import("xlsx");
    return XLSX;
  };

  const handleFileChange = (e) => {
    if (loading) return;
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setUploadResult(null);
  };

  // Upload handler
  const handleFileUpload = async (uploadFn, label) => {
    if (!files.length) {
      toast.error(`Please select ${label} file`);
      return;
    }

    setLoading(true);
    setUploadInfo({ label, current: 0, total: files.length, fileName: "" });
    setProgress({ filePercent: 0, overallPercent: 0 });
    setUploadResult(null);

    try {
      let finalRes = null;
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setUploadInfo({
          label,
          current: i + 1,
          total: files.length,
          fileName: file?.name || "",
        });
        setProgress((prev) => ({ ...prev, filePercent: 0 }));

        const res = await uploadFn(file, (pct) => {
          const totalFiles = files.length || 1;
          const completed = i;
          const safePct = Math.max(0, Math.min(100, pct));
          const overall = Math.round(
            ((completed + safePct / 100) / totalFiles) * 100
          );
          setProgress({ filePercent: safePct, overallPercent: overall });
        });
        finalRes = res?.data;

        const doneOverall = Math.round(((i + 1) / (files.length || 1)) * 100);
        setProgress({ filePercent: 100, overallPercent: doneOverall });

      }

      setUploadResult(finalRes);
      toast.success(`${label} upload completed!`);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const msg = err?.message || "Upload failed";
      toast.error(`Upload failed: ${msg}`);
    }

    setLoading(false);
    setUploadInfo({ label: "", current: 0, total: 0, fileName: "" });
    setProgress({ filePercent: 0, overallPercent: 0 });
  };

  // DOWNLOAD XLSX (Lazy XLSX)
  const downloadXLSXFile = async (name, fetchApiFn, params = {}) => {
    try {
      setLoading(true);

      const XLSX = await loadXLSX(); // โหลดเฉพาะตอนใช้
      const data = await fetchApiFn(params);

      const sheet = XLSX.utils.json_to_sheet(data);
      const book = XLSX.write(
        { Sheets: { data: sheet }, SheetNames: ["data"] },
        { bookType: "xlsx", type: "array" }
      );

      const blob = new Blob([book], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${name} Downloaded!`);
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClearStock = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล Stock ทั้งหมดในระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    setLoading(true);
    try {
      await clearStock();
      toast.success("ลบข้อมูล Stock ทั้งหมดเรียบร้อยแล้ว");
      fetchSyncDates();
    } catch (err) {
      toast.error(`ลบข้อมูล Stock ล้มเหลว: ${err.message || "Clear stock failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSku = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล POG SKU ทั้งหมดในระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    setLoading(true);
    try {
      await clearSku();
      toast.success("ลบข้อมูล POG SKU ทั้งหมดเรียบร้อยแล้ว");
      fetchSyncDates();
    } catch (err) {
      toast.error(`ลบข้อมูล POG SKU ล้มเหลว: ${err.message || "Clear SKU failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTemplate = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล POG Shelf ทั้งหมดในระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    setLoading(true);
    try {
      await clearTemplate();
      toast.success("ลบข้อมูล POG Shelf ทั้งหมดเรียบร้อยแล้ว");
      fetchSyncDates();
    } catch (err) {
      toast.error(`ลบข้อมูล POG Shelf ล้มเหลว: ${err.message || "Clear Shelf failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearMinMax = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล ItemMinMax ทั้งหมดในระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    setLoading(true);
    try {
      await clearMinMax();
      toast.success("ลบข้อมูล ItemMinMax ทั้งหมดเรียบร้อยแล้ว");
      fetchSyncDates();
    } catch (err) {
      toast.error(`ลบข้อมูล ItemMinMax ล้มเหลว: ${err.message || "Clear ItemMinMax failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const renderFileUploadForm = (fileType) => {
    const config = FILE_TYPE_CONFIG[fileType];
    if (!config) return null;

    const syncKey = config.syncKey;
    const lastSyncInfo = syncKey && syncDates[syncKey];

    const actions = {
      onClearTemplate: handleClearTemplate,
      onClearSku: handleClearSku,
      onClearStock: handleClearStock,
      onClearMinMax: handleClearMinMax,
    };

    return (
      <div className="border rounded-md p-4 bg-gray-50 mt-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{config.label}</h3>
          <SyncStatusInfo syncInfo={lastSyncInfo} />
        </div>

        <FileNotes fileType={fileType} loading={loading} actions={actions} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          multiple
          disabled={loading}
          className="w-full p-2 border rounded bg-white"
        />

        <button
          onClick={() => handleFileUpload(uploadFunctions[fileType], config.label)}
          disabled={loading}
          className="mt-4 w-full py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Uploading..." : `Upload ${config.label}`}
        </button>

        {/* Inline Progress Bar */}
        {loading && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-slate-600 text-center animate-pulse">
              {progress.filePercent < 100 
                ? `กำลังอัปโหลดไฟล์... (${progress.filePercent}%)` 
                : "อัปโหลดไฟล์เสร็จแล้ว กำลังประมวลผลและบันทึกข้อมูลลงฐานข้อมูล..."}
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-green-600 rounded-full transition-all duration-300 ${
                  progress.filePercent >= 100 ? "animate-pulse w-full" : ""
                }`}
                style={{ width: `${progress.filePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Filter สาขาสำหรับ SKU */}
        {fileType === "SKU" && (
          <div className="mt-6 mb-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Filter by Branch (Download)
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border rounded bg-white truncate"
              disabled={loading}
            >
              <option value="">All Branches</option>
              {filteredBranches?.map((b) => {
                const displayName =
                  b.branch_name.length > 45 ? `${b.branch_name.substring(0, 42)}...` : b.branch_name;
                return (
                  <option key={b.branch_code} value={b.branch_code}>
                    {b.branch_code} - {displayName}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* DOWNLOAD TEMPLATE */}
        {fileType === "Template" && (
          <button
            disabled={loading}
            onClick={() => downloadXLSXFile("POG_Shelf_Template.xlsx", downloadTemplate)}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded"
          >
            Download POG Shelf Template XLSX
          </button>
        )}

        {/* DOWNLOAD SKU */}
        {fileType === "SKU" && (
          <button
            disabled={loading}
            onClick={() =>
              downloadXLSXFile("POG_SKU_Template.xlsx", downloadSKU, {
                branch_code: selectedBranch,
              })
            }
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded"
          >
            Download POG SKU Template XLSX
          </button>
        )}
      </div>
    );
  };

  const totalRows = uploadResult 
    ? (uploadResult.raw_rows || uploadResult.inserted || uploadResult.parsed_rows || 0)
    : 0;
  const successRows = uploadResult 
    ? (uploadResult.bills_created !== undefined ? uploadResult.bills_created : (uploadResult.inserted || 0))
    : 0;
  const skippedRows = uploadResult 
    ? (uploadResult.bills_skipped !== undefined ? uploadResult.bills_skipped : 0)
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Choose File Type to Upload
      </h2>

      <select
        className="w-full p-2 border rounded mb-4"
        value={selectedFileType || ""}
        onChange={(e) => handleSelectFileType(e.target.value)}
        disabled={loading}
      >
        <option value="">-- Select --</option>
        <option value="Template">POG Shelf XLSX</option>
        <option value="SKU">POG SKU XLSX</option>
        <option value="">-</option>
        <option value="withdraw">Withdraw XLSX</option>
        <option value="stock">Stock XLSX</option>
        <option value="minMax">ItemMinMax XLSX</option>
        <option value="masterItem">MasterItem XLSX</option>
        <option value="bill">Bill XLSX</option>
        <option value="gourmet">Gourmet XLSX</option>
      </select>

      {selectedFileType && renderFileUploadForm(selectedFileType)}

      {/* Success results cards shown below */}
      {!loading && uploadResult && (
        <div className="mt-6 space-y-6">
          {/* Green Alert Box */}
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <div className="font-bold text-sm">สำเร็จ</div>
              <div className="text-xs mt-1">
                {selectedFileType === "bill"
                  ? `Sales Bill import completed: ${successRows.toLocaleString()} bills imported, ${skippedRows.toLocaleString()} duplicates skipped`
                  : `${FILE_TYPE_CONFIG[selectedFileType]?.label || "Data"} import completed: ${successRows.toLocaleString()} rows imported`}
              </div>
            </div>
          </div>

          {/* Stats Cards (3 cards row) */}
          <div className="grid grid-cols-3 gap-4">
            {/* Card 1: Total Rows */}
            <div className="bg-white border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[11px] font-medium text-gray-500 text-center">จำนวนแถวทั้งหมด</span>
              <span className="text-2xl font-black text-gray-800 mt-1 tabular-nums">
                {totalRows.toLocaleString()}
              </span>
            </div>

            {/* Card 2: Imported Successfully */}
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[11px] font-medium text-teal-600 text-center">นำเข้าสำเร็จ</span>
              <span className="text-2xl font-black text-teal-600 mt-1 tabular-nums">
                {successRows.toLocaleString()}
              </span>
            </div>

            {/* Card 3: Duplicates Skipped */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[11px] font-medium text-amber-700 text-center">ข้อมูลซ้ำ (ข้าม)</span>
              <span className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
                {skippedRows.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadCSV;

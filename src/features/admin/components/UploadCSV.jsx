import React, { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "react-toastify";
import useSalesStore from "../../../store/sales_store";
import api from "../../../utils/axios";

// upload APIs
import {
  uploadWithdrawXLSX,
  uploadStockXLSX,
  uploadTemplateXLSX,
  uploadItemSKUXLSX,
  uploadItemMinMaxXLSX,
  uploadMasterItemXLSX,
  uploadBillXLSX,
  uploadSI_XLSX,
  uploadGourmetXLSX,
  getUploadStatus,
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
import UploadProgressOverlay from "./upload/UploadProgressOverlay";
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
  si: uploadSI_XLSX,
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
  const [serverProgress, setServerProgress] = useState({
    percent: 0,
    status: "",
    message: "",
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [activeBranchCodes, setActiveBranchCodes] = useState([]);
  const [syncDates, setSyncDates] = useState({});

  const { branches, fetchListBranches } = useSalesStore();

  const fetchSyncDates = async () => {
    try {
      const dates = await getSyncDates();
      setSyncDates(dates || {});
    } catch (err) {
      console.error("Failed to fetch sync dates", err);
    }
  };

  useEffect(() => {
    fetchListBranches();
    fetchSyncDates();

    const fetchActiveUsers = async () => {
      try {
        const res = await api.get("/users");
        const activeUsers = res.data.filter(u => u.enabled).map(u => u.name);
        setActiveBranchCodes(activeUsers);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    const interval = setInterval(fetchSyncDates, 60000); // refresh every minute

    fetchActiveUsers();
    return () => clearInterval(interval);
  }, [fetchListBranches]);

  const filteredBranches = branches.filter(b => activeBranchCodes.includes(b.branch_code));

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const pollErrorRef = useRef(false);
  const currentJobIdRef = useRef(null);

  // เลือกประเภทไฟล์
  const handleSelectFileType = (type) => {
    if (loading) return;
    setSelectedFileType(type);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const makeJobId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `job_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    currentJobIdRef.current = null;
  };

  const startPolling = (jobId) => {
    stopPolling();
    pollErrorRef.current = false;
    currentJobIdRef.current = jobId;
    setServerProgress({ percent: 0, status: "processing", message: "starting" });

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getUploadStatus(jobId);
        if (currentJobIdRef.current !== jobId) return;

        const nextPercent = Math.max(
          0,
          Math.min(100, Number(data?.progress) || 0)
        );
        const nextStatus = data?.status || "";
        const nextMessage = data?.message || "";

        setServerProgress({
          percent: nextPercent,
          status: nextStatus,
          message: nextMessage,
        });

        if (nextStatus === "done") stopPolling();
        if (nextStatus === "error" && !pollErrorRef.current) {
          pollErrorRef.current = true;
          toast.error(`Upload failed: ${nextMessage || "processing error"}`);
          stopPolling();
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) return;
        if (!pollErrorRef.current) {
          pollErrorRef.current = true;
          setServerProgress((prev) => ({
            ...prev,
            status: "error",
            message: "status error",
          }));
        }
        stopPolling();
      }
    }, 1200);
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
  };

  useEffect(() => {
    if (!loading) return undefined;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [loading]);

  useEffect(() => () => stopPolling(), []);

  // Upload handler
  const handleFileUpload = async (uploadFn, label) => {
    if (!files.length) {
      toast.error(`Please select ${label} file`);
      return;
    }

    setLoading(true);
    setUploadInfo({ label, current: 0, total: files.length, fileName: "" });
    setProgress({ filePercent: 0, overallPercent: 0 });
    setServerProgress({ percent: 0, status: "", message: "" });

    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setUploadInfo({
          label,
          current: i + 1,
          total: files.length,
          fileName: file?.name || "",
        });
        setProgress((prev) => ({ ...prev, filePercent: 0 }));
        const jobId = makeJobId();
        startPolling(jobId);
        await uploadFn(file, (pct) => {
          const totalFiles = files.length || 1;
          const completed = i;
          const safePct = Math.max(0, Math.min(100, pct));
          const overall = Math.round(
            ((completed + safePct / 100) / totalFiles) * 100
          );
          setProgress({ filePercent: safePct, overallPercent: overall });
        }, jobId);
        const doneOverall = Math.round(((i + 1) / (files.length || 1)) * 100);
        setProgress({ filePercent: 100, overallPercent: doneOverall });
        stopPolling();
        setServerProgress({ percent: 100, status: "done", message: "completed" });
      }

      toast.success(`${label} upload completed!`);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const msg = err?.message || "Upload failed";
      toast.error(`Upload failed: ${msg}`);
      stopPolling();
    }

    setLoading(false);
    setUploadInfo({ label: "", current: 0, total: 0, fileName: "" });
    setProgress({ filePercent: 0, overallPercent: 0 });
    setServerProgress({ percent: 0, status: "", message: "" });
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
                branchCode: selectedBranch,
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

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      {loading && (
        <UploadProgressOverlay
          uploadInfo={uploadInfo}
          progress={progress}
          serverProgress={serverProgress}
        />
      )}

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
        {/* <option value="si">Order SI XLSX</option> */}
        <option value="gourmet">Gourmet XLSX</option>
      </select>

      {selectedFileType && renderFileUploadForm(selectedFileType)}
    </div>
  );
};

export default UploadCSV;

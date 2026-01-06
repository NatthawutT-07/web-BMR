import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

// upload APIs
import {
  uploadSalesDayXLSX,
  uploadWithdrawXLSX,
  uploadStockXLSX,
  uploadTemplateXLSX,
  uploadItemSKUXLSX,
  uploadStationXLSX,
  uploadItemMinMaxXLSX,
  uploadMasterItemXLSX,
  uploadBillXLSX,
  uploadGourmetXLSX,
  getUploadStatus,
} from "../../../api/admin/upload";

// download APIs
import { downloadSKU, downloadTemplate } from "../../../api/admin/download";

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

  // อัปโหลด map
  const uploadFunctions = {
    sales: uploadSalesDayXLSX,
    withdraw: uploadWithdrawXLSX,
    stock: uploadStockXLSX,
    Template: uploadTemplateXLSX,
    SKU: uploadItemSKUXLSX,
    store: uploadStationXLSX,
    minMax: uploadItemMinMaxXLSX,
    masterItem: uploadMasterItemXLSX,
    bill: uploadBillXLSX,
    gourmet: uploadGourmetXLSX,
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
  const downloadXLSXFile = async (name, fetchApiFn) => {
    try {
      setLoading(true);

      const XLSX = await loadXLSX(); // โหลดเฉพาะตอนใช้
      const data = await fetchApiFn();

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

  const renderFileUploadForm = (fileType) => {
    const labels = {
      sales: "Sales XLSX",
      withdraw: "Withdraw XLSX",
      stock: "Stock XLSX",
      Template: "POG Shelf XLSX",
      SKU: "POG SKU XLSX",
      store: "Station XLSX",
      minMax: "ItemMinMax XLSX",
      masterItem: "MasterItem XLSX",
      bill: "Bill XLSX",
      gourmet: "Gourmet XLSX",
    };

    return (
      <div className="border rounded-md p-4 bg-gray-50 mt-6">
        <h3 className="text-lg font-semibold mb-2">{labels[fileType]}</h3>

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
          onClick={() =>
            handleFileUpload(uploadFunctions[fileType], labels[fileType])
          }
          disabled={loading}
          className="mt-4 w-full py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Uploading..." : `Upload ${labels[fileType]}`}
        </button>

        {/* DOWNLOAD TEMPLATE (Lazy XLSX) */}
        {fileType === "Template" && (
          <button
            disabled={loading}
            onClick={() =>
              downloadXLSXFile("POG_Shelf_Template.xlsx", downloadTemplate)
            }
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded"
          >
            Download POG Shelf Template XLSX
          </button>
        )}

        {/* DOWNLOAD SKU (Lazy XLSX) */}
        {fileType === "SKU" && (
          <button
            disabled={loading}
            onClick={() =>
              downloadXLSXFile("POG_SKU_Template.xlsx", downloadSKU)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[92%] max-w-md rounded-xl bg-white p-5 shadow-xl border">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              <div>
                <div className="text-sm font-semibold text-slate-800">กำลังอัปโหลดไฟล์</div>
                <div className="text-xs text-slate-500">
                  {uploadInfo.label || "Upload"}{" "}
                  {uploadInfo.total > 0
                    ? `(${uploadInfo.current}/${uploadInfo.total})`
                    : ""}
                </div>
              </div>
            </div>
            {uploadInfo.fileName && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {uploadInfo.fileName}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>ไฟล์นี้ (อัปโหลด)</span>
                  <span className="tabular-nums">{progress.filePercent}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress.filePercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>อัปโหลดทั้งหมด</span>
                  <span className="tabular-nums">{progress.overallPercent}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${progress.overallPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>ประมวลผลบนเซิร์ฟเวอร์</span>
                  <span className="tabular-nums">{serverProgress.percent}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${serverProgress.percent}%` }}
                  />
                </div>
                {serverProgress.message && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    {serverProgress.message}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                กรุณารอจนกว่าการอัปโหลดจะเสร็จ เพื่อป้องกันข้อมูลไม่ครบ
              </div>
            </div>
          </div>
        </div>
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
        {/* <option value="sales">Sales XLSX</option> */}
        <option value="withdraw">Withdraw XLSX</option>
        <option value="stock">Stock XLSX</option>
        {/* <option value="store">Station XLSX</option> */}
        <option value="minMax">ItemMinMax XLSX</option>
        <option value="masterItem">MasterItem XLSX</option>
        {/* <option value="bill">Bill XLSX</option> */}
        {/* <option value="gourmet">Gourmet XLSX</option> */}
      </select>

      {selectedFileType && renderFileUploadForm(selectedFileType)}
    </div>
  );
};

export default UploadCSV;

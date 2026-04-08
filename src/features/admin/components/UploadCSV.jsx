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

  // อัปโหลด map
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
      const msg = err?.response?.data?.message || err?.message || "Clear stock failed";
      toast.error(`ลบข้อมูล Stock ล้มเหลว: ${msg}`);
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
      const msg = err?.response?.data?.message || err?.message || "Clear SKU failed";
      toast.error(`ลบข้อมูล POG SKU ล้มเหลว: ${msg}`);
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
      const msg = err?.response?.data?.message || err?.message || "Clear Shelf failed";
      toast.error(`ลบข้อมูล POG Shelf ล้มเหลว: ${msg}`);
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
      const msg = err?.response?.data?.message || err?.message || "Clear ItemMinMax failed";
      toast.error(`ลบข้อมูล ItemMinMax ล้มเหลว: ${msg}`);
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
      // si: "Order SI XLSX",
      gourmet: "Gourmet Sales XLSX",
    };

    const syncKeys = {
      withdraw: "withdraw",
      stock: "stock",
      Template: "template",
      SKU: "sku",
      minMax: "minMax",
      masterItem: "masterItem",
      bill: "dashboard", // Bill data updates the dashboard sync key
      si: "si",
      gourmet: "gourmet",
    };

    const syncKey = syncKeys[fileType];
    const lastSyncInfo = syncKey && syncDates[syncKey];

    // Format date string
    let lastUpdateStr = "ยังไม่มีข้อมูล";
    if (lastSyncInfo && lastSyncInfo.updatedAt) {
      try {
        const dateObj = new Date(lastSyncInfo.updatedAt);
        // Format: DD/MM/YYYY HH:mm:ss
        lastUpdateStr = dateObj.toLocaleString("th-TH", {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        lastUpdateStr = "วันที่ไม่ถูกต้อง";
      }
    }

    return (
      <div className="border rounded-md p-4 bg-gray-50 mt-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{labels[fileType]}</h3>
          {lastSyncInfo && (
            <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">
              อัปโหลดล่าสุด: <span className="font-medium text-slate-700">{lastUpdateStr}</span>
              {lastSyncInfo.rowCount > 0 && (
                <span className="ml-1 text-emerald-600">({lastSyncInfo.rowCount.toLocaleString()} แถว)</span>
              )}
            </div>
          )}
        </div>

        {/* Notes for POG Shelf */}
        {fileType === "Template" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (POG Shelf):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ระบบจะทำการ <strong className="font-semibold">อัปเดตและเพิ่มข้อมูลใหม่</strong> ตามสาขาที่มีในไฟล์</li>
              <li>ข้อมูลชั้นวางใดในสาขานั้นๆ ที่มีในระบบแต่ <strong className="font-semibold text-rose-600">ไม่มีในไฟล์ จะถูกลบทิ้งทันที</strong> (Full Sync)</li>
              <li>ข้อมูลสาขาที่ไม่ได้อยู่ในไฟล์อัปโหลด จะไม่ได้รับผลกระทบใดๆ</li>
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClearTemplate}
                disabled={loading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
              >
                เคลียร์ข้อมูล POG Shelf ทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* Notes for POG SKU */}
        {fileType === "SKU" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (POG SKU):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ระบบจะทำงานแบบ <strong className="font-semibold">เพิ่มใหม่และอัปเดตทับเท่านั้น (ไม่มีการลบข้อมูลสินค้าเดิมทิ้ง)</strong></li>
              <li>หาก <strong className="font-semibold">รหัสสาขาและรหัสสินค้า</strong> ตรงกับในระบบ จะทำการอัปเดตตำแหน่งใหม่ (รหัสชั้นวาง, แถว, ลำดับ)</li>
              <li>หากในไฟล์มีข้อมูลที่ <strong className="font-semibold text-rose-600">รหัสสาขาและรหัสสินค้าซ้ำกันเอง</strong> ระบบจะแจ้ง Error ให้แก้ไขก่อนอัปโหลด</li>
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClearSku}
                disabled={loading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
              >
                เคลียร์ข้อมูล POG SKU ทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* Notes for Withdraw */}
        {fileType === "withdraw" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (Withdraw):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ดึงเฉพาะข้อมูลที่มี <strong className="font-semibold">สถานะเอกสาร "อนุมัติแล้ว"</strong> และ <strong className="font-semibold">เหตุผล ไม่ใช่ "เบิกเพื่อขาย"</strong></li>
              <li>ทำงานแบบ <strong className="font-semibold">เพิ่มข้อมูลใหม่และอัปเดต</strong> (อิงจากเลขเอกสาร, รหัสสาขา, สินค้า, จำนวน, มูลค่า)</li>
              <li>ข้อมูลซ้ำซ้อนในไฟล์ จะถูกกรองออกอัตโนมัติ</li>
            </ul>
          </div>
        )}

        {/* Notes for Stock */}
        {fileType === "stock" && (
          <div className="mb-4 text-sm text-amber-800 bg-amber-50 p-3 rounded-md border border-amber-200">
            <strong className="font-semibold text-amber-700">หมายเหตุการอัปโหลด (Stock):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-amber-800">
              <li><strong className="font-semibold text-rose-600">คำเตือน:</strong> ข้อมูล Stock เดิมในระบบจะถูก <strong className="font-semibold">ลบทิ้งทั้งหมด (Truncate)</strong> ก่อนนำเข้าข้อมูลชุดใหม่</li>
              <li>ข้อมูลในไฟล์ใหม่ จะกลายเป็นข้อมูล Stock ปัจจุบันของทั้งระบบ</li>
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClearStock}
                disabled={loading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
              >
                เคลียร์ข้อมูล Stock ทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* Notes for ItemMinMax */}
        {fileType === "minMax" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (ItemMinMax):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ระบบทำงานแบบ <strong className="font-semibold">เพิ่มข้อมูลใหม่และอัปเดตทับข้อมูลเดิม</strong> (ไม่มีการลบข้อมูลทิ้ง)</li>
              <li>ใช้รหัสสาขาและรหัสสินค้า เป็นตัวตรวจสอบ หากตรงกันจะอัปเดตค่า Min/Max ใหม่</li>
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClearMinMax}
                disabled={loading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
              >
                เคลียร์ข้อมูล ItemMinMax ทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* Notes for MasterItem */}
        {fileType === "masterItem" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (MasterItem):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ระบบทำงานแบบ <strong className="font-semibold">เพิ่มสินค้าใหม่และอัปเดตข้อมูลสินค้าเดิม</strong> (ไม่มีการลบทิ้ง)</li>
              <li>หากข้อมูลไม่มีการเปลี่ยนแปลงจากในระบบ จะทำการข้าม(Skip) ไปอัตโนมัติเพื่อความรวดเร็ว</li>
            </ul>
          </div>
        )}

        {/* Notes for Bill */}
        {fileType === "bill" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (Bill):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ระบบจะข้ามเลขที่บิลที่มีอยู่แล้วในระบบ (กันบิลซ้ำ)</li>
              <li><strong className="font-semibold">เพิ่มข้อมูลใหม่โดยอัตโนมัติ:</strong> หากพบรหัสสาขา, ช่องทางการขาย, สินค้า, หรือลูกค้าใหม่ในไฟล์ จะถูกสร้างขึ้นใหม่อัตโนมัติ</li>
            </ul>
          </div>
        )}

        {/* Notes for Order SI */}
        {fileType === "si" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (Order SI):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ทำงานแบบ <strong className="font-semibold">เพิ่มข้อมูลใหม่เท่านั้น</strong></li>
              <li>ระบบจะข้ามข้อมูลที่ซ้ำกัน (สาขา + เลขที่ SI + รหัสสินค้า + บาร์โค้ด ตรงกัน) โดยไม่เกิด Error</li>
            </ul>
          </div>
        )}

        {/* Notes for Gourmet */}
        {fileType === "gourmet" && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 p-3 rounded-md border border-blue-200">
            <strong className="font-semibold">หมายเหตุการอัปโหลด (Gourmet):</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700">
              <li>ทำงานแบบ <strong className="font-semibold">เพิ่มยอดขายใหม่</strong> (วันที่, สาขา, สินค้า, จำนวน)</li>
              <li>หากเจอรายการยอดขายที่ซ้ำกันในระบบ จะทำการข้าม(Skip) ข้อมูลนั้นไปอัตโนมัติ</li>
            </ul>
          </div>
        )}

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

        {/* Filter สาขาสำหรับ SKU */}
        {fileType === "SKU" && (
          <div className="mt-6 mb-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Filter by Branch (Download)</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border rounded bg-white truncate"
              disabled={loading}
            >
              <option value="">All Branches</option>
              {filteredBranches?.map((b) => {
                const displayName = b.branch_name.length > 45 ? b.branch_name.substring(0, 42) + '...' : b.branch_name;
                return (
                  <option key={b.branch_code} value={b.branch_code}>
                    {b.branch_code} - {displayName}
                  </option>
                );
              })}
            </select>
          </div>
        )}

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
              downloadXLSXFile("POG_SKU_Template.xlsx", downloadSKU, { branchCode: selectedBranch })
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
        <option value="">-</option>
        <option value="withdraw">Withdraw XLSX</option>
        <option value="stock">Stock XLSX</option>
        <option value="minMax">ItemMinMax XLSX</option>
        <option value="masterItem">MasterItem XLSX</option>
        <option value="bill">Bill XLSX</option>
        {/* <option value="si">Order SI XLSX</option> */}
        {/* <option value="gourmet">Gourmet XLSX</option> */}
      </select>

      {selectedFileType && renderFileUploadForm(selectedFileType)}
    </div>
  );
};

export default UploadCSV;

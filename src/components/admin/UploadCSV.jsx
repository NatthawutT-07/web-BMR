import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import useBmrStore from "../../store/bmr_store";

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
} from "../../api/admin/upload";

// download APIs
import { downloadSKU, downloadTemplate } from "../../api/admin/download";

const UploadCSV = () => {
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const accessToken = useBmrStore((s) => s.accessToken);

  // เลือกประเภทไฟล์
  const handleSelectFileType = (type) => {
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

  // โหลดไฟล์ XLSX (Dynamic Import → ลด bundle)
  const loadXLSX = async () => {
    const XLSX = await import("xlsx");
    return XLSX;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  // Upload handler
  const handleFileUpload = async (uploadFn, label) => {
    if (!files.length) {
      toast.error(`Please select ${label} file`);
      return;
    }

    setLoading(true);

    try {
      for (let file of files) {
        await uploadFn(file);
      }

      toast.success(`${label} upload completed!`);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    }

    setLoading(false);
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
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Choose File Type to Upload
      </h2>

      <select
        className="w-full p-2 border rounded mb-4"
        value={selectedFileType || ""}
        onChange={(e) => handleSelectFileType(e.target.value)}
      >
        <option value="">-- Select --</option>
        {/* <option value="Template">POG Shelf template XLSX</option> */}
        {/* <option value="SKU">POG SKU template XLSX</option> */}
        {/* <option value="sales">Sales XLSX</option> */}
        {/* <option value="withdraw">Withdraw XLSX</option> */}
        {/* <option value="stock">Stock XLSX</option> */}
        {/* <option value="store">Station XLSX</option> */}
        {/* <option value="minMax">ItemMinMax XLSX</option> */}
        {/* <option value="masterItem">MasterItem XLSX</option> */}
        {/* <option value="bill">Bill XLSX</option> */}
        {/* <option value="gourmet">Gourmet XLSX</option> */}
      </select>

      {selectedFileType && renderFileUploadForm(selectedFileType)}
    </div>
  );
};

export default UploadCSV;

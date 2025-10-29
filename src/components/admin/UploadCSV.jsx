import React, { useState, useEffect } from "react";
import {
  uploadSalesDayCSV,
  uploadSalesMonthCSV,
  uploadWithdrawCSV,
  uploadStockCSV,
  uploadTemplateCSV,
  uploadItemSKUCSV,
  uploadStationCSV,
  uploadItemCSV,
  uploadMasterItemCSV,
  uploadPartnersCSV,
} from "../../api/admin/upload";
import useBmrStore from "../../store/bmr_store";
import { toast } from "react-toastify";

const UploadCSV = () => {
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [uploadType, setUploadType] = useState("day");
  const [files, setFiles] = useState([]);
  const [expectedHeaders, setExpectedHeaders] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = useBmrStore((state) => state.token);

  // ✅ header มาตรฐานของแต่ละประเภทไฟล์ (รองรับ uploadType)
  const getDefaultHeaders = (uploadType) => ({
    sales:
      uploadType === "day"
        ?
        ["id", "-", "branchCode", "-", "channelSales", "codeProduct", "-", "-",
          "quantity", "-", "-", "discount", "-", "totalPrice", "day",]
        :
        ["id", "-", "branchCode", "-", "channelSales", "codeProduct", "-", "-",
          "quantity", "-", "-", "discount", "-", "totalPrice", "month", "year",],
    withdraw: ["id", "codeProduct", "-", "-", "-", "branchCode", "docNumber",
      "date", "-", "docStatus", "-", "-", "reason", "quantity", "-", "value",],
    stock: ["id", "codeProduct", "-", "-", "branchCode", "-", "quantity", "-", "-",],
    // Template: ["id", "branchCode", "shelfCode", "fullName", "rowQty", "type"],
    Template: ["id", "StoreCode", "Code", "Name", "rowQty", "type?"],
    // SKU: ["id", "branchCode", "shelfCode", "rowNo", "codeProduct", "index?"],
    SKU: ["id", "StoreCode", "shelfCode", "rowNo", "ItemCode", "index"],
    item: ["id", "branchCode", "-", "ItemCode", "-", "MinStock", "MaxStock"],
    masterItem: ["#", "ItemNo", "ItemDescription", "GroupName", "Status", "-", "-", "-",
      "BarCode", "-", "Name", "ConsignItem", "PurchasePriceExcVAT", "-", "SalesPriceIncVAT",
      "PreferredVendor", "PreferredVendorName", "GP", "ShelfLife", "-", "ProductionDate", "VatGroupPu", "-",],
    partner: [""],
  });

  // ✅ เมื่อเลือกประเภทไฟล์
  const handleSelectFileType = (type) => {
    setSelectedFileType(type);
    setExpectedHeaders(getDefaultHeaders(uploadType)[type] || []);
    setUploadedHeaders([]);
    setFiles([]);
  };

  // ✅ เปลี่ยน header อัตโนมัติเมื่อ uploadType หรือ fileType เปลี่ยน
  useEffect(() => {
    if (selectedFileType) {
      setExpectedHeaders(getDefaultHeaders(uploadType)[selectedFileType] || []);
    }
  }, [uploadType, selectedFileType]);

  // ✅ เมื่อเลือกไฟล์จริง → อ่าน header จากไฟล์ (ข้ามช่องว่าง)
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files) || [];
    setFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const firstLine = text.split(/\r?\n/)[0];
        const headers = firstLine
          .replace(/^\uFEFF/, "") // ✅ ลบ BOM ถ้ามี
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""))
          .filter((h) => h !== ""); // ✅ ข้ามช่องว่างที่ไม่มีชื่อ header
        setUploadedHeaders(headers);
      };
      reader.readAsText(file);
    } else {
      setUploadedHeaders([]);
    }
  };

  // ✅ อัปโหลดไฟล์จริง
  const handleFileUpload = async (uploadFn, label) => {
    if (files.length === 0) {
      toast.error(`Please select ${label} files`, { autoClose: 300 });
      return;
    }

    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFn(file, token, uploadType);
      }
      toast.success(`${label} files uploaded successfully!`, { autoClose: 300 });
      setFiles([]);
      setUploadedHeaders([]);
    } catch (err) {
      toast.error(`Upload ${label} failed: ${err.message}`, { autoClose: 300 });
    } finally {
      setLoading(false);
    }
  };

  const renderFileUploadForm = (fileType) => {
    const labels = {
      sales: "Sales CSV",
      withdraw: "Withdraw CSV",
      stock: "Stock CSV",
      Template: "POG Shelf template CSV",
      SKU: "POG SKU template CSV",
      station: "Station CSV",
      item: "ItemMinMax CSV",
      masterItem: "MasterItem CSV",
      partner: "Partner CSV",
    };

    const uploadFunctions = {
      sales: uploadType === "day" ? uploadSalesDayCSV : uploadSalesMonthCSV,
      withdraw: uploadWithdrawCSV,
      stock: uploadStockCSV,
      Template: uploadTemplateCSV,
      SKU: uploadItemSKUCSV,
      station: uploadStationCSV,
      item: uploadItemCSV,
      masterItem: uploadMasterItemCSV,
      partner: uploadPartnersCSV,
    };

    const maxLength = Math.max(expectedHeaders.length, uploadedHeaders.length);

    return (
      <div className="border rounded-md p-4 bg-gray-50 mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {labels[fileType]}
        </h3>

        {fileType === "sales" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Upload Type
            </label>
            <select
              className="block w-full p-2 border border-gray-300 rounded-md"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
            >
              <option value="day">Daily Sales</option>
              <option value="month">Monthly Sales</option>
            </select>
          </div>
        )}

        <div className="bg-white border border-gray-300 rounded p-3 mb-3 text-sm overflow-x-auto">
          <label className="font-medium text-gray-700 mb-1">Choose Files</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            multiple
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* ✅ ตารางเปรียบเทียบ 2 คอลัมน์ */}
        {expectedHeaders.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Header Comparison:
            </h4>
            <table className="w-full border text-sm bg-white rounded-md overflow-hidden">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="border px-3 py-2 text-center w-1/2">
                    Expected Header (System)
                  </th>
                  <th className="border px-3 py-2 text-center w-1/2">
                    Uploaded File Header
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxLength }).map((_, i) => {
                  const expected = expectedHeaders[i] || "";
                  const uploaded = uploadedHeaders[i] || "";
                  const isPlaceholder = expected === "-" || expected === "";

                  const match =
                    !isPlaceholder &&
                    expected.toLowerCase() === uploaded.toLowerCase();

                  const isDynamic =
                    fileType === "sales" && ["day", "month", "year"].includes(expected);

                  return (
                    <tr key={i}>
                      <td
                        className={`border px-2 py-1 text-center font-medium ${isPlaceholder
                            ? "bg-white text-gray-400"
                            : match
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          } ${isDynamic ? "bg-blue-50 text-blue-700" : ""}`}
                      >
                        {expected || "-"}
                      </td>

                      <td
                        className={`border px-2 py-1 text-center ${isPlaceholder
                            ? "bg-white text-gray-400"
                            : match
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                      >
                        {uploaded || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        <button
          onClick={() =>
            handleFileUpload(uploadFunctions[fileType], labels[fileType])
          }
          disabled={loading}
          className={`mt-4 w-full py-2 text-white rounded ${loading
            ? "opacity-50 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {loading ? (
            <div className="flex items-center justify-center mt-4 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600 mr-2"></div>
              <span>loading...</span>
            </div>
          ) : (
            `Upload ${labels[fileType]}`
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Choose File Type to Upload
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File Type
          </label>
          <select
            className="block w-full p-2 border border-gray-300 rounded-md"
            value={selectedFileType || ""}
            onChange={(e) => handleSelectFileType(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="sales">Sales CSV</option>
            <option value="withdraw">Withdraw CSV</option>
            <option value="stock">Stock CSV</option>
            <option value="Template">POG Shelf template CSV</option>
            <option value="SKU">POG SKU template CSV</option>
            <option value="item">ItemMinMax CSV</option>
            <option value="masterItem">MasterItem CSV(Hold)</option>
            <option value="partner">Partner CSV</option>
          </select>
        </div>

        {selectedFileType && renderFileUploadForm(selectedFileType)}
      </div>
    </div>
  );
};

export default UploadCSV;

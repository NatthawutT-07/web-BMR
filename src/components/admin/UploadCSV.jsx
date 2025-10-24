  import React, { useState } from 'react';
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
  } from '../../api/admin/upload';
  import useBmrStore from '../../store/bmr_store';
  import { toast } from 'react-toastify';

  const UploadCSV = () => {
    const [selectedFileType, setSelectedFileType] = useState(null);
    const [uploadType, setUploadType] = useState('day'); // 'day' for daily, 'month' for monthly
    const [files, setFiles] = useState([]); // เก็บไฟล์ทั้งหมดที่เลือก
    const [loading, setLoading] = useState(false);
    const token = useBmrStore((state) => state.token);

    const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files) || [];
      setFiles(selectedFiles);
    };

    const handleFileUpload = async (uploadFn, label) => {
      if (files.length === 0) {
        toast.error(`Please select ${label} files`), { autoClose: 300 };
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
      } catch (err) {
        toast.error(`Upload ${label} failed: ${err.message}`, { autoClose: 300 });
      } finally {
        setLoading(false);
      }
    };

    const renderFileUploadForm = (fileType) => {
      const labels = {
        sales: 'Sales CSV',
        withdraw: 'Withdraw CSV',
        stock: 'Stock CSV',
        Template: 'POG Shelf template CSV',
        SKU: 'POG SKU template CSV',
        station: 'Station CSV',
        item: 'ItemMinMax CSV',
        masterItem: 'MasterItem CSV',
        partner: 'Partner CSV',
      };

      const uploadFunctions = {
        sales: uploadType === 'day' ? uploadSalesDayCSV : uploadSalesMonthCSV,
        withdraw: uploadWithdrawCSV,
        stock: uploadStockCSV,
        Template: uploadTemplateCSV,
        SKU: uploadItemSKUCSV,
        station: uploadStationCSV,
        item: uploadItemCSV, //min max
        masterItem: uploadMasterItemCSV,
        partner: uploadPartnersCSV,
      };

      return (
        <div className="border rounded-md p-4 bg-gray-50 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{labels[fileType]}</h3>

          {/* แสดง dropdown เลือกประเภทอัพโหลดสำหรับ Sales */}
          {fileType === 'sales' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Upload Type</label>
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

          <button
            onClick={() => handleFileUpload(uploadFunctions[fileType], labels[fileType])}
            disabled={loading}
            className={`mt-4 w-full py-2 text-white rounded ${loading ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center mt-4 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600 mr-2"></div>
                <span>
                  loading...
                </span>
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
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Choose File Type to Upload</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File Type</label>
            <select
              className="block w-full p-2 border border-gray-300 rounded-md"
              value={selectedFileType || ''}
              onChange={(e) => setSelectedFileType(e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="sales">Sales CSV</option>
              <option value="withdraw">Withdraw CSV</option>
              <option value="stock">Stock CSV</option>
              <option value="Template">POG Shelf template CSV</option>
              <option value="SKU">POG SKU template CSV</option>
              {/* <option value="station">Station CSV</option> */}
              <option value="item">ItemMinMax CSV</option>
              <option value="masterItem">MasterItem CSV</option>
              <option value="partner">Partner CSV</option>
            </select>
          </div>

          {selectedFileType && renderFileUploadForm(selectedFileType)}
        </div>
      </div>
    );
  };

  export default UploadCSV;

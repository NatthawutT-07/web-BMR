import React, { useState } from 'react';
import {
  uploadItemCSV,
  uploadMasterItemCSV,
  uploadPartnersCSV,
  uploadSalesCSV,
  uploadStationCSV,
  uploadStockCSV,
  uploadWithdrawCSV,
  uploadTamplateCSV,
  uploadItemSearchCSV
} from '../../api/admin/upload';
import useBmrStore from '../../store/bmr_store';
import { toast } from 'react-toastify';

const UploadCSV = () => {
  const [files, setFiles] = useState({
    station: null,
    item: null,
    masterItem: null,
    partner: null,
    sales: null,
    stock: null,
    withdraw: null,
    tamplate: null,
    itemSearch: null,
  });
  const [loading, setLoading] = useState(false);
  const token = useBmrStore((state) => state.token);

  const handleFileChange = (key) => (e) => {
    const file = e.target.files[0] || null;
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleFileUpload = async (key, uploadFn, label) => {
    const file = files[key];
    if (!file) {
      toast.error(`Please select a ${label} file`);
      return;
    }
    setLoading(true);
    try {
      const response = await uploadFn(file, token);
      toast.success(`Upload ${label} succeeded`);
      // ถ้าต้องการ ล้างไฟล์หลัง upload สำเร็จ:
      setFiles(prev => ({ ...prev, [key]: null }));
    } catch (err) {
      toast.error(`Upload ${label} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderUploadSection = (key, label, uploadFn, btnColor = 'green') => {
    const file = files[key];
    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{label}</h3>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange(key)}
            disabled={loading}
            className="flex-1 border rounded px-2 py-1 bg-white"
          />
          {file && (
            <span className="text-sm text-gray-600 italic truncate max-w-xs">
              {file.name}
            </span>
          )}
        </div>
        <button
          onClick={() => handleFileUpload(key, uploadFn, label)}
          disabled={loading}
          className={`mt-3 w-full py-2 text-white rounded ${
            btnColor === 'green'
              ? 'bg-green-600 hover:bg-green-700'
              : btnColor === 'red'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Uploading...' : `Upload ${label}`}
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload CSV Files</h2>

      <div className="space-y-6">
        {renderUploadSection('station', 'Station CSV', uploadStationCSV, 'blue')}
        {renderUploadSection('item', 'ItemMinMax CSV', uploadItemCSV, 'green')}
        {renderUploadSection('masterItem', 'MasterItem CSV', uploadMasterItemCSV, 'purple')}
        {renderUploadSection('partner', 'Partner CSV', uploadPartnersCSV, 'green')}
        {renderUploadSection('sales', 'Sales CSV', uploadSalesCSV, 'blue')}
        {renderUploadSection('stock', 'Stock CSV', uploadStockCSV, 'blue')}
        {renderUploadSection('withdraw', 'Withdraw CSV', uploadWithdrawCSV, 'orange')}
        {renderUploadSection('tamplate', 'Tamplate CSV', uploadTamplateCSV, 'red')}
        {renderUploadSection('itemSearch', 'ItemSearch CSV', uploadItemSearchCSV, 'red')}
      </div>
    </div>
  );
};

export default UploadCSV;

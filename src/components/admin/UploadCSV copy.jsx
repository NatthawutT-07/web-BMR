import React, { useState } from 'react';
import {
  uploadItemCSV,
  uploadMasterItemCSV,
  uploadPartnersCSV,
  uploadSalesDayCSV,
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
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleFileUpload = async (key, uploadFn, label) => {
    const file = files[key];
    if (!file) {
      toast.error(`Please select a ${label} file`);
      return;
    }
    setLoading(true);
    try {
      await uploadFn(file, token);
      toast.success(`Upload ${label} succeeded`);
      setFiles((prev) => ({ ...prev, [key]: null }));
    } catch (err) {
      toast.error(`Upload ${label} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const csvHeaders = {
    // withdraw: [
    //   'ID', 'codeProduct', 'nameProduct', 'to', 'from', 'branchCode', 'docNumber',
    //   'date', 'time', 'docStatus', 'ref1', 'ref2', 'reason', 'quantity', 'unit', 'value'
    // ],
    // sales: [
    //   'Id', 'system', 'branchCode', 'branchName', 'channelSales', 'codeProduct',
    //   'nameProduct', 'groupProduct', 'quantity', 'unit', 'sales',
    //   'discount', 'averagePrice', 'totalPrice'
    // ],
  };

  const renderUploadSection = (key, label, uploadFn, btnColor = 'green') => {
    const file = files[key];
    const header = csvHeaders[key];
    return (
      <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{label}</h3>

        {header && (
          <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-3 text-sm overflow-x-auto max-w-xs">
            <p className="font-medium text-gray-700 mb-1">
              ตัวอย่าง Header :
            </p>
            <code className="text-gray-800 break-words select-all block whitespace-pre-wrap">
              {header.join(',')}
            </code>
          </div>
        )}

        <div className="flex items-center gap-3 w-full justify-center">
          <label className="cursor-pointer bg-yellow-400 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-150">
            Choose File
            <input
              key={file ? file.name : `${key}-empty`}
              type="file"
              accept=".csv"
              onChange={handleFileChange(key)}
              disabled={loading}
              className="hidden"
            />
          </label>

          {file && (
            <span className="text-sm text-gray-700 italic truncate max-w-xs">{file.name}</span>
          )}
        </div>

        <button
          onClick={() => handleFileUpload(key, uploadFn, label)}
          disabled={loading}
          className={`mt-4 w-full py-2 text-white rounded ${btnColor === 'green'
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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Upload CSV Files</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {renderUploadSection('sales', 'Sales CSV', uploadSalesDayCSV, 'blue')}
        {renderUploadSection('withdraw', 'Withdraw CSV', uploadWithdrawCSV, 'blue')}
        {renderUploadSection('stock', 'Stock CSV', uploadStockCSV, 'blue')}

        {renderUploadSection('tamplate', 'Tamplate CSV', uploadTamplateCSV, 'red')}
        {renderUploadSection('itemDetail', 'ItemDetail CSV', uploadItemSearchCSV, 'red')}

        {renderUploadSection('station', 'Station CSV', uploadStationCSV, 'green')}
        {renderUploadSection('item', 'ItemMinMax CSV', uploadItemCSV, 'green')}
        {renderUploadSection('masterItem', 'MasterItem CSV', uploadMasterItemCSV, 'green')}
        {renderUploadSection('partner', 'Partner CSV', uploadPartnersCSV, 'green')}
      </div>
    </div>
  );
};

export default UploadCSV;

import React from "react";

const BranchSelector = ({
  branches,
  selectedBranchCode,
  onChange,
  onSubmit,
  okLocked,
  onRefreshProduct,
  onDownload,
  onExportPDF,
  pdfLoading
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-2 bg-white p-4 rounded shadow-sm w-full max-w-xl mx-auto"
    >
      <label className="mb-2 font-semibold text-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
        <span>Select Branch</span>
        <span className="text-sm font-normal text-gray-500">
          1/9/25 - 23/11/25
        </span>
      </label>

      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">

        <select
          id="branches"
          value={selectedBranchCode}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full sm:flex-1 text-sm"
        >
          <option value="">-- Select Branch --</option>
          {branches.map((branch, id) => (
            <option key={id} value={branch.branch_code}>
              {id + 1}. {branch.branch_code} - {branch.branch_name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={okLocked || !selectedBranchCode}
          className={`
            px-4 py-2 rounded text-white font-semibold text-sm w-full sm:w-auto
            ${
              okLocked || !selectedBranchCode
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            }
          `}
        >
          {okLocked ? "Loaded" : "OK"}
        </button>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">

        <button
          type="button"
          onClick={() => onDownload(selectedBranchCode)}
          className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-700 w-full sm:w-auto"
        >
          Download CSV
        </button>

        <button
          type="button"
          onClick={onExportPDF}
          disabled={pdfLoading}
          className={`px-4 py-2 text-sm rounded text-white w-full sm:w-auto ${
            pdfLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {pdfLoading ? "กำลังสร้าง PDF..." : "Export PDF"}
        </button>
      </div>
    </form>
  );
};

export default BranchSelector;

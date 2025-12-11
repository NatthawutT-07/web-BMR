import React from "react";

const BranchSelector = React.memo(
  ({
    branches,
    selectedBranchCode,
    onChange,
    onSubmit,
    okLocked,
    onRefreshProduct,
    onDownload,
    downloadLoading,
  }) => {
    const handleSubmit = (e) => {
      if (onSubmit) {
        onSubmit(e);
      }
    };

    const handleRefresh = () => {
      if (!selectedBranchCode || !onRefreshProduct) return;
      onRefreshProduct(selectedBranchCode);
    };

    const handleDownload = () => {
      if (!selectedBranchCode || !onDownload) return;
      onDownload(selectedBranchCode);
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="mb-4 bg-white p-6 rounded-xl shadow-md w-full max-w-2xl mx-auto space-y-4 border border-gray-200"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Select Branch
          </h2>
        </div>

        {/* Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
          <select
            id="branches"
            value={selectedBranchCode}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:flex-1 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Branch --</option>
            {(branches || []).map((branch, idx) => (
              <option
                key={branch.branch_code ?? idx}
                value={branch.branch_code}
              >
                {idx + 1}. {branch.branch_code} - {branch.branch_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={okLocked || !selectedBranchCode}
            className={`px-4 py-2 rounded-lg font-semibold text-sm w-full sm:w-auto transition-all duration-200 ${okLocked || !selectedBranchCode
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500 shadow-md"
              }`}
          >
            {okLocked ? "✅ Loaded" : "✔️ OK"}
          </button>
        </div>

      </form>
    );
  }
);

export default BranchSelector;

{/* Action Buttons */ }
<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
  {/* <button
            type="button"
            onClick={handleRefresh}
            disabled={!selectedBranchCode}
            className={`px-4 py-2 text-sm rounded-lg w-full sm:w-auto transition-all duration-200 ${
              selectedBranchCode
                ? "bg-yellow-500 text-white hover:bg-yellow-600 shadow"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            🔄 Refresh Product
          </button> */}
  {/* 
          <button
            type="button"
            onClick={handleDownload}
            disabled={!selectedBranchCode || downloadLoading}
            className={`px-4 py-2 text-sm rounded-lg w-full sm:w-auto transition-all duration-200 ${
              selectedBranchCode && !downloadLoading
                ? "bg-green-500 text-white hover:bg-green-600 shadow"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {downloadLoading ? "⬇️ Downloading..." : "⬇️ Download XLSX"}
          </button> */}

</div>
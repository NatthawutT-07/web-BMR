import React, { useState, useEffect } from "react";
import api from "../../../../../utils/axios";

const BranchSelector = React.memo(
  ({
    branches,
    selectedbranch_code,
    onChange,
    onSubmit,
    okLocked,
    onRefreshProduct,

  }) => {
    const [activebranch_codes, setActivebranch_codes] = useState([]);

    useEffect(() => {
      const fetchActiveBranches = async () => {
        try {
          const res = await api.get("/active-branches");
          if (Array.isArray(res.data)) {
            // res.data is expected to be array of objects with { code, label }
            setActivebranch_codes(res.data.map(b => b.code));
          }
        } catch (err) {
          console.error("Failed to fetch active branches:", err);
        }
      };
      fetchActiveBranches();
    }, []);

    const handleSubmit = (e) => {
      if (onSubmit) {
        onSubmit(e);
      }
    };

    const handleRefresh = () => {
      if (!selectedbranch_code || !onRefreshProduct) return;
      onRefreshProduct(selectedbranch_code);
    };



    // เรียงสาขาตามตัวเลข (ST001, ST002, ST003...)
    const excludedBranches = [];
    const sortedBranches = [...(branches || [])]
      .filter((b) => !excludedBranches.includes(b.branch_code))
      .filter((b) => activebranch_codes.length === 0 || activebranch_codes.includes(b.branch_code)) // Filter active branches
      .sort((a, b) => {
        const numA = parseInt(a.branch_code?.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.branch_code?.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });

    return (
      <form
        onSubmit={handleSubmit}
        className="mb-4 bg-white p-4 rounded-lg shadow-sm w-full max-w-3xl mx-auto border border-slate-200"
      >
        {/* Selector Row - all inline with wrap */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
            เลือกสาขา:
          </label>

          <select
            id="branches"
            value={selectedbranch_code}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex-1 min-w-[200px]"
          >
            <option value="">-- เลือกสาขา --</option>
            {sortedBranches.map((branchMain, idx) => (
              <option key={branchMain.branch_code ?? idx} value={branchMain.branch_code}>
                {branchMain.branch_code} - {branchMain.branch_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={okLocked || !selectedbranch_code}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${okLocked || !selectedbranch_code
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            {okLocked ? "โหลดแล้ว" : "ดูข้อมูล"}
          </button>

          {/* Action buttons inline */}
          {okLocked && selectedbranch_code && (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 py-2 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 whitespace-nowrap"
              >
                รีเฟรช
              </button>


            </>
          )}
        </div>

        {/* Selected branchMain info (subtle) */}
        {/* {okLocked && selectedBranch && (
          <div className="mt-2 text-xs text-slate-500">
            กำลังดู: <span className="font-medium text-slate-700">{selectedBranch.branch_code} - {selectedBranch.branch_name}</span>
          </div>
        )} */}
      </form>
    );
  }
);

export default BranchSelector;

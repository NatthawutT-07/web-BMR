import React, { useEffect, useState } from "react";
import { RefreshCw, Store } from "lucide-react";
import api from "../../../../../utils/axios";

const BranchSelector = React.memo(
  ({
    branches,
    selectedbranch_code,
    onChange,
    onSubmit,
    okLocked,
    onRefreshProduct,
    onRefreshAll,
    loading,
    actionLoading,
  }) => {
    const [activebranch_codes, setActivebranch_codes] = useState([]);

    useEffect(() => {
      const fetchActiveBranches = async () => {
        try {
          const res = await api.get("/active-branches");
          if (Array.isArray(res.data)) {
            setActivebranch_codes(res.data.map((b) => b.code));
          }
        } catch (err) {
          console.error("Failed to fetch active branches:", err);
        }
      };

      fetchActiveBranches();
    }, []);

    const handleSubmit = (e) => {
      if (onSubmit) onSubmit(e);
    };

    const handleRefreshProduct = () => {
      if (!selectedbranch_code || !onRefreshProduct) return;
      onRefreshProduct(selectedbranch_code);
    };

    const handleRefresh = () => {
      if (onRefreshAll) {
        onRefreshAll();
        return;
      }
      handleRefreshProduct();
    };

    const sortedBranches = [...(branches || [])]
      .filter((branch) => activebranch_codes.length === 0 || activebranch_codes.includes(branch.branch_code))
      .sort((a, b) => {
        const numA = parseInt(a.branch_code?.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.branch_code?.replace(/\D/g, "") || "0", 10);
        return numA - numB;
      });

    return (
      <form
        onSubmit={handleSubmit}
        className="mb-4 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <Store size={20} />
              Shelf Store
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium text-slate-700">
              Select:
            </label>

            <select
              id="branches"
              value={selectedbranch_code}
              onChange={(e) => onChange && onChange(e.target.value)}
              className="w-[520px] max-w-[52vw] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Branch --</option>
              {sortedBranches.map((branch, idx) => (
                <option key={branch.branch_code ?? idx} value={branch.branch_code}>
                  {branch.branch_code} - {branch.branch_name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={okLocked || !selectedbranch_code}
              className={`min-w-[96px] whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
                okLocked || !selectedbranch_code
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {okLocked ? "Loaded" : "View"}
            </button>
          </div>

          <div className="flex justify-end">
            {/* <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || actionLoading}
              className="inline-flex min-w-[106px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading || actionLoading ? "animate-spin" : ""} />
              Refresh
            </button> */}
          </div>
        </div>
      </form>
    );
  }
);

export default BranchSelector;

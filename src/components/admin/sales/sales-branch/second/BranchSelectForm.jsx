import React, { useMemo } from "react";

const BranchSelectForm = React.memo(
  ({ branches, selectedBranchCode, setSelectedBranchCode, onSubmit }) => {
    // Memoize dropdown options
    const branchOptions = useMemo(() => {
      return branches.map((b, idx) => (
        <option key={b.branch_code ?? idx} value={b.branch_code}>
          {idx + 1}. {b.branch_code} - {b.branch_name}
        </option>
      ));
    }, [branches]);

    const handleChange = (e) => setSelectedBranchCode(e.target.value);

    return (
      <form
        onSubmit={onSubmit}
        className="bg-white/95 backdrop-blur rounded-xl shadow-sm border border-slate-200 px-4 py-3 md:px-5 md:py-4 w-full max-w-3xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          <div className="flex-1">
            <label
              htmlFor="branch-sales"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Select branch
            </label>
            <select
              id="branch-sales"
              value={selectedBranchCode}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select branch --</option>
              {branchOptions}
            </select>
          </div>

          <div className="flex-shrink-0 flex items-end md:items-center">
            <button
              type="submit"
              className="mt-2 md:mt-0 inline-flex items-center justify-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!selectedBranchCode}
            >
              OK
            </button>
          </div>
        </div>
      </form>
    );
  }
);

export default BranchSelectForm;

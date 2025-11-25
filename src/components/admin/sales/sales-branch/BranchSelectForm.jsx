const BranchSelectForm = ({ branches, selectedBranchCode, setSelectedBranchCode, onSubmit }) => (
    <form onSubmit={onSubmit} className="mb-4 bg-white p-3 rounded shadow-sm w-full max-w-lg mx-auto">
        <label htmlFor="branch-sales" className="block mb-2 font-semibold text-gray-700">Select Branch</label>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full">
            <select
                id="branch-sales"
                value={selectedBranchCode}
                onChange={(e) => setSelectedBranchCode(e.target.value)}
                className="border border-gray-300 rounded px-2 py-2 w-full sm:flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
            >
                <option value="">-- Select Branch --</option>
                {branches.map((branch, id) => (
                    <option key={branch.branch_code ?? id} value={branch.branch_code}>
                        {id + 1}. {branch.branch_code} - {branch.branch_name}
                    </option>
                ))}
            </select>

            <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-500 transition-colors text-sm w-full sm:w-auto"
            >
                OK
            </button>
        </div>
    </form>
);

export default BranchSelectForm;

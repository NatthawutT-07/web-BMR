const BranchSelector = ({ branches, selectedBranchCode, setSelectedBranchCode, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <label htmlFor="branches" className="block mb-2 font-medium text-gray-700">
        Select Branch
      </label>

      <div className="flex items-center space-x-2">
        <select
          id="branches"
          name="branches"
          value={selectedBranchCode}
          onChange={(e) => setSelectedBranchCode(e.target.value)}
          className="border border-gray-300 rounded p-2 w-200"
        >
          <option value="">-- Select Branch --</option>
          {branches.map((branch, id) => (
            <option key={branch.codeADA ?? id} value={branch.codeADA}>
              {id + 1}. {branch.adaStore} - {branch.codeSAP}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          OK
        </button>
      </div>
    </form>
  );
};

export default BranchSelector;

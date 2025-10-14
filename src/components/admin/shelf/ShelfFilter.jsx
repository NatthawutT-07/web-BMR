const ShelfFilter = ({ shelves, selectedShelves, onToggle, onClear }) => (
  <div className="mb-4">
    <label className="block mb-2 font-medium text-gray-700">🗂 Filter by Shelf</label>
    <div className="flex flex-wrap gap-4 mb-2">
      {[...new Set(shelves)].map((shelfCode) => (
        <label key={shelfCode} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedShelves.includes(shelfCode)}
            onChange={() => onToggle(shelfCode)}
          />
          <span>{shelfCode}</span>
        </label>
      ))}
    </div>
    <button
      onClick={onClear}
      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
    >
      ❌ Clear Filter
    </button>
  </div>
);

export default ShelfFilter;

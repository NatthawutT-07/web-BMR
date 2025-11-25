import React from "react";

const ShelfFilter = ({ shelves, selectedShelves, onToggle, onClear }) => (
  <div className="mb-3 bg-white p-2.5 rounded shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        🗂 Filter by Shelf
      </label>
      <button
        onClick={onClear}
        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs transition-colors"
      >
        ❌ Clear
      </button>
    </div>

    <div className="flex flex-wrap gap-1.5 mb-2">
      {[...new Set(shelves)].map((shelfCode) => (
        <label
          key={shelfCode}
          className="flex items-center space-x-2 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedShelves.includes(shelfCode)}
            onChange={() => onToggle(shelfCode)}
            className="form-checkbox h-3.5 w-3.5 text-blue-600"
          />
          <span>{shelfCode}</span>
        </label>
      ))}
    </div>
  </div>
);

export default ShelfFilter;

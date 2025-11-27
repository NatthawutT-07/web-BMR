import React from "react";

const ShelfFilterUser = ({ shelves, selectedShelves, onToggle, onClear }) => (
  <div className="mb-3 bg-white p-3 rounded shadow-sm">

    {/* Header */}
    <div className="flex items-center justify-between mb-3">
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

    {/* Responsive Shelf Grid */}
    <div
      className="
        grid grid-cols-4
        sm:grid-cols-6 
        md:grid-cols-8
        lg:grid-cols-10
        gap-2
      "
    >
      {[...new Set(shelves)].map((shelfCode) => (
        <label
          key={shelfCode}
          className="
            flex items-center gap-2 
            bg-gray-50 border border-gray-300 
            rounded px-2 py-1.5 
            text-xs 
            hover:bg-gray-100 
            cursor-pointer
            transition
            truncate
          "
        >
          <input
            type="checkbox"
            checked={selectedShelves.includes(shelfCode)}
            onChange={() => onToggle(shelfCode)}
            className="form-checkbox h-4 w-4 text-blue-600 min-w-[16px]"
          />
          <span className="truncate">{shelfCode}</span>
        </label>
      ))}
    </div>
  </div>
);

export default ShelfFilterUser;

import React, { useMemo } from "react";

const ShelfFilter = React.memo(
  ({ shelves, selectedShelves, onToggle, onClear }) => {
    // unique shelves เฉพาะตอน shelves เปลี่ยน
    const uniqueShelves = useMemo(() => [...new Set(shelves)], [shelves]);

    return (
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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

        {/* Shelves grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2"
        >
          {uniqueShelves.map((shelfCode) => (
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
  }
);

export default ShelfFilter;

import React, { useMemo } from "react";

const ShelfFilterAudit = ({ shelves, selectedShelves, onToggle, onClear }) => {
  const uniqueShelves = useMemo(() => [...new Set(shelves)], [shelves]);

  return (
    <div className="mb-3 bg-white p-3 sm:p-4 rounded-lg shadow-sm border print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          🗂 เลือกชั้นวางที่ต้องการตรวจ
        </label>
        <button
          onClick={onClear}
          className="self-start sm:self-auto px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
        >
          ❌ ล้างการเลือกทั้งหมด
        </button>
      </div>

      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {uniqueShelves.map((shelfCode) => (
          <label
            key={shelfCode}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 
                       rounded px-2 py-1.5 text-[11px] sm:text-xs hover:bg-gray-100 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedShelves.includes(shelfCode)}
              onChange={() => onToggle(shelfCode)}
              className="h-4 w-4 text-emerald-600"
            />
            <span className="truncate">{shelfCode}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ShelfFilterAudit;

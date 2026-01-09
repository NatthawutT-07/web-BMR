import React, { useMemo } from "react";

const ShelfFilter = React.memo(
  ({ shelves, selectedShelves, onToggle, onClear }) => {
    // unique shelves เฉพาะตอน shelves เปลี่ยน
    const uniqueShelves = useMemo(() => [...new Set(shelves)], [shelves]);

    return (
      <div className="print:hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            🗂 เลือก Shelf
            {selectedShelves.length > 0 && (
              <span className="text-xs font-normal text-emerald-600">
                ({selectedShelves.length})
              </span>
            )}
          </label>

          {selectedShelves.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] text-slate-500 hover:text-red-600 underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        {/* Shelves grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {uniqueShelves.map((shelfCode) => {
            const isSelected = selectedShelves.includes(shelfCode);
            return (
              <button
                key={shelfCode}
                type="button"
                onClick={() => onToggle(shelfCode)}
                className={`
                  px-2 py-2 rounded-lg text-sm font-bold text-center transition-all
                  ${isSelected
                    ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:border-blue-200'}
                `}
              >
                {shelfCode}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

export default ShelfFilter;

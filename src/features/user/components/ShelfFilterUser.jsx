import React, { useMemo } from "react";

const ShelfFilterUser = ({ shelves, selectedShelves, onToggle, onClear }) => {
  const uniqueShelves = useMemo(() => [...new Set(shelves)], [shelves]);

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-3">
        <label className="text-sm font-semibold text-slate-700">
          เลือก Shelf
          {selectedShelves.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-emerald-600">
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
                  ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'}
              `}
            >
              {shelfCode}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ShelfFilterUser;

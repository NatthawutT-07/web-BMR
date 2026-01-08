import React, { useMemo } from "react";

const ShelfFilterUser = ({ shelves, selectedShelves, onToggle, onClear }) => {
  const uniqueShelves = useMemo(() => [...new Set(shelves)], [shelves]);

  return (
    <div className="mb-3 bg-white p-4 rounded-xl shadow-sm border print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <label className="text-sm font-semibold text-slate-700">
          เลือก Shelf ที่ต้องการดู
          {selectedShelves.length > 0 && (
            <span className="ml-2 text-xs font-normal text-emerald-600">
              (เลือกแล้ว {selectedShelves.length} รายการ)
            </span>
          )}
        </label>
        <button
          onClick={onClear}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
        >
          ล้างทั้งหมด
        </button>
      </div>

      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {uniqueShelves.map((shelfCode) => {
          const isSelected = selectedShelves.includes(shelfCode);
          return (
            <button
              key={shelfCode}
              type="button"
              onClick={() => onToggle(shelfCode)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium text-center transition-all
                ${isSelected
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'}
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

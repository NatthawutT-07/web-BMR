import React, { useMemo } from "react";

const ShelfFilterUser = ({ shelves, selectedShelves, onToggle, onClear }) => {
  const uniqueShelves = useMemo(() => [...new Set(shelves)], [shelves]);
  const hasSelection = selectedShelves.length > 0;

  return (
    <div className="print:hidden">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div>
          <label className="text-sm font-semibold text-slate-800">
            Filter
            {hasSelection && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {selectedShelves.length}
              </span>
            )}
          </label>
          <div className="mt-0.5 text-xs text-slate-500">
            {hasSelection ? "แสดงเฉพาะ Shelf ที่เลือก" : "แสดง Shelf ทั้งหมด"}
          </div>
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-white hover:text-rose-600"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>

      <div className="grid max-h-[300px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 2xl:grid-cols-5">
        {uniqueShelves.map((shelf_code) => {
          const isSelected = selectedShelves.includes(shelf_code);
          return (
            <button
              key={shelf_code}
              type="button"
              onClick={() => onToggle(shelf_code)}
              className={`
                w-full min-h-[54px] rounded-lg px-1 text-xs font-bold text-center transition-all flex items-center justify-center border
                ${isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800'}
              `}
            >
              {shelf_code}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ShelfFilterUser;

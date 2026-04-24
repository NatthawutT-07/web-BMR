import React, { Suspense, lazy } from 'react';

const ShelfFilter = lazy(() => import("../second/ShelfFilter"));

const ShelfSearchFilter = ({ 
  filteredTemplate, 
  loading, 
  selectedShelves, 
  toggleShelfFilter, 
  handleClearFilter,
  searchText,
  handleSearch,
  searchResult,
  setSelectedShelves,
  submittedBranchCode
}) => {
  return (
    <div className="xl:w-[320px] 2xl:w-[380px] flex-shrink-0 flex flex-col gap-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-full">
        <div className="space-y-4">
          {/* Filter */}
          {filteredTemplate.length > 0 && !loading ? (
            <Suspense fallback={<div className="text-sm text-gray-500">Loading filter...</div>}>
              <ShelfFilter
                shelves={filteredTemplate.map((t) => t.shelfCode)}
                selectedShelves={selectedShelves}
                onToggle={toggleShelfFilter}
                onClear={handleClearFilter}
              />
            </Suspense>
          ) : (
            <div className="h-[100px] bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              {/* Empty placeholder */}
            </div>
          )}

          {/* Search */}
          <div className="pt-4 border-t border-slate-200">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              ค้นหาสินค้า (แบรนด์ / บาร์โค้ด)
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder=""
              disabled={!submittedBranchCode}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
            />

            {searchText && (
              <div className="mt-3 border rounded-lg p-2 bg-white max-h-60 overflow-y-auto text-sm shadow-inner">
                {searchResult.length === 0 ? (
                  <div className="text-gray-500 italic text-center py-4">ไม่พบข้อมูล</div>
                ) : (
                  searchResult.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center p-2 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer rounded transition-colors"
                      onClick={() =>
                        item.shelfCode && setSelectedShelves([item.shelfCode])
                      }
                    >
                      <span className="font-semibold text-blue-700 whitespace-nowrap text-xs bg-blue-100 px-2 py-0.5 rounded">
                        {item.shelfCode}/R{item.rowNo}/I{item.index}
                      </span>

                      <span className="text-xs break-all text-slate-600">
                        {item.barcode} • {item.nameProduct} • {item.nameBrand}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfSearchFilter;

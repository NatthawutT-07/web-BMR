import React, { Suspense, lazy } from 'react';

const BranchSelector = lazy(() => import("../second/BranchSelector"));

const ShelfHeader = ({ 
  branches, 
  selectedBranchCode, 
  setSelectedBranchCode, 
  okLocked, 
  setOkLocked, 
  handleSubmit, 
  handleRefreshProduct,
  loading,
  actionLoading
}) => {
  return (
    <>
      <div className="center-to-top">
        <Suspense
          fallback={
            <div className="w-full flex justify-center">
              <div className="text-gray-500 text-sm">Loading branches...</div>
            </div>
          }
        >
          <BranchSelector
            branches={branches || []}
            selectedBranchCode={selectedBranchCode}
            onChange={(val) => {
              setSelectedBranchCode(val);
              setOkLocked(false);
            }}
            okLocked={okLocked}
            onSubmit={handleSubmit}
            onRefreshProduct={handleRefreshProduct}
          />
        </Suspense>
      </div>

      {(loading || actionLoading) && (
        <div className="flex items-center justify-center text-gray-600 mt-4">
          <div className="animate-spin h-5 w-5 border-b-2 border-t-2 border-gray-600 rounded-full mr-2"></div>
          loading...
        </div>
      )}
    </>
  );
};

export default ShelfHeader;

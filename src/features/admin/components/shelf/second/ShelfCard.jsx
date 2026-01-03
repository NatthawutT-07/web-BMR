import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useMemo,
} from "react";

// lazy load component หนัก ๆ
const ShelfTable = lazy(() => import("./third-card/ShelfTable"));
const EditShelfModal = lazy(() => import("./third-card/EditShelfModal"));

const ShelfCard = ({
  template,
  product,
  onAdd,
  onDelete,
  onUpdateProducts,
  actionLoading,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // เปิด/ปิด table
  const [isImageOpen, setIsImageOpen] = useState(false); // ซูมรูปภาพ
  const [localShelfProducts, setLocalShelfProducts] = useState([]);

  /* ------------------------------------------------
   * OPTIMIZE: ใช้ useMemo() ลดการ filter/sort บ่อย ๆ
   * ------------------------------------------------ */
  const filteredShelfProducts = useMemo(() => {
    return product
      .filter((p) => p.shelfCode === template.shelfCode)
      .sort((a, b) => Number(a.index) - Number(b.index));
  }, [product, template.shelfCode]);

  useEffect(() => {
    setLocalShelfProducts(filteredShelfProducts);
  }, [filteredShelfProducts]);

  /* ------------------------------------------------
   * Save after Edit
   * ------------------------------------------------ */
  const handleSaveEdit = async (updatedProducts) => {
    setLocalShelfProducts(updatedProducts);

    if (onUpdateProducts) await onUpdateProducts(updatedProducts);

    setIsEditOpen(false);
    setIsOpen(true);
  };

  return (
    <div className="border rounded shadow-sm p-4 mb-6 bg-white relative">

      {/* LOADING MASK */}
      {actionLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-gray-700">
            <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-700 rounded-full"></div>
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div
        className="flex justify-between items-center mb-3 cursor-pointer select-none hover:bg-gray-50 p-2 rounded"
        onClick={() => {
          if (!actionLoading && !isImageOpen) {
            setIsOpen((prev) => !prev);
          }
        }}
      >
        {/* LEFT: Image + Title */}
        <div className="flex items-center space-x-3">

          {/* Expand image */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsImageOpen((prev) => !prev);
            }}
            className={`rounded border bg-gray-200 flex items-center justify-center 
              text-xs text-gray-500 cursor-pointer transition-all duration-300
              ${isImageOpen ? "w-full h-64 min-h-[250px]" : "w-10 h-10"}`}
          >
            {isImageOpen ? (
              <div className="text-gray-600">[ IMAGE ]</div>
            ) : (
              <span>img</span>
            )}
          </div>

          {!isImageOpen && (
            <h2 className="text-lg font-semibold">
              Shelf: {template.shelfCode} - {template.fullName} ({template.rowQty} Rows)
            </h2>
          )}
        </div>

        {/* Right side buttons */}
        {!isImageOpen && (
          <div className="flex items-center space-x-2">

            {/* Edit button */}
            {isOpen && (
              <button
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditOpen(true);
                }}
                className="px-3 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600"
              >
                Edit
              </button>
            )}

            {/* Toggle */}
            <button
              disabled={actionLoading}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
              className="px-2 py-1 text-lg"
            >
              {isOpen ? "▲" : "▼"}
            </button>
          </div>
        )}
      </div>

      {/* TABLE AREA */}
      {isOpen && !isImageOpen && (
        <Suspense
          fallback={
            <div className="p-3 text-gray-500 text-sm">Loading table...</div>
          }
        >
          <ShelfTable
            rows={template.rowQty}
            shelfProducts={localShelfProducts}
            onDelete={(p) => {
              setLocalShelfProducts((prev) => prev.filter((prod) => prod !== p));
              if (onDelete) onDelete(p);
            }}
            onAdd={(p) => {
              setLocalShelfProducts((prev) => [...prev, p]);
              if (onAdd) onAdd(p);
            }}
            shelfCode={template.shelfCode}
            branchCode={template.branchCode}
          />
        </Suspense>
      )}

      {/* EDIT MODAL */}
      <Suspense
        fallback={
          isEditOpen ? (
            <div className="p-3 text-gray-500 text-sm">Loading editor...</div>
          ) : null
        }
      >
        <EditShelfModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
          shelfProducts={localShelfProducts}
          shelfCode={template.shelfCode}
        />
      </Suspense>
    </div>
  );
};

export default ShelfCard;

import React, { useState, useEffect } from "react";
import ShelfTable from "./third-card/ShelfTable";
import EditShelfModal from "./third-card/EditShelfModal";

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
  const [forceOpen, setForceOpen] = useState(false); // บังคับเปิดหลัง edit

  const [localShelfProducts, setLocalShelfProducts] = useState([]);

  // โหลดสินค้าใน shelf
  useEffect(() => {
    const filtered = product
      .filter((p) => p.shelfCode === template.shelfCode)
      .sort((a, b) => Number(a.index) - Number(b.index));

    setLocalShelfProducts(filtered);
  }, [product, template.shelfCode]);

  // เซฟข้อมูลจาก Modal
  const handleSaveEdit = async (updatedProducts) => {
    setLocalShelfProducts(updatedProducts);

    if (onUpdateProducts) await onUpdateProducts(updatedProducts);

    setIsEditOpen(false);
    setIsOpen(true); // เปิดตารางไว้หลังแก้ไข
    setForceOpen(false);
  };

  return (
    <div className="border rounded shadow-sm p-4 mb-6 bg-white relative">

      {/* Loader */}
      {actionLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-gray-700">
            <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-700 rounded-full"></div>
            <span className="text-sm">The system is working...</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">

        {/* LEFT: Image + Title */}
        <div className="flex items-center space-x-3">

          {/* Expandable Image */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsImageOpen((prev) => !prev);
            }}
            className={`
              rounded border bg-gray-200 flex items-center justify-center text-xs text-gray-500 
              cursor-pointer transition-all duration-300
              ${isImageOpen ? "w-full h-64" : "w-10 h-10"}
            `}
          >
            {isImageOpen ? (
              <div className="text-gray-600">[ รูปภาพใหญ่ ]</div>
            ) : (
              <span>img</span>
            )}
          </div>

          {/* Title — คลิกเปิด/ปิดได้ */}
          {!isImageOpen && (
            <h2
              className="text-lg font-semibold cursor-pointer hover:text-blue-600 select-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
            >
              Shelf: {template.shelfCode} - {template.fullName} ({template.rowQty} Rows)
            </h2>
          )}
        </div>

        {/* RIGHT: Edit + toggle arrow */}
        {!isImageOpen && (
          <div className="flex items-center space-x-2">

            {/* ปุ่ม Edit */}
            {isOpen && (
              <button
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  setForceOpen(true);
                  setIsEditOpen(true);
                }}
                className="px-3 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600"
              >
                Edit
              </button>
            )}

            {/* ปุ่มเปิด/ปิด */}
            <button
              disabled={actionLoading}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
              className="px-2 py-1 text-lg select-none"
            >
              {isOpen ? "▲" : "▼"}
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      {isOpen && !isImageOpen && (
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
      )}

      {/* EDIT MODAL */}
      <EditShelfModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setForceOpen(false);
        }}
        onSave={handleSaveEdit}
        shelfProducts={localShelfProducts}
        shelfCode={template.shelfCode}
      />
    </div>
  );
};

export default ShelfCard;

import React, { useState } from "react";
import ShelfTable from "./ShelfTable";
import ShelfSummary from "./ShelfSummary";
import EditShelfModal from "./EditShelfModal"

const ShelfCard = ({ template, product, onAdd, onDelete, onUpdateProducts, actionLoading }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const shelfProducts = product
    .filter((p) => p.shelfCode === template.shelfCode)
    .sort((a, b) => Number(a.index) - Number(b.index));

  const handleSaveEdit = async (updatedProducts) => {
    if (onUpdateProducts) {
      await onUpdateProducts(updatedProducts);
    }
    setIsEditOpen(false);
  };

  return (
    <div className="border rounded shadow-md p-4 mb-6 bg-white relative">
      {/* 🔹 show overlay load */}
      {actionLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-gray-700">
            <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-700 rounded-full"></div>
            <span>The system is working....</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Shelf: {template.shelfCode} - {template.fullName} ({template.rowQty} Rows)
        </h2>

        <button
          disabled={actionLoading}
          className={`px-3 py-1 rounded text-white text-sm transition ${actionLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
            }`}
          onClick={() => setIsEditOpen(true)}
        >
          ✏️ Edit Shelf-{template.shelfCode}
        </button>
      </div>

      <ShelfTable
        rows={template.rowQty}
        shelfProducts={shelfProducts}
        onDelete={onDelete}
        onAdd={onAdd}
        shelfCode={template.shelfCode}
        actionLoading={actionLoading}
      />

      <ShelfSummary shelfProducts={shelfProducts} />

      <EditShelfModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveEdit}
        shelfProducts={shelfProducts}
        shelfCode={template.shelfCode}
      />
    </div>
  );
};

export default ShelfCard;
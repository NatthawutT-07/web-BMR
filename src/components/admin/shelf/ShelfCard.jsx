import React, { useState } from "react";
import ShelfSummary from "./ShelfSummary";
import ShelfTable from "./ShelfTable";
import EditShelfModal from "./EditShelfModal";
import useShelfData from "../../../hooks/useShelfData";
import useBmrStore from "../../../store/bmr_store";

const ShelfCard = ({ template, product, onAdd, onDelete, onUpdateProducts }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const shelfProducts = product
    .filter((p) => p.shelfCode === template.shelfCode)
    .sort((a, b) => Number(a.index) - Number(b.index));

  const handleSaveEdit = async (updatedProducts) => {
    // sand update database
    if (onUpdateProducts) {
      await onUpdateProducts(updatedProducts);
    }
    setIsEditOpen(false);
  };
 

  return (
    <div className="border rounded shadow-md p-4 mb-6 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Shelf: {template.shelfCode} - {template.fullName} ({template.rowQty} Rows)
        </h2>
        <button
          className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded transition"
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

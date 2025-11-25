import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

const EditShelfModal = ({ isOpen, onClose, onSave, shelfProducts, shelfCode }) => {
  const [originalProducts, setOriginalProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setOriginalProducts([...shelfProducts]);
      setEditedProducts([...shelfProducts]);
    }
  }, [isOpen, shelfProducts]);

  const sensors = useSensors(useSensor(PointerSensor));

  // Group products by rowNo, memoized
  const groupedByRow = useMemo(() => {
    return editedProducts.reduce((acc, prod) => {
      const row = prod.rowNo ?? 0;
      if (!acc[row]) acc[row] = [];
      acc[row].push(prod);
      return acc;
    }, {});
  }, [editedProducts]);

  const rowNumbers = useMemo(() => Object.keys(groupedByRow).map(Number).sort((a, b) => a - b), [groupedByRow]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceIndex = editedProducts.findIndex(p => p.codeProduct === active.id);
    const targetIndex = editedProducts.findIndex(p => p.codeProduct === over.id);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const sourceItem = editedProducts[sourceIndex];
    const targetItem = editedProducts[targetIndex];

    // เปลี่ยน row ของ source ให้เหมือน target
    const updatedProducts = editedProducts.map(p =>
      p.codeProduct === sourceItem.codeProduct
        ? { ...p, rowNo: targetItem.rowNo }
        : p
    );

    // Reorder within the same row
    const rowGroup = updatedProducts
      .filter(p => p.rowNo === targetItem.rowNo)
      .sort((a, b) => a.index - b.index);

    const oldIdx = rowGroup.findIndex(p => p.codeProduct === active.id);
    const newIdx = rowGroup.findIndex(p => p.codeProduct === over.id);
    const reorderedGroup = arrayMove(rowGroup, oldIdx, newIdx).map((p, idx) => ({
      ...p,
      index: idx + 1,
    }));

    // Merge back other rows
    const finalProducts = [
      ...updatedProducts.filter(p => p.rowNo !== targetItem.rowNo),
      ...reorderedGroup,
    ].sort((a, b) => a.rowNo - b.rowNo || a.index - b.index);

    setEditedProducts(finalProducts);
  };

  const handleSave = () => onSave(editedProducts);
  const handleCancel = () => {
    setEditedProducts([...originalProducts]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl ring-1 ring-gray-300 flex flex-col">

        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">🛒 Edit Shelf: {shelfCode}</h3>
          <button
            onClick={handleCancel}
            className="text-white text-2xl leading-none hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-white">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {rowNumbers.map((row) => {
              const items = groupedByRow[row]?.sort((a, b) => a.index - b.index) || [];
              return (
                <div key={row} className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Row {row}</h4>
                  <SortableContext
                    items={items.map((p) => p.codeProduct)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((prod, index) => (
                      <SortableItem key={prod.codeProduct} item={prod} index={index} />
                    ))}
                  </SortableContext>
                </div>
              );
            })}
          </DndContext>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditShelfModal;

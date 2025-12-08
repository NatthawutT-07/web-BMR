import React, { useState, useEffect, useMemo, useCallback } from "react";
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

  /* --------------------------------------------
   * เปิด Modal → โหลดข้อมูลทีเดียว
   * -------------------------------------------- */
  useEffect(() => {
    if (isOpen) {
      setOriginalProducts(shelfProducts);
      setEditedProducts(shelfProducts);
    }
  }, [isOpen, shelfProducts]);

  /* --------------------------------------------
   * SENSOR ใช้แค่ Pointer → เบาที่สุด
   * -------------------------------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /* --------------------------------------------
   * Group by Row → memo ลดการคำนวณ 90%
   * -------------------------------------------- */
  const groupedByRow = useMemo(() => {
    const groups = {};
    for (const p of editedProducts) {
      const row = p.rowNo ?? 0;
      if (!groups[row]) groups[row] = [];
      groups[row].push(p);
    }
    return groups;
  }, [editedProducts]);

  const rowNumbers = useMemo(
    () => Object.keys(groupedByRow).map(Number).sort((a, b) => a - b),
    [groupedByRow]
  );

  /* --------------------------------------------
   * DRAG LOGIC (เลือกเฉพาะเฉพาะจุดที่จำเป็น)
   * -------------------------------------------- */
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const edited = [...editedProducts];

      const srcIndex = edited.findIndex(p => p.codeProduct === active.id);
      const dstIndex = edited.findIndex(p => p.codeProduct === over.id);
      if (srcIndex === -1 || dstIndex === -1) return;

      const srcItem = edited[srcIndex];
      const dstItem = edited[dstIndex];

      const targetRow = dstItem.rowNo;

      // เปลี่ยน row ถ้าโยนไปแถวใหม่
      edited[srcIndex] = { ...srcItem, rowNo: targetRow };

      // ดึง row ปลายทางมาวางใหม่
      const sameRow = edited
        .filter(p => p.rowNo === targetRow)
        .sort((a, b) => a.index - b.index);

      const oldIdx = sameRow.findIndex(p => p.codeProduct === active.id);
      const newIdx = sameRow.findIndex(p => p.codeProduct === over.id);

      const reordered = arrayMove(sameRow, oldIdx, newIdx).map((p, i) => ({
        ...p,
        index: i + 1,
      }));

      const merged = [
        ...edited.filter(p => p.rowNo !== targetRow),
        ...reordered,
      ].sort((a, b) => a.rowNo - b.rowNo || a.index - b.index);

      setEditedProducts(merged);
    },
    [editedProducts]
  );

  /* --------------------------------------------
   * SAVE / CANCEL
   * -------------------------------------------- */
  const handleSave = useCallback(() => onSave(editedProducts), [editedProducts]);
  const handleCancel = useCallback(() => {
    setEditedProducts(originalProducts);
    onClose();
  }, [originalProducts, onClose]);

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
              const items = groupedByRow[row]
                ?.slice()
                .sort((a, b) => a.index - b.index);

              return (
                <div key={row} className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Row {row}
                  </h4>

                  <SortableContext
                    items={items.map((p) => p.codeProduct)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((prod, index) => (
                      <SortableItem
                        key={prod.codeProduct}
                        item={prod}
                        index={index}
                      />
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

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

const EditShelfModal = ({ isOpen, onClose, onSave, shelfProducts, shelfCode, rowQty }) => {
  
  const [originalProducts, setOriginalProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState([]);
  const [activeId, setActiveId] = useState(null);

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

  // Generate an array of row numbers from 1 to rowQty
  const rowNumbers = useMemo(
    () => Array.from({ length: rowQty }, (_, i) => i + 1),
    [rowQty]
  );

  /* --------------------------------------------
   * DRAG LOGIC (เลือกเฉพาะเฉพาะจุดที่จำเป็น)
   * -------------------------------------------- */
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dragging over an empty row (the over.id will be a string like 'empty-row-1')
    if (typeof overId === 'string' && overId.startsWith('empty-row-')) {
      const targetRow = parseInt(overId.replace('empty-row-', ''), 10);
      
      setEditedProducts((prev) => {
        const activeIndex = prev.findIndex(p => p.codeProduct === activeId);
        if (activeIndex === -1) return prev;
        
        const activeItem = prev[activeIndex];
        if (activeItem.rowNo === targetRow) return prev; // Already in the target row
        
        const newProducts = [...prev];
        newProducts[activeIndex] = { ...activeItem, rowNo: targetRow, index: 1 };
        return newProducts;
      });
      return;
    }

    if (activeId === overId) return;

    setEditedProducts((prev) => {
      const activeIndex = prev.findIndex(p => p.codeProduct === activeId);
      const overIndex = prev.findIndex(p => p.codeProduct === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const activeItem = prev[activeIndex];
      const overItem = prev[overIndex];

      if (activeItem.rowNo !== overItem.rowNo) {
        // Moving to a different row
        const newProducts = [...prev];
        newProducts[activeIndex] = { ...activeItem, rowNo: overItem.rowNo };
        return newProducts;
      }

      return prev;
    });
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      if (activeId === overId) return;

      setEditedProducts((prev) => {
        const edited = [...prev];
        const activeIndex = edited.findIndex(p => p.codeProduct === activeId);
        const overIndex = edited.findIndex(p => p.codeProduct === overId);

        if (activeIndex === -1) return prev;

        const activeItem = edited[activeIndex];
        let targetRow = activeItem.rowNo;

        // If dropped on an empty row
        if (typeof overId === 'string' && overId.startsWith('empty-row-')) {
            targetRow = parseInt(overId.replace('empty-row-', ''), 10);
            edited[activeIndex] = { ...activeItem, rowNo: targetRow };
        } else if (overIndex !== -1) {
            targetRow = edited[overIndex].rowNo;
            edited[activeIndex] = { ...activeItem, rowNo: targetRow };
        }

        // Reorder within the row
        const sameRow = edited
          .filter(p => p.rowNo === targetRow)
          .sort((a, b) => a.index - b.index);

        const oldIdx = sameRow.findIndex(p => p.codeProduct === activeId);
        let newIdx = oldIdx;
        
        if (typeof overId !== 'string' || !overId.startsWith('empty-row-')) {
             newIdx = sameRow.findIndex(p => p.codeProduct === overId);
        }

        let reordered;
        if (oldIdx !== -1 && newIdx !== -1) {
             reordered = arrayMove(sameRow, oldIdx, newIdx).map((p, i) => ({
                ...p,
                index: i + 1,
              }));
        } else {
            reordered = sameRow.map((p, i) => ({...p, index: i+1}));
        }

        const merged = [
          ...edited.filter(p => p.rowNo !== targetRow),
          ...reordered,
        ].sort((a, b) => a.rowNo - b.rowNo || a.index - b.index);

        return merged;
      });
    },
    []
  );

  // For the DragOverlay
  const activeProduct = useMemo(() => {
    if (!activeId) return null;
    return editedProducts.find((p) => p.codeProduct === activeId);
  }, [activeId, editedProducts]);

  /* --------------------------------------------
   * SAVE / CANCEL
   * -------------------------------------------- */
  const handleSave = useCallback(() => onSave(editedProducts), [editedProducts, onSave]);
  const handleCancel = useCallback(() => {
    setEditedProducts(originalProducts);
    onClose();
  }, [originalProducts, onClose]);

  if (!isOpen) return null;

  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-xl ring-1 ring-gray-300 flex flex-col">

        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-3 flex justify-between items-center">
          <h3 className="text-base font-semibold">Edit Shelf: {shelfCode}</h3>
          <button
            onClick={handleCancel}
            className="text-white text-2xl leading-none hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-3 overflow-y-auto flex-1 bg-gray-50">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              {rowNumbers.map((row) => {
                const items = groupedByRow[row]
                  ?.slice()
                  .sort((a, b) => a.index - b.index) || [];

                return (
                  <div key={row} className="bg-white border rounded-md shadow-sm overflow-hidden">
                    <div className="bg-gray-100 border-b px-3 py-1.5 font-semibold text-gray-700 flex justify-between items-center">
                        <span className="text-sm">Row: {row}</span>
                        <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border shadow-sm">
                            {items.length} items
                        </span>
                    </div>
                    
                    <div className="p-2 min-h-[50px]">
                        <SortableContext
                        items={items.map((p) => p.codeProduct).concat([`empty-row-${row}`])} // Allow dropping on empty row
                        strategy={verticalListSortingStrategy}
                        >
                        {items.length > 0 ? (
                            <div className="space-y-1">
                                {items.map((prod, index) => (
                                <SortableItem
                                    key={prod.codeProduct}
                                    item={prod}
                                    index={index}
                                />
                                ))}
                            </div>
                        ) : (
                            // Render a drop zone for empty rows
                            <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md py-3 text-gray-400 text-xs">
                                No products in this Row. Drop here.
                            </div>
                        )}
                        {/* Hidden item to act as a target for empty row drops if it's not totally empty, but helps DndKit */}
                        <div id={`empty-row-${row}`} style={{ display: 'none' }} />
                        </SortableContext>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeProduct ? (
                <div className="opacity-90 shadow-xl ring-2 ring-green-500 scale-105 cursor-grabbing z-50">
                  <SortableItem
                    item={activeProduct}
                    index={activeProduct.index - 1} // Just for visual in overlay
                    isDragging={true}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex justify-end gap-3 bg-gray-100">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm bg-white border text-gray-700 rounded hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 shadow-sm transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditShelfModal;

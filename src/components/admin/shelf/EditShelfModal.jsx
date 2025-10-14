import React, { useState, useEffect } from "react";
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
import { act } from "react";

const EditShelfModal = ({ isOpen, onClose, onSave, shelfProducts, shelfCode }) => {
  const [originalProducts, setOriginalProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setOriginalProducts([...shelfProducts]);
      setEditedProducts([...shelfProducts]);
    }
  }, [isOpen, shelfProducts]);


  const sensors = useSensors(useSensor(PointerSensor)); //Drag & Drop Sensor  ให้ระบบ DnD ใช้ pointer (เมาส์/นิ้ว) เป็นตัวจับ event การลาก

  const groupedByRow = editedProducts.reduce((acc, prod) => { //(rowNo)
    const row = prod.rowNo ?? 0;
    if (!acc[row]) acc[row] = [];
    acc[row].push(prod);
    return acc;
  }, {});

  const rowNumbers = Object.keys(groupedByRow).map(Number).sort((a, b) => a - b);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    // console.log("event : ", event)

    if (!over || active.id === over.id) return;
    // console.log("active : ", active, " ||  over :", over)

    const sourceItem = editedProducts.find(p => p.codeProduct === active.id);
    const targetItem = editedProducts.find(p => p.codeProduct === over.id);
    // console.log("sourceItem : ", sourceItem, "|||| targetItem : ", targetItem)


    if (!sourceItem || !targetItem) return;

    const updated = [...editedProducts];
    // console.log("updated : ", updated)
    // เปลี่ยน row ของ source ให้เหมือน target
    sourceItem.rowNo = targetItem.rowNo;
    // console.log("sourceItem.rowNo : ", sourceItem.rowNo, "targetIem.rowNo : ", targetItem.rowNo)
    // new Group
    const updatedGroup = updated
      .filter(p => p.rowNo === sourceItem.rowNo)
      .sort((a, b) => a.index - b.index);
    // console.log("updatedGroup : ", updatedGroup)

    const oldIndex = updatedGroup.findIndex(p => p.codeProduct === active.id);
    const newIndex = updatedGroup.findIndex(p => p.codeProduct === over.id);
    // console.log("oldIndex : ", oldIndex, "|| newIndex :", newIndex)

    const reordered = arrayMove(updatedGroup, oldIndex, newIndex);
    // console.log("reordered : ", reordered)

    // update new
    reordered.forEach((p, idx) => {
      p.index = idx + 1;
    });
    // console.log("reordered : ", reordered)

    // update for back Array main
    const newProducts = [
      ...updated.filter(p => p.rowNo !== sourceItem.rowNo),
      ...reordered,
    ];
    // console.log("newProduct : ", newProducts)

    // Group and re-index all products by rowNo
    const regrouped = newProducts
      .reduce((acc, item) => {
        if (!acc[item.rowNo]) acc[item.rowNo] = [];
        acc[item.rowNo].push(item);
        return acc;
      }, {});

    const fullyIndexed = Object.values(regrouped).flatMap(group => {
      const sortedGroup = group.sort((a, b) => a.index - b.index);
      return sortedGroup.map((item, idx) => ({
        ...item,
        index: idx + 1,
      }));
    });

    // console.log("fullyIndexed : ", fullyIndexed);

    setEditedProducts(fullyIndexed);

  };

  const handleSave = () => {
    onSave(editedProducts);
  };

  const handleCancel = () => {
    setEditedProducts([...originalProducts]);
    onClose();
  };




  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl ring-1 ring-gray-300">

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
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)] bg-white">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {rowNumbers.map((row) => {
              const items = groupedByRow[row].sort((a, b) => a.index - b.index);
              return (
                <div key={row} className="mb-2">
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

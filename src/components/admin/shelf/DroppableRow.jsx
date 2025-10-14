// DroppableRow.jsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";

const DroppableRow = ({ rowId, children }) => {
  const { setNodeRef } = useDroppable({
    id: `row-${rowId}`, // ให้ id ชัดเจนว่าเป็น row
  });

  return (
    <div ref={setNodeRef} className="mb-6 border-b pb-2">
      <h4 className="text-md font-bold mb-2 text-gray-700">Row {rowId}</h4>
      <div>
        {children}
      </div>
    </div>
  );
};

export default DroppableRow;

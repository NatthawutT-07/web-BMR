import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const EmptyRowDropZone = React.memo(({ rowId, isEmpty }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } =
    useSortable({ id: rowId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // When row already has items, render a minimal but measurable element
  if (!isEmpty) {
    return <div ref={setNodeRef} style={{ ...style, height: 0 }} {...attributes} />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        w-full flex items-center justify-center border-2 border-dashed rounded-md py-4 text-xs transition-colors
        ${isOver ? "border-green-400 bg-green-50 text-green-500" : "border-gray-300 text-gray-400"}
      `}
    >
      No products in this Row. Drop here.
    </div>
  );
});

export default EmptyRowDropZone;

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ item, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.codeProduct });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-300 px-2 py-1 mb-0.5 text-xs font-mono grid grid-cols-[30px_80px_1fr_60px] items-center hover:bg-gray-50 cursor-move"
    >
      <div className="text-center">{index + 1}</div>
      <div className="text-center">{String(item.codeProduct).padStart(5, "0")}</div>
      <div className="whitespace-nowrap overflow-hidden">{item.nameProduct}</div>
      <div className="text-center">{item.stockQuantity ?? "-"}</div>
    </div>
  );
};

export default SortableItem;

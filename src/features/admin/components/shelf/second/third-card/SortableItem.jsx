import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = React.memo(({ item, index }) => {
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
      className="
        bg-white border border-gray-300 px-4 py-2 text-sm font-sans
        grid grid-cols-[30px_80px_1fr_270px]
        items-center hover:bg-gray-50 cursor-move rounded-lg
      "
    >
      {/* Running No. */}
      <div className="text-center text-gray-700">{index + 1}</div>

      {/* Code Product */}
      <div className="text-center text-gray-700">
        {String(item.codeProduct).padStart(5, "0")}
      </div>

      {/* Product Name */}
      <div className="whitespace-nowrap overflow-hidden text-gray-700 text-sm">
        {item.nameProduct}
      </div>

      {/* Brand */}
      <div
        className="text-left text-gray-700 text-sm overflow-hidden whitespace-nowrap text-ellipsis"
        style={{ maxWidth: "150px" }}
      >
        {item.nameBrand ?? "-"}
      </div>
    </div>
  );
});

export default SortableItem;

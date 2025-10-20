import React, { useState } from "react";
import useShelfData from "../../../hooks/useShelfData";
import useShelfActions from "../../../hooks/useShelfActions";
import useBmrStore from "../../../store/bmr_store";
import ShelfFilter from "./ShelfFilter";
import ShelfCard from "./ShelfCard";
import BranchSelector from "./BranchSelector";

const ShelfManager = () => {
  const token = useBmrStore((s) => s.token);
  const { branches, template, product, loading, fetchProduct } = useShelfData(token);
  const {
    handleAddProduct,
    handleDelete,
    handleUpdateProducts,
    actionLoading,
  } = useShelfActions(token, fetchProduct);

  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedShelves, setSelectedShelves] = useState([]);
  const [filteredTemplate, setFilteredTemplate] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const matched = template.filter(
      (item) => String(item.branchCode) === String(selectedBranchCode)
    );
    setFilteredTemplate(matched);
    fetchProduct(selectedBranchCode);
  };

  const toggleShelfFilter = (code) =>
    setSelectedShelves((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  const handleClearFilter = () => setSelectedShelves([]);

  const displayedTemplates = selectedShelves.length
    ? filteredTemplate.filter((t) => selectedShelves.includes(t.shelfCode))
    : filteredTemplate;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BranchSelector
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        onChange={setSelectedBranchCode}
        onSubmit={handleSubmit}
      />

      {/* 🔸 show status load data */}
      {(loading || actionLoading) && (
        <div className="flex items-center justify-center mt-4 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600 mr-2"></div>
          <span>
            {actionLoading ? "loading..." : "loading..."}
          </span>
        </div>
      )}

      {filteredTemplate.length > 0 && !loading && (
        <ShelfFilter
          shelves={filteredTemplate.map((t) => t.shelfCode)}
          selectedShelves={selectedShelves}
          onToggle={toggleShelfFilter}
          onClear={handleClearFilter}
        />
      )}

      {!loading &&
        displayedTemplates.map((t) => (
          <ShelfCard
            key={t.shelfCode}
            template={t}
            product={product}
            onAdd={(item) => handleAddProduct(selectedBranchCode, item)}
            actionLoading={actionLoading}
            onDelete={(p) => handleDelete(selectedBranchCode, p)}
            onUpdateProducts={(updated) =>
              handleUpdateProducts(selectedBranchCode, updated)
            }
          />
        ))}
    </div>
  );
};

export default ShelfManager;

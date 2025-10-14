import React, { useState } from 'react';
import useShelfData from '../../../hooks/useShelfData';

import useBmrStore from '../../../store/bmr_store';
import ShelfFilter from './ShelfFilter';
import ShelfCard from './ShelfCard';
import BranchSelector from './BranchSelector';
import { addTemplate, deleteTemplate, updateProducts } from '../../../api/admin/tamplate';

const ShelfManager = () => {
  const token = useBmrStore((s) => s.token);
  const { branches, tamplate, product, loading, fetchProduct } = useShelfData(token);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [selectedShelves, setSelectedShelves] = useState([]);
  const [filteredTamplate, setFilteredTamplate] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const matched = tamplate.filter(
      (item) => String(item.branchCode) === String(selectedBranchCode)
    );
    setFilteredTamplate(matched);
    fetchProduct(selectedBranchCode);
  };

  const toggleShelfFilter = (code) =>
    setSelectedShelves((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  const handleClearFilter = () => setSelectedShelves([]);

  const displayedTemplates = selectedShelves.length
    ? filteredTamplate.filter((t) => selectedShelves.includes(t.shelfCode))
    : filteredTamplate;


  const handleAddProduct = async (newItem) => {
    try {
      await addTemplate(token, newItem)
      // alert("✅ success");
      fetchProduct(selectedBranchCode);
    } catch (error) {
      console.error("Add failed:", error);
      alert("error add data");
    }
  };

  // Delete Product
  const handleDelete = async (product) => {
    try {
      await deleteTemplate(token, product)
      // alert("✅ success");
      fetchProduct(selectedBranchCode);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // update EditShelfModal
  const handleUpdateProducts = async (updatedProducts) => {
    try {
      const res = await updateProducts(token, updatedProducts);

      if (res.success) {
        console.log("✅ success:", res.message);
        fetchProduct(selectedBranchCode);
      } else {
        console.error("❌ update failed:", res.message);
        alert(res.message);
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <BranchSelector
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        onChange={setSelectedBranchCode}
        onSubmit={handleSubmit}
      />

      {loading && <p className="text-center mt-4 text-gray-600">⏳ Loading data...</p>}

      {filteredTamplate.length > 0 && (
        <ShelfFilter
          shelves={filteredTamplate.map(t => t.shelfCode)}
          selectedShelves={selectedShelves}
          onToggle={toggleShelfFilter}
          onClear={handleClearFilter}
        />
      )}

      {displayedTemplates.map((t) => (
        <ShelfCard
          key={t.id}
          template={t}
          onAdd={handleAddProduct}
          product={product}
          onDelete={handleDelete}
          onUpdateProducts={handleUpdateProducts} />
         
      ))}
    </div>
  );
};

export default ShelfManager;

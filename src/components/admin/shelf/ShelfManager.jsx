import React, { useEffect, useState, useRef } from "react";
import useBmrStore from "../../../store/bmr_store";
import ShelfFilter from "./second/ShelfFilter";
import ShelfCard from "./second/ShelfCard";
import BranchSelector from "./second/BranchSelector";
import useShelfStore from "../../../store/shelf_store";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ShelfManager = () => {
  const token = useBmrStore(s => s.token);
  const {
    branches,
    template,
    product,
    loading,
    actionLoading,
    fetchBranches,
    fetchTemplate,
    fetchProduct,
    handleAddProduct,
    handleDelete,
    handleUpdateProducts,
    refreshDataProduct,
    downloadTemplate
  } = useShelfStore();

  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [submittedBranchCode, setSubmittedBranchCode] = useState("");

  const [selectedShelves, setSelectedShelves] = useState([]);
  const [filteredTemplate, setFilteredTemplate] = useState([]);

  // 🔒 LOCK BUTTON
  const [okLocked, setOkLocked] = useState(false);

  const captureRef = useRef(null);

  useEffect(() => {
    if (token) {
      useShelfStore.getState().setToken(token);
      fetchBranches();
      fetchTemplate();
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔒 LOCK ปุ่ม OK
    setOkLocked(true);

    const matched = template.filter(
      item => String(item.branchCode) === String(selectedBranchCode)
    );
    setFilteredTemplate(matched);

    fetchProduct(selectedBranchCode);
    setSubmittedBranchCode(selectedBranchCode);
  };

  const toggleShelfFilter = (code) =>
    setSelectedShelves(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );

  const handleClearFilter = () => setSelectedShelves([]);

  const displayedTemplates =
    selectedShelves.length > 0
      ? filteredTemplate.filter(t => selectedShelves.includes(t.shelfCode))
      : filteredTemplate.sort((a, b) => a.shelfCode.localeCompare(b.shelfCode));

  const handleRefreshProduct = (branchCode) => {
    refreshDataProduct(branchCode);
  };

  const handleDownloadTemplate = (branchCode) => {
    downloadTemplate(branchCode);
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!captureRef.current) return;
    setPdfLoading(true);

    try {
      const element = captureRef.current;

      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const paddingLeftRight = 20;
      const paddingTopBottom = 30;
      const pdfContentWidth = pdfWidth - 2 * paddingLeftRight;
      const pdfContentHeight = pdfHeight - 2 * paddingTopBottom;

      let startY = 0;

      while (startY < canvas.height) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;

        const sliceHeight = Math.min(
          canvas.height - startY,
          (pdfContentHeight * canvas.width) / pdfContentWidth
        );

        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.7);

        pdf.addImage(
          imgData,
          "JPEG",
          paddingLeftRight,
          paddingTopBottom,
          pdfContentWidth,
          (sliceHeight * pdfContentWidth) / canvas.width
        );

        startY += sliceHeight;

        if (startY < canvas.height) pdf.addPage();
      }

      pdf.save(`branch_${submittedBranchCode}_A4.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  const imageUrl = submittedBranchCode
    ? `/images/branch/${submittedBranchCode}.png`
    : "";

  return (
    <div className="container mx-auto p-6 space-y-6">

      <BranchSelector
        branches={branches}
        selectedBranchCode={selectedBranchCode}
        onChange={(val) => {
          setSelectedBranchCode(val);

          // 🔓 UNLOCK OK เมื่อเปลี่ยน select ใหม่
          setOkLocked(false);
        }}
        okLocked={okLocked}
        onSubmit={handleSubmit}
        onRefreshProduct={handleRefreshProduct}
        onDownload={handleDownloadTemplate}
        onExportPDF={handleDownloadPDF}
        pdfLoading={pdfLoading}
      />

      {(loading || actionLoading) && (
        <div className="flex items-center justify-center mt-4 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600 mr-2"></div>
          <span>loading...</span>
        </div>
      )}

      <div ref={captureRef}>

        {submittedBranchCode && (
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <img
              src={imageUrl}
              alt={`Branch ${submittedBranchCode}`}
              className="w-full max-w-xs object-cover rounded"
              loading="lazy"
            />
          </div>
        )}

        {filteredTemplate.length > 0 && !loading && (
          <ShelfFilter
            shelves={filteredTemplate.map(t => t.shelfCode)}
            selectedShelves={selectedShelves}
            onToggle={toggleShelfFilter}
            onClear={handleClearFilter}
          />
        )}

        {!loading &&
          displayedTemplates.map(t => (
            <ShelfCard
              key={t.shelfCode}
              template={t}
              product={product}
              onAdd={item => handleAddProduct(item)}
              actionLoading={actionLoading}
              onDelete={p => handleDelete(p)}
              onUpdateProducts={updated => handleUpdateProducts(updated)}
            />
          ))}
      </div>
    </div>
  );
};

export default ShelfManager;

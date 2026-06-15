import React, { useEffect, useMemo, useRef, useState } from "react";
import ShelfTableUser from "./ShelfTableUser";

const ShelfCardUser = React.memo(function ShelfCardUser({
  shelfTemplate,
  autoOpen,
  isPrinting,
  openNonce,
  branchName = "",
  availableShelves = [],
  duplicateCodes,
}) {
  const shelfProducts = useMemo(
    () => (Array.isArray(shelfTemplate.shelfProducts) ? shelfTemplate.shelfProducts : []),
    [shelfTemplate.shelfProducts]
  );

  const shelf_code = shelfTemplate.shelf_code || "-";
  const shelf_name = shelfTemplate.shelf_name || "";
  const shelf_total_row = shelfTemplate.shelf_total_row || 1;

  const [isOpen, setIsOpen] = useState(false);

  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    if (openNonce) setIsOpen(true);
  }, [openNonce]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let observer;
    if (isOpen || isPrinting) {
      observer = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          if (contentRef.current) {
            setMaxH(contentRef.current.scrollHeight || 0);
          }
        });
      });
      observer.observe(el);
      
      requestAnimationFrame(() => {
        setMaxH(el.scrollHeight || 0);
      });
    } else {
      setMaxH(0);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isOpen, isPrinting, shelfProducts.length]);

  const toggleOpen = () => setIsOpen((o) => !o);

  const shouldRenderTable = isOpen || isPrinting;

  return (
    <div
      className="
        border rounded-lg bg-white mb-4
        shadow-sm hover:shadow-md transition-shadow duration-200
        print:shadow-none print:border-black
      "
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={toggleOpen}
        className="
          w-full flex justify-between items-center
          px-3 sm:px-4 py-2 sm:py-3
          cursor-pointer select-none
          hover:bg-gray-50 active:bg-gray-100
          rounded-t-lg
        "
      >
        <h2 className="text-base sm:text-lg font-bold text-slate-800 text-left">
          {shelf_code}{shelf_name ? ` - ${shelf_name}` : ""} <span className="text-slate-500 font-normal">({shelf_total_row} ชั้น)</span>
        </h2>

        <div
          className={`
            ml-2 print:hidden text-slate-500
            transition-transform duration-300 ease-out
            ${isOpen ? "rotate-180" : "rotate-0"}
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* CONTENT */}
      <div
        ref={contentRef}
        className="
          px-2 sm:px-3 pb-3 sm:pb-4
          overflow-hidden
          transition-[max-height,opacity] duration-300 ease-out
          print:block print:opacity-100 print:max-h-none
        "
        style={{
          maxHeight: isPrinting ? "none" : `${maxH}px`,
          opacity: isOpen || isPrinting ? 1 : 0,
        }}
      >
        <div className="mt-2">
          {shouldRenderTable ? (
            <ShelfTableUser
              shelfProducts={shelfProducts}
              branchName={branchName}
              availableShelves={availableShelves}
              duplicateCodes={duplicateCodes}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default ShelfCardUser;

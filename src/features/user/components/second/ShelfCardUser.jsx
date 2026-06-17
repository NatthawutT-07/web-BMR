import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Layers3 } from "lucide-react";
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
  const itemCount = shelfProducts.length;

  return (
    <div
      className="
        print-shelf-card
        border border-slate-200 rounded-lg bg-white mb-4
        shadow-sm hover:shadow-md transition-shadow duration-200
        print:shadow-none print:border-black
      "
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={toggleOpen}
        className="
          w-full flex justify-between items-center gap-3
          px-3 sm:px-4 py-3
          cursor-pointer select-none
          hover:bg-slate-50 active:bg-slate-100
          rounded-t-lg
        "
      >
        <div className="flex min-w-0 items-center gap-3 text-left">
          <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:flex">
            <Layers3 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">
              {shelf_code}{shelf_name ? ` - ${shelf_name}` : ""}
            </h2>
            <span className="inline-flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
              <span>{shelf_total_row} ชั้น</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{itemCount} รายการ</span>
            </span>
          </div>
        </div>

        <div
          className={`
            ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 print:hidden
            transition-transform duration-300 ease-out
            ${isOpen ? "rotate-180" : "rotate-0"}
          `}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      {/* CONTENT */}
      <div
        ref={contentRef}
        className="
          print-shelf-card-content
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

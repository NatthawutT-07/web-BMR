import React from 'react';

const ShelfImageThumb = ({ imageUrl, onImageClick }) => {
  return (
    <div className="flex justify-center xl:justify-start xl:w-[260px] flex-shrink-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Branch"
          className="w-full max-w-[260px] h-auto object-contain rounded-lg shadow-sm border bg-slate-50 cursor-pointer hover:scale-105 transition-transform"
          loading="lazy"
          onClick={onImageClick}
        />
      ) : (
        <div className="w-full max-w-[260px] aspect-[3/4] rounded-lg shadow-sm border bg-slate-100 flex items-center justify-center text-slate-400">
          <span></span>
        </div>
      )}
    </div>
  );
};

export default ShelfImageThumb;

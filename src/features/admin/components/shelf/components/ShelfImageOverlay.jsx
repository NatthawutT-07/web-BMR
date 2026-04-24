import React from 'react';

const ShelfImageOverlay = ({ 
  isFullscreenImage, 
  imageUrl, 
  setIsFullscreenImage 
}) => {
  if (!isFullscreenImage || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center cursor-pointer"
      onClick={() => setIsFullscreenImage(false)}
    >
      <img
        src={imageUrl}
        alt="Branch Fullscreen"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ShelfImageOverlay;

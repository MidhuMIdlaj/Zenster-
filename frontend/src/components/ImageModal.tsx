import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, imageName, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 20, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 20, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{imageName}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 relative">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Controls */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-center space-x-3 bg-gray-50">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex items-center space-x-1 text-gray-700 hover:text-gray-900"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
            <span className="text-sm">-</span>
          </button>

          <div className="px-4 py-2 bg-white rounded-lg border border-gray-300 min-w-[80px] text-center">
            <span className="text-sm font-medium text-gray-700">{zoom}%</span>
          </div>

          <button
            onClick={handleZoomIn}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex items-center space-x-1 text-gray-700 hover:text-gray-900"
            title="Zoom In"
          >
            <ZoomIn size={20} />
            <span className="text-sm">+</span>
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          <button
            onClick={handleRotate}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900"
            title="Rotate 90°"
          >
            <RotateCcw size={20} />
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Reset to original"
          >
            Reset
          </button>

          <a
            href={imageUrl}
            download={imageName}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            title="Download"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

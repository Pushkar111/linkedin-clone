/**
 * ImageCropperModal Component
 * 
 * Provides image cropping functionality for profile photos and banners
 * Uses react-image-crop for smooth cropping experience
 * Exports cropped image as base64 string for upload
 */

import React, { useState, useRef, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1, // 1 for profile photo, 4 for banner
  cropShape = "rect", // 'rect' or 'round'
  title = "Crop Image",
}) {
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    aspect: aspectRatio,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!completedCrop || !canvasRef.current || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [completedCrop]);

  const handleSave = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          onCropComplete(reader.result);
        };
      },
      "image/jpeg",
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[200] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Crop Area */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="flex justify-center items-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                circularCrop={cropShape === "round"}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  style={{ maxHeight: "50vh", maxWidth: "100%" }}
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget;
                    const cropWidth = Math.min(width, height * aspectRatio);
                    setCrop({
                      unit: "px",
                      width: cropWidth,
                      height: cropWidth / aspectRatio,
                      x: (width - cropWidth) / 2,
                      y: (height - cropWidth / aspectRatio) / 2,
                      aspect: aspectRatio,
                    });
                  }}
                />
              </ReactCrop>
            </div>

            {/* Hidden canvas for cropping */}
            <canvas
              ref={canvasRef}
              style={{ display: "none" }}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Save Image
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useState, useRef } from "react";
import { cleanOCRText, preprocessImage, resizeImageForOCR } from "@/lib/utils/ocr";
import Image from "next/image";

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
  onSearch: (gameName: string) => void;
  isSearching?: boolean;
}

export function OCRUpload({ onTextExtracted, onSearch, isSearching = false }: OCRUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Process image with OCR
  const processImage = async (imageFile: File | Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      console.log("🔍 Starting advanced OCR...");

      // Create canvas for preprocessing
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas");

      // Load image into canvas
      const img = new globalThis.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Apply preprocessing
      console.log("🔧 Applying preprocessing...");
      const resizedCanvas = resizeImageForOCR(canvas);
      const processedCanvas = preprocessImage(resizedCanvas);

      // Set file type and name for blob
      const fileType = (imageFile as File).type || "image/png";
      const fileName = (imageFile as File).name || "upload.png";

      // Convert canvas to blob
      const processedBlob = await new Promise<Blob>((resolve) => {
        processedCanvas.toBlob((blob) => resolve(blob!), fileType, 0.9);
      });
      // Send to /api/ocr (Next.js proxy)
      const apiForm = new FormData();
      apiForm.append("file", imageFile, fileName);
      const resp = await fetch("/api/ocr", { method: "POST", body: apiForm, cache: "no-store" });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`OCR API failed: ${resp.status} ${txt}`);
      }
      const data = await resp.json();
      // matched_title from backend
      const text = (data.text || "").toString();
      let bestName = "";
      if (typeof data.matched_title === "string" && data.matched_title.trim().length > 0) {
        bestName = data.matched_title.trim();
      } else if (typeof data.text === "string" && data.text.trim().length > 0) {
        bestName = cleanOCRText(data.text);
      }
      if (bestName.trim()) {
        setExtractedText(bestName);
        onTextExtracted(bestName);
      } else {
        throw new Error("Could not extract readable text from the image");
      }
    } catch (err) {
      console.error("❌ OCR error:", err);
      setError("Error processing the image. Try a clearer image or take another photo.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Clear extracted text
  // File upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select only image files.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum 10MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    processImage(file);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Rear camera on mobile
      });
      setStream(mediaStream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera.");
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setSelectedImage(imageUrl);
          processImage(blob);
          stopCamera();
        }
      },
      "image/jpeg",
      0.8
    );
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Search on eBay
  const handleSearch = () => {
    if (extractedText.trim()) {
      onSearch(extractedText.trim());
    }
  };

  // Clear all
  const clearAll = () => {
    setSelectedImage(null);
    setExtractedText("");
    setError(null);
    setProgress(0);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">Game detector</h2>
        <p className="text-sm text-gray-600 mt-1">Take a photo, upload an image or drag and drop a game to search automatically</p>
      </div>

      {/* Upload/Camera Controls */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || showCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          📁 Choose Image
        </button>
        <button
          onClick={startCamera}
          disabled={isProcessing || showCamera}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          📷 Use Camera
        </button>
        {(selectedImage || extractedText || showCamera) && (
          <button onClick={clearAll} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2">
            ❌ Clear
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      {/* Camera */}
      {showCamera && (
        <div className="mb-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 rounded-lg border object-cover" />
          <div className="flex gap-2 mt-2">
            <button onClick={capturePhoto} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              📸 Capture Photo
            </button>
            <button onClick={stopCamera} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Selected Image */}
      {selectedImage && !showCamera && (
        <div className="mb-4">
          <Image src={selectedImage} alt="Selected image" width={400} height={300} className="w-full max-h-64 object-contain rounded-lg border" />
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>🔍 Processing image...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">❌ {error}</div>}

      {/* Extracted Text */}
      {extractedText && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-blue-900 mb-2">{extractedText}</h3>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">✅ Name extracted successfully!</p>
            <p className="text-green-600 text-xs mt-1">The text was automatically added to the search field. You can edit it above if needed.</p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { cleanOCRText, preprocessImage, resizeImageForOCR } from "@/lib/utils/ocr";
import Image from "next/image";
import { GameResult } from "@/lib/types";

interface PriceData {
  id: string;
  product_name: string;
  console_name: string;
  genre: string;
  release_date: string;
  upc: string;
  asin: string;
  prices: {
    loose: number | null;
    cib: number | null;
    new: number | null;
    graded: number | null;
    box_only: number | null;
  };
  currency: string;
  detected_title?: string;
  detected_platform?: string;
}

interface OCRUploadProps {
  onTextExtracted: (text: string, plataforma?: string, priceData?: PriceData[]) => void;
  onSearch: (gameName: string) => void;
  isSearching?: boolean;
  currentGameResults?: GameResult[];
  userPrice?: number;
}

export function OCRUpload({ onTextExtracted, onSearch, isSearching = false, currentGameResults = [], userPrice = 0 }: OCRUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // States for adding to collection
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addErrorMsg, setAddErrorMsg] = useState<string | null>(null);

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
      setProgress(20);

      // Usar o novo endpoint combinado OCR + Price Charting
      const apiForm = new FormData();
      apiForm.append("file", imageFile, fileName);
      const resp = await fetch("http://127.0.0.1:8000/ask-agent-image-with-prices", {
        method: "POST",
        body: apiForm,
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`OCR API failed: ${resp.status} ${txt}`);
      }

      setProgress(80);

      const data = await resp.json();
      const games = data.games || [];
      const prices = data.price_data || [];

      console.log("OCR + Price Charting response:", data);

      // Extrair o primeiro jogo detectado para exibição principal
      const firstGame = games[0];
      if (firstGame) {
        setExtractedText(firstGame.title);
        setPlatform(firstGame.platform);
        onTextExtracted(firstGame.title, firstGame.platform, prices);
      } else {
        throw new Error("No games detected in the image");
      }

      setProgress(100);
    } catch (err) {
      console.error("❌ OCR error:", err);
      setError("Error processing the image. Try a clearer image or take another photo.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Add detected game to user's collection via API
  const addToCollection = async () => {
    setAddLoading(true);
    setAddErrorMsg(null);
    setAddSuccess(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("You must be logged in to add to collection");

      // Calculate price statistics from current game results
      const prices = currentGameResults.map((result) => result.price).filter((price) => typeof price === "number" && price > 0);

      let lowestPrice: number | undefined;
      let highestPrice: number | undefined;
      let averagePrice: number | undefined;

      if (prices.length > 0) {
        lowestPrice = Math.min(...prices);
        highestPrice = Math.max(...prices);
        averagePrice = Number((prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2));

        console.log("Calculated prices from search results:", {
          lowestPrice,
          highestPrice,
          averagePrice,
          totalResults: prices.length,
        });
      }

      const payload = {
        gameTitle: extractedText || "Unknown title",
        platform: platform || "all",
        condition: "used",
        purchasePrice: userPrice > 0 ? userPrice : undefined,
        notes: "",
        images: selectedImage ? [selectedImage] : [],
        lowestPrice,
        highestPrice,
        averagePrice,
      } as any;

      const res = await fetch("/api/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to add to collection");
      }

      setAddSuccess("Added to your collection");
      // Notify other parts of the app to refresh collection
      try {
        window.dispatchEvent(new CustomEvent("collection:added"));
      } catch (e) {}
      // Optionally clear selection or keep it
    } catch (err: any) {
      console.error("Add to collection error:", err);
      setAddErrorMsg(err?.message || "Error adding to collection");
    } finally {
      setAddLoading(false);
      // Clear success after a brief moment
      setTimeout(() => setAddSuccess(null), 3000);
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
    setPlatform("");
    setError(null);
    setProgress(0);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto backdrop-blur-sm bg-black/40 rounded-2xl border-2 border-cyan-400/50 shadow-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-cyan-300 font-mono tracking-wider flex items-center gap-2">GAME DETECTOR</h2>
        <p className="text-sm text-cyan-300/80 mt-2 font-mono">Upload an image or use camera to auto-detect games</p>
      </div>

      {/* Upload/Camera Controls */}
      <div className="flex gap-3 flex-wrap mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || showCamera}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 border border-gray-700 text-sm"
        >
          UPLOAD IMAGE
        </button>

        {(selectedImage || extractedText) && (
          <button
            onClick={addToCollection}
            disabled={addLoading}
            className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 border border-gray-700 text-sm ${
              addLoading ? "opacity-70 cursor-wait" : ""
            }`}
          >
            {addLoading ? "ADDING..." : "+ ADD TO COLLECTION"}
          </button>
        )}

        {/* feedback messages for add action */}
        {addSuccess && (
          <div className="text-green-400 bg-green-900/20 px-3 py-2 rounded-md border border-green-700 flex items-center">{addSuccess}</div>
        )}
        {addErrorMsg && <div className="text-red-300 bg-red-900/20 px-3 py-2 rounded-md border border-red-700 flex items-center">{addErrorMsg}</div>}

        {(selectedImage || extractedText || showCamera) && (
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 border border-gray-700 text-sm"
          >
            CLEAR
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      {/* Camera */}
      {showCamera && (
        <div className="mb-6">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 rounded-xl border-2 border-cyan-400/50 object-cover" />
          <div className="flex gap-3 mt-4">
            <button
              onClick={capturePhoto}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-blue-400/50 hover:border-purple-400/50 font-mono"
            >
              CAPTURE PHOTO
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-gray-400/50 font-mono"
            >
              CANCEL
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Selected Image */}
      {selectedImage && !showCamera && (
        <div className="mb-6">
          <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-purple-400/30">
            <Image
              src={selectedImage}
              alt="Selected image"
              width={400}
              height={300}
              className="w-full max-h-64 object-contain rounded-lg border-2 border-cyan-400/50"
            />
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-6">
          <div className="backdrop-blur-sm bg-black/20 rounded-xl p-4 border border-cyan-400/30">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-cyan-300 font-mono">🔍 SCANNING IMAGE...</span>
              <span className="text-pink-400 font-mono font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-3 border border-cyan-400/30">
              <div
                className="bg-gradient-to-r from-cyan-400 to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6">
          <div className="backdrop-blur-sm bg-red-900/30 border-2 border-red-400/50 text-red-300 rounded-xl p-4">
            <p className="font-mono">❌ ERROR: {error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

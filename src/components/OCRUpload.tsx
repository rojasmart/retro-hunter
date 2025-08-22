"use client";

import { useState, useRef } from "react";
import { createWorker, PSM, OEM } from "tesseract.js";
import { cleanOCRText, generateGameNameVariations, preprocessImage, resizeImageForOCR } from "@/lib/utils/ocr";
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

  // Processar imagem com OCR
  const processImage = async (imageFile: File | Blob) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      console.log("🔍 Iniciando OCR avançado...");

      // Criar canvas para pré-processamento
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível criar canvas");

      // Carregar imagem no canvas
      const img = new globalThis.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Aplicar pré-processamento
      console.log("🔧 Aplicando pré-processamento...");
      const resizedCanvas = resizeImageForOCR(canvas);
      const processedCanvas = preprocessImage(resizedCanvas);

      // Converter canvas para blob
      const processedBlob = await new Promise<Blob>((resolve) => {
        processedCanvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/png",
          0.9
        );
      });

      // Configurar Tesseract com múltiplas tentativas para melhor extração
      const worker = await createWorker(["por", "eng"], 1, {
        logger: (m) => {
          console.log("OCR Progress:", m.status, Math.round(m.progress * 100) + "%");
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Tentar múltiplas configurações de OCR para melhor resultado
      const ocrAttempts = [
        // Configuração 1: Para texto em blocos (títulos principais)
        {
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :-&'",
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          description: "SINGLE_BLOCK",
        },
        // Configuração 2: Para texto em linhas (labels, cartuchos)
        {
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :-&'",
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          description: "SINGLE_LINE",
        },
        // Configuração 3: Para texto esparso (CDs, mídia)
        {
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :-&'",
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          description: "SPARSE_TEXT",
        },
      ];

      let bestResult = { text: "", confidence: 0 };

      // Tentar cada configuração e pegar o melhor resultado
      for (const [index, config] of ocrAttempts.entries()) {
        console.log(`🔧 Tentativa ${index + 1}/3 com configuração: ${config.description}`);

        try {
          await worker.setParameters({
            tessedit_char_whitelist: config.tessedit_char_whitelist,
            tessedit_pageseg_mode: config.tessedit_pageseg_mode,
            tessedit_ocr_engine_mode: config.tessedit_ocr_engine_mode,
          });

          const result = await worker.recognize(processedBlob);

          console.log(`📊 Resultado ${index + 1}: confiança=${Math.round(result.data.confidence)}%`);
          console.log(`📝 Texto ${index + 1}:`, result.data.text.substring(0, 100));

          if (result.data.confidence > bestResult.confidence && result.data.text.trim().length > 0) {
            bestResult = result.data;
            console.log(`✅ Melhor resultado atualizado: ${Math.round(bestResult.confidence)}%`);
          }
        } catch (attemptError) {
          console.warn(`⚠️ Erro na tentativa ${index + 1}:`, attemptError);
        }
      }

      await worker.terminate();

      const { text, confidence } = bestResult;

      console.log(`📝 Texto bruto extraído (confiança: ${Math.round(confidence)}%):`, text);

      // Limpar e gerar variações
      const cleanedText = cleanOCRText(text);
      const variations = generateGameNameVariations(text);

      console.log("✅ Texto limpo:", cleanedText);
      console.log("🎯 Variações:", variations);

      if (cleanedText.trim()) {
        setExtractedText(cleanedText);
        onTextExtracted(cleanedText);
      } else if (variations.length > 0) {
        setExtractedText(variations[0]);
        onTextExtracted(variations[0]);
      } else {
        throw new Error("Não foi possível extrair texto legível da imagem");
      }
    } catch (err) {
      console.error("❌ Erro no OCR:", err);
      setError("Erro ao processar a imagem. Tente uma imagem com texto mais claro ou tire outra foto.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Limpar texto extraído
  // Upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    processImage(file);
  };

  // Iniciar câmera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Câmera traseira no mobile
      });
      setStream(mediaStream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera.");
    }
  };

  // Capturar foto
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

  // Parar câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Buscar no eBay
  const handleSearch = () => {
    if (extractedText.trim()) {
      onSearch(extractedText.trim());
    }
  };

  // Limpar tudo
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
        <h2 className="text-xl font-semibold flex items-center gap-2">📷 Reconhecimento de Texto (OCR)</h2>
        <p className="text-sm text-gray-600 mt-1">Tire uma foto ou carregue uma imagem de um jogo para buscar automaticamente</p>
      </div>

      {/* Controles de Upload/Câmera */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || showCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          📁 Escolher Imagem
        </button>
        <button
          onClick={startCamera}
          disabled={isProcessing || showCamera}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          📷 Usar Câmera
        </button>
        {(selectedImage || extractedText || showCamera) && (
          <button onClick={clearAll} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2">
            ❌ Limpar
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      {/* Câmera */}
      {showCamera && (
        <div className="mb-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 rounded-lg border object-cover" />
          <div className="flex gap-2 mt-2">
            <button onClick={capturePhoto} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              📸 Capturar Foto
            </button>
            <button onClick={stopCamera} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Cancelar
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Imagem Selecionada */}
      {selectedImage && !showCamera && (
        <div className="mb-4">
          <Image src={selectedImage} alt="Imagem selecionada" width={400} height={300} className="w-full max-h-64 object-contain rounded-lg border" />
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>🔍 Processando imagem...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Erro */}
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">❌ {error}</div>}

      {/* Texto Extraído */}
      {extractedText && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Texto Reconhecido:</label>
          <textarea
            value={extractedText}
            onChange={(e) => {
              setExtractedText(e.target.value);
              onTextExtracted(e.target.value); // Atualizar o componente pai quando o texto for editado
            }}
            className="w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Texto extraído aparecerá aqui..."
          />
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              ✅ Nome extraído com sucesso! 
            </p>
            <p className="text-green-600 text-xs mt-1">
              O texto foi automaticamente adicionado ao campo de busca. Você pode editá-lo acima se necessário.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { OCRUpload } from "@/components/OCRUpload";
import { generateGameNameVariations } from "@/lib/utils/ocr";

interface AdvancedOCRProps {
  // changed to accept optional plataforma
  onGameExtracted: (gameName: string, plataforma?: string) => void;
  isProcessing?: boolean;
}

export function AdvancedOCR({ onGameExtracted, isProcessing = false }: AdvancedOCRProps) {
  const [extractedText, setExtractedText] = useState<string>("");
  const [gameVariations, setGameVariations] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");

  // now accepts plataforma from OCRUpload
  const handleTextExtracted = (text: string, plataforma?: string) => {
    setExtractedText(text);
    const variations = [text, ...generateGameNameVariations(text).filter((v) => v !== text)];
    setGameVariations(variations);

    if (variations.length > 0) {
      setSelectedGame(variations[0]);
      // forward platform when available
      onGameExtracted(variations[0], plataforma);
    }
  };

  const handleGameSelection = (gameName: string) => {
    setSelectedGame(gameName);
    // keep platform undefined here (will use current global platform)
    onGameExtracted(gameName);
  };

  const handleDirectSearch = () => {
    if (selectedGame) {
      onGameExtracted(selectedGame);
    }
  };

  return (
    <div className="space-y-4">
      <OCRUpload onTextExtracted={handleTextExtracted} onSearch={handleDirectSearch} isSearching={isProcessing} />
    </div>
  );
}

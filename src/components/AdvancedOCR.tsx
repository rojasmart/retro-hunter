"use client";

import { useState } from "react";
import { OCRUpload } from "@/components/OCRUpload";
import { generateGameNameVariations } from "@/lib/utils/ocr";
import { GameResult } from "@/lib/types";

interface AdvancedOCRProps {
  // changed to accept optional plataforma and ebay results
  onGameExtracted: (gameName: string, plataforma?: string, ebayResults?: GameResult[]) => void;
  isProcessing?: boolean;
  currentGameResults?: GameResult[];
  userPrice?: number;
}

export function AdvancedOCR({ onGameExtracted, isProcessing = false, currentGameResults = [], userPrice = 0 }: AdvancedOCRProps) {
  const [extractedText, setExtractedText] = useState<string>("");
  const [gameVariations, setGameVariations] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");

  // now accepts plataforma and ebay results from OCRUpload
  const handleTextExtracted = (text: string, plataforma?: string, ebayResults?: GameResult[]) => {
    setExtractedText(text);
    const variations = [text, ...generateGameNameVariations(text).filter((v) => v !== text)];
    setGameVariations(variations);

    if (variations.length > 0) {
      setSelectedGame(variations[0]);
      // forward platform and ebay results when available
      onGameExtracted(variations[0], plataforma, ebayResults);
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
      <OCRUpload
        onTextExtracted={handleTextExtracted}
        onSearch={handleDirectSearch}
        isSearching={isProcessing}
        currentGameResults={currentGameResults}
        userPrice={userPrice}
      />
    </div>
  );
}

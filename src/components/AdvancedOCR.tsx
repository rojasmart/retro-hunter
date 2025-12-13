"use client";

import { useState } from "react";
import { OCRUpload } from "@/components/OCRUpload";
import { generateGameNameVariations } from "@/lib/utils/ocr";
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

interface AdvancedOCRProps {
  onGameExtracted: (gameName: string, plataforma?: string, priceData?: PriceData[]) => void;
  isProcessing?: boolean;
  currentGameResults?: GameResult[];
  userPrice?: number;
}

export function AdvancedOCR({ onGameExtracted, isProcessing = false, currentGameResults = [], userPrice = 0 }: AdvancedOCRProps) {
  const [extractedText, setExtractedText] = useState<string>("");
  const [gameVariations, setGameVariations] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");

  // now accepts plataforma and price data from OCRUpload
  const handleTextExtracted = (text: string, plataforma?: string, priceData?: PriceData[]) => {
    setExtractedText(text);
    const variations = [text, ...generateGameNameVariations(text).filter((v) => v !== text)];
    setGameVariations(variations);

    if (variations.length > 0) {
      setSelectedGame(variations[0]);
      // forward platform and price data when available
      onGameExtracted(variations[0], plataforma, priceData);
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

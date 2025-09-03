"use client";

import { useState } from "react";
import { OCRUpload } from "@/components/OCRUpload";
import { generateGameNameVariations } from "@/lib/utils/ocr";

interface AdvancedOCRProps {
  onGameExtracted: (gameName: string) => void;
  isProcessing?: boolean;
}

export function AdvancedOCR({ onGameExtracted, isProcessing = false }: AdvancedOCRProps) {
  const [extractedText, setExtractedText] = useState<string>("");
  const [gameVariations, setGameVariations] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    const variations = [text, ...generateGameNameVariations(text).filter((v) => v !== text)];
    setGameVariations(variations);

    if (variations.length > 0) {
      setSelectedGame(variations[0]);
      onGameExtracted(variations[0]);
    }
  };

  const handleGameSelection = (gameName: string) => {
    setSelectedGame(gameName);
    // Atualizar o campo de busca com o jogo selecionado
    onGameExtracted(gameName);
  };

  const handleDirectSearch = () => {
    // Esta função não faz busca automática, apenas confirma a seleção
    if (selectedGame) {
      onGameExtracted(selectedGame);
    }
  };

  return (
    <div className="space-y-4">
      <OCRUpload onTextExtracted={handleTextExtracted} onSearch={handleDirectSearch} isSearching={isProcessing} />

      {/* Variações do nome do jogo */}
      {gameVariations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-3">Possible game names found:</h3>
          <div className="space-y-2">
            {gameVariations.map((variation, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`game-${index}`}
                  name="gameSelection"
                  value={variation}
                  checked={selectedGame === variation}
                  onChange={(e) => handleGameSelection(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`game-${index}`} className="flex-1 cursor-pointer hover:text-blue-700">
                  {variation}
                </label>
              </div>
            ))}
          </div>

          {selectedGame && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                ✅ Selected name: <strong>{selectedGame}</strong>
              </p>
              <p className="text-green-600 text-xs mt-1">The name has been automatically added to the search field above</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

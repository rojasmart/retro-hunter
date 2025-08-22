"use client";

import { useState } from "react";
import { OCRUpload } from "@/components/OCRUpload";
import { generateGameNameVariations } from "@/lib/utils/ocr";

interface AdvancedOCRProps {
  onGameSelected: (gameName: string) => void;
  isSearching?: boolean;
}

export function AdvancedOCR({ onGameSelected, isSearching = false }: AdvancedOCRProps) {
  const [extractedText, setExtractedText] = useState<string>("");
  const [gameVariations, setGameVariations] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    const variations = generateGameNameVariations(text);
    setGameVariations(variations);

    // Auto-selecionar a primeira variação se disponível
    if (variations.length > 0) {
      setSelectedGame(variations[0]);
    }
  };

  const handleSearch = (gameName: string) => {
    onGameSelected(gameName);
  };

  return (
    <div className="space-y-4">
      <OCRUpload onTextExtracted={handleTextExtracted} onSearch={handleSearch} isSearching={isSearching} />

      {/* Variações do nome do jogo */}
      {gameVariations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-3">🎯 Possíveis nomes de jogos encontrados:</h3>
          <div className="space-y-2">
            {gameVariations.map((variation, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`game-${index}`}
                  name="gameSelection"
                  value={variation}
                  checked={selectedGame === variation}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`game-${index}`} className="flex-1 cursor-pointer hover:text-blue-700">
                  {variation}
                </label>
              </div>
            ))}
          </div>

          {selectedGame && (
            <button
              onClick={() => handleSearch(selectedGame)}
              disabled={isSearching}
              className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔍 {isSearching ? "Buscando..." : `Buscar "${selectedGame}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

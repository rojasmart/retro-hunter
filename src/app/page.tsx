"use client";

import { useState } from "react";
import { GameResult, Platform } from "@/lib/types";
import { PLATFORM_CONFIGS } from "@/lib/config/platforms";
import { AdvancedOCR } from "@/components/AdvancedOCR";
import Image from "next/image";

export default function Home() {
  const [nome, setNome] = useState("");
  const [platform, setPlatform] = useState<Platform>("all");
  const [condition, setCondition] = useState<string>("all");
  const [resultados, setResultados] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEbayOnly = async (searchName?: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      nome: searchName ?? nome,
      platform: platform,
      condition: condition,
    });
    const res = await fetch(`/api/ebay?${params.toString()}`);
    const data = await res.json();
    setResultados(data.resultados || []);
    setLoading(false);
  };

  // Função para definir os títulos extraídos do OCR
  const [ocrTitles, setOcrTitles] = useState<string[]>([]);
  const [selectedOcrTitle, setSelectedOcrTitle] = useState<string>("");

  // Recebe até 3 títulos do OCR
  const handleOCRExtraction = (titles: string[] | string) => {
    let arr: string[] = [];
    if (Array.isArray(titles)) {
      arr = titles.slice(0, 3);
    } else if (typeof titles === "string" && titles.trim()) {
      arr = [titles.trim()];
    }
    setOcrTitles(arr);
    setSelectedOcrTitle(arr[0] || "");
    setNome(arr[0] || "");
    if (arr[0]) {
      searchEbayOnly(arr[0]);
    }
  };

  return (
    <div className="bg-gray-100 p-8 rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-gray-500">Retro Hunter</h1>
      <p className="mb-6 text-gray-500">Compare prices of your games</p>

      {/* Componente OCR */}
      <div className="mb-8">
        <AdvancedOCR onGameExtracted={handleOCRExtraction} isProcessing={loading} />
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Campo de busca */}
        <div>
          <input
            id="game-name"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Enter the game name (e.g., R-Type Final)"
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtros */}

        {/* Search button */}
        <div>
          <button
            onClick={searchEbayOnly}
            disabled={loading || !nome.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed w-full font-medium"
          >
            {loading ? "🔍 Searching..." : "Search"}
          </button>
        </div>

        {/* Info dos filtros ativos */}
        {(platform !== "all" || condition !== "all") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Filtros ativos:</span>{" "}
              {platform !== "all" && (
                <span className="bg-blue-100 px-2 py-1 rounded mr-2">
                  {PLATFORM_CONFIGS[platform].icon} {PLATFORM_CONFIGS[platform].name}
                </span>
              )}
              {condition !== "all" && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  {condition === "new" && "🆕 Novo"}
                  {condition === "used" && "📦 Usado"}
                  {condition === "refurbished" && "🔧 Recondicionado"}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="mt-8 space-y-4">
        {resultados.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Found results ({resultados.length}):</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resultados.map((r, i) => (
                <div key={i} className="result-card bg-white p-4 shadow-sm rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-semibold hover:text-blue-900 flex-1 line-clamp-2"
                    >
                      {r.title}
                    </a>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2 whitespace-nowrap">{r.site}</span>
                  </div>
                  <p className="text-green-600 font-bold text-lg mb-2">{r.priceText}</p>

                  {/* Tags */}
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.image && <Image src={r.image} alt={r.title} width={300} height={96} className="w-full h-24 object-cover rounded border" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && resultados.length === 0 && nome.trim() && (
          <div className="text-center py-8">
            <p className="text-gray-500">😕 Nenhum resultado encontrado para &ldquo;{nome}&rdquo;</p>
            <p className="text-sm text-gray-400 mt-1">Tente alterar os filtros ou usar termos diferentes</p>
          </div>
        )}
      </div>
    </div>
  );
}

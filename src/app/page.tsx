"use client";

import { useState } from "react";
import { GameResult, Platform } from "@/lib/types";
import { PLATFORM_CONFIGS } from "@/lib/config/platforms";
import { AdvancedOCR } from "@/components/AdvancedOCR";
import Image from "next/image";

// Normalização simples de nomes de plataformas para as keys do projeto
const PLATFORM_ALIASES: Record<string, Platform> = {
  ps2: "ps2",
  "playstation 2": "ps2",
  ps3: "ps3",
  "playstation 3": "ps3",
  ps4: "ps4",
  "playstation 4": "ps4",
  xbox: "xbox",
  "xbox 360": "xbox360",
  switch: "nintendo-switch",
  "nintendo switch": "nintendo-switch",
  wii: "nintendo-wii",
  ds: "nintendo-ds",
  // Adicionado Dreamcast
  dreamcast: "dreamcast",
  "sega dreamcast": "dreamcast",
  // fallback
  all: "all",
};

function normalizePlatform(input?: string): Platform {
  if (!input) return "all";
  const s = input.toLowerCase().trim();
  // check direct alias matches
  if (PLATFORM_ALIASES[s]) return PLATFORM_ALIASES[s];

  // check contains any alias key
  for (const [k, v] of Object.entries(PLATFORM_ALIASES)) {
    if (k !== "all" && s.includes(k)) return v;
  }
  return "all";
}
export default function Home() {
  const [nome, setNome] = useState("");
  const [platform, setPlatform] = useState<Platform>("all");
  const [condition, setCondition] = useState<string>("all");
  const [resultados, setResultados] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEbayOnly = async (searchName?: string, platformParam?: string) => {
    setLoading(true);

    // priority: platformParam (from OCR) > current state platform
    const platformToSend = normalizePlatform(platformParam ?? platform);
    console.log("[searchEbayOnly] searchName:", searchName ?? nome, "platformParam:", platformParam, "normalized:", platformToSend);

    const params = new URLSearchParams({
      nome: searchName ?? nome,
      platform: platformToSend,
      condition: condition,
    });
    console.log("[searchEbayOnly] fetch /api/ebay?", params.toString());
    const res = await fetch(`/api/ebay?${params.toString()}`);
    const data = await res.json();
    setResultados(data.resultados || []);
    setLoading(false);
  };

  const [ocrTitles, setOcrTitles] = useState<string[]>([]);
  const [selectedOcrTitle, setSelectedOcrTitle] = useState<string>("");

  const handleOCRExtraction = (titles: string[] | string, plataforma?: string) => {
    // construir lista de títulos a partir do argumento
    let arr: string[] = [];
    if (Array.isArray(titles)) {
      arr = titles
        .slice(0, 3)
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (typeof titles === "string" && titles.trim()) {
      arr = [titles.trim()];
    }

    // determinar plataforma a usar (prioridade: plataforma passada > state.platform)
    let platformToUse: Platform = platform;
    console.log("[handleOCRExtraction] received plataforma from OCR:", plataforma);
    if (typeof plataforma === "string" && plataforma.trim() && plataforma.toLowerCase() !== "all") {
      const normalized = normalizePlatform(plataforma);
      console.log("[handleOCRExtraction] normalized plataforma:", normalized);
      setPlatform(normalized);
      platformToUse = normalized;
    }

    setOcrTitles(arr);
    setSelectedOcrTitle(arr[0] || "");
    setNome(arr[0] || "");

    if (arr[0]) {
      // passar a plataforma normalizada para a pesquisa
      searchEbayOnly(arr[0], platformToUse);
    }
  };

  return (
    <div className="bg-gray-100 p-8 rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-gray-500">Retro Hunter</h1>
      <p className="mb-6 text-gray-500">Compare prices of your games</p>

      <div className="mb-8">
        <AdvancedOCR onGameExtracted={handleOCRExtraction} isProcessing={loading} />
      </div>

      <div className="max-w-2xl space-y-4">
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

        <div>
          <button
            onClick={() => searchEbayOnly()}
            disabled={loading || !nome.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed w-full font-medium"
          >
            {loading ? "🔍 Searching..." : "Search"}
          </button>
        </div>

        {(platform !== "all" || condition !== "all") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Filtros ativos:</span>{" "}
              {platform !== "all" &&
                (() => {
                  const platformConfig = PLATFORM_CONFIGS[platform as Platform];
                  if (!platformConfig) return <span className="bg-red-100 px-2 py-1 rounded mr-2">Plataforma desconhecida</span>;
                  return (
                    <span className="bg-blue-100 px-2 py-1 rounded mr-2">
                      {platformConfig.icon} {platformConfig.name}
                    </span>
                  );
                })()}
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

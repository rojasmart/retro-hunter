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

const PriceTableAndSlider = ({ items }: { items: GameResult[] }) => {
  // Calcular preços
  const prices = items.map((item) => item.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2);

  return (
    <div className="overflow-hidden">
      {/* Tabela de preços */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-4 table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left">Preço mais baixo</th>
              <th className="border px-4 py-2 text-left">Preço mais alto</th>
              <th className="border px-4 py-2 text-left">Preço médio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2">R$ {lowestPrice}</td>
              <td className="border px-4 py-2">R$ {highestPrice}</td>
              <td className="border px-4 py-2">R$ {averagePrice}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Slider horizontal com botões de navegação */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-4 py-4 scrollbar-hide">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[150px] p-4 border rounded-lg bg-white shadow hover:shadow-md hover:bg-gray-50 text-center"
            >
              <p className="font-medium text-blue-600 hover:underline">{item.title}</p>
              <p className="text-sm text-gray-500">R$ {item.price}</p>
            </a>
          ))}
        </div>
        {/* Botões de navegação */}
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full shadow hover:bg-gray-300"
          onClick={() => {
            const slider = document.querySelector(".overflow-x-auto");
            if (slider) {
              slider.scrollBy({ left: -200, behavior: "smooth" });
            }
          }}
        >
          ◀
        </button>
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full shadow hover:bg-gray-300"
          onClick={() => {
            const slider = document.querySelector(".overflow-x-auto");
            if (slider) {
              slider.scrollBy({ left: 200, behavior: "smooth" });
            }
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

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
            {/* Exibir tabela e slider de preços */}
            <PriceTableAndSlider items={resultados} />
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

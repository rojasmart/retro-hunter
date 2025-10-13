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
  masterSystem: "master-system",
  "master system": "master-system",
  genesis: "genesis",
  megadrive: "genesis",
  "mega drive": "genesis",
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
  const prices = items.map((item) => item.price).filter((price) => price > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const averagePrice = prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2) : "0.00";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tabela de preços com visual retro */}
      <div className="mb-8">
        <div className="backdrop-blur-sm bg-black/40 rounded-2xl p-6 border-2 border-cyan-400/50 shadow-2xl">
          <h2 className="text-center text-xl font-bold text-cyan-300 mb-4 font-mono tracking-wider">PRICE ANALYSIS</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-b from-green-500/20 to-green-600/30 rounded-xl border border-green-400/50">
              <div className="text-xs text-green-300 font-mono mb-1">LOWEST</div>
              <div className="text-2xl font-bold text-green-400">R$ {lowestPrice}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-b from-red-500/20 to-red-600/30 rounded-xl border border-red-400/50">
              <div className="text-xs text-red-300 font-mono mb-1">HIGHEST</div>
              <div className="text-2xl font-bold text-red-400">R$ {highestPrice}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-b from-blue-500/20 to-blue-600/30 rounded-xl border border-blue-400/50">
              <div className="text-xs text-blue-300 font-mono mb-1">AVERAGE</div>
              <div className="text-2xl font-bold text-blue-400">R$ {averagePrice}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider horizontal com visual retro */}
      <div className="backdrop-blur-sm bg-black/40 rounded-2xl p-6 border-2 border-purple-400/50 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-purple-300 mb-4 font-mono tracking-wider">AVAILABLE GAMES</h2>
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-purple-900/30">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-52 p-4 bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-2 border-cyan-400/30 rounded-xl hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 transform hover:scale-105"
            >
              {item.image && (
                <div className="mb-3">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={200}
                    height={120}
                    className="w-full h-28 object-cover rounded-lg border border-cyan-400/30"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <h3 className="font-bold text-cyan-300 hover:text-pink-300 text-sm line-clamp-2 mb-2 font-mono transition-colors">{item.title}</h3>
              <p className="text-green-400 font-bold text-xl mb-1">R$ {item.price}</p>
              {item.tags && item.tags.length > 0 && <p className="text-xs text-purple-300 font-mono">{item.tags[0]}</p>}
            </a>
          ))}
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Retro Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Neon Glow Effects */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-pink-500 rounded-full filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500 rounded-full filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>

      <div className="relative z-10 p-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent filter drop-shadow-lg">
            RETRO HUNTER
          </h1>
          <p className="text-xl text-cyan-300 font-mono tracking-wider animate-pulse">&gt; GET THE PRICES OF YOUR RETRO GAMES</p>
          <div className="mt-4 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full"></div>
          </div>
        </div>

        <div className="mb-8">
          <AdvancedOCR onGameExtracted={handleOCRExtraction} isProcessing={loading} />
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-cyan-500/30 shadow-2xl">
            <input
              id="game-name"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Enter the game name (e.g., Action Fighter)"
              className="w-full p-4 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-lg"
            />
          </div>

          <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-purple-500/30">
            <button
              onClick={() => searchEbayOnly()}
              disabled={loading || !nome.trim()}
              className="w-full py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 disabled:scale-100 transition-all duration-300 border-2 border-pink-400/50 hover:border-purple-400/50 disabled:border-gray-500/50"
            >
              {loading ? "🔍 SCANNING RETRO UNIVERSE..." : "🚀 HUNT FOR GAMES"}
            </button>
          </div>

          {(platform !== "all" || condition !== "all") && (
            <div className="backdrop-blur-sm bg-black/20 border border-cyan-400/40 rounded-xl p-4">
              <p className="text-sm text-cyan-300 font-mono">
                <span className="text-pink-400 font-bold">&gt; ACTIVE FILTERS:</span>{" "}
                {platform !== "all" &&
                  (() => {
                    const platformConfig = PLATFORM_CONFIGS[platform as Platform];
                    if (!platformConfig)
                      return <span className="bg-red-500/30 text-red-300 px-2 py-1 rounded mr-2 border border-red-400/50">Unknown Platform</span>;
                    return (
                      <span className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded mr-2 border border-purple-400/50">
                        {platformConfig.icon} {platformConfig.name}
                      </span>
                    );
                  })()}
                {condition !== "all" && (
                  <span className="bg-cyan-500/30 text-cyan-200 px-2 py-1 rounded border border-cyan-400/50">
                    {condition === "new" && "🆕 NEW"}
                    {condition === "used" && "📦 USED"}
                    {condition === "refurbished" && "🔧 REFURBISHED"}
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
            <div className="text-center py-12">
              <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-8 border border-red-400/40">
                <p className="text-2xl text-red-400 font-mono mb-2">😕 NO DATA FOUND</p>
                <p className="text-cyan-300 font-mono">
                  &gt; No results for &ldquo;<span className="text-pink-400">{nome}</span>&rdquo;
                </p>
                <p className="text-sm text-gray-400 mt-2 font-mono">Try different search terms or filters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

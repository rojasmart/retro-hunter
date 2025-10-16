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

const PriceTableAndSlider = ({ items, searchName }: { items: GameResult[]; searchName: string }) => {
  const prices = items.map((item) => item.price).filter((price) => price > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const averagePrice = prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2) : "0.00";

  const [minPrice, setMinPrice] = useState(lowestPrice);
  const [maxPrice, setMaxPrice] = useState(highestPrice);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredItems = items
    .filter((item) => item.price >= minPrice && item.price <= maxPrice)
    .sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));
  console.log("hello searchName", searchName);
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="backdrop-blur-sm bg-black/40 rounded-2xl p-6 border-2 border-cyan-400/50 shadow-2xl">
          <h2 className="text-center text-3xl font-bold text-cyan-300 mb-4 font-mono tracking-wider">{searchName}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500 rounded-xl border border-green-400">
              <div className="text-xs text-white font-mono mb-1">LOWEST</div>
              <div className="text-2xl font-bold text-white">$ {lowestPrice}</div>
            </div>
            <div className="text-center p-4 bg-red-500 rounded-xl border border-red-400">
              <div className="text-xs text-white font-mono mb-1">HIGHEST</div>
              <div className="text-2xl font-bold text-white">$ {highestPrice}</div>
            </div>
            <div className="text-center p-4 bg-blue-500 rounded-xl border border-blue-400">
              <div className="text-xs text-white font-mono mb-1">AVERAGE</div>
              <div className="text-2xl font-bold text-white">$ {averagePrice}</div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-cyan-300 font-mono mb-2">Filter by Price Range:</label>
            <div className="flex space-x-4">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                min={lowestPrice}
                max={highestPrice}
                className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-lg"
                placeholder="Min Price"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                min={lowestPrice}
                max={highestPrice}
                className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-lg"
                placeholder="Max Price"
              />
            </div>
            <div className="mt-4">
              <label className="block text-cyan-300 font-mono mb-2">Sort Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-lg"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-full p-4 bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-2 border-cyan-400/30 rounded-xl hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 transform hover:scale-105"
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
  );
};

export default function Home() {
  const [nome, setNome] = useState("");
  const [platform, setPlatform] = useState<Platform>("all");
  const [condition, setCondition] = useState<string>("all");
  const [resultados, setResultados] = useState<GameResult[]>([]);
  const [searchNameState, setSearchNameState] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const searchEbayOnly = async (searchName?: string, platformParam?: string) => {
    setLoading(true);

    // priority: platformParam (from OCR) > current state platform
    const platformToSend = normalizePlatform(platformParam ?? platform);
    console.log("[searchEbayOnly] searchName:", searchName ?? nome, "platformParam:", platformParam, "normalized:", platformToSend);

    const finalSearchName = searchName ?? nome;
    setSearchNameState(finalSearchName);

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
    <div className="w-screen bg-gray-900 text-white font-mono">
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 shadow-md border-b border-gray-700 z-50">
        {/* Logo e Mensagem */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            RETRO HUNTER
          </h1>
          <span className="text-sm text-cyan-300 font-mono tracking-wide">Hunt, Decide, Sell</span>
        </div>

        {/* Botões */}
        <div className="flex space-x-4">
          <button className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 border border-gray-700">
            My Collection
          </button>
          <button className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 border border-gray-700">
            My Account
          </button>
        </div>
      </header>

      <div className="relative z-10 flex h-screen pt-16">
        {/* Lateral Esquerda - Fixa */}
        <div className="w-1/2 h-full bg-black/30 p-8 border-r border-cyan-500/30 flex flex-col justify-between">
          <div>
            <AdvancedOCR onGameExtracted={searchEbayOnly} isProcessing={loading} />
            <div className="mt-4">
              <input
                id="game-name"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Enter the game name (e.g., Action Fighter)"
                className="w-full p-4 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-lg"
              />
              <button
                onClick={() => searchEbayOnly()}
                disabled={loading || !nome.trim()}
                className="w-full mt-4 py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 disabled:scale-100 transition-all duration-300 border-2 border-pink-400/50 hover:border-purple-400/50 disabled:border-gray-500/50"
              >
                {loading ? "🔍 SCANNING..." : "HUNT FOR PRICES"}
              </button>
            </div>
          </div>
        </div>

        {/* Lateral Direita - Rolável */}
        <div className="w-1/2 w-full overflow-y-auto p-8">
          {resultados.length > 0 && <PriceTableAndSlider items={resultados} searchName={searchNameState} />}
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

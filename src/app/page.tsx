"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GameResult, Platform } from "@/lib/types";
import { PLATFORM_CONFIGS } from "@/lib/config/platforms";
import { AdvancedOCR } from "@/components/AdvancedOCR";
import AuthButton from "@/components/auth/AuthButton";
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

const PriceTableAndSlider = ({
  items,
  searchName,
  myPrice,
  setMyPrice,
}: {
  items: GameResult[];
  searchName: string;
  myPrice: number;
  setMyPrice: (price: number) => void;
}) => {
  const prices = items.map((item) => item.price).filter((price) => price > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const averagePrice = prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2) : "0.00";

  const [minPrice, setMinPrice] = useState(lowestPrice);
  const [maxPrice, setMaxPrice] = useState(highestPrice);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [exchangeRate, setExchangeRate] = useState(0.86); // USD to EUR rate (fallback rate)
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Fetch current exchange rate from free API
  const fetchExchangeRate = async () => {
    try {
      setIsLoadingRate(true);
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await response.json();

      if (data.rates && data.rates.EUR) {
        setExchangeRate(data.rates.EUR);
        console.log("Exchange rate updated:", data.rates.EUR);
      }
    } catch (error) {
      console.error("Failed to fetch exchange rate, using fallback 0.86:", error);
      setExchangeRate(0.86); // Fallback rate
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Fetch exchange rate on component mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Function to convert price based on selected currency
  const convertPrice = (price: number) => {
    return currency === "EUR" ? (price * exchangeRate).toFixed(2) : price.toFixed(2);
  };

  // Function to get currency symbol
  const getCurrencySymbol = () => {
    return currency === "EUR" ? "€" : "$";
  };

  // Function to pass myPrice to components
  const getPriceData = () => ({
    lowestPrice,
    highestPrice,
    averagePrice: Number(averagePrice),
    myPrice,
  });

  const filteredItems = items
    .filter((item) => item.price >= minPrice && item.price <= maxPrice)
    .sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="backdrop-blur-sm bg-black/40 rounded-2xl p-6 border-2 border-cyan-400/50 shadow-2xl">
          <h2 className="text-center text-3xl font-bold text-cyan-300 mb-4 font-mono tracking-wider">{searchName}</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500 rounded-xl border border-green-400">
              <div className="text-xs text-white font-mono mb-1">LOWEST</div>
              <div className="text-2xl font-bold text-white">
                {getCurrencySymbol()} {convertPrice(lowestPrice)}
              </div>
            </div>
            <div className="text-center p-4 bg-red-500 rounded-xl border border-red-400">
              <div className="text-xs text-white font-mono mb-1">HIGHEST</div>
              <div className="text-2xl font-bold text-white">
                {getCurrencySymbol()} {convertPrice(highestPrice)}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-500 rounded-xl border border-blue-400">
              <div className="text-xs text-white font-mono mb-1">AVERAGE</div>
              <div className="text-2xl font-bold text-white">
                {getCurrencySymbol()} {convertPrice(Number(averagePrice))}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-500 rounded-xl border border-purple-400">
              <div className="text-xs text-white font-mono mb-1">MY PRICE</div>
              <input
                type="number"
                step="0.01"
                value={myPrice || ""}
                onChange={(e) => setMyPrice(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-center text-xl font-bold bg-transparent text-white placeholder-purple-200 border-0 outline-0 focus:ring-0"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Range Filter */}
              <div>
                <label className="block text-cyan-300 font-mono mb-2 text-sm">Price Range:</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    min={lowestPrice}
                    max={highestPrice}
                    className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    min={lowestPrice}
                    max={highestPrice}
                    className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Sort Order Filter */}
              <div>
                <label className="block text-cyan-300 font-mono mb-2 text-sm">Sort Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {/* Currency Filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-cyan-300 font-mono text-sm">Currency:</label>
                  <button
                    onClick={fetchExchangeRate}
                    disabled={isLoadingRate}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-mono text-xs rounded transition-all duration-300"
                  >
                    {isLoadingRate ? "⟳" : "Refresh"}
                  </button>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")}
                  className="w-full p-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-xl text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€) - {exchangeRate.toFixed(4)}</option>
                </select>
                {isLoadingRate && <div className="text-xs text-cyan-300 mt-1 font-mono">Updating...</div>}
              </div>
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
            <p className="text-green-400 font-bold text-xl mb-1">
              {getCurrencySymbol()} {convertPrice(item.price)}
            </p>
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
  const [myPrice, setMyPrice] = useState<number>(0);
  const [priceData, setPriceData] = useState<PriceData[]>([]);

  // States para adicionar à coleção
  const [addingGameId, setAddingGameId] = useState<string | null>(null);
  const [gamesPurchasePrice, setGamesPurchasePrice] = useState<Record<string, number>>({});
  const [gamesCondition, setGamesCondition] = useState<Record<string, string>>({});
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // Função para adicionar jogo à coleção
  const addToCollection = async (game: PriceData) => {
    setAddingGameId(game.id);
    setAddError(null);
    setAddSuccess(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("You must be logged in to add to collection");

      const purchasePrice = gamesPurchasePrice[game.id] || 0;
      const selectedCondition = gamesCondition[game.id] || "used";

      const payload = {
        gameTitle: game.product_name,
        platform: game.console_name || "Unknown",
        condition: selectedCondition,
        purchasePrice: purchasePrice > 0 ? purchasePrice : undefined,
        notes: `Genre: ${game.genre || "N/A"}`,
        images: [],
        loosePrice: game.prices.loose,
        gradedPrice: game.prices.graded,
        completePrice: game.prices.cib,
        newPrice: game.prices.new,
      };

      console.log("payload to add:", payload);

      const res = await fetch("/api/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to add to collection");
      }

      setAddSuccess(`${game.product_name} added to your collection!`);

      // Notify other parts of the app to refresh collection
      window.dispatchEvent(new CustomEvent("collection:added"));

      // Clear success message after 3 seconds
      setTimeout(() => setAddSuccess(null), 3000);
    } catch (err: any) {
      console.error("Add to collection error:", err);
      setAddError(err?.message || "Error adding to collection");
      setTimeout(() => setAddError(null), 3000);
    } finally {
      setAddingGameId(null);
    }
  };

  const searchEbayOnly = async (searchName?: string, platformParam?: string) => {
    setLoading(true);

    // priority: platformParam (from OCR) > current state platform
    const platformToSend = normalizePlatform(platformParam ?? platform);
    console.log("[searchEbayOnly] searchName:", searchName ?? nome, "platformParam:", platformParam, "normalized:", platformToSend);

    const finalSearchName = searchName ?? nome;
    setSearchNameState(finalSearchName);

    try {
      // Chamar diretamente o FastAPI
      const params = new URLSearchParams({
        game_name: finalSearchName,
        platform: platformToSend,
        condition: condition,
      });

      console.log("[searchEbayOnly] fetch http://127.0.0.1:8000/ebay-search?", params.toString());
      const res = await fetch(`http://127.0.0.1:8000/ebay-search?${params.toString()}`);
      const data = await res.json();
      setResultados(data.resultados || []);
    } catch (error) {
      console.error("Erro na busca:", error);
      setResultados([]);
    }

    setLoading(false);
  };

  const [ocrTitles, setOcrTitles] = useState<string[]>([]);
  const [selectedOcrTitle, setSelectedOcrTitle] = useState<string>("");

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

  const handleOCRExtraction = (titles: string[] | string, plataforma?: string, priceData?: PriceData[]) => {
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
    setSearchNameState(arr[0] || "");

    // Se recebemos dados de preço do Price Charting, processar e exibir
    if (priceData && priceData.length > 0) {
      console.log("[handleOCRExtraction] Price Charting data received:", priceData);
      setPriceData(priceData);
      setLoading(false);
    } else if (arr[0]) {
      // Caso contrário, fazer busca normal (se ainda estiver usando busca externa)
      searchEbayOnly(arr[0], platformToUse);
    }
  };

  return (
    <div className="w-screen bg-gray-900 text-white font-mono">
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 shadow-md border-b border-gray-700 z-50">
        {/* Logo e Mensagem */}
        <a href="/" className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            RETRO HUNTER
          </h1>
          <span className="text-sm text-cyan-300 font-mono tracking-wide">Hunt, Decide, Sell</span>
        </a>

        {/* Navigation and Auth */}
        <div className="flex items-center space-x-6">
          <Link href="/about" className="text-cyan-300 hover:text-pink-400 transition-colors font-mono">
            About
          </Link>
          <Link href="/pricing" className="text-cyan-300 hover:text-pink-400 transition-colors font-mono">
            Pricing
          </Link>
          <AuthButton />
        </div>
      </header>

      <div className="relative z-10 flex h-screen pt-16">
        {/* Lateral Esquerda - Fixa */}
        <div className="w-1/2 h-full bg-black/30 p-8 border-r border-cyan-500/30 flex flex-col justify-between">
          <div>
            <AdvancedOCR onGameExtracted={handleOCRExtraction} isProcessing={loading} currentGameResults={resultados} userPrice={myPrice} />
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
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-8 border border-cyan-400/40">
                <div className="animate-pulse">
                  <p className="text-2xl text-cyan-400 font-mono mb-2">🔍 SEARCHING PRICES...</p>
                  <p className="text-cyan-300 font-mono">Please wait while we fetch the best prices</p>
                </div>
              </div>
            </div>
          )}

          {/* Price Data Display */}
          {!loading && priceData.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-cyan-300 font-mono tracking-wider">PRICE INFORMATION</h3>
                <p className="text-sm text-cyan-300/70 font-mono mt-2">
                  Found {priceData.length} game{priceData.length > 1 ? "s" : ""}
                </p>
              </div>

              {/* Success/Error Messages */}
              {addSuccess && (
                <div className="backdrop-blur-sm bg-green-900/30 border-2 border-green-400/50 text-green-300 rounded-xl p-4 text-center">
                  <p className="font-mono">✓ {addSuccess}</p>
                </div>
              )}
              {addError && (
                <div className="backdrop-blur-sm bg-red-900/30 border-2 border-red-400/50 text-red-300 rounded-xl p-4 text-center">
                  <p className="font-mono">✗ {addError}</p>
                </div>
              )}

              {priceData.map((item, index) => (
                <div key={index} className="backdrop-blur-sm bg-black/40 rounded-xl p-6 border-2 border-purple-400/50 shadow-2xl">
                  {/* Game Info */}
                  <div className="mb-4 pb-4 border-b border-cyan-400/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-2xl font-bold text-pink-400 font-mono">{item.product_name}</h4>
                      <span className="text-xs bg-purple-600 px-3 py-1 rounded-full font-mono">#{index + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-cyan-300/70 font-mono">Console:</span>
                        <span className="text-white font-mono ml-2 font-bold">{item.console_name}</span>
                      </div>
                      <div>
                        <span className="text-cyan-300/70 font-mono">Release:</span>
                        <span className="text-white font-mono ml-2 font-bold">{item.release_date || "N/A"}</span>
                      </div>
                      {item.genre && (
                        <div>
                          <span className="text-cyan-300/70 font-mono">Genre:</span>
                          <span className="text-white font-mono ml-2 font-bold">{item.genre}</span>
                        </div>
                      )}
                      {item.detected_title && (
                        <div>
                          <span className="text-cyan-300/70 font-mono">Detected as:</span>
                          <span className="text-yellow-300 font-mono ml-2 font-bold">{item.detected_title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prices Grid */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {item.prices.loose !== null && (
                      <div className="bg-blue-900/40 rounded-lg p-3 border-2 border-blue-400/50 transform hover:scale-105 transition-all">
                        <div className="text-[10px] text-blue-300 font-mono mb-1">LOOSE</div>
                        <div className="text-lg font-bold text-white font-mono">${item.prices.loose.toFixed(2)}</div>
                      </div>
                    )}

                    {item.prices.cib !== null && (
                      <div className="bg-green-900/40 rounded-lg p-3 border-2 border-green-400/50 transform hover:scale-105 transition-all">
                        <div className="text-[10px] text-green-300 font-mono mb-1">CIB</div>
                        <div className="text-lg font-bold text-white font-mono">${item.prices.cib.toFixed(2)}</div>
                      </div>
                    )}

                    {item.prices.new !== null && (
                      <div className="bg-purple-900/40 rounded-lg p-3 border-2 border-purple-400/50 transform hover:scale-105 transition-all">
                        <div className="text-[10px] text-purple-300 font-mono mb-1">NEW</div>
                        <div className="text-lg font-bold text-white font-mono">${item.prices.new.toFixed(2)}</div>
                      </div>
                    )}

                    {item.prices.graded !== null && (
                      <div className="bg-yellow-900/40 rounded-lg p-3 border-2 border-yellow-400/50 transform hover:scale-105 transition-all">
                        <div className="text-[10px] text-yellow-300 font-mono mb-1">GRADED</div>
                        <div className="text-lg font-bold text-white font-mono">${item.prices.graded.toFixed(2)}</div>
                      </div>
                    )}

                    {item.prices.box_only !== null && (
                      <div className="bg-gray-900/40 rounded-lg p-3 border-2 border-gray-400/50 transform hover:scale-105 transition-all">
                        <div className="text-[10px] text-gray-300 font-mono mb-1">BOX</div>
                        <div className="text-lg font-bold text-white font-mono">${item.prices.box_only.toFixed(2)}</div>
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  {(item.upc || item.asin) && (
                    <div className="pt-4 border-t border-cyan-400/30 text-sm space-y-2">
                      {item.upc && (
                        <div>
                          <span className="text-cyan-300/70 font-mono">UPC:</span>
                          <span className="text-white font-mono ml-2">{item.upc}</span>
                        </div>
                      )}
                      {item.asin && (
                        <div>
                          <span className="text-cyan-300/70 font-mono">ASIN:</span>
                          <span className="text-white font-mono ml-2">{item.asin}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add to Collection Section */}
                  <div className="mt-4 pt-4 border-t border-cyan-400/30">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-cyan-300/70 font-mono mb-1 block">CONDITION</label>
                        <select
                          value={gamesCondition[item.id] || "used"}
                          onChange={(e) => setGamesCondition({ ...gamesCondition, [item.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-lg text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-sm"
                        >
                          <option value="new">New</option>
                          <option value="used">Used</option>
                          <option value="refurbished">Refurbished</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-cyan-300/70 font-mono mb-1 block">MY PURCHASE PRICE</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={gamesPurchasePrice[item.id] || ""}
                          onChange={(e) => setGamesPurchasePrice({ ...gamesPurchasePrice, [item.id]: Number(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-gray-900/80 border-2 border-cyan-400/50 rounded-lg text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none transition-all duration-300 font-mono text-sm"
                        />
                      </div>
                      <button
                        onClick={() => addToCollection(item)}
                        disabled={addingGameId === item.id}
                        className={`px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 border-2 border-purple-400/50 hover:border-pink-400/50 font-mono text-sm ${
                          addingGameId === item.id ? "opacity-70 cursor-wait" : ""
                        }`}
                      >
                        {addingGameId === item.id ? "..." : "+ ADD"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resultados.length > 0 && <PriceTableAndSlider items={resultados} searchName={searchNameState} myPrice={myPrice} setMyPrice={setMyPrice} />}
          {!loading && resultados.length === 0 && priceData.length === 0 && nome.trim() && (
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

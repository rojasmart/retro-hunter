"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CollectionGame, Folder } from "@/lib/types/auth";
import AuthButton from "@/components/auth/AuthButton";
import PriceHistoryChart from "@/components/PriceHistoryChart";

export default function MyCollectionPage() {
  const { user, logout } = useAuth();
  const [games, setGames] = useState<CollectionGame[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
  const [newGame, setNewGame] = useState({
    title: "",
    platform: "",
    condition: "used",
    purchasePrice: "",
    notes: "",
    folderId: "",
  });
  const [newFolder, setNewFolder] = useState({
    name: "",
    description: "",
    color: "#22d3ee",
  });

  // Fetch user's collection
  const fetchCollection = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/collection`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch collection");

      console.log("Raw data from API:", data.games);

      // map backend documents to CollectionGame
      const mapped: CollectionGame[] = (data.games || []).map((g: any) => ({
        id: g._id,
        title: g.gameTitle,
        platform: g.platform,
        condition: g.condition,
        folderId: g.folderId,
        purchasePrice: g.purchasePrice,
        notes: g.notes,
        addedAt: g.createdAt,
        // Add price analysis fields
        lowestPrice: g.lowestPrice,
        highestPrice: g.highestPrice,
        averagePrice: g.averagePrice,
        newPrice: g.newPrice,
        loosePrice: g.loosePrice,
        gradedPrice: g.gradedPrice,
        completePrice: g.completePrice,
        priceHistory: g.priceHistory,
      }));

      console.log("Mapped games:", mapped);

      setGames(mapped);
    } catch (err: any) {
      console.error("Error fetching collection:", err);
      setError(err?.message || "Error fetching collection");
    } finally {
      setLoading(false);
    }
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const res = await fetch(`/api/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setFolders(
          data.folders.map((f: any) => ({
            id: f._id,
            name: f.name,
            description: f.description,
            color: f.color,
            icon: f.icon,
            gameCount: f.gameCount,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          }))
        );
        setUncategorizedCount(data.uncategorizedCount);
      }
    } catch (err: any) {
      console.error("Error fetching folders:", err);
    }
  };

  // Create new folder
  const handleAddFolder = async () => {
    if (!newFolder.name.trim()) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFolder),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create folder");
        setTimeout(() => setError(null), 3000);
        return;
      }

      await fetchFolders();
      setNewFolder({ name: "", description: "", color: "#22d3ee" });
      setIsAddingFolder(false);
    } catch (err: any) {
      console.error("Error creating folder:", err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta pasta? Os jogos não serão deletados.")) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/folders?id=${folderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchFolders();
        await fetchCollection();
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
        }
      }
    } catch (err: any) {
      console.error("Error deleting folder:", err);
    }
  };

  // Move game to folder
  const moveGameToFolder = async (gameId: string, folderId: string | null) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/collection?id=${gameId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId }),
      });

      if (res.ok) {
        await fetchCollection();
        await fetchFolders();
      }
    } catch (err: any) {
      console.error("Error moving game:", err);
    }
  };

  // Update prices for a single game
  const updateGamePrices = async (gameId: string, gameTitle: string, platform: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      // Fetch new prices from backend price API
      const priceResponse = await fetch(
        `http://127.0.0.1:8000/price-search?game_name=${encodeURIComponent(gameTitle)}&platform=${encodeURIComponent(platform)}`
      );

      if (!priceResponse.ok) {
        console.warn(`Failed to fetch prices for ${gameTitle}`);
        return false;
      }

      const priceData = await priceResponse.json();

      if (priceData.success && priceData.data && priceData.data.prices) {
        // Update the game with new prices and add to history
        const updateResponse = await fetch("/api/collection/update-prices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gameId,
            newPrice: priceData.data.prices.new,
            loosePrice: priceData.data.prices.loose,
            gradedPrice: priceData.data.prices.graded,
            completePrice: priceData.data.prices.cib,
          }),
        });

        if (updateResponse.ok) {
          console.log(`✓ Updated prices for ${gameTitle}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`Error updating prices for ${gameTitle}:`, error);
      return false;
    }
  };

  // Update all games prices
  const updateAllGamesPrices = async () => {
    if (games.length === 0) return;

    setUpdatingPrices(true);
    setUpdateProgress({ current: 0, total: games.length });

    let successCount = 0;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      setUpdateProgress({ current: i + 1, total: games.length });

      const success = await updateGamePrices(game.id, game.title, game.platform);
      if (success) successCount++;

      // Add a small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`Updated ${successCount}/${games.length} games successfully`);

    // Refresh collection to show updated data
    await fetchCollection();
    setUpdatingPrices(false);
    setUpdateProgress({ current: 0, total: 0 });
  };

  useEffect(() => {
    const initializeCollection = async () => {
      await fetchFolders();
      await fetchCollection();
    };

    initializeCollection();

    // Listen for collection updates
    const handler = () => {
      fetchCollection();
      fetchFolders();
    };
    window.addEventListener("collection:added", handler);
    return () => window.removeEventListener("collection:added", handler);
  }, []);

  // Auto-update prices when games are loaded (once per day)
  useEffect(() => {
    if (games.length === 0) return;

    const lastUpdate = localStorage.getItem("last_price_update");
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Check if we should update (once per day)
    if (!lastUpdate || now - parseInt(lastUpdate) > oneDayMs) {
      console.log("Triggering automatic price update...");
      updateAllGamesPrices();
      localStorage.setItem("last_price_update", now.toString());
    }
  }, [games.length]);

  const handleAddGame = () => {
    if (!newGame.title || !newGame.platform) return;

    const game: CollectionGame = {
      id: `game_${Date.now()}`,
      title: newGame.title,
      platform: newGame.platform,
      condition: newGame.condition,
      purchasePrice: newGame.purchasePrice ? parseFloat(newGame.purchasePrice) : undefined,
      notes: newGame.notes || undefined,
      addedAt: new Date(),
    };

    setGames((prev) => [...prev, game]);
    setNewGame({
      title: "",
      platform: "",
      condition: "used",
      purchasePrice: "",
      notes: "",
      folderId: "",
    });
    setIsAddingGame(false);
  };

  const handleRemoveGame = async (gameId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/collection?id=${gameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to delete game");
      }

      // Remove from local state
      setGames((prev) => prev.filter((game) => game.id !== gameId));

      console.log(`Game ${gameId} deleted successfully`);
    } catch (err: any) {
      console.error("Error deleting game:", err);
      setError(err?.message || "Error deleting game");
      setTimeout(() => setError(null), 3000);
    }
  };

  const totalValue = games.reduce((sum, game) => sum + (game.purchasePrice || 0), 0);

  return (
    <ProtectedRoute>
      <div className="w-screen h-screen bg-gray-900 text-white overflow-hidden">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 shadow-md border-b border-gray-700 z-50">
          {/* Logo e Mensagem */}
          <a href="/" className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              RETRO HUNTER
            </h1>
            <span className="text-sm text-cyan-300 tracking-wide">Hunt, Decide, Sell</span>
          </a>

          {/* Auth */}
          <div className="flex items-center">
            <AuthButton />
          </div>
        </header>

        {/* Main Content - Fullscreen with scroll */}
        <div className="w-full h-full pt-16 overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-cyan-300">My Collection</h1>
                <p className="text-cyan-100/80">Manage your game collection</p>
                {updatingPrices && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-yellow-400">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>
                      Updating prices... ({updateProgress.current}/{updateProgress.total})
                    </span>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={updateAllGamesPrices}
                  disabled={updatingPrices || games.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-bold transition-all duration-300 border border-cyan-400/50 flex items-center space-x-2"
                >
                  <svg className={`w-5 h-5 ${updatingPrices ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Update Prices</span>
                </button>
                <button
                  onClick={() => setIsAddingGame(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-bold transition-all duration-300 border border-purple-400/50 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Adicionar Jogo</span>
                </button>
              </div>
            </div>

            {/* Statistics and Folders - Same Line */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Statistics - 3 columns */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-cyan-400/50 shadow-xl">
                  <div className="text-2xl font-bold text-cyan-400">{games.length}</div>
                  <div className="text-cyan-100/80">Games in your Collection</div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-green-400/50 shadow-xl">
                  <div className="text-2xl font-bold text-green-400">$ {totalValue.toFixed(2)}</div>
                  <div className="text-cyan-100/80">Total Invested Value</div>
                </div>
                <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-purple-400/50 shadow-xl">
                  <div className="text-2xl font-bold text-purple-400">{new Set(games.map((g) => g.platform)).size}</div>
                  <div className="text-cyan-100/80">Different Platforms</div>
                </div>
              </div>

              {/* Folders Sidebar - 1 column */}
              <div className="lg:col-span-1">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-cyan-400/50 shadow-xl h-full">
                  <div className="px-4 py-3 border-b border-cyan-500/30 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-cyan-300">Folders</h3>
                    <button
                      onClick={() => setIsAddingFolder(true)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      title="Criar Nova Pasta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-2 max-h-[200px] overflow-y-auto">
                    {/* All Games */}
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                        selectedFolder === null ? "bg-cyan-600/30 text-cyan-300 border border-cyan-400/50" : "text-cyan-100/80 hover:bg-gray-800/50"
                      }`}
                    >
                      <span>All Games</span>
                      <span className="text-xs bg-gray-700/50 px-2 py-0.5 rounded">{games.length}</span>
                    </button>

                    {/* Uncategorized */}
                    <button
                      onClick={() => setSelectedFolder("uncategorized")}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between mt-1 ${
                        selectedFolder === "uncategorized"
                          ? "bg-cyan-600/30 text-cyan-300 border border-cyan-400/50"
                          : "text-cyan-100/80 hover:bg-gray-800/50"
                      }`}
                    >
                      <span>No Folder</span>
                      <span className="text-xs bg-gray-700/50 px-2 py-0.5 rounded">{uncategorizedCount}</span>
                    </button>

                    <div className="border-t border-cyan-500/20 my-2"></div>

                    {/* User Folders */}
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className={`group w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between mt-1 ${
                          selectedFolder === folder.id
                            ? "bg-cyan-600/30 text-cyan-300 border border-cyan-400/50"
                            : "text-cyan-100/80 hover:bg-gray-800/50"
                        }`}
                      >
                        <button onClick={() => setSelectedFolder(folder.id)} className="flex-1 flex items-center justify-between">
                          <span style={{ color: folder.color }}>📁 {folder.name}</span>
                          <span className="text-xs bg-gray-700/50 px-2 py-0.5 rounded">{folder.gameCount}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="ml-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Folder Modal */}
            {isAddingFolder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-cyan-400/50">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-cyan-300">Nova Pasta</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Nome da Pasta *</label>
                        <input
                          type="text"
                          value={newFolder.name}
                          onChange={(e) => setNewFolder((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                          placeholder="Ex: Jogos SNES"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Descrição</label>
                        <input
                          type="text"
                          value={newFolder.description}
                          onChange={(e) => setNewFolder((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                          placeholder="Ex: Minha coleção de SNES"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Cor</label>
                        <div className="flex space-x-2">
                          {["#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((color) => (
                            <button
                              key={color}
                              onClick={() => setNewFolder((prev) => ({ ...prev, color }))}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                newFolder.color === color ? "border-white scale-110" : "border-gray-600"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={() => {
                          setIsAddingFolder(false);
                          setNewFolder({ name: "", description: "", color: "#22d3ee" });
                        }}
                        className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddFolder}
                        disabled={!newFolder.name.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        Criar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Game Modal */}
            {isAddingGame && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-cyan-400/50">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-cyan-300">Adicionar Jogo</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Game Title *</label>
                        <input
                          type="text"
                          value={newGame.title}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                          placeholder="Ex: Sonic Adventure"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Platform *</label>
                        <select
                          value={newGame.platform}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, platform: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                        >
                          <option value="">Selecione uma plataforma</option>
                          <option value="dreamcast">Dreamcast</option>
                          <option value="ps2">PlayStation 2</option>
                          <option value="xbox">Xbox Original</option>
                          <option value="nintendo-64">Nintendo 64</option>
                          <option value="playstation">PlayStation</option>
                          <option value="snes">Super Nintendo</option>
                          <option value="mega-drive">Mega Drive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Condition</label>
                        <select
                          value={newGame.condition}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, condition: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                        >
                          <option value="new">Novo</option>
                          <option value="used">Usado</option>
                          <option value="refurbished">Restaurado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Folder</label>
                        <select
                          value={newGame.folderId}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, folderId: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                        >
                          <option value="">Uncategorised</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Purchase Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newGame.purchasePrice}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                          placeholder="Ex: 59.90"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Notes</label>
                        <textarea
                          value={newGame.notes}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                          rows={3}
                          placeholder="Observações sobre o jogo..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={() => setIsAddingGame(false)}
                        className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddGame}
                        disabled={!newGame.title || !newGame.platform}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        Add Game
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Games List */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-cyan-400/50 shadow-xl">
              <div className="px-6 py-4 border-b border-cyan-500/30">
                <h2 className="text-lg font-semibold text-cyan-300">
                  {selectedFolder === null && "All Games"}
                  {selectedFolder === "uncategorized" && "Uncategorised"}
                  {selectedFolder && selectedFolder !== "uncategorized" && folders.find((f) => f.id === selectedFolder)?.name}
                </h2>
              </div>

              {(() => {
                // Filter games based on selected folder
                const filteredGames =
                  selectedFolder === null
                    ? games
                    : selectedFolder === "uncategorized"
                    ? games.filter((g) => !g.folderId)
                    : games.filter((g) => g.folderId === selectedFolder);

                return filteredGames.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-400/30">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-cyan-300 mb-2">Nenhum jogo nesta pasta</h3>
                    <p className="text-cyan-100/60 mb-6">Adicione jogos ou mova jogos existentes para esta pasta.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-cyan-500/20">
                    {filteredGames.map((game) => (
                      <div key={game.id} className="p-6 hover:bg-gray-800/30 transition-colors">
                        {/* Title, Folder Dropdown and Purchase Price */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3 flex-1">
                            <h3 className="text-lg font-medium text-cyan-300">{game.title}</h3>
                            <select
                              value={game.folderId || ""}
                              onChange={(e) => moveGameToFolder(game.id, e.target.value || null)}
                              className="text-xs px-2 py-1 bg-gray-900/80 border border-cyan-400/30 rounded text-cyan-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 focus:outline-none"
                              title="Mover para pasta"
                            >
                              <option value="">No folder</option>
                              {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          {game.purchasePrice && (
                            <div className="flex items-center space-x-2 bg-gray-800/50 px-2 py-1 rounded border border-cyan-400/30">
                              <span className="text-md text-purple-300">My Price:</span>
                              <span className="text-purple-400 font-bold text-lg">$ {game.purchasePrice.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {/* Platform and Condition */}
                        <div className="flex items-center space-x-4 text-sm text-cyan-100/80 mb-4">
                          <span className="bg-gray-800/50 px-2 py-1 rounded border border-cyan-400/30">{game.platform}</span>
                          <span className="capitalize">{game.condition}</span>
                        </div>

                        {/* Price Analysis Section - Full Width */}
                        {(game.newPrice || game.loosePrice || game.gradedPrice || game.completePrice) && (
                          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-400/30">
                            <p className="text-xs font-medium text-blue-300 mb-3">Price Analysis Market:</p>

                            {/* Price History Chart with Indicators */}
                            <PriceHistoryChart
                              priceHistory={game.priceHistory}
                              currentPrices={{
                                newPrice: game.newPrice,
                                loosePrice: game.loosePrice,
                                gradedPrice: game.gradedPrice,
                                completePrice: game.completePrice,
                              }}
                              addedAt={game.addedAt}
                            />
                          </div>
                        )}

                        {/* Notes */}
                        {game.notes && <p className="mt-3 text-sm text-cyan-100/60 italic">{game.notes}</p>}

                        {/* Added Date and Delete Button */}
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-cyan-400/60">Added on {new Date(game.addedAt).toLocaleDateString("pt-BR")}</p>
                          <button onClick={() => handleRemoveGame(game.id)} className="text-red-400 hover:text-red-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

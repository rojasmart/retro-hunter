"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CollectionGame } from "@/lib/types/auth";
import AuthButton from "@/components/auth/AuthButton";

export default function MyCollectionPage() {
  const { user, logout } = useAuth();
  const [games, setGames] = useState<CollectionGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGame, setNewGame] = useState({
    title: "",
    platform: "",
    condition: "used",
    purchasePrice: "",
    notes: "",
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
        purchasePrice: g.purchasePrice,
        notes: g.notes,
        addedAt: g.createdAt,
        // Add price analysis fields
        lowestPrice: g.lowestPrice,
        highestPrice: g.highestPrice,
        averagePrice: g.averagePrice,
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

  useEffect(() => {
    fetchCollection();

    // Listen for collection updates
    const handler = () => fetchCollection();
    window.addEventListener("collection:added", handler);
    return () => window.removeEventListener("collection:added", handler);
  }, []);

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
    });
    setIsAddingGame(false);
  };

  const handleRemoveGame = (gameId: string) => {
    // TODO: call DELETE API
    setGames((prev) => prev.filter((game) => game.id !== gameId));
  };

  const totalValue = games.reduce((sum, game) => sum + (game.purchasePrice || 0), 0);

  return (
    <ProtectedRoute>
      <div className="w-screen h-screen bg-gray-900 text-white font-mono overflow-hidden">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 shadow-md border-b border-gray-700 z-50">
          {/* Logo e Mensagem */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              RETRO HUNTER
            </h1>
            <span className="text-sm text-cyan-300 font-mono tracking-wide">Hunt, Decide, Sell</span>
          </div>

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
              </div>
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

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            {/* Add Game Modal */}
            {isAddingGame && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-cyan-400/50">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-cyan-300">Adicionar Jogo</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Título do Jogo *</label>
                        <input
                          type="text"
                          value={newGame.title}
                          onChange={(e) => setNewGame((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                          placeholder="Ex: Sonic Adventure"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Plataforma *</label>
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
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Condição</label>
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
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Preço de Compra ($)</label>
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
                        <label className="block text-sm font-medium text-cyan-100 mb-1">Notas</label>
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
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddGame}
                        disabled={!newGame.title || !newGame.platform}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Games List */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-cyan-400/50 shadow-xl">
              <div className="px-6 py-4 border-b border-cyan-500/30">
                <h2 className="text-lg font-semibold text-cyan-300">Jogos</h2>
              </div>

              {games.length === 0 ? (
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
                  <h3 className="text-lg font-medium text-cyan-300 mb-2">Nenhum jogo na coleção</h3>
                  <p className="text-cyan-100/60 mb-6">Comece adicionando seus primeiros jogos à sua coleção!</p>
                  <button
                    onClick={() => setIsAddingGame(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-bold transition-colors border border-purple-400/50"
                  >
                    Adicionar Primeiro Jogo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-cyan-500/20">
                  {games.map((game) => {
                    console.log("Rendering game:", game);
                    return (
                      <div key={game.id} className="p-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-cyan-300">{game.title}</h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-cyan-100/80">
                            <span className="bg-gray-800/50 px-2 py-1 rounded border border-cyan-400/30">{game.platform}</span>
                            <span className="capitalize">{game.condition}</span>
                          </div>

                          {/* MY PRICE Section - More prominent */}
                          {game.purchasePrice && (
                            <div className="mt-2 p-2 bg-purple-900/20 rounded-lg border border-purple-400/30">
                              <p className="text-xs font-medium text-purple-300 mb-1">My Price:</p>
                              <span className="text-purple-400 font-bold text-sm">$ {game.purchasePrice.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Price Analysis Section */}
                          {(game.lowestPrice || game.highestPrice || game.averagePrice) && (
                            <div className="mt-2 p-2 bg-blue-900/20 rounded-lg border border-blue-400/30">
                              <p className="text-xs font-medium text-blue-300 mb-1">Análise de Preços de Mercado:</p>
                              <div className="flex items-center space-x-4 text-xs">
                                {game.lowestPrice && (
                                  <span className="flex items-center">
                                    <span className="text-green-400 font-medium">↓ Menor:$ {game.lowestPrice.toFixed(2)}</span>
                                  </span>
                                )}
                                {game.highestPrice && (
                                  <span className="flex items-center">
                                    <span className="text-red-400 font-medium">↑ Maior:$ {game.highestPrice.toFixed(2)}</span>
                                  </span>
                                )}
                                {game.averagePrice && (
                                  <span className="flex items-center">
                                    <span className="text-blue-400 font-medium">≈ Médio:$ {game.averagePrice.toFixed(2)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {game.notes && <p className="mt-2 text-sm text-cyan-100/60">{game.notes}</p>}
                          <p className="text-xs text-cyan-400/60 mt-1">Adicionado em {new Date(game.addedAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <button onClick={() => handleRemoveGame(game.id)} className="ml-4 text-red-400 hover:text-red-300 transition-colors">
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

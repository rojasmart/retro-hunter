"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthButton from "@/components/auth/AuthButton";
import { CollectionGame } from "@/lib/types/auth";

export default function MyAccountPage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [games, setGames] = useState<CollectionGame[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [platformCount, setPlatformCount] = useState(0);

  useEffect(() => {
    const fetchCollection = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const res = await fetch(`/api/collection`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch collection");

        const mappedGames: CollectionGame[] = (data.games || []).map((g: any) => ({
          id: g._id,
          title: g.gameTitle,
          platform: g.platform,
          condition: g.condition,
          purchasePrice: g.purchasePrice,
          notes: g.notes,
          addedAt: g.createdAt,
          lowestPrice: g.lowestPrice,
          highestPrice: g.highestPrice,
          averagePrice: g.averagePrice,
          newPrice: g.newPrice,
          loosePrice: g.loosePrice,
          gradedPrice: g.gradedPrice,
          completePrice: g.completePrice,
        }));

        setGames(mappedGames);
        setTotalValue(mappedGames.reduce((sum, game) => sum + (game.purchasePrice || 0), 0));
        setPlatformCount(new Set(mappedGames.map((g) => g.platform)).size);
      } catch (error) {
        console.error("Failed to fetch collection data:", error);
      }
    };

    fetchCollection();
  }, []);

  const handleSave = async () => {
    // Aqui você implementaria a atualização do perfil
    console.log("Salvando dados:", formData);
    setIsEditing(false);
    // Em uma implementação real, você faria uma chamada à API
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

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
            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-cyan-400/50 shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-cyan-500/30">
                <h1 className="text-2xl font-bold text-cyan-300">My Account</h1>
                <p className="text-cyan-100/80">Manage your personal information</p>
              </div>

              {/* Profile Section */}
              <div className="p-6">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-cyan-400/50">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-cyan-300">{user?.name}</h2>
                    <p className="text-cyan-100/80">{user?.email}</p>
                    <p className="text-sm text-cyan-400/60">
                      Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Information Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-cyan-100 mb-2">Nome</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-800/50 rounded-md text-cyan-100 border border-cyan-400/30">{user?.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-100 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900/80 border border-cyan-400/50 rounded-md text-cyan-100 placeholder-cyan-300/60 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-800/50 rounded-md text-cyan-100 border border-cyan-400/30">{user?.email}</div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-bold transition-colors border border-purple-400/50"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-bold transition-colors border border-purple-400/50"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics Section */}
              <div className="border-t border-cyan-500/30 px-6 py-4">
                <h3 className="text-lg font-medium text-cyan-300 mb-4">Statistic</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-400/30">
                    <div className="text-2xl font-bold text-blue-400">{games.length}</div>
                    <div className="text-sm text-blue-300">Games in your Collection</div>
                  </div>
                  <div className="bg-green-900/20 p-4 rounded-lg border border-green-400/30">
                    <div className="text-2xl font-bold text-green-400">$ {totalValue.toFixed(2)}</div>
                    <div className="text-sm text-green-300">Total Invested Value</div>
                  </div>
                  <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-400/30">
                    <div className="text-2xl font-bold text-purple-400">{platformCount}</div>
                    <div className="text-sm text-purple-300">Different Platforms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

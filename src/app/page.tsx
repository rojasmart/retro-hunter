"use client";

import { useState } from "react";
import { GameResult } from "@/lib/types";
import Image from "next/image";

export default function Home() {
  const [nome, setNome] = useState("");
  const [resultados, setResultados] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEbayOnly = async () => {
    setLoading(true);
    const res = await fetch(`/api/ebay?nome=${encodeURIComponent(nome)}`);
    const data = await res.json();
    setResultados(data.resultados || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-500">🎮 Retrosniffer</h1>
      <p className="mb-6 text-gray-500">Compare o preço de jogos retro automaticamente</p>

      <div className="max-w-2xl space-y-4">
        {/* Campo de busca */}
        <div>
          <label htmlFor="game-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Jogo
          </label>
          <input
            id="game-name"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite o nome do jogo (ex: R-Type Final)"
            className="border border-gray-300 p-3 rounded-lg w-full text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botão de busca */}
        <div>
          <button
            onClick={searchEbayOnly}
            disabled={loading || !nome.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed w-full font-medium"
          >
            {loading ? "🔍 Procurando..." : "🛒 Buscar no eBay"}
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-8 space-y-4">
        {resultados.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resultados encontrados ({resultados.length}):</h2>
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
                  {r.image && <Image src={r.image} alt={r.title} width={300} height={96} className="w-full h-24 object-cover rounded border" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && resultados.length === 0 && nome.trim() && (
          <div className="text-center py-8">
            <p className="text-gray-500">😕 Nenhum resultado encontrado para &ldquo;{nome}&rdquo;</p>
            <p className="text-sm text-gray-400 mt-1">Tente alterar a plataforma ou usar termos diferentes</p>
          </div>
        )}
      </div>
    </div>
  );
}

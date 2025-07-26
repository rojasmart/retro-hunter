"use client";

import { useState } from "react";

export default function Home() {
  const [nome, setNome] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    const res = await fetch(`/api/comparar?nome=${encodeURIComponent(nome)}`);
    const data = await res.json();
    setResultados(data.resultados || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-500">🎮 Retrosniffer</h1>
      <p className="mb-4 text-gray-500">Compare o preço de jogos retro automaticamente</p>

      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Digite o nome do jogo (ex: R-Type Final)"
        className="border p-2 rounded w-full max-w-md mb-4 text-gray-500"
      />
      <br />
      <button onClick={search} disabled={loading || !nome} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        {loading ? "Procurar..." : "Procurar"}
      </button>

      <div className="mt-8 space-y-4">
        {resultados.length > 0 && <h2 className="text-xl font-semibold text-gray-800">Resultados encontrados:</h2>}
        {resultados.map((r, i) => (
          <div key={i} className="bg-white p-4 shadow rounded border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-2">
              <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold hover:text-blue-900 flex-1">
                {r.title}
              </a>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2 whitespace-nowrap">{r.site}</span>
            </div>
            <p className="text-green-600 font-bold text-lg">{r.priceText}</p>
            {r.image && <img src={r.image} alt={r.title} className="mt-2 h-16 w-16 object-cover rounded" />}
          </div>
        ))}
      </div>
    </div>
  );
}

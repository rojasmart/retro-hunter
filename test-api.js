require("dotenv").config({ path: ".env.local" });

// Teste da API local
async function testarAPI() {
  try {
    console.log("🧪 Testando API do RetroSniffer...\n");

    // Testar termos que funcionaram no sandbox
    const testTerms = ["laptop", "camera", "toy"];

    for (const term of testTerms) {
      console.log(`🔍 Testando: "${term}"`);

      const response = await fetch(`http://localhost:3000/api/ebay?nome=${encodeURIComponent(term)}&platform=all`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Total: ${data.total || 0}`);
        console.log(`   📦 Resultados: ${data.resultados?.length || 0}`);

        if (data.resultados && data.resultados.length > 0) {
          const firstItem = data.resultados[0];
          console.log(`   🎮 Primeiro: ${firstItem.title}`);
          console.log(`   � Preço: ${firstItem.price} ${firstItem.currency || ""}`);
        }
      } else {
        const error = await response.json();
        console.log(`   ❌ Erro ${response.status}: ${error.error || "Erro desconhecido"}`);
      }

      console.log("");
    }
  } catch (error) {
    console.error("\n❌ Erro ao testar API:", error.message);
    console.log("\n💡 Certifique-se que o servidor está rodando:");
    console.log("   npm run dev");
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testarAPI();
}

module.exports = testarAPI;

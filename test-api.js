// Teste da API local
async function testarAPI() {
  try {
    console.log("🧪 Testando API do RetroSniffer...\n");

    const response = await fetch("http://localhost:3000/api/comparar?nome=R-Type");
    const data = await response.json();

    console.log("📊 Resposta da API:");
    console.log(JSON.stringify(data, null, 2));

    if (data.resultados && data.resultados.length > 0) {
      console.log("\n✅ API funcionando corretamente!");
      console.log(`📈 Encontrados ${data.total} resultados`);
    } else {
      console.log("\n⚠️ API retornou sem resultados");
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

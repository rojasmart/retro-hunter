// Script para testar a API do eBay
const { scrapeEbay } = require("./src/lib/scrapers/ebay.ts");

async function testEbayAPI() {
  console.log("🧪 Testando API do eBay...");

  try {
    // Verificar variáveis de ambiente
    const token = process.env.EBAY_ACCESS_TOKEN;
    if (!token) {
      console.error("❌ EBAY_ACCESS_TOKEN não encontrado no .env.local");
      console.log("📝 Configure seu token no arquivo .env.local:");
      console.log("EBAY_ACCESS_TOKEN=your_oauth_application_token_here");
      return;
    }

    console.log("✅ Token do eBay encontrado");

    // Testar busca simples
    console.log('\n🔍 Testando busca por "mario"...');
    const results = await scrapeEbay("mario", "all");

    if (results.length > 0) {
      console.log(`✅ Encontrados ${results.length} resultados:`);
      results.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Preço: ${result.priceText}`);
        console.log(`   Link: ${result.link}`);
        console.log("");
      });
    } else {
      console.log("❌ Nenhum resultado encontrado");
    }

    // Testar busca específica por plataforma
    console.log('🔍 Testando busca por "mario" no PS2...');
    const ps2Results = await scrapeEbay("mario", "ps2");
    console.log(`✅ Encontrados ${ps2Results.length} resultados para PS2`);
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);

    if (error.message.includes("EBAY_ACCESS_TOKEN")) {
      console.log("\n📋 Para configurar o eBay:");
      console.log("1. Acesse: https://developer.ebay.com/");
      console.log("2. Crie uma aplicação");
      console.log("3. Gere um OAuth Application Token");
      console.log("4. Adicione o token ao .env.local");
    }
  }
}

// Executar teste se for chamado diretamente
if (require.main === module) {
  testEbayAPI();
}

module.exports = { testEbayAPI };

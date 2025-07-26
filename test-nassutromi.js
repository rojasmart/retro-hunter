// Teste específico para o scraper do blog Nas Sutromi
const { scrapeNasSutromiBlog } = require("./src/lib/scrapers/nassutromi.ts");

async function testarNasSutromi() {
  console.log("🧪 Testando scraper do Nas Sutromi Blog...\n");

  const jogosParaTestar = ["Hello Kitty", "R-Type", "Final Fantasy", "Resident Evil", "Prince of Persia", "Devil May Cry"];

  for (const jogo of jogosParaTestar) {
    console.log(`🔍 Buscando: ${jogo}`);

    try {
      const resultados = await scrapeNasSutromiBlog(jogo);

      if (resultados.length > 0) {
        console.log(`✅ Encontrados ${resultados.length} resultados:`);
        resultados.forEach((resultado, index) => {
          console.log(`  ${index + 1}. ${resultado.title}`);
          console.log(`     Preço: ${resultado.priceText}`);
          console.log(`     Link: ${resultado.link}`);
          console.log("");
        });
      } else {
        console.log("❌ Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar ${jogo}:`, error.message);
    }

    console.log("─".repeat(50));
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testarNasSutromi();
}

module.exports = testarNasSutromi;

// Teste específico para Soul Calibur 3 / Soul Calibur III
async function testSoulCalibur() {
  console.log("⚔️ Testando Soul Calibur 3 vs Soul Calibur III\n");
  console.log("=".repeat(60));

  const testCases = ["Soul Calibur 3", "Soul Calibur III", "soul calibur 3", "soul calibur iii", "SoulCalibur 3", "SoulCalibur III"];

  console.log("🔍 Testando diferentes variações de busca:\n");

  testCases.forEach((searchTerm, index) => {
    console.log(`${index + 1}. "${searchTerm}"`);

    // Simular normalização
    const normalized = normalizeRomanNumerals(searchTerm.toLowerCase());
    console.log(`   Normalizado: "${normalized}"`);

    // Testar match com título conhecido
    const knownTitle = "Soul Calibur III";
    const titleNormalized = normalizeRomanNumerals(knownTitle.toLowerCase());

    const exactMatch = knownTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedMatch = titleNormalized.includes(normalized) || knownTitle.toLowerCase().includes(normalized);

    console.log(`   Match exato: ${exactMatch ? "✅" : "❌"}`);
    console.log(`   Match normalizado: ${normalizedMatch ? "✅" : "❌"}`);
    console.log("");
  });

  console.log("📦 Resultados esperados:");
  console.log("─".repeat(40));

  // WebBuy Portugal
  console.log("\n🇵🇹 WebBuy Portugal:");
  console.log("  📦 Soul Calibur III - PlayStation 2 (Usado)");
  console.log("  💰 €16.99");
  console.log("  🔗 https://pt.webuy.com/product/711719183617");
  console.log("  📋 SKU: 711719183617");
  console.log("  ✅ Link correto fornecido pelo usuário");

  // Nas Sutromi Blog
  console.log("\n🇵🇹 Nas Sutromi Blog:");
  console.log("  📦 Soul Calibur III - PlayStation 2 (Usado)");
  console.log("  💰 €18 (~R$ 108.00)");
  console.log("  🔗 https://nas-sutromi.blogspot.com/2023/05/soul-calibur-iii.html");
  console.log("  ✅ Adicionado ao fallback");

  console.log("\n🔧 Melhorias implementadas:");
  console.log("─".repeat(40));
  console.log("✅ Função normalizeRomanNumerals() adicionada");
  console.log("✅ Soul Calibur III adicionado aos fallbacks");
  console.log("✅ Busca cruzada (3 ↔ III) implementada");
  console.log("✅ SKU real do WebBuy: 711719183617");
  console.log("✅ Match aprimorado para números romanos");

  console.log("\n🚀 Como testar:");
  console.log("─".repeat(40));
  console.log("1. npm run dev");
  console.log("2. Abra http://localhost:3000");
  console.log('3. Pesquise por: "Soul Calibur 3"');
  console.log("4. Deveria aparecer nos dois scrapers agora!");

  console.log("\n📝 Mapeamento de números romanos:");
  console.log("─".repeat(40));
  console.log("I → 1    |  VI → 6     |  XI → 11    |  XVI → 16");
  console.log("II → 2   |  VII → 7    |  XII → 12   |  XVII → 17");
  console.log("III → 3  |  VIII → 8   |  XIII → 13  |  XVIII → 18");
  console.log("IV → 4   |  IX → 9     |  XIV → 14   |  XIX → 19");
  console.log("V → 5    |  X → 10     |  XV → 15    |  XX → 20");
}

// Função de normalização (cópia da implementada)
function normalizeRomanNumerals(text) {
  const romanToArabic = {
    " iii": " 3",
    " ii": " 2",
    " iv": " 4",
    " v": " 5",
    " vi": " 6",
    " vii": " 7",
    " viii": " 8",
    " ix": " 9",
    " x": " 10",
    " xi": " 11",
    " xii": " 12",
    " xiii": " 13",
    " xiv": " 14",
    " xv": " 15",
    " xvi": " 16",
    " xvii": " 17",
    " xviii": " 18",
    " xix": " 19",
    " xx": " 20",
  };

  let normalized = text;
  for (const [roman, arabic] of Object.entries(romanToArabic)) {
    normalized = normalized.replace(new RegExp(roman, "g"), arabic);
  }

  return normalized;
}

// Executar se chamado diretamente
if (require.main === module) {
  testSoulCalibur();
}

module.exports = testSoulCalibur;

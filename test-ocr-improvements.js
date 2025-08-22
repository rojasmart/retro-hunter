/**
 * Script de teste para demonstrar as melhorias no OCR
 */

import { generateGameNameVariations, cleanOCRText } from "./src/lib/utils/ocr";

// Simular texto OCR de uma capa do "Super Monaco GP II" com ruído
const testOCRTexts = [
  // Caso 1: Texto com sistema + título
  `SEGA
  Master System
  SUPER MONACO GP II
  Racing Game`,

  // Caso 2: Texto bagunçado típico de OCR
  `5EGA
  M45TER 5Y5TEM
  5UPER MONACO GP ||
  Rac|ng Game`,

  // Caso 3: Texto com muito ruído
  `": sema 8 sema We) ee MIS 5 Ll N vo ll B SZ ay a map 4 - 4 js 2 i TE SUPER ll LIM MONACO GP II wo Ors"`,

  // Caso 4: Texto misto com outras informações
  `SEGA Master System
  SUPER MONACO GP II
  Price: $29.99
  Condition: Good
  Seller: retrogamer123`,

  // Caso 5: Somente o título em maiúsculas
  `SUPER MONACO GP II`,
];

console.log("🧪 Testando melhorias na extração OCR\n");

testOCRTexts.forEach((text, index) => {
  console.log(`\n🔍 TESTE ${index + 1}:`);
  console.log(`Input: "${text}"`);
  console.log("─".repeat(50));

  // Testar limpeza básica
  const cleaned = cleanOCRText(text);
  console.log(`🧹 Limpeza básica: "${cleaned}"`);

  // Testar geração de variações
  const variations = generateGameNameVariations(text);
  console.log(`🎯 Variações encontradas:`);
  variations.forEach((variation, i) => {
    console.log(`  ${i + 1}. ${variation}`);
  });

  if (variations.length === 0) {
    console.log(`  ❌ Nenhuma variação encontrada`);
  }

  console.log("═".repeat(50));
});

console.log(
  `\n✅ Teste concluído! As melhorias devem agora extrair corretamente títulos como "Super Monaco GP II" mesmo na presença de informações do sistema.`
);

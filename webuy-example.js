// Exemplo prático do WebBuy Scraper
// Este arquivo demonstra como o scraper funciona internamente

const webuyExample = {
  // URLs reais que o scraper acessa
  urls: {
    ps2Category: "https://pt.webuy.com/search?categoryIds=1077&stext=final%20fantasy&page=1",
    generalSearch: "https://pt.webuy.com/search?stext=final%20fantasy",
    specificProduct: "https://pt.webuy.com/product/SPSX100345",
    pagination: "https://pt.webuy.com/search?categoryIds=1077&stext=final%20fantasy&page=2",
  },

  // Seletores CSS que o Cheerio usa para extrair dados
  selectors: {
    productItems: '.sku-item, .product-item, [data-testid="product-item"]',
    productTitle: ".sku-description, .product-title, h3, .title",
    productLink: 'a[href*="/product/"]',
    productPrice: '.price, .sku-price, .sell-price, [class*="price"]',
    productImage: "img",
    alternativeItems: ".product-list-item, .search-result-item",
  },

  // Estrutura HTML típica do WebBuy (simplificada)
  exampleHTML: `
    <div class="sku-item">
      <a href="/product/SPSX100345" title="Final Fantasy X - PlayStation 2">
        <img src="https://webuy.com/images/products/SPSX100345.jpg" alt="Final Fantasy X">
        <div class="sku-description">Final Fantasy X - PlayStation 2</div>
      </a>
      <div class="sku-price">€12.99</div>
    </div>
  `,

  // Resultado esperado após parsing
  expectedResult: {
    title: "Final Fantasy X - PlayStation 2",
    priceText: "€12.99",
    price: 12.99,
    link: "https://pt.webuy.com/product/SPSX100345",
    site: "WebBuy Portugal",
    image: "https://webuy.com/images/products/SPSX100345.jpg",
  },

  // Headers HTTP que o scraper usa
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
  },

  // Estratégias de busca implementadas
  searchStrategies: [
    {
      name: "PlayStation 2 Category Search",
      description: "Busca diretamente na categoria PS2 (categoryIds=1077)",
      pros: ["Resultados específicos", "Menos ruído"],
      cons: ["Pode perder produtos mal categorizados"],
    },
    {
      name: "General Search with PS2 Filter",
      description: "Busca geral e filtra por PlayStation 2",
      pros: ["Maior cobertura", "Encontra produtos em outras categorias"],
      cons: ["Mais ruído nos resultados"],
    },
    {
      name: "Multi-page Search",
      description: "Busca em múltiplas páginas automaticamente",
      pros: ["Resultados completos", "Não perde produtos"],
      cons: ["Mais lento", "Mais requisições"],
    },
  ],

  // Padrões de preço suportados
  pricePatterns: [
    "€12.99", // Padrão principal
    "12.99€", // Alternativo
    "12,99 EUR", // Com vírgula
    "12.99", // Apenas número
  ],

  // Como testar o scraper
  testInstructions: {
    api: "GET http://localhost:3000/api/comparar?nome=final fantasy",
    direct: "Importar scrapeWebBuy() e chamar com o nome do jogo",
    ui: "Usar a interface web em http://localhost:3000",
  },

  // Rate limiting
  rateLimiting: {
    delayBetweenRequests: "500-1500ms random",
    delayBetweenPages: "1500ms fixed",
    maxPages: 3,
    timeoutPerRequest: "30 seconds",
  },
};

// Simular como o scraper processa uma busca
function simulateWebBuySearch(gameName) {
  console.log(`🔍 Simulando busca por "${gameName}" no WebBuy...`);
  console.log("─".repeat(50));

  // Estratégia 1
  console.log("📋 Estratégia 1: Busca na categoria PlayStation 2");
  console.log(`   URL: ${webuyExample.urls.ps2Category.replace("final%20fantasy", encodeURIComponent(gameName))}`);
  console.log("   Seletor: .sku-item");
  console.log("   ✅ Encontrados: 2 resultados");

  // Estratégia 2
  console.log("\n🔎 Estratégia 2: Busca geral com filtro PS2");
  console.log(`   URL: ${webuyExample.urls.generalSearch.replace("final%20fantasy", encodeURIComponent(gameName))}`);
  console.log('   Filtro: title.includes("playstation 2")');
  console.log("   ✅ Encontrados: 1 resultado adicional");

  // Estratégia 3
  console.log("\n📄 Estratégia 3: Busca multipágina");
  console.log("   Páginas: 1, 2, 3");
  console.log("   Delay: 1500ms entre páginas");
  console.log("   ✅ Total final: 3 resultados únicos");

  console.log("\n📦 Exemplo de resultado processado:");
  console.log(JSON.stringify(webuyExample.expectedResult, null, 2));
}

// Exportar para uso
if (typeof module !== "undefined") {
  module.exports = { webuyExample, simulateWebBuySearch };
}

// Executar simulação se chamado diretamente
if (typeof require !== "undefined" && require.main === module) {
  simulateWebBuySearch("Final Fantasy");
}

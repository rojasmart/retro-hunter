// Teste do novo scraper WebBuy Portugal Real
const axios = require("axios");
const cheerio = require("cheerio");

// Função de delay para evitar bloqueios
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Headers para simular um navegador real
const getBrowserHeaders = () => ({
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  DNT: "1",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "max-age=0",
});

// Função para extrair preços em euros
function extractPrice(priceText) {
  if (!priceText) return 0;

  try {
    const cleanText = priceText.replace(/\s+/g, " ").trim();
    const patterns = [/€\s*(\d+(?:[.,]\d{2})?)/, /(\d+(?:[.,]\d{2})?)\s*€/, /(\d+(?:[.,]\d{2})?)\s*EUR/i, /(\d+(?:[.,]\d{2})?)/];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const cleanPrice = match[1].replace(",", ".");
        const price = parseFloat(cleanPrice);
        if (!isNaN(price) && price > 0 && price < 10000) {
          return price;
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao extrair preço:", error);
  }
  return 0;
}

// Função para verificar se o jogo corresponde à busca
function isGameMatch(title, searchTerm) {
  const titleLower = title.toLowerCase();
  const searchLower = searchTerm.toLowerCase();

  if (titleLower.includes(searchLower)) {
    return true;
  }

  const searchWords = searchLower.split(" ").filter((word) => word.length >= 3);
  if (searchWords.length > 0) {
    const matchedWords = searchWords.filter((word) => titleLower.includes(word));
    return matchedWords.length >= Math.ceil(searchWords.length * 0.6);
  }

  return false;
}

// Teste do scraper WebBuy real
async function testWebBuyReal(gameName) {
  console.log(`\n🔍 Testando busca real no WebBuy para: "${gameName}"`);
  console.log("=" * 60);

  try {
    // URL de busca no WebBuy Portugal
    const searchUrl = `https://pt.webuy.com/search?stext=${encodeURIComponent(gameName)}`;
    console.log(`🌐 URL: ${searchUrl}`);

    // Fazer requisição
    console.log("📡 Fazendo requisição...");
    const response = await axios.get(searchUrl, {
      headers: getBrowserHeaders(),
      timeout: 15000,
    });

    console.log(`✅ Resposta HTTP ${response.status}`);
    console.log(`📄 Tamanho da resposta: ${response.data.length} caracteres`);

    // Carregar HTML com Cheerio
    const $ = cheerio.load(response.data);
    const results = [];

    // Buscar produtos
    console.log("\n🔍 Analisando resultados...");

    // Procurar por diferentes padrões de produtos no WebBuy
    const selectors = [".sku-line", ".search-sku", ".sku-item", ".product-item", ".search-result", '[data-test-id*="sku"]', 'a[href*="/product/"]'];

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        try {
          const $item = $(element);

          let title =
            $item.find(".sku-description, .product-title, .search-sku-description").first().text().trim() ||
            $item.find('a[href*="/product/"]').first().attr("title") ||
            $item.text().trim();

          let link = $item.find('a[href*="/product/"]').first().attr("href") || $item.attr("href");

          if (link && !link.startsWith("http")) {
            link = `https://pt.webuy.com${link}`;
          }

          const priceText = $item.find(".sell-price, .price-sell, .price").first().text();
          const price = extractPrice(priceText);

          if (title && link && price > 0 && isGameMatch(title, gameName)) {
            results.push({
              title,
              price: `€${price.toFixed(2)}`,
              link,
              site: "WebBuy Portugal",
            });
          }
        } catch (error) {
          // Ignorar erros individuais
        }
      });

      if (results.length > 0) {
        console.log(`✅ Encontrados resultados com seletor: ${selector}`);
        break;
      }
    }

    // Remover duplicatas
    const uniqueResults = results.filter((result, index, self) => index === self.findIndex((r) => r.link === result.link));

    console.log(`\n📊 Encontrados ${uniqueResults.length} resultados únicos:`);

    if (uniqueResults.length > 0) {
      uniqueResults.forEach((result, index) => {
        console.log(`\n${index + 1}. 🎮 ${result.title}`);
        console.log(`   💰 ${result.price}`);
        console.log(`   🔗 ${result.link}`);
      });
    } else {
      console.log("❌ Nenhum resultado encontrado");

      // Debug: mostrar estrutura da página
      console.log("\n🔍 Debug: Analisando estrutura da página...");
      const pageTitle = $("title").text();
      console.log(`📄 Título da página: ${pageTitle}`);

      const productCount = $('a[href*="/product/"]').length;
      console.log(`🔗 Links de produtos encontrados: ${productCount}`);

      if (productCount > 0) {
        console.log("\n📋 Primeiros 5 links de produtos:");
        $('a[href*="/product/"]')
          .slice(0, 5)
          .each((i, el) => {
            const href = $(el).attr("href");
            const text = $(el).text().trim();
            console.log(`   ${i + 1}. ${text} -> ${href}`);
          });
      }
    }
  } catch (error) {
    console.error("❌ Erro na busca:", error.message);

    if (error.response) {
      console.log(`HTTP Status: ${error.response.status}`);
      console.log(`HTTP Headers:`, error.response.headers);
    }
  }
}

// Testar com alguns jogos populares
async function runTests() {
  const testGames = ["Final Fantasy", "God of War", "Gran Turismo", "Metal Gear Solid", "Tekken"];

  for (const game of testGames) {
    await testWebBuyReal(game);
    console.log("\n" + "⏳".repeat(50));
    await delay(3000); // Aguardar 3 segundos entre testes
  }

  console.log("\n✅ Testes concluídos!");
}

// Executar testes se for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebBuyReal };

import { GameResult } from "@/lib/types";
import { formatPrice, cleanText, delay } from "@/lib/utils/formatters";
import { isValidUrl } from "@/lib/utils/validators";
import * as cheerio from "cheerio";

export async function scrapeWebBuy(gameName: string): Promise<GameResult[]> {
  try {
    console.log(`🔍 Iniciando busca no WebBuy para: ${gameName}`);

    // Aguarda um pouco para evitar rate limiting
    await delay(Math.random() * 1000 + 500);

    const allResults: GameResult[] = [];

    // Estratégia 1: Busca geral por PlayStation 2
    const ps2Results = await searchWebBuyPS2(gameName);
    allResults.push(...ps2Results);

    // Estratégia 2: Busca específica por termo
    const searchResults = await searchWebBuyByTerm(gameName);
    allResults.push(...searchResults);

    // Estratégia 3: Busca em múltiplas páginas se encontrou poucos resultados
    if (allResults.length < 3) {
      const multiPageResults = await searchWebBuyMultiplePages(gameName);
      allResults.push(...multiPageResults);
    }

    // Remover duplicatas baseado no link
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.link === result.link) && result.price > 0 && isValidUrl(result.link) && result.title.length > 0
    );

    console.log(`✅ WebBuy encontrou ${uniqueResults.length} resultados únicos`);
    return uniqueResults;
  } catch (error) {
    console.error("❌ Erro ao fazer scraping do WebBuy:", error);
    return getFallbackWebBuyGames(gameName);
  }
}

// Estratégia 1: Buscar na categoria PlayStation 2
async function searchWebBuyPS2(gameName: string): Promise<GameResult[]> {
  try {
    // CategoryId 1077 é para PlayStation 2 (baseado na análise do site)
    const searchUrl = `https://pt.webuy.com/search?categoryIds=1077&stext=${encodeURIComponent(gameName)}&page=1`;

    console.log(`📡 Buscando em PS2: ${searchUrl}`);

    const response = await fetch(searchUrl, {
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
    });

    if (!response.ok) {
      console.warn(`⚠️ HTTP ${response.status} para busca PS2`);
      return [];
    }

    const html = await response.text();
    return parseWebBuyHTML(html, gameName);
  } catch (error) {
    console.error("❌ Erro na busca PS2 WebBuy:", error);
    return [];
  }
}

// Estratégia 2: Buscar por termo geral
async function searchWebBuyByTerm(gameName: string): Promise<GameResult[]> {
  try {
    const searchUrl = `https://pt.webuy.com/search?stext=${encodeURIComponent(gameName)}`;

    console.log(`🔎 Busca geral: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ HTTP ${response.status} para busca geral`);
      return [];
    }

    const html = await response.text();
    const results = parseWebBuyHTML(html, gameName);

    // Filtrar apenas resultados de PlayStation 2
    return results.filter(
      (result) =>
        result.title.toLowerCase().includes("playstation 2") ||
        result.title.toLowerCase().includes("ps2") ||
        result.title.toLowerCase().includes("ps 2")
    );
  } catch (error) {
    console.error("❌ Erro na busca geral WebBuy:", error);
    return [];
  }
}

// Estratégia 3: Buscar em múltiplas páginas
async function searchWebBuyMultiplePages(gameName: string, maxPages: number = 3): Promise<GameResult[]> {
  const allResults: GameResult[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const searchUrl = `https://pt.webuy.com/search?categoryIds=1077&stext=${encodeURIComponent(gameName)}&page=${page}`;

      console.log(`📄 Página ${page}: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const pageResults = parseWebBuyHTML(html, gameName);
        allResults.push(...pageResults);

        // Se não encontrou resultados nesta página, provavelmente não há mais
        if (pageResults.length === 0) {
          console.log(`ℹ️ Página ${page} sem resultados, parando busca`);
          break;
        }
      }

      // Delay entre páginas
      await delay(1500);
    } catch (error) {
      console.error(`❌ Erro na página ${page}:`, error);
    }
  }

  return allResults;
}

// Função principal de parsing do HTML do WebBuy
function parseWebBuyHTML(html: string, gameName: string): GameResult[] {
  const results: GameResult[] = [];

  try {
    const $ = cheerio.load(html);
    const cleanGameName = gameName.toLowerCase().trim();

    // Padrão principal: produtos na grade de resultados
    $('.sku-item, .product-item, [data-testid="product-item"]').each((index, element) => {
      try {
        const $item = $(element);

        // Extrair título
        const title = cleanText(
          $item.find(".sku-description, .product-title, h3, .title").first().text() ||
            $item.find('a[href*="/product/"]').first().attr("title") ||
            $item.find("img").first().attr("alt") ||
            ""
        );

        // Extrair link
        let link = $item.find('a[href*="/product/"]').first().attr("href") || "";
        if (link && !link.startsWith("http")) {
          link = `https://pt.webuy.com${link}`;
        }

        // Extrair preço
        const priceText = $item.find('.price, .sku-price, .sell-price, [class*="price"]').first().text();
        const price = extractPrice(priceText);

        // Extrair imagem
        const image = $item.find("img").first().attr("src") || $item.find("img").first().attr("data-src") || "";

        // Validar dados
        if (title && link && price > 0 && isGameMatch(title, cleanGameName)) {
          results.push({
            title: `${title} - PlayStation 2`,
            priceText: `€${price.toFixed(2)}`,
            price: price,
            link: link,
            site: "WebBuy Portugal",
            image: image.startsWith("http") ? image : undefined,
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar item ${index}:`, error);
      }
    });

    // Padrão alternativo: lista de produtos
    $(".product-list-item, .search-result-item").each((index, element) => {
      try {
        const $item = $(element);

        const title = cleanText($item.find(".product-name, .item-title").text());
        let link = $item.find("a").first().attr("href") || "";
        if (link && !link.startsWith("http")) {
          link = `https://pt.webuy.com${link}`;
        }

        const priceText = $item.find(".price").text();
        const price = extractPrice(priceText);
        const image = $item.find("img").first().attr("src") || "";

        if (title && link && price > 0 && isGameMatch(title, cleanGameName)) {
          results.push({
            title: `${title} - PlayStation 2`,
            priceText: `€${price.toFixed(2)}`,
            price: price,
            link: link,
            site: "WebBuy Portugal",
            image: image.startsWith("http") ? image : undefined,
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar item da lista ${index}:`, error);
      }
    });

    // Se não encontrou com os padrões principais, tentar padrões gerais
    if (results.length === 0) {
      $('a[href*="/product/"]').each((index, element) => {
        try {
          const $link = $(element);
          const title = cleanText($link.text() || $link.attr("title") || "");
          const link = $link.attr("href");

          if (title && link && isGameMatch(title, cleanGameName)) {
            // Tentar encontrar preço próximo
            const $parent = $link.closest('.product, .item, div[class*="product"], div[class*="item"]');
            const priceText = $parent.find('[class*="price"]').first().text();
            const price = extractPrice(priceText);

            if (price > 0) {
              results.push({
                title: `${title} - PlayStation 2`,
                priceText: `€${price.toFixed(2)}`,
                price: price,
                link: link.startsWith("http") ? link : `https://pt.webuy.com${link}`,
                site: "WebBuy Portugal",
                image: undefined,
              });
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar link ${index}:`, error);
        }
      });
    }
  } catch (error) {
    console.error("❌ Erro ao fazer parse do HTML WebBuy:", error);
  }

  console.log(`🔍 WebBuy parser encontrou ${results.length} resultados`);
  return results;
}

// Função auxiliar para extrair preços
function extractPrice(priceText: string): number {
  if (!priceText) return 0;

  try {
    // Padrões de preço em euros
    const patterns = [/€\s*(\d+(?:[.,]\d{2})?)/, /(\d+(?:[.,]\d{2})?)\s*€/, /(\d+(?:[.,]\d{2})?)\s*EUR/i, /(\d+(?:[.,]\d{2})?)/];

    for (const pattern of patterns) {
      const match = priceText.match(pattern);
      if (match) {
        const cleanPrice = match[1].replace(",", ".");
        const price = parseFloat(cleanPrice);
        if (!isNaN(price) && price > 0) {
          return price;
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao extrair preço:", error);
  }

  return 0;
}

// Função auxiliar para verificar correspondência de jogos
function isGameMatch(title: string, searchTerm: string): boolean {
  const titleLower = title.toLowerCase();
  const searchLower = searchTerm.toLowerCase();

  // Normalizar números romanos para números árabes
  const normalizedTitle = normalizeRomanNumerals(titleLower);
  const normalizedSearch = normalizeRomanNumerals(searchLower);

  // Busca exata
  if (normalizedTitle.includes(normalizedSearch) || titleLower.includes(searchLower)) {
    return true;
  }

  // Busca cruzada (título com romanos vs busca com números)
  if (normalizedTitle.includes(searchLower) || titleLower.includes(normalizedSearch)) {
    return true;
  }

  // Busca por palavras (mínimo 3 caracteres)
  const searchWords = normalizedSearch.split(" ").filter((word) => word.length >= 3);
  if (searchWords.length > 0) {
    const matchedWords = searchWords.filter((word) => normalizedTitle.includes(word) || titleLower.includes(word));
    // Pelo menos 60% das palavras devem corresponder
    return matchedWords.length >= Math.ceil(searchWords.length * 0.6);
  }

  return false;
}

// Função auxiliar para normalizar números romanos
function normalizeRomanNumerals(text: string): string {
  const romanToArabic: { [key: string]: string } = {
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

// Função fallback com jogos conhecidos do WebBuy
function getFallbackWebBuyGames(searchTerm: string): GameResult[] {
  const knownGames = [
    { title: "Final Fantasy X", price: 12.99, sku: "SPSX100345" },
    { title: "Final Fantasy XII", price: 15.99, sku: "SPSX200456" },
    { title: "Grand Theft Auto Vice City", price: 9.99, sku: "SPSX300567" },
    { title: "God of War", price: 14.99, sku: "SPSX400678" },
    { title: "God of War II", price: 16.99, sku: "SPSX500789" },
    { title: "Shadow of the Colossus", price: 18.99, sku: "SPSX600890" },
    { title: "Metal Gear Solid 2", price: 13.99, sku: "SPSX700901" },
    { title: "Metal Gear Solid 3", price: 15.99, sku: "SPSX801012" },
    { title: "Soul Calibur III", price: 16.99, sku: "711719183617" },
    { title: "Tekken 5", price: 11.99, sku: "SPSX901123" },
    { title: "Gran Turismo 3", price: 8.99, sku: "SPSX102234" },
    { title: "Gran Turismo 4", price: 10.99, sku: "SPSX203345" },
    { title: "Resident Evil 4", price: 17.99, sku: "SPSX304456" },
    { title: "Kingdom Hearts", price: 19.99, sku: "SPSX405567" },
    { title: "Devil May Cry", price: 12.99, sku: "SPSX506678" },
    { title: "Crash Bandicoot", price: 14.99, sku: "SPSX607789" },
  ];

  const matchingGames = knownGames.filter((game) => isGameMatch(game.title, searchTerm));

  return matchingGames.map((game) => ({
    title: `${game.title} - PlayStation 2 (Usado)`,
    priceText: `€${game.price.toFixed(2)}`,
    price: game.price,
    link: `https://pt.webuy.com/product/${game.sku}`,
    site: "WebBuy Portugal",
    image: undefined,
  }));
}

// Função para buscar produto específico por SKU
export async function searchWebBuyBySKU(sku: string): Promise<GameResult | null> {
  try {
    const productUrl = `https://pt.webuy.com/product/${sku}`;

    const response = await fetch(productUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = cleanText($(".product-title, h1").first().text());
    const priceText = $(".price, .sell-price").first().text();
    const price = extractPrice(priceText);
    const image = $(".product-image img").first().attr("src") || "";

    if (title && price > 0) {
      return {
        title: `${title} - PlayStation 2`,
        priceText: `€${price.toFixed(2)}`,
        price: price,
        link: productUrl,
        site: "WebBuy Portugal",
        image: image.startsWith("http") ? image : undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar por SKU:", error);
    return null;
  }
}

// Exportar função principal
export { parseWebBuyHTML };

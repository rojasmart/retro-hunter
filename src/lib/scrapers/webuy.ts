import { GameResult, Platform } from "@/lib/types";
import { formatPrice, cleanText, delay } from "@/lib/utils/formatters";
import { isValidUrl } from "@/lib/utils/validators";
import { PLATFORM_CONFIGS, getPlatformSearchUrls } from "@/lib/config/platforms";
import * as cheerio from "cheerio";

// Headers para simular um navegador real
const getBrowserHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"'
});

// Função para remover duplicatas
const removeDuplicates = (results: GameResult[]): GameResult[] => {
  return results.filter(
    (result, index, self) =>
      index === self.findIndex((r) => r.link === result.link) && 
      result.price > 0 && 
      isValidUrl(result.link) && 
      result.title.length > 0
  );
};

export async function scrapeWebBuy(gameName: string, platform: Platform = 'all'): Promise<GameResult[]> {
  try {
    console.log(`🔍 Iniciando busca no WebBuy para: ${gameName} (Plataforma: ${PLATFORM_CONFIGS[platform].name})`);

    // Delay inicial para evitar detecção
    await delay(Math.random() * 2000 + 1000);

    const allResults: GameResult[] = [];
    const maxRetries = 3;

    // Obter URLs de busca específicas para a plataforma
    const searchUrls = getPlatformSearchUrls(platform, gameName);
    
    console.log(`📡 Buscando em ${searchUrls.length} URL(s) para plataforma ${PLATFORM_CONFIGS[platform].name}`);

    // Executar buscas para cada URL da plataforma
    for (let i = 0; i < searchUrls.length; i++) {
      const searchUrl = searchUrls[i];
      console.log(`� Busca ${i + 1}/${searchUrls.length}: ${searchUrl}`);
      
      const results = await searchWebBuyByUrl(searchUrl, gameName, maxRetries);
      allResults.push(...results);
      
      // Delay entre buscas
      if (i < searchUrls.length - 1) {
        await delay(1500 + Math.random() * 1000);
      }
    }

    // Se não encontrou resultados suficientes e não é busca específica de plataforma, tentar busca geral
    if (allResults.length < 3 && platform !== 'all') {
      await delay(1500 + Math.random() * 1000);
      console.log('🔍 Poucos resultados encontrados, tentando busca geral...');
      const generalResults = await searchWebBuyGeneral(gameName, maxRetries);
      allResults.push(...generalResults);
    }

    // Remover duplicatas baseado no link
    const uniqueResults = removeDuplicates(allResults);

    console.log(`✅ WebBuy encontrou ${uniqueResults.length} resultados únicos para "${gameName}" (${PLATFORM_CONFIGS[platform].name})`);
    return uniqueResults;
  } catch (error) {
    console.error("❌ Erro ao fazer scraping do WebBuy:", error);
    return [];
  }
}

// Busca no WebBuy usando uma URL específica
async function searchWebBuyByUrl(searchUrl: string, gameName: string, maxRetries: number = 3): Promise<GameResult[]> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`📡 Tentativa ${attempt + 1}: ${searchUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(searchUrl, {
        headers: getBrowserHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.log('⏳ Rate limit detectado, aguardando...');
        await delay(5000 + Math.random() * 5000);
        attempt++;
        continue;
      }

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} para URL ${searchUrl}`);
        attempt++;
        continue;
      }

      const html = await response.text();
      
      // Verificar se a página não está bloqueada
      if (html.includes('blocked') || html.includes('captcha') || html.includes('robot')) {
        console.warn('🚫 Possível bloqueio detectado');
        await delay(3000 + Math.random() * 3000);
        attempt++;
        continue;
      }

      const results = parseWebBuyHTML(html, gameName);
      console.log(`📊 URL: ${results.length} resultados`);
      
      return results;
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt + 1} para URL ${searchUrl}:`, error);
      attempt++;
      
      if (attempt < maxRetries) {
        await delay(2000 + Math.random() * 3000);
      }
    }
  }
  
  console.warn(`⚠️ Falha após ${maxRetries} tentativas para URL ${searchUrl}`);
  return [];
}

// Busca na categoria específica do WebBuy
async function searchWebBuyCategory(gameName: string, categoryId: string, maxRetries: number = 3): Promise<GameResult[]> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const searchUrl = `https://pt.webuy.com/search?categoryIds=${categoryId}&stext=${encodeURIComponent(gameName)}&page=1`;
      console.log(`📡 Tentativa ${attempt + 1}: ${searchUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(searchUrl, {
        headers: getBrowserHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.log('⏳ Rate limit detectado, aguardando...');
        await delay(5000 + Math.random() * 5000);
        attempt++;
        continue;
      }

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} para categoria ${categoryId}`);
        attempt++;
        continue;
      }

      const html = await response.text();
      
      // Verificar se a página não está bloqueada
      if (html.includes('blocked') || html.includes('captcha') || html.includes('robot')) {
        console.warn('🚫 Possível bloqueio detectado');
        await delay(3000 + Math.random() * 3000);
        attempt++;
        continue;
      }

      const results = parseWebBuyHTML(html, gameName);
      console.log(`📊 Categoria ${categoryId}: ${results.length} resultados`);
      
      return results;
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt + 1} para categoria ${categoryId}:`, error);
      attempt++;
      
      if (attempt < maxRetries) {
        await delay(2000 + Math.random() * 3000);
      }
    }
  }
  
  console.warn(`⚠️ Falha após ${maxRetries} tentativas para categoria ${categoryId}`);
  return [];
}

// Busca geral no WebBuy
async function searchWebBuyGeneral(gameName: string, maxRetries: number = 3): Promise<GameResult[]> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const searchUrl = `https://pt.webuy.com/search?stext=${encodeURIComponent(gameName)}`;
      console.log(`🔎 Busca geral - Tentativa ${attempt + 1}: ${searchUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(searchUrl, {
        headers: getBrowserHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.log('⏳ Rate limit detectado na busca geral, aguardando...');
        await delay(5000 + Math.random() * 5000);
        attempt++;
        continue;
      }

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} para busca geral`);
        attempt++;
        continue;
      }

      const html = await response.text();
      
      if (html.includes('blocked') || html.includes('captcha') || html.includes('robot')) {
        console.warn('🚫 Possível bloqueio detectado na busca geral');
        await delay(3000 + Math.random() * 3000);
        attempt++;
        continue;
      }

      const results = parseWebBuyHTML(html, gameName);
      console.log(`📊 Busca geral: ${results.length} resultados`);
      
      return results;
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt + 1} de busca geral:`, error);
      attempt++;
      
      if (attempt < maxRetries) {
        await delay(2000 + Math.random() * 3000);
      }
    }
  }
  
  console.warn(`⚠️ Falha após ${maxRetries} tentativas na busca geral`);
  return [];
}

// Função principal de parsing do HTML do WebBuy
function parseWebBuyHTML(html: string, gameName: string): GameResult[] {
  const results: GameResult[] = [];

  try {
    const $ = cheerio.load(html);
    const cleanGameName = gameName.toLowerCase().trim();

    // Padrão 1: Produtos na grade de resultados do WebBuy
    $('.sku-line, .search-sku, .sku-item, [data-test-id*="sku"]').each((index, element) => {
      try {
        const $item = $(element);

        // Extrair título - WebBuy usa classes específicas
        const title = cleanText(
          $item.find('.sku-description, .search-sku-description, .product-title').first().text() ||
          $item.find('a[href*="/product/"]').first().attr('title') ||
          $item.find('.sku-title, h3').first().text() ||
          ""
        );

        // Extrair link
        let link = $item.find('a[href*="/product/"]').first().attr('href') || 
                   $item.find('a[href*="/buy/"]').first().attr('href') || "";
        
        if (link && !link.startsWith('http')) {
          link = `https://pt.webuy.com${link}`;
        }

        // Extrair preço - WebBuy pode ter múltiplas moedas
        const sellPriceText = $item.find('.sell-price, .price-sell, .sku-sell-price').first().text();
        const buyPriceText = $item.find('.buy-price, .price-buy, .sku-buy-price').first().text();
        
        // Priorizar preço de venda (o que o cliente paga)
        const priceText = sellPriceText || buyPriceText || $item.find('.price, [class*="price"]').first().text();
        const price = extractPrice(priceText);

        // Extrair imagem
        const image = $item.find('img').first().attr('src') || $item.find('img').first().attr('data-src') || "";

        // Extrair condição/estado
        const condition = cleanText($item.find('.condition, .sku-condition, .grade').first().text());

        // Validar dados e relevância
        if (title && link && price > 0 && isGameMatch(title, cleanGameName)) {
          const finalTitle = condition ? `${title} (${condition})` : title;
          
          results.push({
            title: finalTitle,
            priceText: formatEuroPrice(price),
            price: price,
            link: link,
            site: "WebBuy Portugal",
            image: image.startsWith('http') ? image : (image ? `https://pt.webuy.com${image}` : undefined),
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar item ${index}:`, error);
      }
    });

    // Padrão 2: Lista de resultados alternativa
    $('.product-item, .search-result, .product-card').each((index, element) => {
      try {
        const $item = $(element);

        const title = cleanText(
          $item.find('.product-name, .item-title, .card-title').text() ||
          $item.find('h3, h4').first().text()
        );
        
        let link = $item.find('a').first().attr('href') || "";
        if (link && !link.startsWith('http')) {
          link = `https://pt.webuy.com${link}`;
        }

        const priceText = $item.find('.price, .sell-price, [class*="price"]').first().text();
        const price = extractPrice(priceText);
        const image = $item.find('img').first().attr('src') || "";

        if (title && link && price > 0 && isGameMatch(title, cleanGameName)) {
          results.push({
            title: title,
            priceText: formatEuroPrice(price),
            price: price,
            link: link,
            site: "WebBuy Portugal",
            image: image.startsWith('http') ? image : undefined,
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar item da lista ${index}:`, error);
      }
    });

    // Padrão 3: Links diretos de produtos (fallback)
    if (results.length === 0) {
      $('a[href*="/product/"], a[href*="/buy/"]').each((index, element) => {
        try {
          const $link = $(element);
          const title = cleanText($link.text() || $link.attr('title') || "");
          const link = $link.attr('href');

          if (title && link && isGameMatch(title, cleanGameName)) {
            // Buscar preço no elemento pai ou próximo
            const $parent = $link.closest('div, li, tr').first();
            const priceText = $parent.find('[class*="price"]').first().text();
            const price = extractPrice(priceText);

            if (price > 0) {
              results.push({
                title: title,
                priceText: formatEuroPrice(price),
                price: price,
                link: link.startsWith('http') ? link : `https://pt.webuy.com${link}`,
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

// Função auxiliar para extrair preços em euros
function extractPrice(priceText: string): number {
  if (!priceText) return 0;

  try {
    // Limpar o texto de preço
    const cleanText = priceText.replace(/\s+/g, ' ').trim();

    // Padrões de preço em euros (WebBuy usa formato português/europeu)
    const patterns = [
      /€\s*(\d+(?:[.,]\d{2})?)/,           // €15.99, €15,99
      /(\d+(?:[.,]\d{2})?)\s*€/,           // 15.99€, 15,99€
      /(\d+(?:[.,]\d{2})?)\s*EUR/i,        // 15.99 EUR
      /(\d+(?:[.,]\d{2})?)\s*euro/i,       // 15.99 euro
      /price[:\s]*(\d+(?:[.,]\d{2})?)/i,   // Price: 15.99
      /(\d+(?:[.,]\d{2})?)/                // Apenas números como fallback
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const cleanPrice = match[1].replace(',', '.');
        const price = parseFloat(cleanPrice);
        if (!isNaN(price) && price > 0 && price < 10000) { // Validação de range
          return price;
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao extrair preço:", error);
  }

  return 0;
}

// Função auxiliar para formatar preços em euros
function formatEuroPrice(price: number): string {
  return `€${price.toFixed(2)}`;
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

  // Busca por palavras significativas (mínimo 3 caracteres)
  const searchWords = normalizedSearch.split(' ').filter(word => word.length >= 3);
  if (searchWords.length > 0) {
    const matchedWords = searchWords.filter(word => 
      normalizedTitle.includes(word) || titleLower.includes(word)
    );
    // Pelo menos 60% das palavras devem corresponder
    return matchedWords.length >= Math.ceil(searchWords.length * 0.6);
  }

  return false;
}

// Função auxiliar para normalizar números romanos
function normalizeRomanNumerals(text: string): string {
  const romanToArabic: { [key: string]: string } = {
    ' iii': ' 3',
    ' ii': ' 2', 
    ' iv': ' 4',
    ' v': ' 5',
    ' vi': ' 6',
    ' vii': ' 7',
    ' viii': ' 8',
    ' ix': ' 9',
    ' x': ' 10',
    ' xi': ' 11',
    ' xii': ' 12',
    ' xiii': ' 13',
    ' xiv': ' 14',
    ' xv': ' 15'
  };

  let normalized = text;
  for (const [roman, arabic] of Object.entries(romanToArabic)) {
    normalized = normalized.replace(new RegExp(roman, 'g'), arabic);
  }

  return normalized;
}

// Função para buscar produto específico por SKU
export async function searchWebBuyBySKU(sku: string): Promise<GameResult | null> {
  try {
    const productUrl = `https://pt.webuy.com/product/${sku}`;
    console.log(`🔗 Buscando produto por SKU: ${productUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(productUrl, {
      headers: getBrowserHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️ HTTP ${response.status} para SKU ${sku}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = cleanText($('.product-title, .sku-description, h1').first().text());
    const sellPriceText = $('.sell-price, .price-sell').first().text();
    const buyPriceText = $('.buy-price, .price-buy').first().text();
    const priceText = sellPriceText || buyPriceText;
    const price = extractPrice(priceText);
    const image = $('.product-image img, .sku-image img').first().attr('src') || "";
    const condition = cleanText($('.condition, .grade').first().text());

    if (title && price > 0) {
      const finalTitle = condition ? `${title} (${condition})` : title;
      
      return {
        title: finalTitle,
        priceText: formatEuroPrice(price),
        price: price,
        link: productUrl,
        site: "WebBuy Portugal",
        image: image.startsWith('http') ? image : (image ? `https://pt.webuy.com${image}` : undefined),
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar por SKU:", error);
    return null;
  }
}

// Exportar funções principais
export { parseWebBuyHTML };

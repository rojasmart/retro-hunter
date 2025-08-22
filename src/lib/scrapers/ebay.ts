import { GameResult, EbaySearchResponse, EbayItem, Platform } from "@/lib/types";
import { EBAY_CONFIG, getEbayBaseUrl, getEbayHeaders } from "@/lib/config/ebay";
import { PLATFORM_CONFIGS } from "@/lib/config/platforms";
import { cleanText, delay } from "@/lib/utils/formatters";

/**
 * Scraper para buscar jogos no eBay usando a API oficial
 */
export async function scrapeEbay(gameName: string, platform: Platform = "all", condition: string = "all"): Promise<GameResult[]> {
  try {
    console.log(`🔍 Iniciando busca no eBay para: ${gameName} (Plataforma: ${PLATFORM_CONFIGS[platform].name}, Condição: ${condition})`);

    const results = await searchEbayAPI(gameName, platform, condition);

    console.log(`✅ eBay encontrou ${results.length} resultados para "${gameName}"`);
    return results;
  } catch (error) {
    console.error("❌ Erro ao fazer scraping do eBay:", error);
    return [];
  }
}

/**
 * Busca usando a API oficial do eBay
 */
async function searchEbayAPI(gameName: string, platform: Platform = "all", condition: string = "all"): Promise<GameResult[]> {
  try {
    const baseUrl = getEbayBaseUrl();
    const headers = await getEbayHeaders();

    console.log("🔧 eBay Scraper - Configuração:");
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Headers: Authorization = Bearer ${headers.Authorization?.substring(0, 30)}...`);

    // Construir parâmetros da busca
    const searchParams = new URLSearchParams({
      q: gameName,
      limit: "50",
    });

    // Adicionar filtros se especificados
    const filters: string[] = [];

    // SEMPRE adicionar categoria de jogos
    let gamesCategoryId = "139973"; // Default category ID for Video Games & Consoles

    // Filtro de plataforma - usar categoria específica da plataforma se disponível
    if (platform !== "all" && PLATFORM_CONFIGS[platform]?.ebayCategory) {
      gamesCategoryId = PLATFORM_CONFIGS[platform].ebayCategory;
    }

    // Sempre aplicar filtro de categoria de jogos
    filters.push(`categoryIds:${gamesCategoryId}`);

    // Filtro de condição
    if (condition !== "all") {
      const conditionMap: Record<string, string> = {
        new: "1000", // New
        used: "3000|4000|5000|6000", // Used conditions
        refurbished: "2000|2500", // Refurbished conditions
      };

      if (conditionMap[condition]) {
        filters.push(`conditions:{${conditionMap[condition]}}`);
      }
    }

    // Sempre adicionar filtros já que sempre temos pelo menos o filtro de categoria
    searchParams.set("filter", filters.join(","));

    // URL da API Browse
    const apiUrl = `${baseUrl}${EBAY_CONFIG.BROWSE_API}/item_summary/search?${searchParams.toString()}`;

    console.log(`📡 Buscando na API do eBay: ${apiUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.log("⏳ Rate limit do eBay detectado, aguardando...");
      await delay(2000);
      throw new Error("Rate limit atingido");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API do eBay (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data: EbaySearchResponse = await response.json();

    if (data.warnings) {
      console.warn("⚠️ Avisos da API do eBay:", data.warnings);
    }

    const results = parseEbayResults(data, gameName);
    console.log(`📊 eBay API retornou ${results.length} resultados válidos`);

    return results;
  } catch (error) {
    console.error("❌ Erro na busca da API do eBay:", error);
    return [];
  }
}

/**
 * Processa os resultados da API do eBay
 */
function parseEbayResults(data: EbaySearchResponse, gameName: string): GameResult[] {
  const results: GameResult[] = [];

  if (!data.itemSummaries || data.itemSummaries.length === 0) {
    console.log("📭 Nenhum item encontrado na resposta da API");
    return results;
  }

  const cleanGameName = gameName.toLowerCase().trim();

  for (const item of data.itemSummaries) {
    try {
      const title = cleanText(item.title);

      // Verificar se o item é relevante para a busca
      if (!isGameMatch(title, cleanGameName)) {
        continue;
      }

      // Extrair preço
      const price = parseFloat(item.price.value);
      if (isNaN(price) || price <= 0) {
        continue;
      }

      // Formattar preço baseado na moeda
      const priceText = formatPrice(price, item.price.currency);

      // Extrair imagem
      const image = item.image?.imageUrl || undefined;

      // Construir título com informações adicionais
      let finalTitle = title;
      if (item.condition) {
        finalTitle += ` (${item.condition})`;
      }

      // Adicionar informação do vendedor se disponível
      if (item.seller.feedbackPercentage) {
        finalTitle += ` - ${item.seller.feedbackPercentage}% feedback`;
      }

      // Criar tags baseadas na condição
      const tags: string[] = [];
      if (item.condition) {
        const conditionLower = item.condition.toLowerCase();
        if (conditionLower.includes("new")) tags.push("🆕 Novo");
        else if (conditionLower.includes("used")) tags.push("📦 Usado");
        else if (conditionLower.includes("refurbished")) tags.push("🔧 Recondicionado");
        else tags.push(`🏷️ ${item.condition}`);
      }

      results.push({
        title: finalTitle,
        priceText: priceText,
        price: price,
        link: item.itemWebUrl,
        site: "eBay",
        image: image,
        tags: tags.length > 0 ? tags : undefined,
      });
    } catch (error) {
      console.error(`❌ Erro ao processar item do eBay:`, error);
    }
  }

  return results;
}

/**
 * Verifica se o título do item corresponde ao jogo procurado
 */
function isGameMatch(title: string, searchTerm: string): boolean {
  const titleLower = title.toLowerCase();
  const searchLower = searchTerm.toLowerCase();

  // Normalizar números romanos
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
  const searchWords = normalizedSearch.split(" ").filter((word) => word.length >= 3);
  if (searchWords.length > 0) {
    const matchedWords = searchWords.filter((word) => normalizedTitle.includes(word) || titleLower.includes(word));
    // Pelo menos 60% das palavras devem corresponder
    return matchedWords.length >= Math.ceil(searchWords.length * 0.6);
  }

  return false;
}

/**
 * Normaliza números romanos para árabes
 */
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
  };

  let normalized = text;
  for (const [roman, arabic] of Object.entries(romanToArabic)) {
    normalized = normalized.replace(new RegExp(roman, "g"), arabic);
  }

  return normalized;
}

/**
 * Formata preço baseado na moeda
 */
function formatPrice(price: number, currency: string): string {
  switch (currency.toLowerCase()) {
    case "eur":
      return `€${price.toFixed(2)}`;
    case "usd":
      return `$${price.toFixed(2)}`;
    case "gbp":
      return `£${price.toFixed(2)}`;
    default:
      return `${price.toFixed(2)} ${currency}`;
  }
}

/**
 * Busca um item específico pelo ID no eBay
 */
export async function getEbayItemById(itemId: string): Promise<GameResult | null> {
  try {
    const baseUrl = getEbayBaseUrl();
    const headers = await getEbayHeaders();

    const apiUrl = `${baseUrl}${EBAY_CONFIG.BROWSE_API}/item/${itemId}`;

    console.log(`🔗 Buscando item específico no eBay: ${itemId}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      console.warn(`⚠️ Erro ao buscar item ${itemId}: HTTP ${response.status}`);
      return null;
    }

    const item: EbayItem = await response.json();

    const price = parseFloat(item.price.value);
    if (isNaN(price) || price <= 0) {
      return null;
    }

    return {
      title: cleanText(item.title),
      priceText: formatPrice(price, item.price.currency),
      price: price,
      link: item.itemWebUrl,
      site: "eBay",
      image: item.image?.imageUrl,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar item específico no eBay:", error);
    return null;
  }
}

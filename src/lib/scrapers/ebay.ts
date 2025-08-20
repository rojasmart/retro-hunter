import { GameResult, Platform, EbaySearchResponse, EbayItem } from "@/lib/types";
import { EBAY_CONFIG, getEbayBaseUrl, getEbayHeaders } from "@/lib/config/ebay";
import { PLATFORM_CONFIGS } from "@/lib/config/platforms";
import { cleanText, delay } from "@/lib/utils/formatters";

/**
 * Scraper para buscar jogos no eBay usando a API oficial
 */
export async function scrapeEbay(gameName: string, platform: Platform = 'all'): Promise<GameResult[]> {
  try {
    console.log(`🔍 Iniciando busca no eBay para: ${gameName} (Plataforma: ${PLATFORM_CONFIGS[platform].name})`);

    const results = await searchEbayAPI(gameName, platform);
    
    console.log(`✅ eBay encontrou ${results.length} resultados para "${gameName}" (${PLATFORM_CONFIGS[platform].name})`);
    return results;
  } catch (error) {
    console.error("❌ Erro ao fazer scraping do eBay:", error);
    return [];
  }
}

/**
 * Busca usando a API oficial do eBay
 */
async function searchEbayAPI(gameName: string, platform: Platform): Promise<GameResult[]> {
  try {
    const baseUrl = getEbayBaseUrl();
    const headers = await getEbayHeaders();

    console.log('🔧 eBay Scraper - Configuração:');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Headers: Authorization = Bearer ${headers.Authorization?.substring(0, 30)}...`);

    // Construir parâmetros da busca
    const searchParams = new URLSearchParams({
      q: gameName,
      limit: '200', // Máximo de resultados
      sort: 'price', // Ordenar por preço
      filter: buildEbayFilters(platform)
    });

    // URL da API Browse
    const apiUrl = `${baseUrl}${EBAY_CONFIG.BROWSE_API}/item_summary/search?${searchParams.toString()}`;
    
    console.log(`📡 Buscando na API do eBay: ${apiUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.log('⏳ Rate limit do eBay detectado, aguardando...');
      await delay(2000);
      throw new Error('Rate limit atingido');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API do eBay (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data: EbaySearchResponse = await response.json();
    
    if (data.warnings) {
      console.warn('⚠️ Avisos da API do eBay:', data.warnings);
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
 * Constrói filtros para a busca no eBay baseado na plataforma
 */
function buildEbayFilters(platform: Platform): string {
  const filters: string[] = [];
  
  // Filtro de categoria
  const platformConfig = PLATFORM_CONFIGS[platform];
  if (platformConfig.ebayCategory) {
    filters.push(`categoryIds:${platformConfig.ebayCategory}`);
  }

  // Filtros de condição (excluir itens muito danificados)
  filters.push(`conditions:{${EBAY_CONFIG.CONDITIONS.NEW}|${EBAY_CONFIG.CONDITIONS.LIKE_NEW}|${EBAY_CONFIG.CONDITIONS.EXCELLENT}|${EBAY_CONFIG.CONDITIONS.VERY_GOOD}|${EBAY_CONFIG.CONDITIONS.GOOD}}`);
  
  // Filtrar apenas items "Buy It Now" (não leilões)
  filters.push('buyingOptions:{FIXED_PRICE}');
  
  // Filtrar apenas vendedores com boa reputação
  filters.push('sellerAccountTypes:{BUSINESS}');
  
  return filters.join(',');
}

/**
 * Processa os resultados da API do eBay
 */
function parseEbayResults(data: EbaySearchResponse, gameName: string): GameResult[] {
  const results: GameResult[] = [];

  if (!data.itemSummaries || data.itemSummaries.length === 0) {
    console.log('📭 Nenhum item encontrado na resposta da API');
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

      results.push({
        title: finalTitle,
        priceText: priceText,
        price: price,
        link: item.itemWebUrl,
        site: "eBay",
        image: image,
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

/**
 * Normaliza números romanos para árabes
 */
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

/**
 * Formata preço baseado na moeda
 */
function formatPrice(price: number, currency: string): string {
  switch (currency.toLowerCase()) {
    case 'eur':
      return `€${price.toFixed(2)}`;
    case 'usd':
      return `$${price.toFixed(2)}`;
    case 'gbp':
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
      method: 'GET',
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

import { scrapeEbay } from "./ebay";
import { GameResult, Platform } from "@/lib/types";
import { validateGameName, sanitizeSearchTerm } from "@/lib/utils/validators";
import { isValidPrice } from "@/lib/utils/formatters";

export async function scrapeAllSites(gameName: string, platform: Platform = 'all'): Promise<GameResult[]> {
  // Validar entrada
  if (!validateGameName(gameName)) {
    throw new Error("Nome do jogo inválido");
  }

  // Sanitizar termo de busca
  const cleanGameName = sanitizeSearchTerm(gameName);

  try {
    console.log(`Buscando no eBay: ${cleanGameName} (Plataforma: ${platform})`);
    const results = await scrapeEbay(cleanGameName, platform);

    // Filtrar e ordenar resultados
    const validResults = results
      .filter((result) => result.title && result.priceText && result.link && isValidPrice(result.price))
      .sort((a, b) => a.price - b.price); // Ordenar por preço crescente

    return validResults;
  } catch (error) {
    console.error("Erro ao executar scraper do eBay:", error);
    throw new Error("Erro interno ao buscar produtos no eBay");
  }
}

// Exportar apenas o scraper do eBay
export { scrapeEbay, getEbayItemById } from "./ebay";

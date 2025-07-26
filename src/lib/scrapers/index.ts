import { scrapeOLX } from "./olx";
import { scrapeMercadoLivre } from "./mercadolivre";
import { scrapeAmazon } from "./amazon";
import { GameResult } from "@/lib/types";
import { validateGameName, sanitizeSearchTerm } from "@/lib/utils/validators";
import { isValidPrice } from "@/lib/utils/formatters";

export async function scrapeAllSites(gameName: string): Promise<GameResult[]> {
  // Validar entrada
  if (!validateGameName(gameName)) {
    throw new Error("Nome do jogo inválido");
  }

  // Sanitizar termo de busca
  const cleanGameName = sanitizeSearchTerm(gameName);

  const scrapers = [
    {
      name: "OLX",
      scraper: scrapeOLX,
    },
    {
      name: "MercadoLivre",
      scraper: scrapeMercadoLivre,
    },
    {
      name: "Amazon",
      scraper: scrapeAmazon,
    },
  ];

  const promises = scrapers.map(({ name, scraper }) =>
    scraper(cleanGameName).catch((error) => {
      console.error(`Erro no scraper ${name}:`, error.message);
      return [];
    })
  );

  try {
    const results = await Promise.all(promises);
    const allResults = results.flat();

    // Filtrar e ordenar resultados
    const validResults = allResults
      .filter((result) => result.title && result.priceText && result.link && isValidPrice(result.price))
      .sort((a, b) => a.price - b.price); // Ordenar por preço crescente

    return validResults;
  } catch (error) {
    console.error("Erro ao executar scrapers:", error);
    throw new Error("Erro interno ao buscar produtos");
  }
}

// Exportar scrapers individuais
export { scrapeOLX, scrapeMercadoLivre, scrapeAmazon };

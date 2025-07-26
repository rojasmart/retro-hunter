import { scrapeOLX } from "./olx";
import { scrapeMercadoLivre } from "./mercadolivre";
import { scrapeAmazon } from "./amazon";
import { scrapeNasSutromiBlog } from "./nassutromi";
import { scrapeWebBuy } from "./webuy";
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

  const scrapers = [
    {
      name: "OLX",
      scraper: (name: string) => scrapeOLX(name),
    },
    {
      name: "MercadoLivre",
      scraper: (name: string) => scrapeMercadoLivre(name),
    },
    {
      name: "Amazon",
      scraper: (name: string) => scrapeAmazon(name),
    },
    {
      name: "WebBuy Portugal",
      scraper: (name: string) => scrapeWebBuy(name, platform), // Passar plataforma para WebBuy
    },
    {
      name: "Nas Sutromi Blog",
      scraper: (name: string) => scrapeNasSutromiBlog(name),
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
export { scrapeOLX, scrapeMercadoLivre, scrapeAmazon, scrapeNasSutromiBlog, scrapeWebBuy };

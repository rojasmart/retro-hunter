import { GameResult } from "@/lib/types";
import { formatPrice, cleanText, delay } from "@/lib/utils/formatters";
import { isValidUrl } from "@/lib/utils/validators";

export async function scrapeMercadoLivre(gameName: string): Promise<GameResult[]> {
  try {
    // Aguarda um pouco para evitar rate limiting
    await delay(Math.random() * 1000 + 500);

    const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(gameName + " jogo")}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Simular parsing do HTML (você precisará implementar com cheerio ou similar)
    // Por agora, retornando dados mockados para demonstração
    const mockResults: GameResult[] = [
      {
        title: `${gameName} - PlayStation 2`,
        priceText: "R$ 89,90",
        price: 89.9,
        link: "https://mercadolivre.com.br/exemplo1",
        site: "MercadoLivre",
        image: "https://via.placeholder.com/150",
      },
      {
        title: `${gameName} Retro Game`,
        priceText: "R$ 120,00",
        price: 120.0,
        link: "https://mercadolivre.com.br/exemplo2",
        site: "MercadoLivre",
      },
    ];

    // Filtrar resultados válidos
    return mockResults.filter((result) => result.price > 0 && isValidUrl(result.link) && result.title.length > 0);
  } catch (error) {
    console.error("Erro ao fazer scraping do MercadoLivre:", error);
    return [];
  }
}

// Função para parsing real do HTML quando implementar com cheerio
export function parseMercadoLivreHTML(html: string, gameName: string): GameResult[] {
  // TODO: Implementar parsing real com cheerio
  // const $ = cheerio.load(html);
  // const results: GameResult[] = [];

  // $('.ui-search-results__item').each((index, element) => {
  //   const $item = $(element);
  //   const title = cleanText($item.find('.ui-search-item__title').text());
  //   const priceText = cleanText($item.find('.price-tag-fraction').text());
  //   const link = $item.find('a').attr('href') || '';
  //   const image = $item.find('img').attr('src');
  //
  //   if (title && priceText && link) {
  //     results.push({
  //       title,
  //       priceText: `R$ ${priceText}`,
  //       price: formatPrice(priceText),
  //       link,
  //       site: 'MercadoLivre',
  //       image
  //     });
  //   }
  // });

  // return results;
  return [];
}

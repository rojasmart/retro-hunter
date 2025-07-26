import { GameResult } from "@/lib/types";
import { formatPrice, cleanText, delay } from "@/lib/utils/formatters";
import { isValidUrl } from "@/lib/utils/validators";

export async function scrapeOLX(gameName: string): Promise<GameResult[]> {
  try {
    // Aguarda um pouco para evitar rate limiting
    await delay(Math.random() * 1000 + 500);

    const searchUrl = `https://www.olx.com.br/brasil?q=${encodeURIComponent(gameName + " jogo")}`;

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
        title: `${gameName} Original`,
        priceText: "R$ 75,00",
        price: 75.0,
        link: "https://olx.com.br/exemplo1",
        site: "OLX",
        image: "https://via.placeholder.com/150",
      },
      {
        title: `Jogo ${gameName} Usado`,
        priceText: "R$ 45,00",
        price: 45.0,
        link: "https://olx.com.br/exemplo2",
        site: "OLX",
      },
    ];

    // Filtrar resultados válidos
    return mockResults.filter((result) => result.price > 0 && isValidUrl(result.link) && result.title.length > 0);
  } catch (error) {
    console.error("Erro ao fazer scraping da OLX:", error);
    return [];
  }
}

// Função para parsing real do HTML quando implementar com cheerio
export function parseOLXHTML(html: string, gameName: string): GameResult[] {
  // TODO: Implementar parsing real com cheerio
  // const $ = cheerio.load(html);
  // const results: GameResult[] = [];

  // $('[data-testid="ad-card"]').each((index, element) => {
  //   const $item = $(element);
  //   const title = cleanText($item.find('[data-testid="ad-title"]').text());
  //   const priceText = cleanText($item.find('[data-testid="ad-price"]').text());
  //   const link = $item.find('a').attr('href') || '';
  //   const image = $item.find('img').attr('src');
  //
  //   if (title && priceText && link) {
  //     results.push({
  //       title,
  //       priceText,
  //       price: formatPrice(priceText),
  //       link: link.startsWith('http') ? link : `https://www.olx.com.br${link}`,
  //       site: 'OLX',
  //       image
  //     });
  //   }
  // });

  // return results;
  return [];
}

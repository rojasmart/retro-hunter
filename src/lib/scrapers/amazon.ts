import { GameResult } from "@/lib/types";
import { formatPrice, cleanText, delay } from "@/lib/utils/formatters";
import { isValidUrl } from "@/lib/utils/validators";

export async function scrapeAmazon(gameName: string): Promise<GameResult[]> {
  try {
    // Aguarda um pouco para evitar rate limiting
    await delay(Math.random() * 1000 + 500);

    const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(gameName + " jogo")}`;

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
        title: `${gameName} - Edição Especial`,
        priceText: "R$ 199,90",
        price: 199.9,
        link: "https://amazon.com.br/exemplo1",
        site: "Amazon",
        image: "https://via.placeholder.com/150",
      },
      {
        title: `${gameName} Digital`,
        priceText: "R$ 89,99",
        price: 89.99,
        link: "https://amazon.com.br/exemplo2",
        site: "Amazon",
      },
    ];

    // Filtrar resultados válidos
    return mockResults.filter((result) => result.price > 0 && isValidUrl(result.link) && result.title.length > 0);
  } catch (error) {
    console.error("Erro ao fazer scraping da Amazon:", error);
    return [];
  }
}

// Função para parsing real do HTML quando implementar com cheerio
export function parseAmazonHTML(html: string, gameName: string): GameResult[] {
  // TODO: Implementar parsing real com cheerio
  // const $ = cheerio.load(html);
  // const results: GameResult[] = [];

  // $('[data-component-type="s-search-result"]').each((index, element) => {
  //   const $item = $(element);
  //   const title = cleanText($item.find('h2 a span').text());
  //   const priceWhole = $item.find('.a-price-whole').text();
  //   const priceFraction = $item.find('.a-price-fraction').text();
  //   const priceText = priceWhole && priceFraction ? `R$ ${priceWhole},${priceFraction}` : '';
  //   const link = $item.find('h2 a').attr('href') || '';
  //   const image = $item.find('img').attr('src');
  //
  //   if (title && priceText && link) {
  //     results.push({
  //       title,
  //       priceText,
  //       price: formatPrice(priceText),
  //       link: link.startsWith('http') ? link : `https://www.amazon.com.br${link}`,
  //       site: 'Amazon',
  //       image
  //     });
  //   }
  // });

  // return results;
  return [];
}

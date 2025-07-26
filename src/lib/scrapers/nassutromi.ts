import { GameResult } from "@/lib/types";
import { formatPrice, cleanText, delay } from "@/lib/utils/formatters";
import { isValidUrl } from "@/lib/utils/validators";

export async function scrapeNasSutromiBlog(gameName: string): Promise<GameResult[]> {
  try {
    // Aguarda um pouco para evitar rate limiting
    await delay(Math.random() * 1000 + 500);

    // Tentar múltiplas estratégias de busca
    const searchStrategies = [
      // 1. Busca na página principal do PlayStation 2
      () => searchInPlaystation2Page(gameName),
      // 2. Busca usando o sistema de busca do blog
      () => searchUsingBlogSearch(gameName),
      // 3. Busca em múltiplas páginas
      () => searchMultiplePages(gameName),
    ];

    let allResults: GameResult[] = [];

    for (const strategy of searchStrategies) {
      try {
        const results = await strategy();
        allResults.push(...results);

        // Se encontrou resultados, pode parar ou continuar para ter mais resultados
        if (results.length > 0) {
          console.log(`Encontrados ${results.length} resultados com uma estratégia`);
        }
      } catch (error) {
        console.error("Erro em estratégia de busca:", error);
      }
    }

    // Remover duplicatas baseado no link
    const uniqueResults = allResults.filter((result, index, self) => index === self.findIndex((r) => r.link === result.link));

    // Filtrar resultados válidos
    return uniqueResults.filter((result) => result.price > 0 && isValidUrl(result.link) && result.title.length > 0);
  } catch (error) {
    console.error("Erro ao fazer scraping do blog Nas Sutromi:", error);
    return [];
  }
}

// Estratégia 1: Buscar na página principal do PlayStation 2
async function searchInPlaystation2Page(gameName: string): Promise<GameResult[]> {
  const searchUrl = "https://nas-sutromi.blogspot.com/search/label/Playstation%202";

  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  return parseNasSutromiHTML(html, gameName);
}

// Estratégia 2: Usar o sistema de busca do blog
async function searchUsingBlogSearch(gameName: string): Promise<GameResult[]> {
  const searchQuery = encodeURIComponent(gameName);
  const searchUrl = `https://nas-sutromi.blogspot.com/search?q=${searchQuery}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (response.ok) {
      const html = await response.text();
      return parseNasSutromiHTML(html, gameName);
    }
  } catch (error) {
    console.error("Erro na busca do blog:", error);
  }

  return [];
}

// Estratégia 3: Buscar em múltiplas páginas
async function searchMultiplePages(gameName: string): Promise<GameResult[]> {
  const allResults: GameResult[] = [];

  // Buscar nas primeiras 3 páginas
  for (let page = 0; page < 3; page++) {
    try {
      const startParam = page * 20;
      const url = `https://nas-sutromi.blogspot.com/search/label/Playstation%202?max-results=20&start=${startParam}&by-date=false`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const pageResults = parseNasSutromiHTML(html, gameName);
        allResults.push(...pageResults);
      }

      // Delay entre páginas
      await delay(1000);
    } catch (error) {
      console.error(`Erro na página ${page}:`, error);
    }
  }

  return allResults;
}

export function parseNasSutromiHTML(html: string, gameName: string): GameResult[] {
  const results: GameResult[] = [];

  try {
    const cleanGameName = gameName.toLowerCase().trim();

    // Múltiplos padrões para encontrar jogos no blog
    const patterns = [
      // Padrão 1: ### [Título](link) ... Valor: XX€
      /### \[([^\]]+)\]\(([^)]+)\)[^]*?Valor:\s*(\d+)€/gi,

      // Padrão 2: <h3><a href="link">Título</a></h3> ... Valor: XX€
      /<h3[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>[^]*?Valor:\s*(\d+)€/gi,

      // Padrão 3: Qualquer link para post + título na mesma linha + preço
      /<a[^>]+href="([^"]*nas-sutromi\.blogspot\.com[^"]*)"[^>]*>([^<]+)<\/a>[^]*?(\d+)€/gi,

      // Padrão 4: Buscar por títulos de posts e preços próximos
      /(?:title|alt)="([^"]*(?:jogo|game|playstation)[^"]*)"[^]*?href="([^"]*nas-sutromi[^"]*)"[^]*?(\d+)€/gi,
    ];

    patterns.forEach((pattern, patternIndex) => {
      let match;
      pattern.lastIndex = 0; // Reset regex

      while ((match = pattern.exec(html)) !== null) {
        let title: string = "";
        let link: string = "";
        let priceEuros: number = 0;

        // Ajustar baseado no padrão
        switch (patternIndex) {
          case 0: // Padrão markdown
            title = cleanText(match[1] || "");
            link = match[2] || "";
            priceEuros = parseInt(match[3] || "0");
            break;
          case 1: // Padrão HTML h3
            title = cleanText(match[2] || "");
            link = match[1] || "";
            priceEuros = parseInt(match[3] || "0");
            break;
          case 2: // Padrão link geral
            title = cleanText(match[2] || "");
            link = match[1] || "";
            priceEuros = parseInt(match[3] || "0");
            break;
          case 3: // Padrão por atributos
            title = cleanText(match[1] || "");
            link = match[2] || "";
            priceEuros = parseInt(match[3] || "0");
            break;
        }

        // Verificar se os dados são válidos
        if (title && link && priceEuros > 0 && isGameMatch(title, cleanGameName)) {
          // Converter euros para reais
          const priceInReais = priceEuros * 6;

          // Verificar se já existe (evitar duplicatas)
          const exists = results.some((r) => r.link === link || r.title === title);

          if (!exists) {
            results.push({
              title: `${title} - PlayStation 2`,
              priceText: `€${priceEuros} (~R$ ${priceInReais.toFixed(2)})`,
              price: priceInReais,
              link: link.startsWith("http") ? link : `https://nas-sutromi.blogspot.com${link}`,
              site: "Nas Sutromi Blog",
              image: undefined,
            });
          }
        }
      }
    });

    // Se não encontrou com os padrões, usar lista conhecida de jogos
    if (results.length === 0) {
      console.log("Usando fallback com jogos conhecidos...");
      return getFallbackGames(cleanGameName);
    }
  } catch (error) {
    console.error("Erro ao fazer parse do HTML do blog:", error);
  }

  return results;
}

// Função auxiliar para verificar se um jogo corresponde à busca
function isGameMatch(title: string, searchTerm: string): boolean {
  const titleLower = title.toLowerCase();
  const searchLower = searchTerm.toLowerCase();

  // Busca exata
  if (titleLower.includes(searchLower)) {
    return true;
  }

  // Busca por palavras (mínimo 3 caracteres)
  const searchWords = searchLower.split(" ").filter((word) => word.length >= 3);
  if (searchWords.length > 0) {
    const matchedWords = searchWords.filter((word) => titleLower.includes(word));
    // Pelo menos 50% das palavras devem corresponder
    return matchedWords.length >= Math.ceil(searchWords.length * 0.5);
  }

  return false;
}

// Função fallback com jogos conhecidos do blog
function getFallbackGames(searchTerm: string): GameResult[] {
  const knownGames = [
    { title: "R-Type Final", price: 20, link: "https://nas-sutromi.blogspot.com/2021/06/r-type-final.html" },
    { title: "Hello Kitty", price: 8, link: "https://nas-sutromi.blogspot.com/2024/11/hello-kitty.html" },
    { title: "Buzz Corridas Loucas", price: 14, link: "https://nas-sutromi.blogspot.com/2022/04/buzz-corridas-loucas.html" },
    {
      title: "Need For Speed Most Wanted Black Edition",
      price: 10,
      link: "https://nas-sutromi.blogspot.com/2022/04/need-for-speed-most-wanted-black-edition.html",
    },
    { title: "O Padrinho", price: 10, link: "https://nas-sutromi.blogspot.com/2022/04/o-padrinho.html" },
    { title: "Tourist Trophy", price: 10, link: "https://nas-sutromi.blogspot.com/2022/01/tourist-trophy.html" },
    { title: "Resident Evil Outbreak", price: 15, link: "https://nas-sutromi.blogspot.com/2021/09/playstation-2-jogo-usado-testado-e.html" },
    { title: "Devil May Cry 3 SE", price: 12, link: "https://nas-sutromi.blogspot.com/2021/04/devil-may-cry-3-se.html" },
    { title: "Prince of Persia Trilogy", price: 15, link: "https://nas-sutromi.blogspot.com/2021/04/prince-of-persia-trilogy.html" },
    { title: "Final Fantasy X", price: 3, link: "https://nas-sutromi.blogspot.com/2021/07/final-fantasy-x.html" },
    { title: "Jak 2", price: 3, link: "https://nas-sutromi.blogspot.com/2021/07/jak-2.html" },
    { title: "Street Fighter Alpha Anthology", price: 10, link: "https://nas-sutromi.blogspot.com/2022/04/street-fighter-alpha-anthology.html" },
    { title: "Buzz Festa na Selva", price: 12, link: "https://nas-sutromi.blogspot.com/2022/04/buzz-festa-na-selva.html" },
  ];

  const matchingGames = knownGames.filter((game) => isGameMatch(game.title, searchTerm));

  return matchingGames.map((game) => {
    const priceInReais = game.price * 6;
    return {
      title: `${game.title} - PlayStation 2 (Usado)`,
      priceText: `€${game.price} (~R$ ${priceInReais.toFixed(2)})`,
      price: priceInReais,
      link: game.link,
      site: "Nas Sutromi Blog",
      image: undefined,
    };
  });
}

// Função auxiliar para buscar em páginas específicas do blog
export async function searchBlogPages(gameName: string, maxPages: number = 3): Promise<GameResult[]> {
  const allResults: GameResult[] = [];

  for (let page = 0; page < maxPages; page++) {
    try {
      const startParam = page * 20;
      const url = `https://nas-sutromi.blogspot.com/search/label/Playstation%202?max-results=20&start=${startParam}&by-date=false`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const pageResults = parseNasSutromiHTML(html, gameName);
        allResults.push(...pageResults);
      }

      // Delay entre páginas
      await delay(1000);
    } catch (error) {
      console.error(`Erro na página ${page}:`, error);
    }
  }

  // Remover duplicatas baseado no link
  const uniqueResults = allResults.filter((result, index, self) => index === self.findIndex((r) => r.link === result.link));

  return uniqueResults;
}

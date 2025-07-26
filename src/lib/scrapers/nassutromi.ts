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
      // 3. Busca em múltiplas páginas com paginação automática
      () => searchMultiplePagesAutomatic(gameName),
      // 4. Busca em todos os anos (estratégia mais completa)
      () => searchAllYears(gameName),
    ];

    let allResults: GameResult[] = [];
    let foundResults = false;

    // Testar estratégias em ordem de velocidade
    for (let i = 0; i < searchStrategies.length; i++) {
      try {
        console.log(`Executando estratégia ${i + 1}...`);
        const results = await searchStrategies[i]();
        allResults.push(...results);

        if (results.length > 0) {
          console.log(`Estratégia ${i + 1} encontrou ${results.length} resultados`);
          foundResults = true;

          // Para busca rápida, se encontrou pode parar
          // Para busca completa, continua para obter mais resultados
          if (i < 2 && results.length >= 5) {
            break; // Parar se encontrou resultados suficientes nas estratégias rápidas
          }
        }
      } catch (error) {
        console.error(`Erro na estratégia ${i + 1}:`, error);
      }
    }

    // Se não encontrou nada com as estratégias, usar fallback
    if (!foundResults) {
      console.log("Usando fallback com jogos conhecidos...");
      allResults.push(...getFallbackGames(gameName));
    }

    // Remover duplicatas baseado no link
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.link === result.link) && result.price > 0 && isValidUrl(result.link) && result.title.length > 0
    );

    return uniqueResults;
  } catch (error) {
    console.error("Erro ao fazer scraping do blog Nas Sutromi:", error);
    return getFallbackGames(gameName);
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

// Estratégia 3 atualizada: Buscar em múltiplas páginas com paginação automática
async function searchMultiplePagesAutomatic(gameName: string): Promise<GameResult[]> {
  const allResults: GameResult[] = [];
  let currentUrl = "https://nas-sutromi.blogspot.com/search/label/Playstation%202";
  let pageCount = 0;
  const maxPages = 50; // Limite de segurança

  while (currentUrl && pageCount < maxPages) {
    try {
      console.log(`Buscando página ${pageCount + 1}: ${currentUrl}`);

      const response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        console.log(`Erro HTTP ${response.status} na página ${pageCount + 1}`);
        break;
      }

      const html = await response.text();
      const pageResults = parseNasSutromiHTML(html, gameName);
      allResults.push(...pageResults);

      // Procurar pelo link da próxima página
      const nextPageUrl = extractNextPageUrl(html);

      if (nextPageUrl && nextPageUrl !== currentUrl) {
        currentUrl = nextPageUrl;
        pageCount++;

        // Delay entre páginas para ser respeitoso
        await delay(1500);
      } else {
        console.log("Não há mais páginas para processar");
        break;
      }
    } catch (error) {
      console.error(`Erro na página ${pageCount + 1}:`, error);
      break;
    }
  }

  console.log(`Processadas ${pageCount + 1} páginas, encontrados ${allResults.length} resultados`);
  return allResults;
}

// Nova função para extrair o URL da próxima página
function extractNextPageUrl(html: string): string | null {
  try {
    // Padrões para encontrar o link "Mais antigos" ou "Older Posts"
    const patterns = [
      // Padrão 1: Link "Mais antigos" em português
      /<a[^>]+href="([^"]*updated-max=[^"]*)"[^>]*>(?:Mais antigos|Older Posts|Publicações mais antigas)/i,

      // Padrão 2: Link com classe blog-pager-older-link
      /<a[^>]+class="[^"]*blog-pager-older-link[^"]*"[^>]+href="([^"]*)"/i,

      // Padrão 3: Qualquer link com updated-max na URL
      /<a[^>]+href="([^"]*updated-max=[^"]*max-results=\d+[^"]*)"[^>]*>/i,

      // Padrão 4: Link dentro de navegação de páginas
      /<div[^>]*class="[^"]*blog-pager[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]*updated-max=[^"]*)"[^>]*>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let url = match[1];

        // Garantir que é uma URL completa
        if (url.startsWith("/")) {
          url = "https://nas-sutromi.blogspot.com" + url;
        } else if (!url.startsWith("http")) {
          url = "https://nas-sutromi.blogspot.com/" + url;
        }

        // Verificar se a URL é válida
        if (url.includes("updated-max=") && url.includes("Playstation%202")) {
          return url;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao extrair URL da próxima página:", error);
    return null;
  }
}

// Nova função para buscar por ano específico
async function searchByYear(gameName: string, year: number): Promise<GameResult[]> {
  const allResults: GameResult[] = [];

  // Criar URL para buscar posts até o final do ano especificado
  const endOfYear = `${year}-12-31T23:59:59-08:00`;
  const startUrl = `https://nas-sutromi.blogspot.com/search/label/Playstation%202?updated-max=${endOfYear}&max-results=20`;

  let currentUrl = startUrl;
  let pageCount = 0;
  const maxPagesPerYear = 20;

  while (currentUrl && pageCount < maxPagesPerYear) {
    try {
      const response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) break;

      const html = await response.text();

      // Verificar se ainda estamos no ano correto
      if (!html.includes(`${year}`) && pageCount > 0) {
        console.log(`Saindo do ano ${year} na página ${pageCount + 1}`);
        break;
      }

      const pageResults = parseNasSutromiHTML(html, gameName);
      allResults.push(...pageResults);

      const nextPageUrl = extractNextPageUrl(html);
      if (nextPageUrl && nextPageUrl !== currentUrl) {
        currentUrl = nextPageUrl;
        pageCount++;
        await delay(1000);
      } else {
        break;
      }
    } catch (error) {
      console.error(`Erro no ano ${year}, página ${pageCount + 1}:`, error);
      break;
    }
  }

  return allResults;
}

// Nova função para buscar em todos os anos
async function searchAllYears(gameName: string): Promise<GameResult[]> {
  const allResults: GameResult[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = 2010; // Ano de início do blog (ajuste conforme necessário)

  console.log(`Buscando ${gameName} de ${startYear} até ${currentYear}...`);

  // Buscar ano por ano, do mais recente para o mais antigo
  for (let year = currentYear; year >= startYear; year--) {
    try {
      console.log(`Processando ano ${year}...`);
      const yearResults = await searchByYear(gameName, year);
      allResults.push(...yearResults);

      // Se encontrou resultados, pode continuar ou parar dependendo da necessidade
      if (yearResults.length > 0) {
        console.log(`Encontrados ${yearResults.length} resultados em ${year}`);
      }

      // Delay entre anos
      await delay(2000);
    } catch (error) {
      console.error(`Erro ao processar ano ${year}:`, error);
    }
  }

  // Remover duplicatas
  const uniqueResults = allResults.filter((result, index, self) => index === self.findIndex((r) => r.link === result.link));

  console.log(`Total encontrado: ${uniqueResults.length} jogos únicos`);
  return uniqueResults;
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

// Exportar funções para teste
export { searchAllYears, searchByYear, searchMultiplePagesAutomatic };

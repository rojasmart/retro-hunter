export const SCRAPER_CONFIG = {
  // Configurações gerais
  DEFAULT_DELAY: 1000,
  MAX_RETRIES: 3,
  TIMEOUT: 10000,

  // User agents para evitar bloqueios
  USER_AGENTS: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  ],

  // Configuração específica do eBay
  SITES: {
    EBAY: {
      name: "eBay",
      baseUrl: "https://api.ebay.com",
      enabled: true,
      priority: 1,
      country: "US",
      currency: "USD",
    },
  },

  // Filtros de qualidade
  FILTERS: {
    MIN_PRICE: 1,
    MAX_PRICE: 10000,
    MIN_TITLE_LENGTH: 3,
    BLOCKED_WORDS: ["replica", "fake", "copia"],
  },
};

export const getRandomUserAgent = (): string => {
  const agents = SCRAPER_CONFIG.USER_AGENTS;
  return agents[Math.floor(Math.random() * agents.length)];
};

export const getEnabledScrapers = () => {
  return Object.values(SCRAPER_CONFIG.SITES)
    .filter((site) => site.enabled)
    .sort((a, b) => a.priority - b.priority);
};

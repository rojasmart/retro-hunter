export const SCRAPER_CONFIG = {
  // Configurações gerais
  DEFAULT_DELAY: 1000,
  MAX_RETRIES: 3,
  TIMEOUT: 10000,

  // Taxa de conversão EUR para BRL (aproximada)
  EUR_TO_BRL_RATE: 6.0,

  // User agents para evitar bloqueios
  USER_AGENTS: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  ],

  // Configurações específicas por site
  SITES: {
    MERCADOLIVRE: {
      name: "MercadoLivre",
      baseUrl: "https://lista.mercadolivre.com.br",
      searchPath: "/{query}",
      enabled: true,
      priority: 1,
    },
    OLX: {
      name: "OLX",
      baseUrl: "https://www.olx.com.br",
      searchPath: "/brasil?q={query}",
      enabled: true,
      priority: 2,
    },
    AMAZON: {
      name: "Amazon",
      baseUrl: "https://www.amazon.com.br",
      searchPath: "/s?k={query}",
      enabled: true,
      priority: 3,
    },
    NAS_SUTROMI: {
      name: "Nas Sutromi Blog",
      baseUrl: "https://nas-sutromi.blogspot.com",
      searchPath: "/search/label/Playstation%202",
      enabled: true,
      priority: 4,
      country: "PT",
      currency: "EUR",
    },
    WEBUY: {
      name: "WebBuy Portugal",
      baseUrl: "https://pt.webuy.com",
      searchPath: "/search?stext={query}",
      enabled: true,
      priority: 3,
      country: "PT",
      currency: "EUR",
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

export interface GameResult {
  title: string;
  priceText: string;
  price: number;
  link: string;
  site: string;
  image?: string;
}

export interface ScraperConfig {
  baseUrl: string;
  searchPath: string;
  selectors: {
    container: string;
    title: string;
    price: string;
    link: string;
    image?: string;
  };
}

export interface ApiResponse {
  resultados: GameResult[];
  total: number;
  error?: string;
}

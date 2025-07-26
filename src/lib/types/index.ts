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

export type Platform = 
  | 'all'
  | 'ps2'
  | 'ps3'
  | 'ps4'
  | 'xbox'
  | 'xbox360'
  | 'nintendo-switch'
  | 'nintendo-wii'
  | 'nintendo-ds'
  | 'retro';

export interface PlatformConfig {
  id: string;
  name: string;
  webuyCategories: string[];
  icon: string;
}

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

// Interfaces para a API do eBay
export interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  itemWebUrl: string;
  image?: {
    imageUrl: string;
  };
  condition?: string;
  seller: {
    username: string;
    feedbackPercentage?: string;
    feedbackScore?: number;
  };
  shippingOptions?: Array<{
    shippingCost: {
      value: string;
      currency: string;
    };
    type: string;
  }>;
}

export interface EbaySearchResponse {
  itemSummaries: EbayItem[];
  total: number;
  limit: number;
  offset: number;
  warnings?: Array<{
    category: string;
    domain: string;
    errorId: number;
    message: string;
  }>;
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
  ebayCategory: string;
  icon: string;
}

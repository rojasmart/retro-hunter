import { getEbayToken } from '@/lib/utils/ebay-token-manager';

// Configurações da API do eBay
export const EBAY_CONFIG = {
  // URLs da API
  PRODUCTION_BASE_URL: 'https://api.ebay.com',
  SANDBOX_BASE_URL: 'https://api.sandbox.ebay.com',
  
  // Endpoints
  BROWSE_API: '/buy/browse/v1',
  
  // Headers padrão
  HEADERS: {
    'Content-Type': 'application/json',
    'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=PT,zip=1000-001',
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_ES' // Espanha é mais próximo para PT
  },

  // Categorias de jogos por plataforma
  GAME_CATEGORIES: {
    'ps2': '139973', // Video Games & Consoles > Video Games > Sony PlayStation 2
    'ps3': '139971', // Sony PlayStation 3
    'ps4': '139973', // Sony PlayStation 4
    'ps5': '180022', // Sony PlayStation 5
    'xbox': '139973', // Microsoft Xbox
    'xbox360': '139973', // Microsoft Xbox 360
    'xbox-one': '139973', // Microsoft Xbox One
    'nintendo-switch': '139973', // Nintendo Switch
    'nintendo-wii': '139973', // Nintendo Wii
    'nintendo-3ds': '139973', // Nintendo 3DS
    'psp': '139973', // Sony PSP
    'pc': '139973', // PC Games
    'retro': '139973' // Retro gaming
  },

  // Filtros de condição
  CONDITIONS: {
    NEW: '1000', // New
    LIKE_NEW: '1500', // Like New
    EXCELLENT: '2000', // Excellent
    VERY_GOOD: '2500', // Very Good
    GOOD: '3000', // Good
    ACCEPTABLE: '4000' // Acceptable
  }
};

// Função para obter a URL base baseada no ambiente
export function getEbayBaseUrl(): string {
  const isSandbox = process.env.EBAY_SANDBOX === 'true';
  return isSandbox ? EBAY_CONFIG.SANDBOX_BASE_URL : EBAY_CONFIG.PRODUCTION_BASE_URL;
}

// Função para obter headers da API
export async function getEbayHeaders(): Promise<Record<string, string>> {
  const token = await getEbayToken();
  
  return {
    ...EBAY_CONFIG.HEADERS,
    'Authorization': `Bearer ${token}`
  };
}

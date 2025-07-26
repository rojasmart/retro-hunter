import { Platform, PlatformConfig } from "@/lib/types";

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  all: {
    id: 'all',
    name: 'Todas as Plataformas',
    webuyCategories: [],
    icon: '🎮'
  },
  ps2: {
    id: 'ps2',
    name: 'PlayStation 2',
    webuyCategories: ['1077'], // PlayStation 2 Jogos + Raridades
    icon: '🎮'
  },
  ps3: {
    id: 'ps3',
    name: 'PlayStation 3',
    webuyCategories: ['1115'],
    icon: '🎮'
  },
  ps4: {
    id: 'ps4',
    name: 'PlayStation 4',
    webuyCategories: ['1210'],
    icon: '🎮'
  },
  xbox: {
    id: 'xbox',
    name: 'Xbox Original',
    webuyCategories: ['1092'],
    icon: '🎮'
  },
  xbox360: {
    id: 'xbox360',
    name: 'Xbox 360',
    webuyCategories: ['1185'],
    icon: '🎮'
  },
  'nintendo-switch': {
    id: 'nintendo-switch',
    name: 'Nintendo Switch',
    webuyCategories: ['1279'],
    icon: '🎮'
  },
  'nintendo-wii': {
    id: 'nintendo-wii',
    name: 'Nintendo Wii',
    webuyCategories: ['1158'],
    icon: '🎮'
  },
  'nintendo-ds': {
    id: 'nintendo-ds',
    name: 'Nintendo DS',
    webuyCategories: ['1150'],
    icon: '🎮'
  },
  retro: {
    id: 'retro',
    name: 'Retro (PSX, N64, etc.)',
    webuyCategories: ['1050', '1051', '1052'], // PSX, N64, etc.
    icon: '👾'
  }
};

// Função para pesquisar no WebBuy com as categorias e subcategorias corretas do PS2
export function getWebBuyPS2SearchUrl(gameName: string): string {
  // Para PS2, usar productLineId=51 que inclui jogos e raridades
  return `https://pt.webuy.com/search?productLineId=51&productLineName=Jogos+Software&categoryFriendlyName=Playstation2+Jogos~Playstation2+Raridades&stext=${encodeURIComponent(gameName)}`;
}

// Função para obter URLs de busca específicas por plataforma
export function getPlatformSearchUrls(platform: Platform, gameName: string): string[] {
  const config = PLATFORM_CONFIGS[platform];
  
  if (platform === 'ps2') {
    // Para PS2, usar a URL específica que inclui jogos e raridades
    return [getWebBuyPS2SearchUrl(gameName)];
  }
  
  if (platform === 'all' || config.webuyCategories.length === 0) {
    // Busca geral
    return [`https://pt.webuy.com/search?stext=${encodeURIComponent(gameName)}`];
  }
  
  // Para outras plataformas, usar categoryIds
  return config.webuyCategories.map(categoryId => 
    `https://pt.webuy.com/search?categoryIds=${categoryId}&stext=${encodeURIComponent(gameName)}`
  );
}

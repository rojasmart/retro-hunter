import { Platform, PlatformConfig } from "@/lib/types";

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  all: {
    id: 'all',
    name: 'Todas as Plataformas',
    ebayCategory: '139973', // Video Games category
    icon: '🎮'
  },
  ps2: {
    id: 'ps2',
    name: 'PlayStation 2',
    ebayCategory: '139973',
    icon: '🎮'
  },
  ps3: {
    id: 'ps3',
    name: 'PlayStation 3',
    ebayCategory: '139973',
    icon: '🎮'
  },
  ps4: {
    id: 'ps4',
    name: 'PlayStation 4',
    ebayCategory: '139973',
    icon: '🎮'
  },
  xbox: {
    id: 'xbox',
    name: 'Xbox Original',
    ebayCategory: '139973',
    icon: '🎮'
  },
  xbox360: {
    id: 'xbox360',
    name: 'Xbox 360',
    ebayCategory: '139973',
    icon: '🎮'
  },
  'nintendo-switch': {
    id: 'nintendo-switch',
    name: 'Nintendo Switch',
    ebayCategory: '139973',
    icon: '🎮'
  },
  'nintendo-wii': {
    id: 'nintendo-wii',
    name: 'Nintendo Wii',
    ebayCategory: '139973',
    icon: '🎮'
  },
  'nintendo-ds': {
    id: 'nintendo-ds',
    name: 'Nintendo DS',
    ebayCategory: '139973',
    icon: '🎮'
  },
  retro: {
    id: 'retro',
    name: 'Retro (PSX, N64, etc.)',
    ebayCategory: '139973',
    icon: '👾'
  }
};

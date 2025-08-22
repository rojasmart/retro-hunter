import { getEbayToken } from "@/lib/utils/ebay-token-manager";

// Configurações da API do eBay
export const EBAY_CONFIG = {
  // URLs da API
  PRODUCTION_BASE_URL: "https://api.ebay.com",
  SANDBOX_BASE_URL: "https://api.sandbox.ebay.com",

  // Endpoints
  BROWSE_API: "/buy/browse/v1",

  // Headers padrão
  HEADERS: {
    "Content-Type": "application/json",
    "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
  },
};

// Função para obter a URL base baseada no ambiente
export function getEbayBaseUrl(): string {
  const isSandbox = process.env.EBAY_SANDBOX === "true";
  return isSandbox ? EBAY_CONFIG.SANDBOX_BASE_URL : EBAY_CONFIG.PRODUCTION_BASE_URL;
}

// Função para obter headers da API
export async function getEbayHeaders(): Promise<Record<string, string>> {
  const token = await getEbayToken();

  return {
    ...EBAY_CONFIG.HEADERS,
    Authorization: `Bearer ${token}`,
  };
}

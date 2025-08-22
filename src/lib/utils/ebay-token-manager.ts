/**
 * Gerenciador de tokens do eBay
 * Automatiza a obtenção e renovação de tokens de acesso
 */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class EbayTokenManager {
  private static instance: EbayTokenManager;
  private currentToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private storedRefreshToken: string | null = null;

  private constructor() {
    // Carregar token atual do .env se existir
    this.currentToken = process.env.EBAY_ACCESS_TOKEN || null;
  }

  static getInstance(): EbayTokenManager {
    if (!EbayTokenManager.instance) {
      EbayTokenManager.instance = new EbayTokenManager();
    }
    return EbayTokenManager.instance;
  }

  /**
   * Obtém um Application Token (para APIs públicas)
   * Este método é mais simples e adequado para busca de itens
   */
  async getApplicationToken(): Promise<string> {
    if (this.currentToken && Date.now() < this.tokenExpiresAt) {
      return this.currentToken;
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Credenciais eBay não encontradas");
    }

    const baseUrl = process.env.EBAY_SANDBOX === "true" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

    const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      // USAR EXATAMENTE O MESMO ESCOPO QUE FUNCIONA NO TESTE
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao obter token eBay: ${error}`);
    }

    const data = await response.json();
    this.currentToken = data.access_token;
    // Token expires in seconds, convert to milliseconds and add buffer
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

    return this.currentToken;
  }

  /**
   * Verifica se o token atual é válido
   */
  isTokenValid(): boolean {
    return this.currentToken !== null && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Obtém um token válido (reutiliza se ainda válido ou gera um novo)
   */
  async getValidToken(): Promise<string> {
    // Se temos um token do .env e ele ainda não expirou, usar ele
    if (this.currentToken && this.tokenExpiresAt === 0) {
      // Token do .env (assumir que é válido por agora)
      return this.currentToken;
    }

    // Se token atual é válido, retornar
    if (this.isTokenValid()) {
      return this.currentToken!;
    }

    // Gerar novo token
    console.log("🔄 Token expirado ou inválido, obtendo novo token...");
    return await this.getApplicationToken();
  }

  /**
   * Força a obtenção de um novo token
   */
  async refreshToken(): Promise<string> {
    console.log("🔄 Forçando renovação do token...");
    return await this.getApplicationToken();
  }

  /**
   * Limpa o token atual (útil para testes)
   */
  clearToken(): void {
    this.currentToken = null;
    this.tokenExpiresAt = 0;
    this.storedRefreshToken = null;
  }

  /**
   * Retorna informações sobre o token atual
   */
  getTokenInfo(): { hasToken: boolean; expiresAt: number; timeToExpiry: number } {
    return {
      hasToken: this.currentToken !== null,
      expiresAt: this.tokenExpiresAt,
      timeToExpiry: Math.max(0, this.tokenExpiresAt - Date.now()),
    };
  }
}

// Exportar instância singleton
export const ebayTokenManager = EbayTokenManager.getInstance();

// Função de conveniência para obter token
export async function getEbayToken(): Promise<string> {
  return await ebayTokenManager.getValidToken();
}

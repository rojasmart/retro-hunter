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
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const isSandbox = process.env.EBAY_SANDBOX === 'true';

    if (!clientId || !clientSecret) {
      throw new Error('EBAY_CLIENT_ID e EBAY_CLIENT_SECRET são obrigatórios');
    }

    const baseUrl = isSandbox 
      ? 'https://api.sandbox.ebay.com' 
      : 'https://api.ebay.com';

    const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
    
    // Codificar credenciais em Base64
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao obter token do eBay:', errorText);
      throw new Error(`Falha ao obter token: ${response.status}`);
    }

    const tokenData: TokenResponse = await response.json();
    
    // Atualizar token e tempo de expiração
    this.currentToken = tokenData.access_token;
    this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 min de margem
    
    console.log(`✅ Novo token do eBay obtido. Expira em ${tokenData.expires_in} segundos`);
    
    return tokenData.access_token;
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
    console.log('🔄 Token expirado ou inválido, obtendo novo token...');
    return await this.getApplicationToken();
  }

  /**
   * Força a obtenção de um novo token
   */
  async refreshToken(): Promise<string> {
    console.log('🔄 Forçando renovação do token...');
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
      timeToExpiry: Math.max(0, this.tokenExpiresAt - Date.now())
    };
  }
}

// Exportar instância singleton
export const ebayTokenManager = EbayTokenManager.getInstance();

// Função de conveniência para obter token
export async function getEbayToken(): Promise<string> {
  return await ebayTokenManager.getValidToken();
}

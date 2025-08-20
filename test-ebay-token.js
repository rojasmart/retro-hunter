#!/usr/bin/env node

/**
 * Script para testar e gerenciar tokens do eBay
 * Execute: node test-ebay-token.js
 */

import { ebayTokenManager } from "./src/lib/utils/ebay-token-manager.js";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config();

async function testEbayToken() {
  try {
    console.log("🔧 Testando sistema de tokens do eBay...\n");

    // Mostrar informações do token atual
    const tokenInfo = ebayTokenManager.getTokenInfo();
    console.log("📋 Informações do token atual:");
    console.log(`   - Token presente: ${tokenInfo.hasToken ? "✅" : "❌"}`);
    console.log(`   - Expira em: ${Math.round(tokenInfo.timeToExpiry / 1000)}s`);
    console.log("");

    // Obter token (usar existente ou gerar novo)
    console.log("🔄 Obtendo token válido...");
    const token = await ebayTokenManager.getValidToken();
    console.log(`✅ Token obtido: ${token.substring(0, 50)}...`);
    console.log("");

    // Testar o token com uma busca real
    console.log("🧪 Testando token com busca na API...");

    const baseUrl = process.env.EBAY_SANDBOX === "true" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

    const testUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=drone&limit=3`;

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API respondeu com sucesso!`);
      console.log(`   - Total de resultados: ${data.total || 0}`);
      console.log(`   - Itens retornados: ${data.itemSummaries?.length || 0}`);

      if (data.itemSummaries && data.itemSummaries.length > 0) {
        console.log(`   - Primeiro item: ${data.itemSummaries[0].title}`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro na API (${response.status}):`, errorText);

      if (response.status === 401) {
        console.log("🔄 Token pode estar inválido, tentando renovar...");
        const newToken = await ebayTokenManager.refreshToken();
        console.log(`✅ Novo token obtido: ${newToken.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  }
}

// Função para mostrar comandos disponíveis
function showHelp() {
  console.log("🔧 Gerenciador de Tokens eBay\n");
  console.log("Comandos disponíveis:");
  console.log("  node test-ebay-token.js test    - Testar token atual");
  console.log("  node test-ebay-token.js refresh - Forçar renovação");
  console.log("  node test-ebay-token.js info    - Mostrar info do token");
  console.log("");
}

// Main
async function main() {
  const command = process.argv[2] || "test";

  switch (command) {
    case "test":
      await testEbayToken();
      break;

    case "refresh":
      console.log("🔄 Forçando renovação do token...");
      const newToken = await ebayTokenManager.refreshToken();
      console.log(`✅ Novo token: ${newToken.substring(0, 50)}...`);
      break;

    case "info":
      const info = ebayTokenManager.getTokenInfo();
      console.log("📋 Informações do token:");
      console.log(`   - Token presente: ${info.hasToken ? "✅" : "❌"}`);
      console.log(`   - Expira em: ${Math.round(info.timeToExpiry / 1000)}s`);
      break;

    case "help":
    default:
      showHelp();
      break;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

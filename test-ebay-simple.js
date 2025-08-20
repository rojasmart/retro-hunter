const { config } = require("dotenv");

// Carregar variáveis de ambiente
config();

/**
 * Teste simples do token eBay
 */
async function testEbayToken() {
  try {
    console.log("🧪 Testando token eBay atual...\n");

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const currentToken = process.env.EBAY_ACCESS_TOKEN;
    const isSandbox = process.env.EBAY_SANDBOX === "true";

    console.log("📋 Configuração atual:");
    console.log(`   - Client ID: ${clientId ? "✅" : "❌"}`);
    console.log(`   - Client Secret: ${clientSecret ? "✅" : "❌"}`);
    console.log(`   - Access Token: ${currentToken ? "✅" : "❌"}`);
    console.log(`   - Sandbox Mode: ${isSandbox ? "✅" : "❌"}`);
    console.log("");

    if (!currentToken) {
      console.log("⚠️ Nenhum token encontrado, gerando Application Token...\n");

      if (!clientId || !clientSecret) {
        throw new Error("EBAY_CLIENT_ID e EBAY_CLIENT_SECRET são obrigatórios");
      }

      const baseUrl = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

      const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      console.log(`🔗 Solicitando token para: ${tokenUrl}`);

      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ Erro ao obter token:", errorText);
        return;
      }

      const tokenData = await tokenResponse.json();
      console.log(`✅ Token obtido com sucesso!`);
      console.log(`   - Expira em: ${tokenData.expires_in} segundos`);
      console.log(`   - Token: ${tokenData.access_token.substring(0, 50)}...`);
      console.log("");

      // Atualizar token para o teste
      currentToken = tokenData.access_token;
    }

    // Testar o token com busca
    console.log("🔍 Testando busca na API...");

    const baseUrl = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

    const testUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=drone&limit=3`;

    console.log(`📡 URL da busca: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    console.log(`📊 Resposta da API: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Busca realizada com sucesso!`);
      console.log(`   - Total de resultados: ${data.total || 0}`);
      console.log(`   - Itens retornados: ${data.itemSummaries?.length || 0}`);

      if (data.itemSummaries && data.itemSummaries.length > 0) {
        console.log(`   - Primeiro item: ${data.itemSummaries[0].title}`);
        console.log(`   - Preço: ${data.itemSummaries[0].price?.value} ${data.itemSummaries[0].price?.currency}`);
      }

      if (data.warnings) {
        console.log("⚠️ Avisos da API:");
        data.warnings.forEach((warning) => {
          console.log(`   - ${warning.message}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro na API (${response.status}):`, errorText);
    }
  } catch (error) {
    console.error("❌ Erro durante o teste:", error.message);
  }
}

// Executar teste
if (require.main === module) {
  testEbayToken();
}

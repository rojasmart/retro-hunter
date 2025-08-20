require("dotenv").config({ path: ".env.local" });

async function debugEbayToken() {
  console.log("=== DEBUG COMPLETO DO TOKEN EBAY ===\n");

  // 1. Verificar variáveis de ambiente
  console.log("1️⃣ VARIÁVEIS DE AMBIENTE:");
  console.log(`CLIENT_ID: ${process.env.EBAY_CLIENT_ID ? "✅ " + process.env.EBAY_CLIENT_ID.substring(0, 30) + "..." : "❌ Não definido"}`);
  console.log(
    `CLIENT_SECRET: ${process.env.EBAY_CLIENT_SECRET ? "✅ " + process.env.EBAY_CLIENT_SECRET.substring(0, 30) + "..." : "❌ Não definido"}`
  );
  console.log(`ACCESS_TOKEN: ${process.env.EBAY_ACCESS_TOKEN ? "✅ " + process.env.EBAY_ACCESS_TOKEN.substring(0, 30) + "..." : "❌ Não definido"}`);
  console.log(`SANDBOX: ${process.env.EBAY_SANDBOX}\n`);

  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.error("❌ CLIENT_ID e CLIENT_SECRET são obrigatórios!");
    return;
  }

  // 2. Testar geração de token
  console.log("2️⃣ GERANDO NOVO TOKEN:");

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const isSandbox = process.env.EBAY_SANDBOX === "true";

  const baseUrl = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
  const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  console.log(`🔗 URL do token: ${tokenUrl}`);
  console.log(`🔑 Credenciais (Base64): ${credentials.substring(0, 50)}...`);

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro detalhado:", errorText);
      return;
    }

    const tokenData = await response.json();
    console.log("✅ Token obtido com sucesso!");
    console.log(`🎫 Novo token: ${tokenData.access_token.substring(0, 50)}...`);
    console.log(`⏰ Expira em: ${tokenData.expires_in} segundos`);
    console.log(`🔧 Tipo: ${tokenData.token_type}\n`);

    // 3. Testar o token na API
    console.log("3️⃣ TESTANDO TOKEN NA API:");

    const apiUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=soul+calibur&limit=1`;
    console.log(`🔍 URL de teste: ${apiUrl}`);

    const testResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    console.log(`📡 Status do teste: ${testResponse.status} ${testResponse.statusText}`);

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log("✅ API respondeu com sucesso!");
      console.log(`📊 Total de itens encontrados: ${testData.total || 0}`);
      console.log(`📦 Itens na resposta: ${testData.itemSummaries?.length || 0}`);
    } else {
      const errorData = await testResponse.text();
      console.error("❌ Erro ao testar API:", errorData);
    }
  } catch (error) {
    console.error("💥 Erro durante o processo:", error);
  }
}

// Executar debug
debugEbayToken().catch(console.error);

require("dotenv").config({ path: ".env.local" });

async function testProductionEbay() {
  console.log("🧪 TESTANDO PRODUÇÃO eBay\n");

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const isSandbox = process.env.EBAY_SANDBOX === "true";

  console.log(`🌍 Ambiente: ${isSandbox ? "SANDBOX" : "PRODUÇÃO"}`);
  console.log(`CLIENT_ID: ${clientId?.substring(0, 30)}...`);
  console.log(`CLIENT_SECRET: ${clientSecret?.substring(0, 30)}...`);
  console.log("");

  const baseUrl = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
  const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // Gerar token
  console.log("🔑 Gerando token...");
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("❌ Erro ao obter token:", error);
    return;
  }

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;
  console.log(`✅ Token obtido: ${token.substring(0, 30)}...`);
  console.log("");

  // Testar jogos específicos que devem existir em produção
  const gameTerms = ["soul calibur 2", "tekken 3", "final fantasy", "mario kart", "zelda"];

  for (const term of gameTerms) {
    console.log(`🎮 Testando: "${term}"`);

    const apiUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(term)}&limit=5&filter=conditionIds:{1000|1500|2000}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   📊 Total: ${data.total || 0} resultados`);
      console.log(`   📦 Na resposta: ${data.itemSummaries?.length || 0} itens`);

      if (data.itemSummaries && data.itemSummaries.length > 0) {
        const firstItem = data.itemSummaries[0];
        console.log(`   🏆 Primeiro: ${firstItem.title}`);
        console.log(`   💰 Preço: ${firstItem.price?.value || "N/A"} ${firstItem.price?.currency || ""}`);
        console.log(`   🏪 Vendedor: ${firstItem.seller?.username || "N/A"}`);
        console.log(`   ⭐ Feedback: ${firstItem.seller?.feedbackPercentage || "N/A"}%`);
      }
    } else {
      const error = await response.text();
      console.error(`   ❌ Erro ${response.status}:`, error);
    }

    console.log("");

    // Pequena pausa para não sobrecarregar a API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

testProductionEbay().catch(console.error);

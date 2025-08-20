require("dotenv").config({ path: ".env.local" });

async function testSandboxData() {
  console.log("🧪 TESTANDO DADOS NO SANDBOX eBay\n");

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const baseUrl = "https://api.sandbox.ebay.com";
  const tokenUrl = `${baseUrl}/identity/v1/oauth2/token`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // Gerar token
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  // Termos de teste comuns no sandbox
  const testTerms = ["phone", "tablet", "watch", "book", "game", "toy", "dvd", "laptop", "camera", "shoes"];

  for (const term of testTerms) {
    console.log(`🔍 Testando: "${term}"`);

    const apiUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=${term}&limit=3`;

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
      console.log(`   📊 Resultados: ${data.total || 0}`);

      if (data.itemSummaries && data.itemSummaries.length > 0) {
        console.log(`   📦 Primeiro item: ${data.itemSummaries[0].title}`);
        console.log(`   💰 Preço: ${data.itemSummaries[0].price?.value || "N/A"} ${data.itemSummaries[0].price?.currency || ""}`);
      }
    } else {
      console.log(`   ❌ Erro: ${response.status}`);
    }
    console.log("");
  }
}

testSandboxData().catch(console.error);

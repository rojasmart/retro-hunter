require("dotenv").config({ path: ".env.local" });

async function testProductionData() {
  console.log("🧪 TESTANDO DADOS EM PRODUÇÃO eBay\n");

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const isSandbox = process.env.EBAY_SANDBOX === "true";

  console.log(`🌍 Ambiente: ${isSandbox ? "SANDBOX" : "PRODUÇÃO"}`);

  const baseUrl = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
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

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("❌ Erro ao obter token:", error);
    return;
  }

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  // Testar Soul Calibur 2
  console.log(`🔍 Testando: "soul calibur 2"`);

  const apiUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=soul+calibur+2&limit=5&filter=conditionIds:{1000|1500|2000}`;

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
    console.log(`📊 Total de resultados: ${data.total || 0}`);
    console.log(`📦 Itens na resposta: ${data.itemSummaries?.length || 0}\n`);

    if (data.itemSummaries && data.itemSummaries.length > 0) {
      data.itemSummaries.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   💰 ${item.price?.value || "N/A"} ${item.price?.currency || ""}`);
        console.log(`   🏪 Vendedor: ${item.seller?.username || "N/A"}`);
        console.log(`   📍 Local: ${item.itemLocation?.country || "N/A"}`);
        console.log("");
      });
    } else {
      console.log("❌ Nenhum resultado encontrado mesmo em produção");
    }
  } else {
    const error = await response.text();
    console.error(`❌ Erro na API: ${response.status}`, error);
  }
}

testProductionData().catch(console.error);

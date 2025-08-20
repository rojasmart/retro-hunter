// Teste simples sem dependências externas
console.log("🧪 Testando token eBay...\n");

// Carregar .env manualmente
const fs = require("fs");
const path = require("path");

try {
  const envPath = path.join(__dirname, ".env.local");
  const envContent = fs.readFileSync(envPath, "utf8");

  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#][^=]*?)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });

  console.log("✅ .env.local carregado");
} catch (error) {
  console.log("⚠️ Erro ao carregar .env.local:", error.message);
}

async function testToken() {
  const currentToken = process.env.EBAY_ACCESS_TOKEN;
  const isSandbox = process.env.EBAY_SANDBOX === "true";

  console.log(`📋 Token presente: ${currentToken ? "✅" : "❌"}`);
  console.log(`📋 Sandbox mode: ${isSandbox ? "✅" : "❌"}`);

  if (!currentToken) {
    console.log("❌ Nenhum token encontrado");
    return;
  }

  const baseUrl = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

  const testUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=drone&limit=3`;

  console.log("\n🔍 Testando busca...");
  console.log(`📡 URL: ${testUrl}`);

  try {
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Sucesso!");
      console.log(`   - Total: ${data.total || 0}`);
      console.log(`   - Itens: ${data.itemSummaries?.length || 0}`);

      if (data.itemSummaries?.[0]) {
        console.log(`   - Primeiro: ${data.itemSummaries[0].title}`);
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Erro:", errorText);
    }
  } catch (error) {
    console.log("❌ Erro de rede:", error.message);
  }
}

testToken();

#!/usr/bin/env node

// Script para instalar dependências automaticamente
const { execSync } = require("child_process");

console.log("🎮 Configurando RetroSniffer...\n");

const dependencies = ["cheerio", "axios", "@types/cheerio"];

try {
  console.log("📦 Instalando dependências de scraping...");

  const installCommand = `npm install ${dependencies.join(" ")}`;
  console.log(`Executando: ${installCommand}\n`);

  execSync(installCommand, { stdio: "inherit" });

  console.log("\n✅ Configuração concluída com sucesso!");
  console.log("\n🚀 Para iniciar o projeto:");
  console.log("   npm run dev");
  console.log("\n📖 Acesse: http://localhost:3000");
} catch (error) {
  console.error("\n❌ Erro durante a instalação:", error.message);
  console.log("\n🔧 Tente instalar manualmente:");
  console.log(`   npm install ${dependencies.join(" ")}`);
}

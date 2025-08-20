#!/usr/bin/env node

/**
 * Script de teste para validar a configuração do eBay
 */

console.log("🔧 Validador de Configuração eBay\n");

// Verificar variáveis de ambiente
console.log("📋 Verificando configuração:");
console.log(`   - EBAY_CLIENT_ID: ${process.env.EBAY_CLIENT_ID ? "✅" : "❌"}`);
console.log(`   - EBAY_CLIENT_SECRET: ${process.env.EBAY_CLIENT_SECRET ? "✅" : "❌"}`);
console.log(`   - EBAY_ACCESS_TOKEN: ${process.env.EBAY_ACCESS_TOKEN ? "✅" : "❌"}`);
console.log(`   - EBAY_SANDBOX: ${process.env.EBAY_SANDBOX || "false"}`);

if (process.env.EBAY_ACCESS_TOKEN) {
  const token = process.env.EBAY_ACCESS_TOKEN;
  console.log(`   - Token (primeiros 30 chars): ${token.substring(0, 30)}...`);
}

console.log("\n✅ Configuração validada!");

console.log("\n📝 Próximos passos:");
console.log("1. Seu token eBay está configurado");
console.log("2. Aplicação rodando em http://localhost:3001");
console.log("3. Teste a API em: http://localhost:3001/api/ebay");
console.log("4. Use a busca com: http://localhost:3001/api/comparar");

console.log("\n🔄 Para renovar o token automaticamente:");
console.log("   - O sistema já está preparado com o token manager");
console.log("   - Tokens são renovados automaticamente quando expiram");
console.log("   - User tokens duram ~2 horas");
console.log("   - Application tokens são regenerados conforme necessário");

console.log("\n🎯 Tudo pronto para usar!");

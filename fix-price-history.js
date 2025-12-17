// Script para corrigir o priceHistory dos jogos existentes
// Executa: node fix-price-history.js

const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

const GameInCollectionSchema = new mongoose.Schema(
  {
    userId: String,
    gameTitle: String,
    platform: String,
    condition: String,
    purchasePrice: Number,
    newPrice: Number,
    loosePrice: Number,
    gradedPrice: Number,
    completePrice: Number,
    priceHistory: [
      {
        date: Date,
        newPrice: Number,
        loosePrice: Number,
        gradedPrice: Number,
        completePrice: Number,
      },
    ],
    createdAt: Date,
    updatedAt: Date,
  },
  { timestamps: true }
);

const GameInCollection = mongoose.model("GameInCollection", GameInCollectionSchema);

async function fixPriceHistory() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Conectado ao MongoDB");

    const games = await GameInCollection.find({});
    console.log(`\nEncontrados ${games.length} jogos na coleção`);

    let fixedCount = 0;

    for (const game of games) {
      // Se o jogo tem preços mas não tem priceHistory, ou tem priceHistory vazio
      if (game.newPrice || game.loosePrice || game.gradedPrice || game.completePrice) {
        // Se não tem priceHistory ou está vazio
        if (!game.priceHistory || game.priceHistory.length === 0) {
          game.priceHistory = [
            {
              date: game.createdAt, // Usa a data de criação do jogo
              newPrice: game.newPrice,
              loosePrice: game.loosePrice,
              gradedPrice: game.gradedPrice,
              completePrice: game.completePrice,
            },
          ];

          await game.save();
          fixedCount++;
          console.log(`✓ Corrigido: ${game.gameTitle} - Data inicial: ${game.createdAt.toISOString().split("T")[0]}`);
        }
        // Se tem priceHistory mas a primeira entrada não está na data de criação
        else if (game.priceHistory.length > 0) {
          const firstEntry = game.priceHistory[0];
          const firstEntryDate = new Date(firstEntry.date);
          const createdDate = new Date(game.createdAt);

          firstEntryDate.setHours(0, 0, 0, 0);
          createdDate.setHours(0, 0, 0, 0);

          // Se a primeira entrada não é da data de criação
          if (firstEntryDate.getTime() !== createdDate.getTime()) {
            // Atualiza a data da primeira entrada para a data de criação
            game.priceHistory[0].date = game.createdAt;
            await game.save();
            fixedCount++;
            console.log(
              `✓ Ajustada data inicial: ${game.gameTitle} - ${firstEntryDate.toISOString().split("T")[0]} → ${
                createdDate.toISOString().split("T")[0]
              }`
            );
          }
        }
      }
    }

    console.log(`\n✓ Finalizado! ${fixedCount} jogos corrigidos.`);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Desconectado do MongoDB");
  }
}

fixPriceHistory();

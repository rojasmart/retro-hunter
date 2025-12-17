import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../auth/auth-service';
import { connectToDatabase } from '@/lib/mongodb';
import GameInCollection from '@/models/Collection';

// Helper para verificar autenticação
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return AuthService.validateToken(token);
}

// POST - Update prices for a specific game and add to price history
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const { gameId, newPrice, loosePrice, gradedPrice, completePrice } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo é obrigatório' },
        { status: 400 }
      );
    }

    const game = await GameInCollection.findOne({
      _id: gameId,
      userId: decoded.userId,
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }

    // Update current prices
    if (newPrice !== undefined) game.newPrice = newPrice;
    if (loosePrice !== undefined) game.loosePrice = loosePrice;
    if (gradedPrice !== undefined) game.gradedPrice = gradedPrice;
    if (completePrice !== undefined) game.completePrice = completePrice;

    if (!game.priceHistory) {
      game.priceHistory = [];
    }

    // Check if there's already an entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const todayEntryIndex = game.priceHistory.findIndex((entry: any) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    const priceHistoryEntry = {
      date: new Date(),
      newPrice: newPrice !== undefined ? newPrice : game.newPrice,
      loosePrice: loosePrice !== undefined ? loosePrice : game.loosePrice,
      gradedPrice: gradedPrice !== undefined ? gradedPrice : game.gradedPrice,
      completePrice: completePrice !== undefined ? completePrice : game.completePrice,
    };

    if (todayEntryIndex >= 0) {
      // Update existing entry for today
      game.priceHistory[todayEntryIndex] = priceHistoryEntry;
    } else {
      // Add new entry
      game.priceHistory.push(priceHistoryEntry);
    }

    await game.save();

    return NextResponse.json({
      message: 'Preços atualizados com sucesso',
      game,
    });
  } catch (error) {
    console.error('Update prices error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

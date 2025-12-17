import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth/auth-service';
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

// GET - Buscar coleção do usuário
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const isWishlist = searchParams.get('wishlist') === 'true';
    const platform = searchParams.get('platform');

    let query: any = { userId: decoded.userId, isWishlist };
    if (platform && platform !== 'all') {
      query.platform = platform;
    }

    const games = await GameInCollection.find(query)
      .sort({ createdAt: -1 });

    // Calcular estatísticas
    const totalValue = games.reduce((sum, game) => sum + (game.purchasePrice || 0), 0);
    const platforms = [...new Set(games.map(game => game.platform))];

    return NextResponse.json({ 
      games,
      stats: {
        totalGames: games.length,
        totalValue: totalValue,
        platforms: platforms.length
      }
    });

  } catch (error) {
    console.error('Collection GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar jogo à coleção
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const gameData = await request.json();
    console.log('Collection POST incoming gameData:', JSON.stringify(gameData, null, 2));
    
    // Validações básicas
    if (!gameData.gameTitle || !gameData.platform) {
      return NextResponse.json(
        { error: 'Título do jogo e plataforma são obrigatórios' },
        { status: 400 }
      );
    }

    const game = new GameInCollection({
      ...gameData,
      userId: decoded.userId,
      priceHistory: [], // Initialize empty, will add after save
    });

    await game.save();

    // Initialize price history with the game's creation date if prices exist
    if (gameData.newPrice || gameData.loosePrice || gameData.gradedPrice || gameData.completePrice) {
      game.priceHistory = [{
        date: game.createdAt, // Use the actual creation date
        newPrice: gameData.newPrice,
        loosePrice: gameData.loosePrice,
        gradedPrice: gameData.gradedPrice,
        completePrice: gameData.completePrice,
      }];
      await game.save();
    }
    console.log('Collection POST saved game:', JSON.stringify(game.toObject(), null, 2));

    return NextResponse.json({ 
      message: 'Jogo adicionado à coleção',
      game 
    });

  } catch (error) {
    console.error('Collection POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover jogo da coleção
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo é obrigatório' },
        { status: 400 }
      );
    }

    const result = await GameInCollection.findOneAndDelete({
      _id: gameId,
      userId: decoded.userId
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Jogo removido da coleção'
    });

  } catch (error) {
    console.error('Collection DELETE error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar jogo na coleção
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');
    const updateData = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo é obrigatório' },
        { status: 400 }
      );
    }

    const updatedGame = await GameInCollection.findOneAndUpdate(
      { _id: gameId, userId: decoded.userId },
      updateData,
      { new: true }
    );

    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Jogo atualizado com sucesso',
      game: updatedGame
    });

  } catch (error) {
    console.error('Collection PUT error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

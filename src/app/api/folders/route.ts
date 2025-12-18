import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth/auth-service';
import { connectToDatabase } from '@/lib/mongodb';
import Folder from '@/models/Folder';
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

// GET - Buscar todas as pastas do usuário
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const folders = await Folder.find({ userId: decoded.userId })
      .sort({ createdAt: 1 });

    // Contar jogos em cada pasta
    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const count = await GameInCollection.countDocuments({
          userId: decoded.userId,
          folderId: folder._id.toString()
        });
        return {
          ...folder.toObject(),
          gameCount: count
        };
      })
    );

    // Contar jogos sem pasta
    const uncategorizedCount = await GameInCollection.countDocuments({
      userId: decoded.userId,
      $or: [{ folderId: { $exists: false } }, { folderId: null }]
    });

    return NextResponse.json({ 
      folders: foldersWithCount,
      uncategorizedCount
    });

  } catch (error) {
    console.error('Folders GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova pasta
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const folderData = await request.json();
    
    // Validações básicas
    if (!folderData.name || folderData.name.trim() === '') {
      return NextResponse.json(
        { error: 'Nome da pasta é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe pasta com esse nome
    const existingFolder = await Folder.findOne({
      userId: decoded.userId,
      name: folderData.name.trim()
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Já existe uma pasta com este nome' },
        { status: 409 }
      );
    }

    const folder = new Folder({
      userId: decoded.userId,
      name: folderData.name.trim(),
      description: folderData.description,
      color: folderData.color || '#22d3ee',
      icon: folderData.icon || 'folder'
    });

    await folder.save();

    return NextResponse.json({ 
      message: 'Pasta criada com sucesso',
      folder 
    });

  } catch (error) {
    console.error('Folders POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar pasta
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');
    const updateData = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: 'ID da pasta é obrigatório' },
        { status: 400 }
      );
    }

    // Se está alterando o nome, verificar duplicação
    if (updateData.name) {
      const existingFolder = await Folder.findOne({
        userId: decoded.userId,
        name: updateData.name.trim(),
        _id: { $ne: folderId }
      });

      if (existingFolder) {
        return NextResponse.json(
          { error: 'Já existe uma pasta com este nome' },
          { status: 409 }
        );
      }
    }

    const updatedFolder = await Folder.findOneAndUpdate(
      { _id: folderId, userId: decoded.userId },
      updateData,
      { new: true }
    );

    if (!updatedFolder) {
      return NextResponse.json(
        { error: 'Pasta não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Pasta atualizada com sucesso',
      folder: updatedFolder
    });

  } catch (error) {
    console.error('Folders PUT error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover pasta
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json(
        { error: 'ID da pasta é obrigatório' },
        { status: 400 }
      );
    }

    // Remover a pasta
    const result = await Folder.findOneAndDelete({
      _id: folderId,
      userId: decoded.userId
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Pasta não encontrada' },
        { status: 404 }
      );
    }

    // Remover folderId dos jogos que estavam nessa pasta
    await GameInCollection.updateMany(
      { userId: decoded.userId, folderId: folderId },
      { $unset: { folderId: "" } }
    );

    return NextResponse.json({ 
      message: 'Pasta removida com sucesso'
    });

  } catch (error) {
    console.error('Folders DELETE error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

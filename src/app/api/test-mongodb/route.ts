import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    console.log('Testando conexão com MongoDB...');
    
    // Testar conexão
    await connectToDatabase();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Testar contagem de usuários
    const userCount = await User.countDocuments();
    console.log(`📊 Total de usuários no banco: ${userCount}`);

    return NextResponse.json({
      success: true,
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      userCount: userCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na conexão com MongoDB:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error : 'Erro interno'
    }, { status: 500 });
  }
}

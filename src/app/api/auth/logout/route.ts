import { NextRequest, NextResponse } from 'next/server';
import { ApiAuthResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Com JWT, o logout é feito no client-side removendo o token
    // Aqui podemos fazer log ou invalidar tokens em uma blacklist se necessário
    
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    } as ApiAuthResponse);

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' } as ApiAuthResponse,
      { status: 500 }
    );
  }
}

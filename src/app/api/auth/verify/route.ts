import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth-service';
import { ApiAuthResponse } from '@/lib/types/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token não fornecido' } as ApiAuthResponse,
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Validar token JWT
    const decoded = await AuthService.validateToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token inválido ou expirado' } as ApiAuthResponse,
        { status: 401 }
      );
    }

    // Buscar usuário no banco
    const user = await AuthService.findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' } as ApiAuthResponse,
        { status: 404 }
      );
    }

    // Retornar usuário sem dados sensíveis
    const publicUser = AuthService.userToPublic(user);

    return NextResponse.json({
      success: true,
      user: publicUser,
      message: 'Token válido',
    } as ApiAuthResponse);

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' } as ApiAuthResponse,
      { status: 500 }
    );
  }
}

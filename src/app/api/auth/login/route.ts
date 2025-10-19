import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth-service';
import { ApiAuthResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email e senha são obrigatórios' } as ApiAuthResponse,
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await AuthService.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' } as ApiAuthResponse,
        { status: 401 }
      );
    }

    // Validar senha
    const isValidPassword = await AuthService.validatePassword(user, password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' } as ApiAuthResponse,
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = AuthService.generateToken(user._id.toString(), user.username);

    // Retornar usuário sem dados sensíveis
    const publicUser = AuthService.userToPublic(user);

    return NextResponse.json({
      success: true,
      user: publicUser,
      token,
      message: 'Login realizado com sucesso',
    } as ApiAuthResponse);

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' } as ApiAuthResponse,
      { status: 500 }
    );
  }
}

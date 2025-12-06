import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth-service';
import { ApiAuthResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' } as ApiAuthResponse,
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await AuthService.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' } as ApiAuthResponse,
        { status: 401 }
      );
    }

    // Validar senha
    const isValidPassword = await AuthService.validatePassword(user, password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' } as ApiAuthResponse,
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
      message: 'Login successful',
    } as ApiAuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiAuthResponse,
      { status: 500 }
    );
  }
}

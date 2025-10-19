import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth-service';
import { ApiAuthResponse } from '@/lib/types/auth';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nome, email e senha são obrigatórios' } as ApiAuthResponse,
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Email inválido' } as ApiAuthResponse,
        { status: 400 }
      );
    }

    // Validar senha
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'A senha deve ter pelo menos 6 caracteres' } as ApiAuthResponse,
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await AuthService.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário já existe com este email' } as ApiAuthResponse,
        { status: 409 }
      );
    }

    // Criar usuário (hash da senha é feito internamente)
    const user = await AuthService.createUser({
      username: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
    });

    // Gerar token JWT
    const token = AuthService.generateToken(user._id.toString(), user.username);

    // Retornar usuário sem dados sensíveis
    const publicUser = AuthService.userToPublic(user);

    return NextResponse.json({
      success: true,
      user: publicUser,
      token,
      message: 'Conta criada com sucesso',
    } as ApiAuthResponse);

  } catch (error: any) {
    console.error('Erro no registro:', error);
    
    // Erro de duplicação no MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' ? 'Este email já está em uso' : 'Este username já está em uso';
      return NextResponse.json(
        { success: false, message } as ApiAuthResponse,
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' } as ApiAuthResponse,
      { status: 500 }
    );
  }
}

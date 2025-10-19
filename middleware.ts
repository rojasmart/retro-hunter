import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Rotas que requerem autenticação
  const protectedPaths = ['/my-account', '/my-collection'];
  const { pathname } = request.nextUrl;

  // Verificar se a rota atual precisa de autenticação
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    // Verificar se há token no localStorage seria ideal, mas middleware roda no servidor
    // Então vamos fazer uma verificação simples e deixar o client-side decidir
    
    // Por enquanto, apenas log - a proteção real será feita no client-side
    console.log(`Accessing protected route: ${pathname}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

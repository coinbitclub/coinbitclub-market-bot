import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware:', pathname);
  
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/login-simple',
    '/api/auth/login',
    '/_next',
    '/favicon.ico',
    '/public'
  ];

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  if (isPublicRoute) {
    console.log('✅ Rota pública:', pathname);
    return NextResponse.next();
  }
  
  // Verificar autenticação
  const token = request.cookies.get('auth_token')?.value;
  const userDataCookie = request.cookies.get('user_data')?.value;
  
  console.log('🔐 Token:', !!token);
  console.log('👤 UserData:', !!userDataCookie);
  
  if (!token || !userDataCookie) {
    console.log('❌ Não autenticado, redirecionando para login');
    return NextResponse.redirect(new URL('/login-simple', request.url));
  }
  
  try {
    const userData = JSON.parse(decodeURIComponent(userDataCookie));
    const userRole = userData.role?.toLowerCase();
    
    console.log('🎭 Role:', userRole);
    console.log('📍 Acessando:', pathname);
    
    // Verificar acesso por role
    if (userRole === 'admin') {
      // Admin tem acesso total
      console.log('👑 Admin - acesso autorizado');
      return NextResponse.next();
    } else if (pathname.startsWith('/admin')) {
      // Não-admin tentando acessar área admin
      console.log('🚫 Acesso negado - redirecionando para user dashboard');
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    } else {
      // Usuário comum acessando área permitida
      console.log('👤 Usuário - acesso autorizado');
      return NextResponse.next();
    }
    
  } catch (error) {
    console.error('❌ Erro middleware:', error);
    return NextResponse.redirect(new URL('/login-simple', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware executando para:', pathname);
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/_next',
    '/favicon.ico',
    '/debug-middleware.html',
    '/debug-login.html',
    '/teste-dashboards.html',
    '/teste-redirect.html',
    '/clear-auth.html'
  ];

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('/**')) {
      const basePath = route.slice(0, -3);
      return pathname.startsWith(basePath);
    }
    return pathname === route || pathname.startsWith(route);
  });
  
  if (isPublicRoute) {
    console.log('✅ Rota pública permitida:', pathname);
    return NextResponse.next();
  }
  
  // Verificar autenticação
  const token = request.cookies.get('auth_token')?.value;
  const userDataCookie = request.cookies.get('user_data')?.value;
  
  console.log('🔐 Token presente:', !!token);
  console.log('👤 User data presente:', !!userDataCookie);
  
  if (!token || !userDataCookie) {
    console.log('❌ Não autenticado, redirecionando para login');
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verificar autorização por perfil
  try {
    const userData = JSON.parse(decodeURIComponent(userDataCookie));
    const userRole = userData.role.toLowerCase();
    
    console.log('🎭 Role do usuário:', userRole);
    console.log('📍 Tentando acessar:', pathname);
    
    // Verificar acesso baseado no role e rota
    let hasAccess = false;
    
    // ADMIN - acesso total
    if (userRole === 'admin') {
      hasAccess = true;
      console.log('👑 Admin tem acesso total');
      
      // Se admin está tentando acessar /auth/login e já está logado, redirecionar para dashboard
      if (pathname === '/auth/login') {
        console.log('🔄 Admin já logado tentando acessar login, redirecionando para dashboard');
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
    // GESTOR - acesso a gestor, operador, affiliate e user
    else if (userRole === 'gestor') {
      hasAccess = pathname.startsWith('/gestor') || 
                 pathname.startsWith('/operador') || 
                 pathname.startsWith('/affiliate') || 
                 pathname.startsWith('/user') ||
                 pathname === '/admin/operations' ||
                 pathname === '/admin/affiliates';
      console.log('🏢 Gestor - acesso:', hasAccess);
      
      // Se gestor está tentando acessar /auth/login e já está logado, redirecionar para dashboard
      if (pathname === '/auth/login') {
        console.log('🔄 Gestor já logado tentando acessar login, redirecionando para dashboard');
        return NextResponse.redirect(new URL('/gestor/dashboard', request.url));
      }
    }
    // OPERADOR - acesso a operador e user
    else if (userRole === 'operador') {
      hasAccess = pathname.startsWith('/operador') || pathname.startsWith('/user');
      console.log('⚙️ Operador - acesso:', hasAccess);
      
      // Se operador está tentando acessar /auth/login e já está logado, redirecionar para dashboard
      if (pathname === '/auth/login') {
        console.log('🔄 Operador já logado tentando acessar login, redirecionando para dashboard');
        return NextResponse.redirect(new URL('/operador/dashboard', request.url));
      }
    }
    // AFILIADO - acesso a affiliate e user
    else if (userRole === 'afiliado' || userRole === 'affiliate') {
      hasAccess = pathname.startsWith('/affiliate') || pathname.startsWith('/user');
      console.log('💰 Afiliado - acesso:', hasAccess);
      
      // Se afiliado está tentando acessar /auth/login e já está logado, redirecionar para dashboard
      if (pathname === '/auth/login') {
        console.log('🔄 Afiliado já logado tentando acessar login, redirecionando para dashboard');
        return NextResponse.redirect(new URL('/affiliate/dashboard', request.url));
      }
    }
    // USUARIO - acesso apenas a user
    else if (userRole === 'usuario' || userRole === 'user') {
      hasAccess = pathname.startsWith('/user');
      console.log('👤 Usuário - acesso:', hasAccess);
      
      // Se usuário está tentando acessar /auth/login e já está logado, redirecionar para dashboard
      if (pathname === '/auth/login') {
        console.log('🔄 Usuário já logado tentando acessar login, redirecionando para dashboard');
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    }
    
    if (hasAccess) {
      console.log('✅ Acesso autorizado para:', pathname);
      return NextResponse.next();
    }
    
    // Se não tem acesso, redirecionar para o dashboard apropriado
    const getDashboardRoute = (role: string): string => {
      switch (role) {
        case 'admin':
          return '/admin/dashboard';
        case 'gestor':
          return '/gestor/dashboard';
        case 'operador':
          return '/operador/dashboard';
        case 'afiliado':
        case 'affiliate':
          return '/affiliate/dashboard';
        case 'usuario':
        case 'user':
        default:
          return '/user/dashboard';
      }
    };
    
    const dashboardRoute = getDashboardRoute(userRole);
    console.log('🚫 Acesso negado, redirecionando para:', dashboardRoute);
    
    return NextResponse.redirect(new URL(dashboardRoute, request.url));
    
  } catch (error) {
    console.error('❌ Erro no middleware:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

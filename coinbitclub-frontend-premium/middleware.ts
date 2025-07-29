import { NextRequest, NextResponse } from 'next/server';

// Configuração de rotas por perfil
const PROTECTED_ROUTES = {
  ADMIN: ['/admin/**'],
  GESTOR: ['/gestor/**', '/admin/operations', '/admin/affiliates'],
  OPERADOR: ['/operador/**'],
  AFILIADO: ['/affiliate/**'],
  USUARIO: ['/user/**']
};

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/',
  '/auth/**',
  '/api/auth/**',
  '/privacy',
  '/terms',
  '/about',
  '/contact',
  '/cadastro',
  '/planos',
  '/politicas'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se é rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/**')) {
      const basePath = route.slice(0, -3);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Verificar autenticação
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verificar autorização por perfil
  try {
    // Decodificar token (simplificado - em produção usar JWT verify)
    const userDataCookie = request.cookies.get('user_data')?.value;
    
    if (!userDataCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    const userData = JSON.parse(decodeURIComponent(userDataCookie));
    const userRole = userData.role;
    
    // Verificar se usuário tem acesso à rota
    const allowedRoutes = PROTECTED_ROUTES[userRole as keyof typeof PROTECTED_ROUTES] || [];
    
    const hasAccess = allowedRoutes.some(route => {
      if (route.endsWith('/**')) {
        const basePath = route.slice(0, -3);
        return pathname.startsWith(basePath);
      }
      return pathname === route;
    });
    
    if (!hasAccess) {
      // Redirecionar para dashboard do usuário
      const dashboardRoutes = {
        ADMIN: '/admin/dashboard',
        GESTOR: '/gestor/dashboard',
        OPERADOR: '/operador/dashboard',
        AFILIADO: '/affiliate/dashboard',
        USUARIO: '/user/dashboard'
      };
      
      const userDashboard = dashboardRoutes[userRole as keyof typeof dashboardRoutes] || '/user/dashboard';
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
    
    return NextResponse.next();
    
  } catch (error) {
    console.error('Erro no middleware de autorização:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo|images|assets).*)',
  ],
};

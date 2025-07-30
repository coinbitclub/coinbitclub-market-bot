import { NextRequest, NextResponse } from 'next/server';

// Configuração de rotas por perfil
const PROTECTED_ROUTES = {
  ADMIN: ['/admin/**'],
  admin: ['/admin/**'],
  GESTOR: ['/gestor/**', '/admin/operations', '/admin/affiliates'],
  gestor: ['/gestor/**', '/admin/operations', '/admin/affiliates'],
  OPERADOR: ['/operador/**'],
  operador: ['/operador/**'],
  AFILIADO: ['/affiliate/**'],
  afiliado: ['/affiliate/**'],
  affiliate: ['/affiliate/**'],
  USUARIO: ['/user/**'],
  usuario: ['/user/**'],
  user: ['/user/**']
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
    const normalizedRole = userRole.toLowerCase();
    
    // Definir rotas permitidas por role (normalizado)
    const getAllowedRoutes = (role: string): string[] => {
      switch (role) {
        case 'admin':
          return ['/admin/**', '/gestor/**', '/operador/**', '/affiliate/**', '/user/**'];
        case 'gestor':
          return ['/gestor/**', '/operador/**', '/affiliate/**', '/user/**', '/admin/operations', '/admin/affiliates'];
        case 'operador':
          return ['/operador/**', '/user/**'];
        case 'afiliado':
        case 'affiliate':
          return ['/affiliate/**', '/user/**'];
        case 'usuario':
        case 'user':
          return ['/user/**'];
        default:
          return ['/user/**'];
      }
    };
    
    const allowedRoutes = getAllowedRoutes(normalizedRole);
    
    const hasAccess = allowedRoutes.some(route => {
      if (route.endsWith('/**')) {
        const basePath = route.slice(0, -3);
        return pathname.startsWith(basePath);
      }
      return pathname === route;
    });
    
    if (!hasAccess) {
      // Redirecionar para dashboard do usuário
      const getDashboardRoute = (role: string): string => {
        const normalizedRole = role.toLowerCase();
        switch (normalizedRole) {
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
            return '/user/dashboard';
          default:
            return '/user/dashboard';
        }
      };
      
      const userDashboard = getDashboardRoute(userRole);
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

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { User } from '../lib/auth';

interface WithAuthOptions {
  requireTrial?: boolean;
  allowedRoles?: ('admin' | 'user' | 'premium')[];
}

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P & { user: User }>,
  options: WithAuthOptions = {}
) => {
  const WithAuthComponent = (props: P) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            router.push('/auth/login');
            return;
          }

          // Simular verificação de autenticação
          // Em produção, fazer chamada para API para verificar token
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            
            // Verificar se o usuário tem permissão para acessar
            if (options.allowedRoles && !options.allowedRoles.includes(parsedUser.role)) {
              router.push('/unauthorized');
              return;
            }
            
            setUser(parsedUser);
          } else {
            // Dados padrão para demo
            setUser({
              id: '1',
              email: 'admin@coinbitclub.com',
              name: 'Admin User',
              role: 'admin'
            });
          }
        } catch (error) {
          console.error('Erro na autenticação:', error);
          router.push('/auth/login');
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="size-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithAuthComponent;
};

export default withAuth;

import React from 'react';
import { useAuth } from '../../store/authStore';
import AdminLayout from './AdminLayout';
import GestorLayout from './GestorLayout';
import OperadorLayout from './OperadorLayout';
import AffiliateLayout from './AffiliateLayout';
import UserLayout from './UserLayout';

interface UniversalLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const UniversalLayout: React.FC<UniversalLayoutProps> = ({ children, title }) => {
  const { user, isAuthenticated } = useAuth();

  // Se não autenticado, renderizar sem layout
  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  // Escolher layout baseado no role do usuário
  switch (user.role) {
    case 'ADMIN':
      return <AdminLayout title={title}>{children}</AdminLayout>;
    
    case 'GESTOR':
      return <GestorLayout title={title}>{children}</GestorLayout>;
    
    case 'OPERADOR':
      return <OperadorLayout title={title}>{children}</OperadorLayout>;
    
    case 'AFILIADO':
      return <AffiliateLayout title={title}>{children}</AffiliateLayout>;
    
    case 'USUARIO':
    default:
      return <UserLayout title={title}>{children}</UserLayout>;
  }
};

export default UniversalLayout;



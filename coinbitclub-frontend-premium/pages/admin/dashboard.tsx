import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../src/components/Layout/DashboardLayout';
import AdminDashboardUltraSimple from '../../src/components/Dashboard/AdminDashboard-ultra-simple';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'user' | 'affiliate';
}

const AdminDashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        
        // Verificar se é admin
        if (parsedUser.user_type !== 'admin' && parsedUser.type !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUser(parsedUser);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <AdminDashboardUltraSimple user={user} />
    </DashboardLayout>
  );
};

export default AdminDashboardPage;

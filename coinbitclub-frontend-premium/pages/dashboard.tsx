import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../src/components/Layout/DashboardLayout';
import AdminDashboard from '../src/components/Dashboard/AdminDashboard';
import UserDashboard from '../src/components/Dashboard/UserDashboard';
import AffiliateDashboard from '../src/components/Dashboard/AffiliateDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'user' | 'affiliate';
}

const Dashboard = () => {
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

  const renderDashboard = () => {
    switch (user.user_type) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'affiliate':
        return <AffiliateDashboard user={user} />;
      case 'user':
      default:
        return <UserDashboard user={user} />;
    }
  };

  return (
    <DashboardLayout user={user}>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;

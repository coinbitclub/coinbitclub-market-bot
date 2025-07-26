import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const MockLogin = () => {
  const router = useRouter();

  useEffect(() => {
    // Simular login automático para avaliação
    const mockUser = {
      id: 'admin-mock-id',
      name: 'Admin Demo',
      email: 'admin@coinbitclub.com',
      user_type: 'admin'
    };

    localStorage.setItem('auth_token', 'mock-token-for-demo');
    localStorage.setItem('user_data', JSON.stringify(mockUser));

    // Redirect para dashboard
    router.push('/admin/dashboard-new');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B0F1E 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#FFFFFF'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#E6C200', marginBottom: '20px' }}>
          🚀 Demo Login
        </h1>
        <p>Redirecionando para o dashboard admin...</p>
        <div style={{
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTop: '4px solid #E6C200',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MockLogin;

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar se há usuário logado
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.replace('/auth/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);

      // Direcionar conforme o role do usuário
      switch (userData.role) {
        case 'admin':
          router.replace('/admin/dashboard');
          break;
        case 'affiliate':
          router.replace('/user/dashboard?type=affiliate');
          break;
        case 'user':
        default:
          router.replace('/user/dashboard');
          break;
      }
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      router.replace('/auth/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub</title>
      </Head>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ⚡ CoinBitClub
          </div>
          
          <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>
            Redirecionando para seu dashboard...
          </h2>
          
          <p style={{ color: '#B0B3B8', marginBottom: '2rem' }}>
            {user?.role === 'admin' && 'Carregando painel administrativo...'}
            {user?.role === 'affiliate' && 'Carregando dashboard de afiliado...'}
            {user?.role === 'user' && 'Carregando dashboard de usuário...'}
            {!user && 'Verificando permissões...'}
          </p>

          <div style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
              borderRadius: '2px',
              animation: 'loading 2s infinite'
            }} />
          </div>
        </div>
        
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(600%); }
          }
        `}</style>
      </div>
    </>
  );
};

export default Dashboard;

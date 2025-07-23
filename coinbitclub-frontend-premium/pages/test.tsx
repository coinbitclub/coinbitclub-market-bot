import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

// Componente para renderizar data/hora apenas no cliente
const ClientDateTime = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>Data: --/--/---- | Hora: --:--:--</>;
  }

  if (!mounted) {
    return <>Carregando...</>;
  }

  return (
    <>
      Data: {new Date().toLocaleDateString('pt-BR')} | 
      Hora: {new Date().toLocaleTimeString('pt-BR')}
    </>
  );
};

const TestPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Teste - CoinBitClub</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
        color: '#FAFBFD',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #05A74E, #6EA297)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🚀 Página de Teste
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#AFB4B1',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          Se você está vendo esta página, significa que o sistema está funcionando corretamente!
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          width: '100%',
          maxWidth: '800px',
          padding: '0 2rem'
        }}>
          {[
            { title: 'Dashboard', href: '/dashboard-simple' },
            { title: 'Credenciais', href: '/user/credentials' },
            { title: 'Financeiro', href: '/financial/dashboard' },
            { title: 'Monitoramento', href: '/system/monitoring' },
            { title: 'Configuração Bot', href: '/bot-config' },
            { title: 'Relatórios', href: '/reports' }
          ].map((link, index) => (
            <a
              key={index}
              href={link.href}
              style={{
                padding: '1.5rem',
                background: 'rgba(5, 167, 78, 0.1)',
                border: '1px solid rgba(5, 167, 78, 0.3)',
                borderRadius: '16px',
                textDecoration: 'none',
                color: '#FAFBFD',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(5, 167, 78, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(5, 167, 78, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0'
              }}>
                {link.title}
              </h3>
            </a>
          ))}
        </div>
        
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(5, 167, 78, 0.05)',
          border: '1px solid rgba(5, 167, 78, 0.2)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#AFB4B1',
            margin: '0'
          }}>
            <ClientDateTime />
          </p>
        </div>
      </div>
    </>
  );
};

export default TestPage;

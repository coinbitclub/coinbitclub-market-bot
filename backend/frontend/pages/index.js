import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus('connected'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <>
      <Head>
        <title>CoinbitClub MarketBot</title>
      </Head>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom right, #1e3a8a, #7c3aed)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            CoinbitClub MarketBot
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            Sistema de Trading Automatizado
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            padding: '0.5rem 1rem',
            borderRadius: '25px',
            backgroundColor: status === 'connected' ? '#10B981' : 
                           status === 'error' ? '#EF4444' : '#F59E0B',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.8)',
              marginRight: '8px'
            }}></div>
            Sistema: {status === 'connected' ? 'Online' : 
                     status === 'error' ? 'Offline' : 'Verificando...'}
          </div>
          <div>
            <a href="/login" style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              marginRight: '1rem',
              display: 'inline-block'
            }}>
              Fazer Login
            </a>
            <a href="/register" style={{
              backgroundColor: '#10B981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Criar Conta
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

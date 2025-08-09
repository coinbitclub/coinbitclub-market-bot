import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';

const LandingPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>CoinBitClub - Teste</title>
      </Head>
      <div style={{ 
        minHeight: '100vh', 
        background: '#000', 
        color: '#fff', 
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀 CoinBitClub</h1>
        <p style={{ fontSize: '1.5rem', textAlign: 'center' }}>
          Plataforma de Trading Automatizado
        </p>
        <div style={{ marginTop: '2rem' }}>
          <a 
            href="/login" 
            style={{
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              color: '#000',
              padding: '1rem 2rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}
          >
            🔑 Entrar
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

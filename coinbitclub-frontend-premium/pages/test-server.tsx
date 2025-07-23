import { NextPage } from 'next';
import Head from 'next/head';

const TestPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Teste - CoinBitClub</title>
      </Head>
      <div style={{ 
        background: '#000', 
        color: '#fff', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h1 style={{ color: '#FFD700', fontSize: '3rem', marginBottom: '2rem' }}>
          🚀 CoinBitClub
        </h1>
        <p style={{ color: '#00BFFF', fontSize: '1.5rem' }}>
          Página carregada com sucesso!
        </p>
      </div>
    </>
  );
};

export default TestPage;

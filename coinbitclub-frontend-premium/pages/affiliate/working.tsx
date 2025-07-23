import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const AffiliatePage: NextPage = () => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <Head>
        <title>Programa de Afiliados - CoinBitClub MarketBot</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
        color: '#FAFBFD',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Header */}
        <header style={{
          background: 'rgba(5, 167, 78, 0.05)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(5, 167, 78, 0.1)',
          padding: isMobile ? '1rem' : '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ⚡ CoinBitClub Afiliados
          </div>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => setShowLoginForm(true)}
              style={{
                background: 'rgba(75, 77, 82, 0.3)',
                color: '#FAFBFD',
                padding: isMobile ? '8px 16px' : '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(175, 180, 177, 0.2)',
                fontWeight: '600',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button 
              onClick={() => setShowRegisterForm(true)}
              style={{
                background: 'linear-gradient(135deg, #05A74E, #6EA297)',
                color: '#FAFBFD',
                padding: isMobile ? '8px 16px' : '12px 24px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '600',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cadastre-se
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          padding: isMobile ? '4rem 1rem 2rem' : '6rem 2rem 4rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '4rem',
            fontWeight: '900',
            lineHeight: '1.1',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, #FAFBFD 0%, #6EA297 50%, #05A74E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Programa de Afiliados<br />
            MarketBot
          </h1>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            color: '#AFB4B1',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Ganhe até <strong style={{color: '#05A74E'}}>50% de comissão</strong> divulgando o melhor bot de trading com IA do mercado
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            <button 
              onClick={() => setShowRegisterForm(true)}
              style={{
                background: 'linear-gradient(135deg, #05A74E, #6EA297)',
                color: '#FAFBFD',
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
                borderRadius: '16px',
                border: 'none',
                fontWeight: '700',
                fontSize: isMobile ? '1rem' : '1.125rem',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(5, 167, 78, 0.3)'
              }}
            >
              🚀 Quero Ser Afiliado
            </button>
          </div>
        </section>

        {/* Benefits Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1000px',
          margin: '4rem auto',
          padding: '0 1rem'
        }}>
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💰</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Até 50% Comissão
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
              Receba até 50% de comissão vitalícia sobre todos os pagamentos dos seus indicados
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📈</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Produto de Alta Conversão
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
              MarketBot com 92.8% de accuracy converte muito bem e gera renda recorrente
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎯</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Material de Apoio
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
              Receba banners, vídeos, textos e todo material necessário para divulgar
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(175, 180, 177, 0.1)',
          padding: '3rem 1rem',
          textAlign: 'center',
          color: '#AFB4B1'
        }}>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            ⚡ CoinBitClub
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
            fontSize: '0.875rem'
          }}>
            <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Termos de Uso</a>
            <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Política de Privacidade</a>
            <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Suporte</a>
          </div>
          <p style={{marginTop: '1rem', fontSize: '0.875rem'}}>
            © 2025 CoinBitClub. Programa de Afiliados MarketBot. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default AffiliatePage;

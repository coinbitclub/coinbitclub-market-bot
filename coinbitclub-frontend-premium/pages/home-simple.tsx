import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const SimpleModernHomePage: NextPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Estilos inline para evitar problemas de hidratação
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif"
  };

  const headerStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(5, 167, 78, 0.1)',
    padding: isMobile ? '1rem' : '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  };

  const logoStyle = {
    fontSize: isMobile ? '1.25rem' : '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const heroStyle = {
    textAlign: 'center' as const,
    padding: isMobile ? '4rem 1rem 2rem' : '6rem 2rem 4rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const heroTitleStyle = {
    fontSize: isMobile ? '2.5rem' : '4.5rem',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #FAFBFD 0%, #6EA297 50%, #05A74E 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  return (
    <>
      <Head>
        <title>CoinBitClub | Trading Automático com IA 24/7</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div style={logoStyle}>⚡ CoinBitClub</div>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            alignItems: 'center'
          }}>
            <a 
              href="/auth"
              style={{
                background: 'rgba(75, 77, 82, 0.3)',
                color: '#FAFBFD',
                padding: isMobile ? '8px 16px' : '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(175, 180, 177, 0.2)',
                fontWeight: '600',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Login
            </a>
            <a 
              href="/auth"
              style={{
                background: 'linear-gradient(135deg, #05A74E, #6EA297)',
                color: '#FAFBFD',
                padding: isMobile ? '8px 16px' : '12px 24px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '600',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Cadastre-se
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section style={heroStyle}>
          <h1 style={heroTitleStyle}>
            Trading Automático<br />
            com IA 24/7
          </h1>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            color: '#AFB4B1',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Deixe a Inteligência Artificial operar por você. Sinais precisos, 
            gestão de risco inteligente e lucros em tempo real.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            marginBottom: '2rem'
          }}>
            <a 
              href="/auth"
              style={{
                background: 'linear-gradient(135deg, #05A74E, #6EA297)',
                color: '#FAFBFD',
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
                borderRadius: '16px',
                border: 'none',
                fontWeight: '700',
                fontSize: isMobile ? '1rem' : '1.125rem',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(5, 167, 78, 0.3)',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              🚀 Começar Agora
            </a>
            
            <a 
              href="/dashboard-simple"
              style={{
                background: 'rgba(75, 77, 82, 0.3)',
                color: '#FAFBFD',
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
                borderRadius: '16px',
                border: '1px solid rgba(175, 180, 177, 0.2)',
                fontWeight: '600',
                fontSize: isMobile ? '1rem' : '1.125rem',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              📊 Ver Dashboard Demo
            </a>
          </div>
        </section>

        {/* Stats Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          maxWidth: '1000px',
          margin: '4rem auto',
          padding: '0 2rem'
        }}>
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎯</div>
            <div style={{fontSize: '2.5rem', fontWeight: '800', color: '#05A74E', marginBottom: '0.5rem'}}>
              92.8%
            </div>
            <div style={{color: '#AFB4B1'}}>Accuracy Média</div>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🕒</div>
            <div style={{fontSize: '2.5rem', fontWeight: '800', color: '#05A74E', marginBottom: '0.5rem'}}>
              24/7
            </div>
            <div style={{color: '#AFB4B1'}}>Operando Sempre</div>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📈</div>
            <div style={{fontSize: '2.5rem', fontWeight: '800', color: '#05A74E', marginBottom: '0.5rem'}}>
              +187%
            </div>
            <div style={{color: '#AFB4B1'}}>Retorno Anual</div>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>👥</div>
            <div style={{fontSize: '2.5rem', fontWeight: '800', color: '#05A74E', marginBottom: '0.5rem'}}>
              15,847
            </div>
            <div style={{color: '#AFB4B1'}}>Usuários Ativos</div>
          </div>
        </section>

        {/* Features */}
        <section style={{
          padding: '6rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center' as const
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '3rem',
            color: '#FAFBFD'
          }}>
            Por que escolher o MarketBot?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              background: 'rgba(15, 45, 37, 0.2)',
              border: '1px solid rgba(110, 162, 151, 0.2)',
              borderRadius: '20px',
              padding: '2.5rem'
            }}>
              <div style={{fontSize: '3rem', marginBottom: '1.5rem'}}>🔐</div>
              <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
                Saldo Sempre Seguro
              </h3>
              <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                Suas credenciais ficam seguras em sua conta. O bot opera sem nunca ter acesso aos seus fundos.
              </p>
            </div>

            <div style={{
              background: 'rgba(15, 45, 37, 0.2)',
              border: '1px solid rgba(110, 162, 151, 0.2)',
              borderRadius: '20px',
              padding: '2.5rem'
            }}>
              <div style={{fontSize: '3rem', marginBottom: '1.5rem'}}>🤖</div>
              <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
                IA Operando 24/7
              </h3>
              <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                Inteligência artificial treinada analisa mercados e executa trades enquanto você dorme.
              </p>
            </div>

            <div style={{
              background: 'rgba(15, 45, 37, 0.2)',
              border: '1px solid rgba(110, 162, 151, 0.2)',
              borderRadius: '20px',
              padding: '2.5rem'
            }}>
              <div style={{fontSize: '3rem', marginBottom: '1.5rem'}}>📊</div>
              <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
                Lucros em Tempo Real
              </h3>
              <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                Acompanhe seus resultados em tempo real com dashboards detalhados e relatórios completos.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section style={{
          padding: '6rem 2rem',
          textAlign: 'center' as const,
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            color: '#FAFBFD'
          }}>
            Comece a Lucrar Hoje
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#AFB4B1',
            marginBottom: '3rem'
          }}>
            Junte-se a milhares de traders que já descobriram o poder da IA
          </p>
          
          <button style={{
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            color: '#FAFBFD',
            padding: '1.5rem 4rem',
            borderRadius: '16px',
            border: 'none',
            fontWeight: '700',
            fontSize: '1.25rem',
            cursor: 'pointer',
            boxShadow: '0 15px 40px rgba(5, 167, 78, 0.4)'
          }}>
            🎯 Teste Grátis por 7 Dias
          </button>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(175, 180, 177, 0.1)',
          padding: '3rem 2rem',
          textAlign: 'center' as const,
          color: '#AFB4B1'
        }}>
          <div style={logoStyle}>⚡ CoinBitClub</div>
          <p style={{marginTop: '1rem', fontSize: '0.875rem'}}>
            © 2025 CoinBitClub. Trading automático com IA. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default SimpleModernHomePage;

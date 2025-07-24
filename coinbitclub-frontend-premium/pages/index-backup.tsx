import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estilos inline para performance e simplicidade
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #333333',
    backdropFilter: 'blur(10px)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
    background: 'rgba(10, 10, 10, 0.8)',
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: '#FFD700',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const authLinksStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  };

  const getButtonStyle = (isPrimary: boolean) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    border: isPrimary ? 'none' : '2px solid #00BFFF',
    background: isPrimary 
      ? 'linear-gradient(45deg, #00BFFF, #FF69B4)' 
      : 'transparent',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center' as const,
  });

  const heroStyle = {
    textAlign: 'center' as const,
    padding: '6rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const titleStyle = {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 3s ease infinite',
  };

  const subtitleStyle = {
    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
    marginBottom: '3rem',
    color: '#B0B3B8',
    lineHeight: '1.6',
    maxWidth: '800px',
    margin: '0 auto 3rem auto',
  };

  const ctaContainerStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '4rem',
  };

  const featuresStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const featureCardStyle = (accentColor: string) => ({
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: `0 20px 40px rgba(${accentColor === '#FFD700' ? '255, 215, 0' : accentColor === '#00BFFF' ? '0, 191, 255' : '255, 105, 180'}, 0.3)`,
    }
  });

  const trialStyle = {
    textAlign: 'center' as const,
    padding: '6rem 2rem',
    background: 'rgba(255, 255, 255, 0.02)',
    margin: '4rem 0',
    borderTop: '1px solid #333333',
    borderBottom: '1px solid #333333',
  };

  return (
    <>
      <Head>
        <title>CoinBitClub - Plataforma de Trading Inteligente</title>
        <meta name="description" content="Maximize seus lucros com trading automatizado de criptomoedas. IA avançada, análise em tempo real e gestão de risco profissional." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <Link href="/" style={logoStyle}>⚡ CoinBitClub</Link>
          <div style={authLinksStyle}>
            <Link href="/auth" style={getButtonStyle(false)}>🔑 Entrar</Link>
            <Link href="/auth" style={getButtonStyle(true)}>🚀 Cadastrar</Link>
          </div>
        </header>

        {/* Hero */}
        <section style={heroStyle}>
          <h1 style={titleStyle}>MARKETBOT - O robô de trade automático que só lucra se você lucrar!</h1>
          <p style={subtitleStyle}>
            Plataforma inteligente com IA avançada para maximizar seus lucros no mercado cripto.
            Trading automatizado, análise em tempo real e gestão de risco profissional.
          </p>
          <div style={ctaContainerStyle}>
            <Link href="/auth" style={getButtonStyle(true)}>🎯 Teste Grátis por 7 Dias</Link>
            <Link href="/dashboard-simple" style={getButtonStyle(false)}>📊 Ver Dashboard</Link>
          </div>
        </section>

        {/* Features */}
        <section style={featuresStyle}>
          <div style={featureCardStyle('#FFD700')}>
            <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>🤖 IA Avançada</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Algoritmos de machine learning analisam padrões de mercado 24/7 para identificar as melhores oportunidades.
            </p>
          </div>
          <div style={featureCardStyle('#00BFFF')}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.5rem', marginBottom: '1rem' }}>📈 Trading Automatizado</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Execute operações automaticamente baseadas em sinais precisos e estratégias validadas.
            </p>
          </div>
          <div style={featureCardStyle('#FF69B4')}>
            <h3 style={{ color: '#FF69B4', fontSize: '1.5rem', marginBottom: '1rem' }}>🛡️ Gestão de Risco</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Proteção avançada do seu capital com stop‑loss inteligente e diversificação automática.
            </p>
          </div>
          <div style={featureCardStyle('#FFD700')}>
            <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>💰 Programa de Afiliados</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Ganhe comissões indicando novos usuários. Sistema multinível com pagamentos automáticos.
            </p>
          </div>
          <div style={featureCardStyle('#00BFFF')}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.5rem', marginBottom: '1rem' }}>📊 Dashboard Completo</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Acompanhe estatísticas, balanços e configure seus bots em tempo real.
            </p>
          </div>
          <div style={featureCardStyle('#FF69B4')}>
            <h3 style={{ color: '#FF69B4', fontSize: '1.5rem', marginBottom: '1rem' }}>🔒 Segurança Máxima</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Criptografia de nível bancário e autenticação dupla para proteger seus fundos.
            </p>
          </div>
        </section>

        {/* Trial */}
        <section style={trialStyle}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎁 Comece Sua Jornada Hoje!
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            color: '#B0B3B8',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Teste nossa plataforma por 7 dias gratuitamente. Sem compromisso, sem cartão de crédito.
            {mounted && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.9rem', color: '#FFD700' }}>
                ⏰ Oferta válida até: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth" style={getButtonStyle(true)}>🚀 Começar Teste Grátis</Link>
            <Link href="/dashboard-simple" style={getButtonStyle(false)}>📊 Ver Demonstração</Link>
          </div>
          <p style={{ fontSize: '0.875rem', marginTop: '1.5rem', color: '#666', fontStyle: 'italic' }}>
            * Ao se cadastrar você concorda com nossos{' '}
            <Link href="/terms" style={{ color: '#00BFFF', textDecoration: 'underline' }}>Termos de Uso</Link> e{' '}
            <Link href="/privacy" style={{ color: '#00BFFF', textDecoration: 'underline' }}>Política de Privacidade</Link>.
          </p>
        </section>

        {/* Footer */}
        <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid #333333', color: '#888888' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Link href="/terms" style={{ color: '#00BFFF', textDecoration: 'none' }}>Termos de Uso</Link>
            <Link href="/privacy" style={{ color: '#00BFFF', textDecoration: 'none' }}>Privacidade</Link>
            <Link href="/security" style={{ color: '#00BFFF', textDecoration: 'none' }}>Segurança</Link>
            <Link href="/contact" style={{ color: '#00BFFF', textDecoration: 'none' }}>Contato</Link>
          </div>
          <p>© 2025 CoinBitClub. Todos os direitos reservados.</p>
        </footer>
      </div>

      {/* CSS global para keyframes e media queries */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 768px) {
          .cta-container {
            flex-direction: column;
            align-items: center;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </>
  );
}

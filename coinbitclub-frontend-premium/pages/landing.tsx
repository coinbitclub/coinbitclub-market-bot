import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const LandingPage: NextPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Carregando...</div>;
  }

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
  } as const;

  const headerStyle = {
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.9)',
    borderBottom: '1px solid #333333',
  } as const;

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  } as const;

  const heroStyle = {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const titleStyle = {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '700',
    marginBottom: '1.5rem',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF, #FFD700)',
    backgroundSize: '300% 300%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 6s ease-in-out infinite',
  };

  const subtitleStyle = {
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
    marginBottom: '2.5rem',
    color: '#B0B3B8',
    maxWidth: '800px',
    margin: '0 auto',
    lineHeight: '1.6',
  };

  const ctaContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginTop: '2rem',
    marginBottom: '3rem',
    gap: '2rem',
  };

  const getButtonStyle = (primary = false) => ({
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: primary ? '2px solid #FFD700' : '2px solid #00BFFF',
    background: primary
      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
      : 'linear-gradient(135deg, #00BFFF20, #FF69B420)',
    color: primary ? '#000' : '#fff',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center' as const,
    minWidth: '200px',
    boxShadow: primary
      ? '0 0 20px rgba(255, 215, 0, 0.5)'
      : '0 0 20px rgba(0, 191, 255, 0.3)',
  });

  const featuresStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const featureCardStyle = (color: string) => ({
    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), ${color}10)`,
    border: `1px solid ${color}40`,
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center' as const,
    backdropFilter: 'blur(10px)',
    boxShadow: `0 0 20px ${color}20`,
    transition: 'transform 0.3s ease',
  });

  const trialStyle = {
    background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(0, 191, 255, 0.1))',
    border: '2px solid rgba(255, 215, 0, 0.5)',
    borderRadius: '20px',
    padding: '3rem 2rem',
    margin: '4rem 2rem',
    textAlign: 'center' as const,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
  };

  const authLinksStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  };

  return (
    <>
      <Head>
        <title>CoinBitClub - Plataforma de Trading Inteligente</title>
        <meta name="description" content="Maximize seus lucros com trading automatizado de criptomoedas. IA avançada, análise em tempo real e gestão de risco profissional." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link href="/" style={logoStyle}>⚡ CoinBitClub</Link>
          <div style={authLinksStyle}>
            <Link href="/auth/login" style={getButtonStyle(false)}>🔑 LOGIN</Link>
            <Link href="/auth/register" style={getButtonStyle(true)}>🚀 Cadastrar</Link>
          </div>
        </header>

        <section style={heroStyle}>
          <h1 style={titleStyle}>MARKETBOT - O robô de trade automático que só lucra se você lucrar!</h1>
          <p style={subtitleStyle}>
            Plataforma inteligente com IA avançada para maximizar seus lucros no mercado cripto.
            Trading automatizado, análise em tempo real e gestão de risco profissional.
          </p>
          <div style={ctaContainerStyle}>
            <Link href="/auth/register" style={getButtonStyle(true)}>🎯 Teste Grátis por 7 Dias</Link>
          </div>
        </section>

        <section style={featuresStyle} className="features-grid">
          {/* cards mantidos conforme original */}
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
              Ganhe comissões de 1,5% sobre os resultados dos seus indicados. Indicações diretas apenas.
            </p>
            <Link href="/auth/affiliate-register" style={getButtonStyle(false)}>📈 Cadastrar como Afiliado</Link>
          </div>
          <div style={featureCardStyle('#00BFFF')}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.5rem', marginBottom: '1rem' }}>📊 Dashboard Completo</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Gráficos em tempo real e relatórios detalhados para otimizar seus resultados.
            </p>
          </div>
          <div style={featureCardStyle('#FF69B4')}>
            <h3 style={{ color: '#FF69B4', fontSize: '1.5rem', marginBottom: '1rem' }}>🔒 Segurança Máxima</h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Criptografia de nível bancário e autenticação dupla para proteger seus fundos.
            </p>
          </div>
        </section>

        <section style={trialStyle}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            marginBottom: '1.5rem',
            background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🎁 Comece Sua Jornada Hoje!
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: '#B0B3B8',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            Teste nossa plataforma por 7 dias gratuitamente. Sem compromisso, sem cartão de crédito.
          </p>
          {mounted && (
            <p style={{
              fontSize: '0.95rem',
              marginTop: '0.5rem',
              marginBottom: '2rem',
              color: '#FFD700'
            }}>
              ⏰ Oferta válida até: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
            </p>
          )}
          <Link href="/auth/register" style={getButtonStyle(true)}>🚀 Começar Teste Grátis</Link>
          <p style={{ fontSize: '0.875rem', marginTop: '1.5rem', color: '#666', fontStyle: 'italic' }}>
            * Ao se cadastrar você concorda com nossos{' '}
            <Link href="/privacy" style={{ color: '#00BFFF', textDecoration: 'underline' }}>Termos de Uso e Política de Privacidade</Link>.
          </p>
        </section>

        <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid #333333', color: '#888888' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Link href="/privacy" style={{ color: '#007BFF', textDecoration: 'none' }}>Termos de Uso e Política de Privacidade</Link>
            <a
              href="https://wa.me/5521995966652?text=Olá,%20quero%20saber%20mais%20sobre%20o%20MARKETBOT"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              💬 Contato WhatsApp
            </a>
          </div>
          <p>© 2025 CoinBitClub. Todos os direitos reservados.</p>
        </footer>
      </div>

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
      `}</style>
    </>
  );
};

export default LandingPage;

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const LandingPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>CoinBitClub - Plataforma de Trading Inteligente</title>
        <meta name="description" content="Maximize seus lucros com trading automatizado de criptomoedas. IA avançada, análise em tempo real e gestão de risco profissional." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Header */}
        <header style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          borderBottom: '1px solid #333333',
        }}>
          <Link href="/" style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>
            ⚡ CoinBitClub
          </Link>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/login" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '2px solid #00BFFF',
              background: 'linear-gradient(135deg, #00BFFF20, #FF69B420)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              🔑 LOGIN
            </Link>
            <Link href="/login" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '2px solid #FFD700',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#000',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              🚀 Cadastrar
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            marginBottom: '1.5rem',
            background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF, #FFD700)',
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            MARKETBOT - O robô de trade automático que só lucra se você lucrar!
          </h1>
          <p style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
            marginBottom: '2.5rem',
            color: '#B0B3B8',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            Plataforma inteligente com IA avançada para maximizar seus lucros no mercado cripto.
            Trading automatizado, análise em tempo real e gestão de risco profissional.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '2rem',
            marginBottom: '3rem',
            gap: '2rem',
          }}>
            <Link href="/login" style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: '2px solid #FFD700',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#000',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
              minWidth: '200px',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            }}>
              🎯 Teste Grátis por 7 Dias
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section style={{
          padding: '3rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🤖 IA Avançada
            </h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Algoritmos de machine learning analisam padrões de mercado 24/7 para identificar as melhores oportunidades.
            </p>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 191, 255, 0.05))',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(0, 191, 255, 0.2)',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📈 Trading Automatizado
            </h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Execute operações automaticamente baseadas em sinais precisos e estratégias validadas.
            </p>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 105, 180, 0.05))',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 105, 180, 0.2)',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#FF69B4', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🛡️ Gestão de Risco
            </h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Proteção avançada do seu capital com stop‑loss inteligente e diversificação automática.
            </p>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>
              💰 Programa de Afiliados
            </h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6', marginBottom: '1rem' }}>
              Ganhe comissões de 1,5% sobre os resultados dos seus indicados. Indicações diretas apenas.
            </p>
            <Link href="/login" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '2px solid #00BFFF',
              background: 'linear-gradient(135deg, #00BFFF20, #FF69B420)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              📈 Cadastrar como Afiliado
            </Link>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 191, 255, 0.05))',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(0, 191, 255, 0.2)',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📊 Dashboard Completo
            </h3>
            <p style={{ color: '#B0B3B8', lineHeight: '1.6' }}>
              Gráficos em tempo real e relatórios detalhados para otimizar seus resultados.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(0, 191, 255, 0.05))',
          borderTop: '1px solid #333333',
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #FFD700, #00BFFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Comece Gratuitamente Hoje!
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            color: '#B0B3B8',
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
          }}>
            7 dias de teste gratuito. Sem compromisso. Cancele quando quiser.
          </p>
          <Link href="/login" style={{
            padding: '1.2rem 2.5rem',
            borderRadius: '12px',
            border: '2px solid #FFD700',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            display: 'inline-block',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
          }}>
            🚀 Começar Agora - Grátis
          </Link>
          <p style={{ fontSize: '0.875rem', marginTop: '1.5rem', color: '#666', fontStyle: 'italic' }}>
            * Ao se cadastrar você concorda com nossos{' '}
            <Link href="/privacy" style={{ color: '#00BFFF', textDecoration: 'underline' }}>
              Termos de Uso e Política de Privacidade
            </Link>.
          </p>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '2rem',
          textAlign: 'center',
          borderTop: '1px solid #333333',
          color: '#888888'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
          }}>
            <Link href="/privacy" style={{ color: '#007BFF', textDecoration: 'none' }}>
              Termos de Uso e Política de Privacidade
            </Link>
            <a
              href="https://wa.me/5521995966652?text=Olá,%20quero%20saber%20mais%20sobre%20o%20MARKETBOT"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#25D366',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              💬 Contato WhatsApp
            </a>
          </div>
          <p>© 2025 CoinBitClub. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;

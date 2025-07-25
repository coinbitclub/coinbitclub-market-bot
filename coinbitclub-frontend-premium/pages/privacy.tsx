import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const PrivacyPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Política de Privacidade e Termos de Uso - CoinBitClub</title>
        <meta name="description" content="Política de Privacidade e Termos de Uso da plataforma CoinBitClub" />
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
            <Link href="/auth/login" style={{
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
            <Link href="/auth/register" style={{
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

        {/* Content */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '2rem',
            background: 'linear-gradient(45deg, #FFD700, #00BFFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}>
            Política de Privacidade e Termos de Uso
          </h1>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            lineHeight: '1.8',
          }}>
            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>1. TERMOS DE USO</h2>
            <p style={{ marginBottom: '1.5rem', color: '#B0B3B8' }}>
              Ao utilizar a plataforma CoinBitClub, você concorda com os seguintes termos e condições.
              O uso desta plataforma é destinado exclusivamente para trading automatizado de criptomoedas
              e está sujeito às regulamentações financeiras aplicáveis.
            </p>

            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>2. POLÍTICA DE PRIVACIDADE</h2>
            <p style={{ marginBottom: '1.5rem', color: '#B0B3B8' }}>
              Protegemos seus dados pessoais com tecnologia de criptografia avançada. Coletamos apenas
              as informações necessárias para fornecer nossos serviços de trading automatizado.
            </p>

            <h3 style={{ color: '#00BFFF', marginBottom: '0.5rem' }}>2.1 Dados Coletados:</h3>
            <ul style={{ marginBottom: '1.5rem', color: '#B0B3B8', paddingLeft: '2rem' }}>
              <li>Nome completo e informações de contato</li>
              <li>Dados de verificação de identidade</li>
              <li>Informações de trading e preferências</li>
              <li>Logs de atividade na plataforma</li>
            </ul>

            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>3. RISCOS DO TRADING</h2>
            <p style={{ marginBottom: '1.5rem', color: '#B0B3B8' }}>
              O trading de criptomoedas envolve riscos significativos. O valor dos investimentos pode
              variar para cima ou para baixo. Você pode perder parte ou todo o seu capital investido.
              Invista apenas o que você pode se dar ao luxo de perder.
            </p>

            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>4. RESPONSABILIDADES</h2>
            <p style={{ marginBottom: '1.5rem', color: '#B0B3B8' }}>
              A CoinBitClub fornece ferramentas de trading automatizado, mas não garante lucros.
              Cada usuário é responsável por suas próprias decisões de investimento e deve considerar
              sua situação financeira antes de usar nossos serviços.
            </p>

            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>5. PROGRAMA DE AFILIADOS</h2>
            <p style={{ marginBottom: '1.5rem', color: '#B0B3B8' }}>
              Nosso programa de afiliados oferece comissões baseadas nos resultados dos usuários indicados.
              As comissões são calculadas sobre os lucros efetivos e pagas mensalmente.
            </p>

            <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>6. CONTATO</h2>
            <p style={{ marginBottom: '1.5rem', color: '#B0B3B8' }}>
              Para dúvidas sobre esta política ou nossos serviços, entre em contato através do WhatsApp:
              <a 
                href="https://wa.me/5521995966652" 
                style={{ color: '#25D366', textDecoration: 'none', marginLeft: '0.5rem' }}
              >
                +55 21 99596-6652
              </a>
            </p>

            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              marginTop: '2rem',
            }}>
              <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>⚠️ AVISO IMPORTANTE</h3>
              <p style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                Esta plataforma é destinada para usuários maiores de 18 anos. O trading de criptomoedas
                pode não ser adequado para todos os investidores. Recomendamos buscar aconselhamento
                financeiro independente antes de investir.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/" style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: '2px solid #00BFFF',
              background: 'linear-gradient(135deg, #00BFFF20, #FF69B420)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              ← Voltar para o Início
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          padding: '2rem',
          textAlign: 'center',
          borderTop: '1px solid #333333',
          color: '#888888'
        }}>
          <p>© 2025 CoinBitClub. Todos os direitos reservados.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Última atualização: Janeiro de 2025
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPage;

import React from 'react';
import { NextPage } from 'next';
import { useState, useEffect } from 'react';

const ViralAffiliatePage: NextPage = () => {
  const [copied, setCopied] = useState(false);
  const [earnings, setEarnings] = useState(2847.65);
  const [referrals, setReferrals] = useState(23);
  
  const affiliateLink = 'https://coinbitclub.com/ref/GOLD789';
  
  // Animação dos ganhos
  useEffect(() => {
    const interval = setInterval(() => {
      setEarnings(prev => +(prev + (Math.random() * 5)).toFixed(2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Estilos ultra modernos e virais
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
    position: 'relative' as const,
    overflow: 'hidden'
  };

  // Partículas de fundo animadas
  const particlesStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at 20% 80%, rgba(5, 167, 78, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(110, 162, 151, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(5, 167, 78, 0.05) 0%, transparent 50%)
    `,
    zIndex: 1
  };

  const headerStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(5, 167, 78, 0.2)',
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.025em'
  };

  const badgeStyle = {
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    color: '#FAFBFD',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    animation: 'pulse 2s infinite'
  };

  const heroStyle = {
    textAlign: 'center' as const,
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10
  };

  const heroTitleStyle = {
    fontSize: '4rem',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #FAFBFD 0%, #6EA297 50%, #05A74E 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em'
  };

  const heroSubtitleStyle = {
    fontSize: '1.5rem',
    color: '#AFB4B1',
    fontWeight: '400',
    marginBottom: '2rem',
    lineHeight: '1.6'
  };

  const earningsDisplayStyle = {
    background: 'linear-gradient(135deg, rgba(5, 167, 78, 0.2), rgba(110, 162, 151, 0.1))',
    border: '2px solid rgba(5, 167, 78, 0.3)',
    borderRadius: '20px',
    padding: '2rem',
    marginBottom: '3rem',
    backdropFilter: 'blur(20px)',
    display: 'inline-block',
    boxShadow: '0 20px 40px rgba(5, 167, 78, 0.2)'
  };

  const earningsAmountStyle = {
    fontSize: '3rem',
    fontWeight: '900',
    color: '#05A74E',
    display: 'block',
    marginBottom: '0.5rem',
    fontFamily: "'Roboto Mono', monospace"
  };

  const earningsLabelStyle = {
    fontSize: '1rem',
    color: '#AFB4B1',
    fontWeight: '500'
  };

  const linkSectionStyle = {
    maxWidth: '800px',
    margin: '0 auto 4rem',
    position: 'relative' as const,
    zIndex: 10
  };

  const linkCardStyle = {
    background: 'linear-gradient(135deg, rgba(15, 45, 37, 0.4), rgba(75, 77, 82, 0.2))',
    border: '1px solid rgba(5, 167, 78, 0.3)',
    borderRadius: '20px',
    padding: '2.5rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(5, 167, 78, 0.1)'
  };

  const linkTitleStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#FAFBFD',
    textAlign: 'center' as const
  };

  const linkBoxStyle = {
    background: 'rgba(5, 5, 6, 0.6)',
    border: '1px solid rgba(5, 167, 78, 0.4)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backdropFilter: 'blur(10px)'
  };

  const linkTextStyle = {
    fontFamily: "'Roboto Mono', monospace",
    fontSize: '1rem',
    color: '#6EA297',
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '0.5rem'
  };

  const copyButtonStyle = {
    background: copied 
      ? 'linear-gradient(135deg, #6EA297, #05A74E)' 
      : 'linear-gradient(135deg, #05A74E, #6EA297)',
    color: '#FAFBFD',
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 20px rgba(5, 167, 78, 0.3)',
    minWidth: '140px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 4rem',
    padding: '0 2rem',
    position: 'relative' as const,
    zIndex: 10
  };

  const statCardStyle = {
    background: 'linear-gradient(135deg, rgba(5, 167, 78, 0.1), rgba(110, 162, 151, 0.05))',
    border: '1px solid rgba(5, 167, 78, 0.2)',
    borderRadius: '20px',
    padding: '2.5rem',
    textAlign: 'center' as const,
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const statIconStyle = {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    display: 'block'
  };

  const statValueStyle = {
    fontSize: '3rem',
    fontWeight: '900',
    marginBottom: '0.75rem',
    lineHeight: '1'
  };

  const statLabelStyle = {
    fontSize: '1.125rem',
    color: '#AFB4B1',
    fontWeight: '600',
    marginBottom: '0.5rem'
  };

  const statDescStyle = {
    fontSize: '0.875rem',
    color: '#6EA297',
    lineHeight: '1.4'
  };

  const toolsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    position: 'relative' as const,
    zIndex: 10
  };

  const toolCardStyle = {
    background: 'linear-gradient(135deg, rgba(15, 45, 37, 0.3), rgba(75, 77, 82, 0.1))',
    border: '1px solid rgba(110, 162, 151, 0.2)',
    borderRadius: '20px',
    padding: '2.5rem',
    backdropFilter: 'blur(15px)',
    transition: 'all 0.3s ease'
  };

  const toolButtonStyle = {
    width: '100%',
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    color: '#FAFBFD',
    padding: '1.25rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '1.5rem'
  };

  return (
    <div style={containerStyle}>
      {/* Partículas de fundo */}
      <div style={particlesStyle}></div>

      {/* Header */}
      <header style={headerStyle}>
        <div style={logoStyle}>💎 CoinBitClub</div>
        <div style={badgeStyle}>
          VIP Affiliate
        </div>
      </header>

      {/* Hero Section */}
      <section style={heroStyle}>
        <h1 style={heroTitleStyle}>
          Programa VIP<br />
          de Afiliados
        </h1>
        <p style={heroSubtitleStyle}>
          Ganhe até 30% de comissão vitalícia compartilhando<br />
          nossa plataforma de trading com IA
        </p>

        {/* Earnings Display */}
        <div style={earningsDisplayStyle}>
          <span style={earningsAmountStyle}>
            R$ {earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span style={earningsLabelStyle}>
            💰 Seus Ganhos Totais • {referrals} Referidos
          </span>
        </div>
      </section>

      {/* Link Section */}
      <section style={linkSectionStyle}>
        <div style={linkCardStyle}>
          <h3 style={linkTitleStyle}>
            🔗 Seu Link Exclusivo VIP
          </h3>
          
          <div style={linkBoxStyle}>
            <input 
              type="text" 
              value={affiliateLink} 
              readOnly 
              style={linkTextStyle}
            / />
            <button
              onClick={copyToClipboard}
              style={copyButtonStyle}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(5, 167, 78, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(5, 167, 78, 0.3)';
                }
              }}
            >
              {copied ? '✅ Copiado!' : '📋 Copiar Link'}
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap' as const
          }}>
            <button style={{
              ...toolButtonStyle,
              width: 'auto',
              padding: '0.75rem 2rem',
              background: 'rgba(5, 167, 78, 0.2)',
              border: '1px solid rgba(5, 167, 78, 0.4)'
            }}>
              📱 Compartilhar WhatsApp
            </button>
            <button style={{
              ...toolButtonStyle,
              width: 'auto',
              padding: '0.75rem 2rem',
              background: 'rgba(5, 167, 78, 0.2)',
              border: '1px solid rgba(5, 167, 78, 0.4)'
            }}>
              📧 Compartilhar Email
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={statsGridStyle}>
        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(5, 167, 78, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={statIconStyle}>💸</div>
          <div style={{...statValueStyle, color: '#05A74E'}}>30%</div>
          <div style={statLabelStyle}>Comissão Vitalícia</div>
          <div style={statDescStyle}>
            A maior comissão do mercado<br />
            Ganhe para sempre de cada cliente
          </div>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(110, 162, 151, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={statIconStyle}>⚡</div>
          <div style={{...statValueStyle, color: '#6EA297'}}>24/7</div>
          <div style={statLabelStyle}>Bot Sempre Ativo</div>
          <div style={statDescStyle}>
            IA operando constantemente<br />
            Clientes satisfeitos = mais ganhos
          </div>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(5, 167, 78, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={statIconStyle}>💎</div>
          <div style={{...statValueStyle, color: '#05A74E'}}>R$ 3.2k</div>
          <div style={statLabelStyle}>Ganho Médio Mensal</div>
          <div style={statDescStyle}>
            Com apenas 15 referidos ativos<br />
            Potencial ilimitado de ganhos
          </div>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(110, 162, 151, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={statIconStyle}>🎯</div>
          <div style={{...statValueStyle, color: '#6EA297'}}>92.8%</div>
          <div style={statLabelStyle}>Taxa de Conversão</div>
          <div style={statDescStyle}>
            Produto de alta qualidade<br />
            Fácil de vender e convencer
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section style={{padding: '4rem 0', position: 'relative' as const, zIndex: 10}}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          textAlign: 'center' as const,
          marginBottom: '3rem',
          color: '#FAFBFD'
        }}>
          🛠️ Kit Completo de Marketing
        </h2>

        <div style={toolsGridStyle}>
          <div 
            style={toolCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 45, 37, 0.4), rgba(75, 77, 82, 0.2))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 45, 37, 0.3), rgba(75, 77, 82, 0.1))';
            }}
          >
            <div style={{fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' as const}}>🎨</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Materiais Visuais
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6', marginBottom: '1rem'}}>
              Banners, posts para redes sociais, vídeos explicativos e apresentações prontas
            </p>
            <button style={toolButtonStyle}>
              📥 Download Pack Completo
            </button>
          </div>

          <div 
            style={toolCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 45, 37, 0.4), rgba(75, 77, 82, 0.2))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 45, 37, 0.3), rgba(75, 77, 82, 0.1))';
            }}
          >
            <div style={{fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' as const}}>📊</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Relatórios de Performance
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6', marginBottom: '1rem'}}>
              Dados reais de performance para mostrar aos prospects e aumentar conversões
            </p>
            <button style={toolButtonStyle}>
              📈 Ver Relatórios Atuais
            </button>
          </div>

          <div 
            style={toolCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 45, 37, 0.4), rgba(75, 77, 82, 0.2))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 45, 37, 0.3), rgba(75, 77, 82, 0.1))';
            }}
          >
            <div style={{fontSize: '3rem', marginBottom: '1.5rem', textAlign: 'center' as const}}>🎯</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Scripts de Vendas
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6', marginBottom: '1rem'}}>
              Scripts testados para WhatsApp, e-mail e ligações que convertem muito mais
            </p>
            <button style={toolButtonStyle}>
              💬 Acessar Scripts VIP
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(175, 180, 177, 0.1)',
        padding: '3rem 2rem',
        textAlign: 'center' as const,
        color: '#AFB4B1',
        position: 'relative' as const,
        zIndex: 10
      }}>
        <div style={logoStyle}>💎 CoinBitClub</div>
        <p style={{marginTop: '1rem', fontSize: '0.875rem'}}>
          © 2025 CoinBitClub. Programa VIP de Afiliados. Renda passiva garantida.
        </p>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default ViralAffiliatePage;

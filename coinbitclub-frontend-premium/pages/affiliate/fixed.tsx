import { NextPage } from 'next';
import { useState } from 'react';

const AffiliatePageFixed: NextPage = () => {
  const [copied, setCopied] = useState(false);
  
  const affiliateLink = 'https://coinbitclub.com/ref/GOLD789';
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Estilos inline para garantir funcionamento
  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#050506',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
    padding: 0,
    margin: 0
  };

  const headerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4rem'
  };

  const buttonPrimaryStyle = {
    backgroundColor: '#FAFBFD',
    color: '#050506',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const heroStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    textAlign: 'center' as const,
    marginBottom: '6rem'
  };

  const cardStyle = {
    backgroundColor: 'rgba(75, 77, 82, 0.3)',
    border: '1px solid rgba(175, 180, 177, 0.1)',
    borderRadius: '12px',
    padding: '2rem',
    backdropFilter: 'blur(10px)',
    marginBottom: '2rem'
  };

  const linkBoxStyle = {
    backgroundColor: 'rgba(15, 45, 37, 0.8)',
    border: '1px solid #4B4D52',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const buttonGreenStyle = {
    backgroundColor: '#05A74E',
    color: '#FAFBFD',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    marginBottom: '4rem'
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center' as const
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{color: '#FAFBFD', fontSize: '14px', fontWeight: '300', letterSpacing: '0.1em'}}>
          CoinBitClub
        </div>
        <button 
          style={buttonPrimaryStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#AFB4B1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FAFBFD';
          }}
        >
          Teste Grátis
        </button>
      </div>

      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #05A74E 0%, #6EA297 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Trading Automático<br />
          com IA 24/7
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#AFB4B1',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Ganhe até 30% de comissão compartilhando nossa plataforma de trading automatizado 
          com inteligência artificial.
        </p>

        {/* Link de Afiliado */}
        <div style={{maxWidth: '600px', margin: '0 auto 3rem auto'}}>
          <div style={cardStyle}>
            <h3 style={{marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600'}}>
              🔗 Seu Link de Afiliado
            </h3>
            
            <div style={linkBoxStyle}>
              <span style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: '14px',
                color: '#6EA297',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
                flex: 1,
                marginRight: '1rem'
              }}>
                {affiliateLink}
              </span>
              
              <button
                onClick={copyToClipboard}
                style={copied ? {...buttonGreenStyle, backgroundColor: '#6EA297'} : buttonGreenStyle}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = '#4B4D52';
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = '#05A74E';
                }}
              >
                {copied ? '✓ Copiado!' : '📋 Copiar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 2rem'}}>
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <div style={{fontSize: '3rem', fontWeight: '800', color: '#05A74E', marginBottom: '0.5rem'}}>
              30%
            </div>
            <div style={{fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem'}}>
              Comissão
            </div>
            <div style={{color: '#AFB4B1', fontSize: '14px'}}>
              Por cada cliente referido
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={{fontSize: '3rem', fontWeight: '800', color: '#6EA297', marginBottom: '0.5rem'}}>
              24/7
            </div>
            <div style={{fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem'}}>
              Automático
            </div>
            <div style={{color: '#AFB4B1', fontSize: '14px'}}>
              Trading com IA sempre ativo
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={{fontSize: '3rem', fontWeight: '800', color: '#05A74E', marginBottom: '0.5rem'}}>
              R$ 2.5k
            </div>
            <div style={{fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem'}}>
              Ganho Médio
            </div>
            <div style={{color: '#AFB4B1', fontSize: '14px'}}>
              Por mês com 10 referidos
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={{fontSize: '3rem', fontWeight: '800', color: '#6EA297', marginBottom: '0.5rem'}}>
              98%
            </div>
            <div style={{fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem'}}>
              Precisão
            </div>
            <div style={{color: '#AFB4B1', fontSize: '14px'}}>
              Taxa de sucesso da IA
            </div>
          </div>
        </div>

        {/* Marketing Materials */}
        <div style={cardStyle}>
          <h3 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem'}}>
            📱 Material de Marketing
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <button style={{
              ...buttonGreenStyle,
              width: '100%',
              padding: '1rem',
              fontSize: '16px'
            }}>
              📥 Download Banners
            </button>
            
            <button style={{
              ...buttonGreenStyle,
              width: '100%',
              padding: '1rem',
              fontSize: '16px'
            }}>
              📊 Relatórios de Performance
            </button>
            
            <button style={{
              ...buttonGreenStyle,
              width: '100%',
              padding: '1rem',
              fontSize: '16px'
            }}>
              🎯 Estratégias de Marketing
            </button>
          </div>
        </div>
      </div>

      {/* Footer spacing */}
      <div style={{height: '4rem'}}></div>
    </div>
  );
};

export default AffiliatePageFixed;

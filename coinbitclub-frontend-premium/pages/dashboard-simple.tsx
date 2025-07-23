import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const ModernDashboard: NextPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStats, setCurrentStats] = useState({
    profit: 47592.34,
    trades: 127,
    accuracy: 92.8,
    botStatus: 'Ativo'
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Styles seguindo o padrão index-modern
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
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  };

  const logoStyle = {
    fontSize: isMobile ? '1.25rem' : '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const mainContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '2rem 1rem' : '3rem 2rem'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  };

  const statCardStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    border: '1px solid rgba(5, 167, 78, 0.2)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease'
  };

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub MarketBot</title>
      </Head>

      <div style={containerStyle}>
        {/* Header moderno */}
        <header style={headerStyle}>
          <div style={logoStyle}>⚡ CoinBitClub Dashboard</div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{
              background: 'rgba(5, 167, 78, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '50px',
              border: '1px solid rgba(5, 167, 78, 0.2)',
              fontSize: '0.875rem',
              color: '#6EA297'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#05A74E',
                display: 'inline-block',
                marginRight: '0.5rem'
              }}></div>
              Bot {currentStats.botStatus}
            </div>
          </div>
        </header>

        {/* Main Content Centralizado */}
        <main style={mainContentStyle}>
          {/* Título principal */}
          <div style={{
            textAlign: 'center' as const,
            marginBottom: '3rem'
          }}>
            <h1 style={{
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              fontWeight: '900',
              lineHeight: '1.1',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #FAFBFD 0%, #6EA297 50%, #05A74E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Seus Resultados
            </h1>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              color: '#AFB4B1',
              lineHeight: '1.6'
            }}>
              Acompanhe o desempenho do seu MarketBot em tempo real
            </p>
          </div>

          {/* Stats Cards */}
          <section style={statsGridStyle}>
            <div 
              style={statCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' as const}}>💰</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#05A74E',
                marginBottom: '0.5rem',
                textAlign: 'center' as const
              }}>
                R$ {currentStats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{color: '#AFB4B1', textAlign: 'center' as const, fontSize: '1rem'}}>
                Lucro Total
              </div>
              <div style={{color: '#05A74E', textAlign: 'center' as const, fontSize: '0.875rem', marginTop: '0.5rem'}}>
                +12.5% hoje
              </div>
            </div>

            <div 
              style={statCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' as const}}>📊</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#FAFBFD',
                marginBottom: '0.5rem',
                textAlign: 'center' as const
              }}>
                {currentStats.trades}
              </div>
              <div style={{color: '#AFB4B1', textAlign: 'center' as const, fontSize: '1rem'}}>
                Trades Hoje
              </div>
              <div style={{color: '#05A74E', textAlign: 'center' as const, fontSize: '0.875rem', marginTop: '0.5rem'}}>
                Win Rate: 94.2%
              </div>
            </div>

            <div 
              style={statCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' as const}}>🎯</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#05A74E',
                marginBottom: '0.5rem',
                textAlign: 'center' as const
              }}>
                {currentStats.accuracy}%
              </div>
              <div style={{color: '#AFB4B1', textAlign: 'center' as const, fontSize: '1rem'}}>
                Accuracy
              </div>
              <div style={{color: '#AFB4B1', textAlign: 'center' as const, fontSize: '0.875rem', marginTop: '0.5rem'}}>
                Média de 30 dias
              </div>
            </div>

            <div 
              style={statCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' as const}}>⚡</div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#05A74E',
                marginBottom: '0.5rem',
                textAlign: 'center' as const
              }}>
                {currentStats.botStatus}
              </div>
              <div style={{color: '#AFB4B1', textAlign: 'center' as const, fontSize: '1rem'}}>
                Bot Status
              </div>
              <div style={{color: '#AFB4B1', textAlign: 'center' as const, fontSize: '0.875rem', marginTop: '0.5rem'}}>
                Operando há 24h
              </div>
            </div>
          </section>

          {/* Atividade Recente */}
          <section style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#FAFBFD',
              textAlign: 'center' as const
            }}>
              📈 Atividade Recente
            </h2>

            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {[
                { pair: 'BTC/USDT', type: 'LONG', time: '15:42', profit: 'R$ 342,15', percentage: '+2.8%' },
                { pair: 'ETH/USDT', type: 'SHORT', time: '15:38', profit: 'R$ 198,67', percentage: '+1.5%' },
                { pair: 'ADA/USDT', type: 'LONG', time: '15:22', profit: 'R$ 89,23', percentage: '+0.7%' }
              ].map((trade, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 167, 78, 0.2)'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{fontSize: '1.5rem'}}>🟢</div>
                    <div>
                      <div style={{fontWeight: '600', color: '#FAFBFD'}}>
                        {trade.pair} - {trade.type}
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#AFB4B1'}}>
                        {trade.time} - Lucro: +{trade.profit}
                      </div>
                    </div>
                  </div>
                  <div style={{color: '#05A74E', fontWeight: '700'}}>
                    {trade.percentage}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Navigation Cards */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { title: '🤖 Configurar Bot', desc: 'Ajustar estratégias e riscos', href: '/bot-config' },
              { title: '📊 Relatórios', desc: 'Análises detalhadas', href: '/reports' },
              { title: '👥 Afiliados', desc: 'Programa de indicações', href: '/affiliate/working' },
              { title: '⚙️ Configurações', desc: 'Perfil e preferências', href: '/settings' }
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                style={{
                  background: 'rgba(15, 45, 37, 0.2)',
                  border: '1px solid rgba(110, 162, 151, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.background = 'rgba(15, 45, 37, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(15, 45, 37, 0.2)';
                }}
              >
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#05A74E'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#AFB4B1',
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}>
                  {item.desc}
                </p>
              </a>
            ))}
          </section>
        </main>
      </div>
    </>
  );
};

export default ModernDashboard;

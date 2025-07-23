import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navigation from '../../src/components/Navigation';

const ModernDashboard: NextPage = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Estilos modernos e virais
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 50%, #1a1a1c 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden'
  };

  const headerStyle = {
    background: 'rgba(5, 167, 78, 0.1)',
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

  const timeStyle = {
    fontSize: '0.875rem',
    color: '#AFB4B1',
    fontFamily: "'Roboto Mono', monospace"
  };

  const mainContentStyle = {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const welcomeStyle = {
    marginBottom: '3rem',
    textAlign: 'center' as const
  };

  const titleStyle = {
    fontSize: '3.5rem',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #FAFBFD 0%, #AFB4B1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const subtitleStyle = {
    fontSize: '1.25rem',
    color: '#6EA297',
    fontWeight: '500',
    marginBottom: '2rem'
  };

  const kpiGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  };

  const kpiCardStyle = {
    background: 'linear-gradient(135deg, rgba(5, 167, 78, 0.1) 0%, rgba(110, 162, 151, 0.05) 100%)',
    border: '1px solid rgba(5, 167, 78, 0.2)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const kpiIconStyle = {
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'block'
  };

  const kpiValueStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
    lineHeight: '1'
  };

  const kpiLabelStyle = {
    fontSize: '1rem',
    color: '#AFB4B1',
    fontWeight: '500',
    marginBottom: '0.5rem'
  };

  const kpiChangeStyle = (isPositive: boolean) => ({
    fontSize: '0.875rem',
    fontWeight: '600',
    color: isPositive ? '#05A74E' : '#F31E14',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  });

  const chartSectionStyle = {
    marginBottom: '3rem'
  };

  const chartCardStyle = {
    background: 'rgba(75, 77, 82, 0.1)',
    border: '1px solid rgba(175, 180, 177, 0.1)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    height: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center'
  };

  const chartPlaceholderStyle = {
    width: '100%',
    height: '300px',
    background: 'linear-gradient(135deg, rgba(5, 167, 78, 0.1), rgba(110, 162, 151, 0.1))',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.125rem',
    color: '#6EA297'
  };

  const aiReportsStyle = {
    marginBottom: '3rem'
  };

  const reportsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem'
  };

  const reportCardStyle = {
    background: 'rgba(15, 45, 37, 0.3)',
    border: '1px solid rgba(110, 162, 151, 0.2)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginTop: '2rem'
  };

  const buttonStyle = (variant: 'primary' | 'secondary') => ({
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: variant === 'primary' 
      ? 'linear-gradient(135deg, #05A74E, #6EA297)' 
      : 'rgba(75, 77, 82, 0.3)',
    color: '#FAFBFD',
    backdropFilter: 'blur(10px)',
    border: variant === 'secondary' ? '1px solid rgba(175, 180, 177, 0.2)' : 'none'
  });

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub Market Bot</title>
        <meta name="description" content="Acompanhe suas métricas e posições em tempo real" />
      </Head>

      <div style={containerStyle}>
        {/* Navigation */}
        <Navigation showAdminLinks={false} />
        
        {/* Header Premium */}
        <header style={headerStyle}>
          <div style={logoStyle}>⚡ CoinBitClub</div>
          <div style={timeStyle}>
            {mounted && currentTime ? `${currentTime.toLocaleTimeString('pt-BR')} • ${currentTime.toLocaleDateString('pt-BR')}` : ''}
          </div>
        </header>

        {/* Main Content */}
        <main style={mainContentStyle}>
          {/* Welcome Section */}
          <section style={welcomeStyle}>
            <h1 style={titleStyle}>Dashboard Premium</h1>
            <p style={subtitleStyle}>
              Acompanhe suas métricas e posições em tempo real com nossa IA avançada
            </p>
          </section>

          {/* KPIs Section */}
          <section style={kpiGridStyle}>
            {/* Accuracy Rate */}
            <div 
              style={kpiCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={kpiIconStyle}>🎯</div>
              <div style={kpiValueStyle}>87.3%</div>
              <div style={kpiLabelStyle}>Accuracy Rate</div>
              <div style={kpiChangeStyle(true)}>
                ↗️ +2.1%
              </div>
            </div>

            {/* Daily Return */}
            <div 
              style={kpiCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={kpiIconStyle}>💰</div>
              <div style={kpiValueStyle}>2.45%</div>
              <div style={kpiLabelStyle}>Daily Return</div>
              <div style={kpiChangeStyle(true)}>
                ↗️ +0.3%
              </div>
            </div>

            {/* Lifetime Return */}
            <div 
              style={kpiCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 167, 78, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={kpiIconStyle}>📈</div>
              <div style={kpiValueStyle}>156.7%</div>
              <div style={kpiLabelStyle}>Lifetime Return</div>
              <div style={kpiChangeStyle(true)}>
                ↗️ +4.2%
              </div>
            </div>

            {/* Current Drawdown */}
            <div 
              style={kpiCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(110, 162, 151, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={kpiIconStyle}>📊</div>
              <div style={kpiValueStyle}>3.2%</div>
              <div style={kpiLabelStyle}>Current Drawdown</div>
              <div style={kpiChangeStyle(false)}>
                ↘️ -0.5%
              </div>
            </div>
          </section>

          {/* Chart Section */}
          <section style={chartSectionStyle}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#FAFBFD'
            }}>
              📈 Curva de Equity
            </h2>
            <p style={{
              color: '#AFB4B1',
              marginBottom: '2rem',
              fontSize: '1.125rem'
            }}>
              Evolução do seu saldo ao longo do tempo
            </p>
            <div style={chartCardStyle}>
              <div style={chartPlaceholderStyle}>
                📊 Gráfico Recharts aqui (Line Chart)<br />
                <small style={{color: '#AFB4B1', marginTop: '0.5rem', display: 'block'}}>
                  Última atualização: {mounted && currentTime ? currentTime.toLocaleString('pt-BR') : ''}
                </small>
              </div>
            </div>
          </section>

          {/* AI Reports Section */}
          <section style={aiReportsStyle}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#FAFBFD'
            }}>
              🤖 Relatórios de IA (Atualizados a cada 4h)
            </h2>
            <p style={{
              color: '#AFB4B1',
              marginBottom: '2rem',
              fontSize: '1.125rem'
            }}>
              Análises automáticas da sua carteira e mercado
            </p>
            
            <div style={reportsGridStyle}>
              {/* Performance Analysis */}
              <div style={reportCardStyle}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#6EA297'
                }}>
                  📊 Análise de Performance da Carteira
                </h3>
                <p style={{color: '#AFB4B1', fontSize: '0.875rem', marginBottom: '1rem'}}>
                  {mounted && currentTime ? currentTime.toLocaleString('pt-BR') : ''}
                </p>
                <div style={{fontSize: '0.875rem', lineHeight: '1.6'}}>
                  <p><strong>Performance:</strong> +6.8%</p>
                  <p><strong>Score de Risco:</strong> 4.2/10</p>
                  <p><strong>Recomendações:</strong></p>
                  <ul style={{marginLeft: '1rem', marginTop: '0.5rem'}}>
                    <li>✅ Performance acima da média do mercado</li>
                    <li>⚠️ Risco controlado dentro dos parâmetros</li>
                    <li>🎯 Considerar realização de lucros parciais</li>
                  </ul>
                </div>
              </div>

              {/* Market Analysis */}
              <div style={reportCardStyle}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#05A74E'
                }}>
                  🌍 Análise de Mercado 4h
                </h3>
                <p style={{color: '#AFB4B1', fontSize: '0.875rem', marginBottom: '1rem'}}>
                  {new Date(Date.now() - 4*60*60*1000).toLocaleString('pt-BR')}
                </p>
                <div style={{fontSize: '0.875rem', lineHeight: '1.6'}}>
                  <p><strong>Sentimento:</strong> <span style={{color: '#05A74E'}}>Alta</span></p>
                  <p><strong>Confiança:</strong> 82%</p>
                  <p><strong>Recomendações:</strong></p>
                  <ul style={{marginLeft: '1rem', marginTop: '0.5rem'}}>
                    <li>🟢 Mercado em tendência de alta consolidada</li>
                    <li>📈 Volume de negociação saudável</li>
                    <li>🎯 Suporte forte em níveis atuais</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Positions Section Placeholder */}
          <section style={{marginBottom: '3rem'}}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#FAFBFD'
            }}>
              💼 Posições Abertas (2)
            </h2>
            <div style={{
              background: 'rgba(15, 45, 37, 0.3)',
              border: '1px solid rgba(110, 162, 151, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center' as const
            }}>
              <p style={{color: '#AFB4B1', fontSize: '1.125rem'}}>
                📋 Gerencia suas posições ativas
              </p>
              <div style={{marginTop: '1rem', fontSize: '0.875rem', color: '#6EA297'}}>
                🟢 BTC Breakout confirmado • 🟢 ETH segundo BTC
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <section style={actionButtonsStyle}>
            <button 
              style={buttonStyle('primary')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(5, 167, 78, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📥 Export CSV
            </button>
            <button 
              style={buttonStyle('secondary')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(75, 77, 82, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(75, 77, 82, 0.3)';
              }}
            >
              📄 Export JSON
            </button>
          </section>
        </main>
      </div>
    </>
  );
};

export default ModernDashboard;

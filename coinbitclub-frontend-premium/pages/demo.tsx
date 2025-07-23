import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const DemoPage: NextPage = () => {
  const [mounted, setMounted] = useState(false);
  const [currentMetric, setCurrentMetric] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentMetric(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <div>Carregando...</div>;
  }

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0b 25%, #1a1a1c 50%, #0a0a0b 75%, #000000 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FFD700',
    textDecoration: 'none',
  };

  const demoContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  };

  const metricsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  };

  const metricCardStyle = (color: string, isActive: boolean) => ({
    background: isActive 
      ? `linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 191, 255, 0.1))`
      : 'rgba(0, 0, 0, 0.8)',
    border: `1px solid ${isActive ? color : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center' as const,
    transition: 'all 0.3s ease',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isActive 
      ? `0 0 30px rgba(255, 215, 0, 0.3)` 
      : '0 4px 15px rgba(0, 0, 0, 0.3)',
  });

  const chartStyle = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    textAlign: 'center' as const,
  };

  const ctaStyle = {
    background: 'rgba(0, 0, 0, 0.9)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    marginTop: '3rem',
  };

  const buttonStyle = {
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: '2px solid #FFD700',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    display: 'inline-block',
    margin: '0 0.5rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
  };

  const metrics = [
    { label: 'Lucro Total', value: 'R$ 47.850,00', change: '+18.5%', color: '#FFD700' },
    { label: 'ROI Mensal', value: '24.3%', change: '+5.2%', color: '#00BFFF' },
    { label: 'Trades Vencedores', value: '87.4%', change: '+2.1%', color: '#FF69B4' },
    { label: 'Valor Investido', value: 'R$ 125.000,00', change: '+12.8%', color: '#FFD700' },
  ];

  const mockPrices = mounted ? [
    { symbol: 'BTC', price: (65000 + Math.random() * 2000).toFixed(0), change: '+5.2%' },
    { symbol: 'ETH', price: (3200 + Math.random() * 200).toFixed(0), change: '+3.8%' },
    { symbol: 'ADA', price: (1.25 + Math.random() * 0.1).toFixed(3), change: '+7.1%' },
    { symbol: 'SOL', price: (180 + Math.random() * 20).toFixed(0), change: '+4.5%' },
  ] : [];

  return (
    <>
      <Head>
        <title>Demo - CoinBitClub Trading Platform</title>
        <meta name="description" content="Veja nossa plataforma em ação com dados reais simulados" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <Link href="/landing" style={logoStyle}>
            ⚡ CoinBitClub
          </Link>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#00BFFF', fontSize: '0.9rem', fontWeight: 'bold' }}>
              📊 DEMO MODE
            </span>
            <Link href="/auth/register" style={{
              ...buttonStyle,
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
            }}>
              🚀 Começar Agora
            </Link>
          </div>
        </header>

        <div style={demoContainerStyle}>
          {/* Demo Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}>
              🎯 Plataforma em Ação
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#B0B3B8' }}>
              Dados reais simulados • Interface completa • Sem compromisso
            </p>
          </div>

          {/* Live Metrics */}
          <div style={metricsGridStyle}>
            {metrics.map((metric, index) => (
              <div key={index} style={metricCardStyle(metric.color, currentMetric === index)}>
                <h3 style={{ color: metric.color, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {metric.label}
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {metric.value}
                </div>
                <div style={{ color: '#4CAF50', fontSize: '0.9rem' }}>
                  📈 {metric.change}
                </div>
              </div>
            ))}
          </div>

          {/* Mock Chart */}
          <div style={chartStyle}>
            <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📊 Performance da Carteira (Últimos 30 dias)
            </h3>
            <div style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(0, 191, 255, 0.1))',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#B0B3B8'
            }}>
              📈 Gráfico interativo com dados em tempo real
              <br />
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                {mounted && `Atualizado em: ${new Date().toLocaleTimeString('pt-BR')}`}
              </small>
            </div>
          </div>

          {/* Live Prices */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(0, 191, 255, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              💰 Preços em Tempo Real
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {mockPrices.map((coin, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {coin.symbol}
                  </div>
                  <div style={{ fontSize: '1.3rem', color: '#FFD700', marginBottom: '0.25rem' }}>
                    ${coin.price}
                  </div>
                  <div style={{ color: '#4CAF50', fontSize: '0.9rem' }}>
                    {coin.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Signals Demo */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 105, 180, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: '#FF69B4', fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              🤖 Sinais de IA em Tempo Real
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid #4CAF50',
                borderRadius: '8px',
                padding: '1rem',
              }}>
                <strong style={{ color: '#4CAF50' }}>🟢 COMPRA - BTC</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#B0B3B8', fontSize: '0.9rem' }}>
                  IA detectou padrão de alta. Confiança: 94%
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid #FFC107',
                borderRadius: '8px',
                padding: '1rem',
              }}>
                <strong style={{ color: '#FFC107' }}>🟡 AGUARDAR - ETH</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#B0B3B8', fontSize: '0.9rem' }}>
                  Análise de volatilidade em andamento. Confiança: 76%
                </p>
              </div>
            </div>
          </div>

          {/* CTA Final */}
          <div style={ctaStyle}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}>
              🚀 Pronto para Começar?
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#B0B3B8' }}>
              Acesso completo por 7 dias • Sem cartão de crédito • Cancele quando quiser
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/register" style={buttonStyle}>
                🎯 Teste Grátis Agora
              </Link>
              <Link href="/landing" style={{
                ...buttonStyle,
                background: 'transparent',
                color: '#00BFFF',
                border: '2px solid #00BFFF',
                boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)',
              }}>
                📖 Saiba Mais
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoPage;
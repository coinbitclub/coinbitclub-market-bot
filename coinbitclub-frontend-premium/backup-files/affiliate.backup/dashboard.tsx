import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import {
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  GiftIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';const AffiliateDashboard: NextPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [affiliateData, setAffiliateData] = useState({
    totalEarnings: 15847.23,
    monthlyEarnings: 3294.56,
    referrals: 47,
    activeReferrals: 32,
    conversionRate: 68.1,
    tier: 'Platinum',
    nextTierProgress: 75,
    pendingPayment: 1247.89
  });

  const [aiInsights, setAiInsights] = useState([
    "📈 Seus ganhos aumentaram 34% este mês comparado ao anterior",
    "🎯 Foque em conversão: 15 leads ainda não convertidos",
    "💡 Melhor horário para posts: 14h-16h (32% mais engajamento)",
    "🚀 Próximo tier em 12 indicações. Bônus: +15% comissão!"
  ]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const mainStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: isMobile ? '2rem 1rem' : '3rem 2rem'
  };

  const cardStyle = {
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
        <title>Dashboard Afiliado - CoinBitClub</title>
      </Head>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🤝 Dashboard Afiliado - {affiliateData.tier}
          </div>
          
          <div style={{
            background: `linear-gradient(90deg, #05A74E ${affiliateData.nextTierProgress}%, rgba(5, 167, 78, 0.2) ${affiliateData.nextTierProgress}%)`,
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: '#FAFBFD'
          }}>
            Próximo Tier: {affiliateData.nextTierProgress}%
          </div>
        </header>

        <main style={mainStyle}>
          {/* IA Insights */}
          <section style={{
            ...cardStyle,
            marginBottom: '3rem',
            background: 'linear-gradient(135deg, rgba(5, 167, 78, 0.1), rgba(110, 162, 151, 0.05))'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <SparklesIcon style={{ width: '1.5rem', height: '1.5rem', color: '#05A74E' }} />
              Insights de IA Personalizados
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {aiInsights.map((insight, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 167, 78, 0.2)',
                  fontSize: '1rem',
                  color: '#FAFBFD',
                  lineHeight: '1.5'
                }}>
                  {insight}
                </div>
              ))}
            </div>
          </section>

          {/* KPIs do Afiliado */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <CurrencyDollarIcon style={{ width: '3rem', height: '3rem', color: '#05A74E' }} />
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem' }}>
                    Ganhos Totais
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#05A74E' }}>
                    R$ {affiliateData.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#05A74E' }}>
                    +34% este mês
                  </p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <ArrowTrendingUpIcon style={{ width: '3rem', height: '3rem', color: '#05A74E' }} />
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem' }}>
                    Este Mês
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#05A74E' }}>
                    R$ {affiliateData.monthlyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                    Média diária: R$ {(affiliateData.monthlyEarnings / 30).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <UserGroupIcon style={{ width: '3rem', height: '3rem', color: '#05A74E' }} />
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem' }}>
                    Indicações
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#FAFBFD' }}>
                    {affiliateData.referrals}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#05A74E' }}>
                    {affiliateData.activeReferrals} ativos ({affiliateData.conversionRate}%)
                  </p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <BanknotesIcon style={{ width: '3rem', height: '3rem', color: '#f59e0b' }} />
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem' }}>
                    A Receber
                  </h3>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>
                    R$ {affiliateData.pendingPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                    Próximo pagamento: 25/jul
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Ferramentas de Marketing */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={cardStyle}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: '#FAFBFD',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <GiftIcon style={{ width: '1.25rem', height: '1.25rem', color: '#05A74E' }} />
                Links de Indicação
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 167, 78, 0.2)'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem' }}>
                    Link Principal
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#05A74E',
                    padding: '0.5rem',
                    background: 'rgba(5, 167, 78, 0.1)',
                    borderRadius: '6px',
                    wordBreak: 'break-all' as const
                  }}>
                    https://coinbitclub.com/ref/ABC123XYZ
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 167, 78, 0.2)'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem' }}>
                    Código de Cupom
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '1.25rem',
                    color: '#05A74E',
                    fontWeight: '800',
                    textAlign: 'center' as const,
                    padding: '1rem',
                    background: 'rgba(5, 167, 78, 0.1)',
                    borderRadius: '6px'
                  }}>
                    COINBIT-ABC123
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: '#FAFBFD',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ChartBarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#05A74E' }} />
                Performance Recente
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  { metric: 'Cliques no Link', value: '247', change: '+18%' },
                  { metric: 'Conversões', value: '8', change: '+33%' },
                  { metric: 'Taxa de Conversão', value: '3.2%', change: '+0.8%' },
                  { metric: 'Ticket Médio', value: 'R$ 297', change: '+5%' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(5, 167, 78, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(5, 167, 78, 0.2)'
                  }}>
                    <div>
                      <div style={{ color: '#AFB4B1', fontSize: '0.875rem' }}>
                        {item.metric}
                      </div>
                      <div style={{ color: '#FAFBFD', fontSize: '1.25rem', fontWeight: '700' }}>
                        {item.value}
                      </div>
                    </div>
                    <div style={{ color: '#05A74E', fontSize: '0.875rem', fontWeight: '600' }}>
                      {item.change}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Histórico de Comissões */}
          <section style={cardStyle}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '2rem',
              color: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <UsersIcon style={{ width: '1.5rem', height: '1.5rem', color: '#05A74E' }} />
              Comissões Recentes
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { user: 'João Silva', plan: 'Premium', amount: 89.10, date: '16/jul/25' },
                { user: 'Maria Santos', plan: 'Pro', amount: 148.50, date: '15/jul/25' },
                { user: 'Pedro Costa', plan: 'Premium', amount: 89.10, date: '14/jul/25' },
                { user: 'Ana Oliveira', plan: 'Enterprise', amount: 297.00, date: '13/jul/25' }
              ].map((commission, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 167, 78, 0.2)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#FAFBFD', marginBottom: '0.25rem' }}>
                      {commission.user} - {commission.plan}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                      {commission.date}
                    </div>
                  </div>
                  
                  <div style={{
                    fontWeight: '700',
                    color: '#05A74E',
                    fontSize: '1.125rem'
                  }}>
                    R$ {commission.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default AffiliateDashboard;

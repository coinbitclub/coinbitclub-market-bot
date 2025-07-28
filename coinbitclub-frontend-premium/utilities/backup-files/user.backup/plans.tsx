import React from 'react';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Componente principal da página de planos
export default function UserPlans() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [upgrading, setUpgrading] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'user') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchPlansData();
  }, []);

  // Buscar dados dos planos
  const fetchPlansData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9997/api/user/plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.currentPlan || null);
        setPlans(data.availablePlans || []);
      } else {
        console.log('API não disponível, usando dados mock...');
        // Dados mock para desenvolvimento
        setCurrentPlan({
          id: 'trial',
          name: 'Plano Teste Grátis',
          type: 'trial',
          maxInvestment: 100,
          features: ['Trading em ambiente testnet', 'Suporte básico', '1 estratégia IA'],
          price: 0,
          validUntil: '2025-07-31T23:59:59Z',
          status: 'active'
        });
        
        setPlans([
          {
            id: 'basic',
            name: 'Plano Básico',
            type: 'basic',
            price: 97,
            priceMonthly: 97,
            maxInvestment: 1000,
            features: [
              '💰 Investimento até $1.000',
              '🤖 2 estratégias de IA',
              '📊 Dashboard completo',
              '📱 Suporte por email',
              '📈 Relatórios mensais',
              '🔒 Trading seguro'
            ],
            popular: false,
            savings: 0
          },
          {
            id: 'premium',
            name: 'Plano Premium',
            type: 'premium',
            price: 197,
            priceMonthly: 247,
            maxInvestment: 5000,
            features: [
              '💰 Investimento até $5.000',
              '🤖 5 estratégias avançadas de IA',
              '📊 Dashboard Premium + Analytics',
              '📱 Suporte prioritário 24/7',
              '📈 Relatórios diários',
              '⚡ Execução de ordens ultra-rápida',
              '🎯 Sinais personalizados',
              '📚 Curso de trading incluso'
            ],
            popular: true,
            savings: 50
          },
          {
            id: 'professional',
            name: 'Plano Profissional',
            type: 'professional',
            price: 497,
            priceMonthly: 597,
            maxInvestment: 25000,
            features: [
              '💰 Investimento até $25.000',
              '🤖 10+ estratégias IA avançadas',
              '📊 Dashboard VIP + IA Analytics',
              '📱 Suporte VIP dedicado',
              '📈 Relatórios em tempo real',
              '⚡ Execução institucional',
              '🎯 Sinais exclusivos VIP',
              '📚 Mentoria 1:1 mensal',
              '🏆 Acesso a comunidade exclusiva',
              '💎 API trading avançada'
            ],
            popular: false,
            savings: 100
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      // Fallback para dados mock
      setCurrentPlan(null);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // Fazer upgrade de plano
  const handleUpgrade = async (planId) => {
    setUpgrading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9997/api/user/upgrade-plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        const data = await response.json();
        alert('🎉 Upgrade realizado com sucesso! Redirecionando para pagamento...');
        window.open(data.paymentUrl, '_blank');
        await fetchPlansData(); // Recarregar dados
      } else {
        // Simulação para desenvolvimento
        alert('🎉 Upgrade simulado com sucesso! Em produção, seria redirecionado para pagamento.');
        await fetchPlansData();
      }
    } catch (error) {
      console.error('Erro no upgrade:', error);
      alert('❌ Erro ao processar upgrade. Tente novamente.');
    } finally {
      setUpgrading(false);
    }
  };

  // Formatação de valores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Estilos
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0B0F1A 0%, #1a1f3a 50%, #2a1810 100%)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: '#ffffff',
    padding: '2rem 1rem'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const planCardStyle = (popular = false) => ({
    background: popular 
      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 105, 180, 0.15) 100%)'
      : 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: popular 
      ? '2px solid rgba(255, 215, 0, 0.5)'
      : '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    position: 'relative',
    boxShadow: popular 
      ? '0 8px 32px rgba(255, 215, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.3)',
    transform: popular ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.3s ease'
  });

  const buttonStyle = {
    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 2rem',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    fontSize: '1.1rem'
  };

  const premiumButtonStyle = {
    background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 2rem',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    fontSize: '1.1rem',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ fontSize: '1.5rem', color: '#00BFFF' }}>⏳ Carregando planos...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planos - CoinBitClub</title>
        <meta name="description" content="Escolha o melhor plano para seu trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(45deg, #FFD700, #FF69B4)', 
                        backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              💎 Planos
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
              Escolha o melhor plano para maximizar seus lucros
            </p>
          </div>
          <button 
            onClick={() => router.push('/user/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        {/* Plano Atual */}
        {currentPlan && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#00BFFF' }}>📋 Seu Plano Atual</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#FFD700' }}>{currentPlan.name}</h4>
                <p style={{ margin: '0 0 1rem 0', opacity: 0.8 }}>
                  Status: <strong style={{ color: '#4CAF50' }}>✅ Ativo</strong>
                </p>
                {currentPlan.validUntil && (
                  <p style={{ margin: '0 0 1rem 0', opacity: 0.8 }}>
                    Válido até: <strong>{formatDate(currentPlan.validUntil)}</strong>
                  </p>
                )}
                <p style={{ margin: '0', opacity: 0.8 }}>
                  Investimento máximo: <strong style={{ color: '#FFD700' }}>
                    {formatCurrency(currentPlan.maxInvestment)}
                  </strong>
                </p>
              </div>
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#00BFFF' }}>Recursos inclusos:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '0.25rem', opacity: 0.9 }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Destaque do Premium */}
        <div style={{
          background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 105, 180, 0.1))',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem', color: '#FFD700' }}>
            🌟 Upgrade Agora e Potencialize Seus Lucros!
          </h2>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Acesse estratégias avançadas de IA e multiplique seus resultados
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#4CAF50' }}>📈 +280%</div>
              <div>Performance média</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#2196F3' }}>🤖 10+</div>
              <div>Estratégias IA</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#FF9800' }}>⚡ 24/7</div>
              <div>Suporte VIP</div>
            </div>
          </div>
        </div>

        {/* Lista de Planos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {plans.map(plan => (
            <div key={plan.id} style={planCardStyle(plan.popular)}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '20px',
                  background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                }}>
                  🔥 MAIS POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: plan.popular ? '#FFD700' : '#00BFFF', fontSize: '1.5rem' }}>
                  {plan.name}
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    fontWeight: 'bold', 
                    color: plan.popular ? '#FFD700' : '#4ECDC4' 
                  }}>
                    {formatCurrency(plan.price)}
                  </div>
                  <div style={{ opacity: 0.8 }}>por mês</div>
                  {plan.savings > 0 && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      color: '#4CAF50',
                      fontSize: '0.9rem',
                      textDecoration: 'line-through',
                      opacity: 0.7
                    }}>
                      Antes: {formatCurrency(plan.priceMonthly)}
                    </div>
                  )}
                  {plan.savings > 0 && (
                    <div style={{ 
                      background: 'rgba(76, 175, 80, 0.2)',
                      color: '#4CAF50',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      marginTop: '0.5rem'
                    }}>
                      💰 Economize ${plan.savings}/mês
                    </div>
                  )}
                </div>

                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFD700' }}>
                    💰 Investimento até {formatCurrency(plan.maxInvestment)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h5 style={{ margin: '0 0 1rem 0', color: '#00BFFF' }}>✨ Recursos inclusos:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem', opacity: 0.9 }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading || (currentPlan && currentPlan.type === plan.type)}
                style={plan.popular ? premiumButtonStyle : buttonStyle}
              >
                {upgrading ? '⏳ Processando...' :
                 currentPlan && currentPlan.type === plan.type ? '✅ Plano Atual' :
                 `🚀 Escolher ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 2rem 0', color: '#00BFFF', textAlign: 'center' }}>❓ Perguntas Frequentes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#FFD700' }}>🔒 Os pagamentos são seguros?</h4>
              <p style={{ margin: 0, opacity: 0.8 }}>
                Sim! Utilizamos criptografia de nível bancário e processadores de pagamento certificados.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#FFD700' }}>🔄 Posso cancelar a qualquer momento?</h4>
              <p style={{ margin: 0, opacity: 0.8 }}>
                Sim, você pode cancelar seu plano a qualquer momento sem taxas adicionais.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#FFD700' }}>📞 Como funciona o suporte?</h4>
              <p style={{ margin: 0, opacity: 0.8 }}>
                Oferecemos suporte por email, chat e WhatsApp de acordo com seu plano.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#FFD700' }}>💡 Posso fazer upgrade depois?</h4>
              <p style={{ margin: 0, opacity: 0.8 }}>
                Claro! Você pode fazer upgrade para um plano superior a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        {/* Garantia */}
        <div style={{
          background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1), rgba(46, 125, 50, 0.1))',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#4CAF50' }}>🛡️ Garantia de 7 dias</h3>
          <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
            Não está satisfeito? Oferecemos reembolso total em até 7 dias, sem perguntas.
          </p>
        </div>
      </div>
    </>
  );
}

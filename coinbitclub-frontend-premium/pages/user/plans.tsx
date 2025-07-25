import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  priceMonthly: number;
  maxInvestment: number;
  features: string[];
  popular?: boolean;
  savings?: number;
}

interface CurrentPlan {
  id: string;
  name: string;
  type: string;
  maxInvestment: number;
  features: string[];
  price: number;
  validUntil?: string;
  status: string;
}

const UserPlans: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchPlansData();
  }, []);

  const fetchPlansData = async () => {
    try {
      setLoading(true);
      
      // Mock data para desenvolvimento
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
            '🤖 Todas as estratégias de IA disponíveis',
            '📊 Dashboard Profissional + API',
            '📱 Suporte VIP dedicado',
            '📈 Relatórios em tempo real',
            '⚡ Execução prioritária',
            '🎯 Sinais VIP exclusivos',
            '📚 Mentoria personalizada',
            '🏆 Copy trading de traders profissionais',
            '📊 Ferramentas de análise avançada'
          ],
          popular: false,
          savings: 100
        }
      ]);
      
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true);
    try {
      // Simular upgrade
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Redirecionando para pagamento do plano ${planId}`);
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid transparent',
            borderTop: '3px solid #fbbf24',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'white' }}>Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(251, 191, 36, 0.3)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="/" style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fbbf24',
                textDecoration: 'none'
              }}>
                CoinBitClub
              </Link>
              <span style={{
                marginLeft: '16px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>Planos</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <Link 
                href="/user/dashboard"
                style={{
                  backgroundColor: '#fbbf24',
                  color: 'black',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Dashboard
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer'
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <nav style={{
            display: 'flex',
            gap: '32px',
            padding: '16px 0'
          }}>
            <Link href="/user/dashboard" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Dashboard
            </Link>
            <Link href="/user/operations" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Operações
            </Link>
            <Link href="/user/plans" style={{
              color: '#fbbf24',
              borderBottom: '2px solid #fbbf24',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Planos
            </Link>
            <Link href="/user/settings" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Configurações
            </Link>
          </nav>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        {/* Plano Atual */}
        {currentPlan && (
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '16px'
            }}>Seu Plano Atual</h2>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  margin: '0 0 8px 0'
                }}>{currentPlan.name}</h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '0 0 4px 0'
                }}>
                  Investimento máximo: {formatCurrency(currentPlan.maxInvestment)}
                </p>
                {currentPlan.validUntil && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    Válido até: {new Date(currentPlan.validUntil).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              
              <div style={{
                padding: '8px 16px',
                backgroundColor: currentPlan.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: currentPlan.status === 'active' ? '#10b981' : '#ef4444',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {currentPlan.status === 'active' ? 'Ativo' : 'Inativo'}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '8px',
              marginTop: '16px'
            }}>
              {currentPlan.features.map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    marginRight: '8px'
                  }}></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Título dos Planos Disponíveis */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 16px 0'
          }}>Upgrade Seu Plano</h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>Escolha o plano ideal para maximizar seus lucros</p>
        </div>

        {/* Grid de Planos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '32px',
          marginBottom: '64px'
        }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '32px',
              border: plan.popular ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              transition: 'transform 0.3s ease'
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#fbbf24',
                  color: 'black',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  MAIS POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 8px 0'
                }}>{plan.name}</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#fbbf24'
                  }}>${plan.price}</span>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '16px'
                  }}>/mês</span>
                </div>

                {plan.savings > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}>
                    Economize ${plan.savings}/mês
                  </div>
                )}
              </div>

              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  Investimento até {formatCurrency(plan.maxInvestment)}
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                {plan.features.map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      fontSize: '12px',
                      color: 'white'
                    }}>✓</div>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading}
                style={{
                  width: '100%',
                  backgroundColor: plan.popular ? '#fbbf24' : '#10b981',
                  color: plan.popular ? 'black' : 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: upgrading ? 'not-allowed' : 'pointer',
                  opacity: upgrading ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {upgrading ? 'Processando...' : `Assinar ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Garantia */}
        <div style={{
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>🛡️</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px'
          }}>Garantia de 30 Dias</h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Teste nosso serviço por 30 dias. Se não estiver satisfeito com os resultados, 
            devolvemos 100% do seu dinheiro, sem perguntas.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserPlans;

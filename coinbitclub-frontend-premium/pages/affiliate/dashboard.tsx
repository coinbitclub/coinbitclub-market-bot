import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface AffiliateData {
  totalEarnings: number;
  monthlyEarnings: number;
  referrals: number;
  activeReferrals: number;
  conversionRate: number;
  tier: string;
  nextTierProgress: number;
  pendingPayment: number;
}

const AffiliateDashboard: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<AffiliateData>({
    totalEarnings: 15847.23,
    monthlyEarnings: 3294.56,
    referrals: 47,
    activeReferrals: 32,
    conversionRate: 68.1,
    tier: 'Platinum',
    nextTierProgress: 75,
    pendingPayment: 1247.89
  });

  const [aiInsights] = useState([
    "📈 Seus ganhos aumentaram 34% este mês comparado ao anterior",
    "🎯 Foque em conversão: 15 leads ainda não convertidos",
    "💡 Melhor horário para posts: 14h-16h (32% mais engajamento)",
    "🚀 Próximo tier em 12 indicações. Bônus: +15% comissão!"
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    // Simular carregamento
    setTimeout(() => setLoading(false), 1000);
  }, []);

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
            borderTop: '3px solid #05a74e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'white' }}>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
      color: '#FAFBFD'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(5, 167, 78, 0.05)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(5, 167, 78, 0.1)',
        padding: '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Link href="/" style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #05A74E, #6EA297)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none'
            }}>
              CoinBitClub
            </Link>
            <span style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>Dashboard Afiliado - {affiliateData.tier}</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: `linear-gradient(90deg, #05A74E ${affiliateData.nextTierProgress}%, rgba(5, 167, 78, 0.2) ${affiliateData.nextTierProgress}%)`,
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Próximo Tier: {affiliateData.nextTierProgress}%
            </div>
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

      {/* Navigation */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 32px'
        }}>
          <nav style={{
            display: 'flex',
            gap: '32px',
            padding: '16px 0'
          }}>
            <Link href="/affiliate/dashboard" style={{
              color: '#05a74e',
              borderBottom: '2px solid #05a74e',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Dashboard
            </Link>
            <Link href="/affiliate/commissions" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Comissões
            </Link>
            <Link href="/user/dashboard" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Área do Usuário
            </Link>
          </nav>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 32px'
      }}>
        {/* Cards de Estatísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(5, 167, 78, 0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>Ganhos Totais</h3>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(5, 167, 78, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>💰</div>
            </div>
            <p style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#05A74E',
              margin: '0 0 8px 0'
            }}>{formatCurrency(affiliateData.totalEarnings)}</p>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              +34% vs mês anterior
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>Este Mês</h3>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>📈</div>
            </div>
            <p style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#fbbf24',
              margin: '0 0 8px 0'
            }}>{formatCurrency(affiliateData.monthlyEarnings)}</p>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              {Math.round(affiliateData.monthlyEarnings / 30)} por dia (média)
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>Indicações</h3>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>👥</div>
            </div>
            <p style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#3b82f6',
              margin: '0 0 8px 0'
            }}>{affiliateData.referrals}</p>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              {affiliateData.activeReferrals} ativos ({affiliateData.conversionRate.toFixed(1)}% conversão)
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>Pendente</h3>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>⏳</div>
            </div>
            <p style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#a855f7',
              margin: '0 0 8px 0'
            }}>{formatCurrency(affiliateData.pendingPayment)}</p>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              Próximo pagamento em 3 dias
            </p>
          </div>
        </div>

        {/* Insights da IA */}
        <div style={{
          background: 'rgba(5, 167, 78, 0.05)',
          border: '1px solid rgba(5, 167, 78, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #05A74E, #6EA297)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              fontSize: '24px'
            }}>🤖</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              color: '#FAFBFD'
            }}>
              Insights da IA Personalizada
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {aiInsights.map((insight, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                {insight}
              </div>
            ))}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          <Link href="/affiliate/commissions" style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.3s ease',
            display: 'block'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(5, 167, 78, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '20px'
              }}>💸</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: '#05A74E'
              }}>Ver Comissões</h3>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '14px'
            }}>
              Acompanhe todas suas comissões e histórico de pagamentos
            </p>
          </Link>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '20px'
              }}>🔗</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: '#fbbf24'
              }}>Link de Indicação</h3>
            </div>
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              https://coinbitclub.com/ref/ABC123
            </div>
            <button style={{
              backgroundColor: '#fbbf24',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '12px',
              width: '100%'
            }}>
              Copiar Link
            </button>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '20px'
              }}>📊</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: '#3b82f6'
              }}>Materiais de Marketing</h3>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '0 0 16px 0',
              fontSize: '14px'
            }}>
              Banners, vídeos e conteúdo para suas redes sociais
            </p>
            <button style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}>
              Acessar Materiais
            </button>
          </div>
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

export default AffiliateDashboard;

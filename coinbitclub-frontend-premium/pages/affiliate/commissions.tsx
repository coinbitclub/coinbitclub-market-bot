import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Commission {
  id: string;
  referralName: string;
  referralEmail: string;
  type: string;
  planType: string;
  amount: number;
  percentage: number;
  date: string;
  status: string;
  payoutDate?: string | null;
}

interface Payout {
  id: string;
  amount: number;
  commissionsCount: number;
  date: string;
  status: string;
  paymentMethod: string;
}

interface Summary {
  totalEarned: number;
  totalPaid: number;
  pendingAmount: number;
  thisMonth: number;
  thisYear: number;
}

const AffiliateCommissions: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalEarned: 0,
    totalPaid: 0,
    pendingAmount: 0,
    thisMonth: 0,
    thisYear: 0
  });
  const [activeTab, setActiveTab] = useState('commissions');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCommissionsData();
  }, []);

  const fetchCommissionsData = async () => {
    try {
      setLoading(true);
      
      // Mock data para desenvolvimento
      setSummary({
        totalEarned: 4567.80,
        totalPaid: 3250.00,
        pendingAmount: 1317.80,
        thisMonth: 645.20,
        thisYear: 4567.80
      });

      setCommissions([
        {
          id: '1',
          referralName: 'João Silva',
          referralEmail: 'joao@email.com',
          type: 'signup',
          planType: 'Premium',
          amount: 49.50,
          percentage: 25,
          date: '2024-01-24T10:30:00Z',
          status: 'paid',
          payoutDate: '2024-01-25T00:00:00Z'
        },
        {
          id: '2',
          referralName: 'Maria Santos',
          referralEmail: 'maria@email.com',
          type: 'renewal',
          planType: 'Basic',
          amount: 19.40,
          percentage: 20,
          date: '2024-01-23T15:45:00Z',
          status: 'pending',
          payoutDate: null
        },
        {
          id: '3',
          referralName: 'Pedro Costa',
          referralEmail: 'pedro@email.com',
          type: 'upgrade',
          planType: 'Professional',
          amount: 99.00,
          percentage: 30,
          date: '2024-01-22T09:15:00Z',
          status: 'paid',
          payoutDate: '2024-01-25T00:00:00Z'
        }
      ]);

      setPayouts([
        {
          id: '1',
          amount: 168.90,
          commissionsCount: 5,
          date: '2024-01-25T00:00:00Z',
          status: 'completed',
          paymentMethod: 'Bank Transfer'
        },
        {
          id: '2',
          amount: 245.60,
          commissionsCount: 7,
          date: '2024-01-15T00:00:00Z',
          status: 'completed',
          paymentMethod: 'PayPal'
        }
      ]);
      
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#fbbf24';
      case 'processing':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    if (filter === 'all') return true;
    return commission.status === filter;
  });

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
          <p style={{ color: 'white' }}>Carregando comissões...</p>
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
        padding: '24px 32px'
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
            }}>Comissões</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Link 
              href="/affiliate/dashboard"
              style={{
                backgroundColor: '#05a74e',
                color: 'white',
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
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Dashboard
            </Link>
            <Link href="/affiliate/commissions" style={{
              color: '#05a74e',
              borderBottom: '2px solid #05a74e',
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
        {/* Resumo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px'
            }}>Total Ganho</h3>
            <p style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#05A74E',
              margin: 0
            }}>{formatCurrency(summary.totalEarned)}</p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px'
            }}>Total Pago</h3>
            <p style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#10b981',
              margin: 0
            }}>{formatCurrency(summary.totalPaid)}</p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px'
            }}>Pendente</h3>
            <p style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#fbbf24',
              margin: 0
            }}>{formatCurrency(summary.pendingAmount)}</p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px'
            }}>Este Mês</h3>
            <p style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#3b82f6',
              margin: 0
            }}>{formatCurrency(summary.thisMonth)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('commissions')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'commissions' ? '#05a74e' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '18px',
              fontWeight: '600',
              padding: '16px 0',
              borderBottom: activeTab === 'commissions' ? '2px solid #05a74e' : 'none',
              cursor: 'pointer'
            }}
          >
            Comissões
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'payouts' ? '#05a74e' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '18px',
              fontWeight: '600',
              padding: '16px 0',
              borderBottom: activeTab === 'payouts' ? '2px solid #05a74e' : 'none',
              cursor: 'pointer'
            }}
          >
            Pagamentos
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'commissions' && (
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                color: '#FAFBFD'
              }}>Histórico de Comissões</h2>
              
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white'
                }}
              >
                <option value="all">Todas</option>
                <option value="paid">Pagas</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Indicado</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Tipo</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Plano</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Comissão</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Status</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <td style={{
                        padding: '12px',
                        color: 'white'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{commission.referralName}</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'rgba(255, 255, 255, 0.5)' 
                          }}>{commission.referralEmail}</div>
                        </div>
                      </td>
                      <td style={{
                        padding: '12px',
                        color: 'white',
                        textTransform: 'capitalize'
                      }}>{commission.type}</td>
                      <td style={{
                        padding: '12px',
                        color: 'white'
                      }}>{commission.planType}</td>
                      <td style={{
                        padding: '12px',
                        color: '#05A74E',
                        fontWeight: '600'
                      }}>
                        {formatCurrency(commission.amount)}
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'rgba(255, 255, 255, 0.5)' 
                        }}>
                          {commission.percentage}% comissão
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: `${getStatusColor(commission.status)}20`,
                          color: getStatusColor(commission.status)
                        }}>
                          {getStatusText(commission.status)}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px'
                      }}>{formatDateTime(commission.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCommissions.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px 0'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>💰</div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>Nenhuma comissão encontrada</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '24px',
              color: '#FAFBFD'
            }}>Histórico de Pagamentos</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {payouts.map((payout) => (
                <div key={payout.id} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#05A74E',
                      marginBottom: '4px'
                    }}>
                      {formatCurrency(payout.amount)}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px'
                    }}>
                      {payout.commissionsCount} comissões • {payout.paymentMethod}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {formatDateTime(payout.date)}
                    </div>
                  </div>
                  
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: `${getStatusColor(payout.status)}20`,
                    color: getStatusColor(payout.status)
                  }}>
                    {getStatusText(payout.status)}
                  </span>
                </div>
              ))}
            </div>

            {payouts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px 0'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>💳</div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>Nenhum pagamento encontrado</p>
              </div>
            )}
          </div>
        )}
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

export default AffiliateCommissions;

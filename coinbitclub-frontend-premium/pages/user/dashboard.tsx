import React from 'react';
import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string;
  accountType: string;
}

interface Balance {
  exchange: string;
  environment: string;
  balance: number;
  balance_type: string;
  last_updated: string;
}

interface Operation {
  id: string;
  symbol: string;
  side: string;
  entry_price: number;
  exit_price?: number;
  profit: number;
  status: string;
  exchange: string;
  environment: string;
  opened_at: string;
  closed_at?: string;
}

interface Statistics {
  totalOperations: number;
  winningTrades: number;
  completedTrades: number;
  successRate: number;
  totalProfit: number;
  avgProfit: number;
}

interface Alerts {
  needsUpgrade: boolean;
  lowBalance: boolean;
  minBalance: number;
  currentBalance: number;
}

interface DashboardData {
  user: UserData;
  balances: Balance[];
  recentOperations: Operation[];
  statistics: Statistics;
  alerts: Alerts;
}

const UserDashboard: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar dados da API Railway integrada primeiro
      const railwayResponse = await fetch('http://localhost:9997/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (railwayResponse.ok) {
        const data = await railwayResponse.json();
        setDashboardData(data);
        return;
      }

      // Fallback para dados mockados
      const mockData: DashboardData = {
        user: {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          role: 'user',
          country: 'Brasil',
          accountType: 'testnet'
        },
        balances: [
          {
            exchange: 'binance',
            environment: 'testnet',
            balance: 1250.75,
            balance_type: 'demo',
            last_updated: new Date().toISOString()
          },
          {
            exchange: 'bybit',
            environment: 'testnet',
            balance: 890.50,
            balance_type: 'demo',
            last_updated: new Date().toISOString()
          }
        ],
        recentOperations: [
          {
            id: '1',
            symbol: 'BTCUSDT',
            side: 'LONG',
            entry_price: 43500.00,
            exit_price: 44200.00,
            profit: 70.00,
            status: 'completed',
            exchange: 'binance',
            environment: 'testnet',
            opened_at: '2024-01-20T10:30:00Z',
            closed_at: '2024-01-20T11:15:00Z'
          }
        ],
        statistics: {
          totalOperations: 45,
          winningTrades: 32,
          completedTrades: 42,
          successRate: 76.19,
          totalProfit: 1247.85,
          avgProfit: 29.71
        },
        alerts: {
          needsUpgrade: true,
          lowBalance: false,
          minBalance: 60,
          currentBalance: 2141.25
        }
      };
      
      setDashboardData(mockData);

    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : 'USD'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
          <p style={{ color: 'white' }}>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
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
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>×</div>
          <p style={{ color: 'white', marginBottom: '16px' }}>{error || 'Erro ao carregar dados'}</p>
          <button 
            onClick={fetchDashboardData}
            style={{
              backgroundColor: '#fbbf24',
              color: 'black',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { user, balances, recentOperations, statistics, alerts } = dashboardData;

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
              }}>Dashboard do Usuário</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{ color: 'white' }}>Olá, {user.name}</span>
              <Link 
                href="/user/settings"
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
                Configurações
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
              color: '#fbbf24',
              borderBottom: '2px solid #fbbf24',
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
              color: 'rgba(255, 255, 255, 0.7)',
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
            {user.role === 'affiliate' && (
              <div style={{ display: 'flex', gap: '32px' }}>
                <Link href="/affiliate/dashboard" style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  paddingBottom: '8px',
                  textDecoration: 'none'
                }}>
                  Gestão de Indicados
                </Link>
                <Link href="/affiliate/commissions" style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  paddingBottom: '8px',
                  textDecoration: 'none'
                }}>
                  Comissões
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        {/* Alertas */}
        {(alerts.needsUpgrade || alerts.lowBalance) && (
          <div style={{ marginBottom: '32px' }}>
            {alerts.needsUpgrade && (
              <div style={{
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fbbf24',
                    borderRadius: '50%',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>!</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      color: '#fbbf24',
                      fontWeight: '500',
                      margin: '0 0 4px 0'
                    }}>Migração para Conta Paga</h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      Você está usando uma conta testnet. Migre para uma conta paga para operar com dinheiro real.
                    </p>
                  </div>
                  <Link 
                    href="/user/plans"
                    style={{
                      backgroundColor: '#fbbf24',
                      color: 'black',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                  >
                    Ver Planos
                  </Link>
                </div>
              </div>
            )}
            
            {alerts.lowBalance && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>!</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      color: '#ef4444',
                      fontWeight: '500',
                      margin: '0 0 4px 0'
                    }}>Saldo Baixo</h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      Seu saldo está abaixo do mínimo de {formatCurrency(alerts.minBalance)}. 
                      O robô só abre novas operações com saldo suficiente.
                    </p>
                  </div>
                  <button style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    Adicionar Saldo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estatísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: '0 0 8px 0'
                }}>Total de Operações</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0
                }}>{statistics.totalOperations}</p>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>📊</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: '0 0 8px 0'
                }}>Taxa de Acerto</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  margin: '0 0 4px 0'
                }}>{statistics.successRate.toFixed(1)}%</p>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>{statistics.winningTrades}/{statistics.completedTrades}</p>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#10b981',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>📈</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: '0 0 8px 0'
                }}>Lucro Total</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: statistics.totalProfit >= 0 ? '#10b981' : '#ef4444',
                  margin: 0
                }}>
                  {formatCurrency(statistics.totalProfit, user.country === 'Brasil' ? 'BRL' : 'USD')}
                </p>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: statistics.totalProfit >= 0 ? '#10b981' : '#ef4444',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>{statistics.totalProfit >= 0 ? '📈' : '📉'}</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: '0 0 8px 0'
                }}>Lucro Médio</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: statistics.avgProfit >= 0 ? '#10b981' : '#ef4444',
                  margin: 0
                }}>
                  {formatCurrency(statistics.avgProfit, user.country === 'Brasil' ? 'BRL' : 'USD')}
                </p>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#fbbf24',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>💰</div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '32px'
        }}>
          {/* Saldos nas Exchanges */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>Saldos nas Exchanges</h2>
              <div style={{
                width: '24px',
                height: '24px',
                color: '#fbbf24'
              }}>💰</div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              {balances.map((balance, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      marginRight: '12px',
                      backgroundColor: balance.exchange === 'binance' ? '#fbbf24' : '#f97316'
                    }}></div>
                    <div>
                      <p style={{
                        color: 'white',
                        fontWeight: '500',
                        margin: '0 0 4px 0',
                        textTransform: 'capitalize'
                      }}>{balance.exchange}</p>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        margin: 0,
                        textTransform: 'capitalize'
                      }}>
                        {balance.environment} • {balance.balance_type}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      color: 'white',
                      fontWeight: 'bold',
                      margin: '0 0 4px 0'
                    }}>
                      {formatCurrency(balance.balance, user.country === 'Brasil' ? 'BRL' : 'USD')}
                    </p>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '12px',
                      margin: 0
                    }}>
                      {formatDateTime(balance.last_updated)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginBottom: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  color: 'white',
                  fontWeight: '500'
                }}>Saldo Total:</span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fbbf24'
                }}>
                  {formatCurrency(
                    balances.reduce((sum, balance) => sum + balance.balance, 0),
                    user.country === 'Brasil' ? 'BRL' : 'USD'
                  )}
                </span>
              </div>
            </div>

            <button style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}>
              + Adicionar Saldo Pré-pago
            </button>
          </div>

          {/* Operações Recentes */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>Operações Recentes</h2>
              <Link href="/user/operations" style={{
                color: '#fbbf24',
                fontSize: '14px',
                textDecoration: 'none'
              }}>
                Ver Todas
              </Link>
            </div>

            <div>
              {recentOperations.length > 0 ? (
                recentOperations.map((operation) => (
                  <div key={operation.id} style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          marginRight: '12px',
                          backgroundColor: operation.side === 'LONG' ? '#10b981' : '#ef4444'
                        }}></div>
                        <span style={{
                          color: 'white',
                          fontWeight: '500'
                        }}>{operation.symbol}</span>
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: operation.side === 'LONG' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: operation.side === 'LONG' ? '#10b981' : '#ef4444'
                        }}>
                          {operation.side}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          marginRight: '4px',
                          backgroundColor: operation.status === 'completed' ? '#10b981' : operation.status === 'active' ? '#fbbf24' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '10px'
                        }}>{operation.status === 'completed' ? '✓' : operation.status === 'active' ? '⏱' : '✗'}</div>
                        <span style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '14px',
                          textTransform: 'capitalize'
                        }}>{operation.status}</span>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          margin: '0 0 4px 0'
                        }}>Entrada:</p>
                        <p style={{
                          color: 'white',
                          margin: 0
                        }}>${operation.entry_price.toLocaleString()}</p>
                      </div>
                      {operation.exit_price && (
                        <div>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            margin: '0 0 4px 0'
                          }}>Saída:</p>
                          <p style={{
                            color: 'white',
                            margin: 0
                          }}>${operation.exit_price.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          margin: '0 0 4px 0'
                        }}>Lucro:</p>
                        <p style={{
                          fontWeight: '500',
                          color: operation.profit >= 0 ? '#10b981' : '#ef4444',
                          margin: 0
                        }}>
                          {formatCurrency(operation.profit, user.country === 'Brasil' ? 'BRL' : 'USD')}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          margin: '0 0 4px 0'
                        }}>Exchange:</p>
                        <p style={{
                          color: 'white',
                          margin: 0,
                          textTransform: 'capitalize'
                        }}>{operation.exchange}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 0'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                  }}>📊</div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>Nenhuma operação encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relatório IA e Sinais */}
        <div style={{
          marginTop: '32px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '24px'
          }}>Relatório IA - Últimas 4 Horas</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{
                  color: '#3b82f6',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>Sinais Identificados</h3>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 4px 0'
                }}>12</p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  margin: 0
                }}>Últimas 4h</p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{
                  color: '#10b981',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>Confiança Média</h3>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 4px 0'
                }}>87.5%</p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  margin: 0
                }}>Análise IA</p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{
                  color: '#8b5cf6',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>Próximo Sinal</h3>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 4px 0'
                }}>~15min</p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  margin: 0
                }}>Estimativa</p>
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            <h4 style={{
              color: 'white',
              fontWeight: '500',
              marginBottom: '8px'
            }}>Recomendação Atual:</h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0
            }}>
              🤖 <strong>BTCUSDT LONG</strong> - Confiança: 92% | RSI oversold detectado, MACD em crossover bullish. 
              Entrada recomendada: $43,200 | Stop Loss: $42,500 | Take Profit: $44,800
            </p>
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

export default UserDashboard;

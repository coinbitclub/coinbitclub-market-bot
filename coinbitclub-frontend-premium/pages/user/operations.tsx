import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Operation {
  id: string;
  exchange: string;
  symbol: string;
  type: string;
  status: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit?: number;
  result?: number;
  resultPercentage?: number;
  investedAmount: number;
  openedAt: string;
  closedAt?: string;
  aiJustification?: string;
  commission: number;
  fees: number;
  duration?: number;
}

interface OperationsStats {
  totalOperations: number;
  profitableOperations: number;
  lossOperations: number;
  successRate: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  averageResult: number;
  totalFees: number;
}

const UserOperations: NextPage = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [stats, setStats] = useState<OperationsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    exchange: '',
    symbol: '',
    type: '',
    status: 'closed'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadOperations();
  }, []);

  const loadOperations = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockOperations: Operation[] = [
        {
          id: '1',
          exchange: 'binance',
          symbol: 'BTCUSDT',
          type: 'LONG',
          status: 'closed',
          entryPrice: 43500.00,
          exitPrice: 44200.00,
          quantity: 0.1,
          leverage: 10,
          stopLoss: 42800.00,
          takeProfit: 44500.00,
          result: 70.00,
          resultPercentage: 1.61,
          investedAmount: 435.00,
          openedAt: '2024-01-20T10:30:00Z',
          closedAt: '2024-01-20T11:15:00Z',
          aiJustification: 'RSI oversold detectado, MACD em crossover bullish',
          commission: 2.18,
          fees: 1.50,
          duration: 0.75
        },
        {
          id: '2',
          exchange: 'bybit',
          symbol: 'ETHUSDT',
          type: 'SHORT',
          status: 'closed',
          entryPrice: 2450.00,
          exitPrice: 2420.00,
          quantity: 1.0,
          leverage: 5,
          stopLoss: 2480.00,
          takeProfit: 2400.00,
          result: 150.00,
          resultPercentage: 6.12,
          investedAmount: 490.00,
          openedAt: '2024-01-19T14:20:00Z',
          closedAt: '2024-01-19T16:45:00Z',
          aiJustification: 'Resistência forte em $2450, momentum bearish confirmado',
          commission: 2.45,
          fees: 1.20,
          duration: 2.42
        }
      ];

      const mockStats: OperationsStats = {
        totalOperations: 45,
        profitableOperations: 32,
        lossOperations: 13,
        successRate: 71.11,
        totalProfit: 1847.50,
        totalLoss: -599.65,
        netResult: 1247.85,
        averageResult: 27.73,
        totalFees: 95.40
      };

      setOperations(mockOperations);
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar operações:', error);
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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getResultColor = (result?: number) => {
    if (!result) return '#6b7280';
    return result > 0 ? '#10b981' : '#ef4444';
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
          <p style={{ color: 'white' }}>Carregando operações...</p>
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
              }}>Operações</span>
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
              color: '#fbbf24',
              borderBottom: '2px solid #fbbf24',
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
          </nav>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        {/* Estatísticas */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              }}>{stats.totalOperations}</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                margin: '0 0 8px 0'
              }}>Taxa de Sucesso</p>
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#10b981',
                margin: 0
              }}>{stats.successRate.toFixed(1)}%</p>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '4px 0 0 0'
              }}>{stats.profitableOperations}/{stats.totalOperations}</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                margin: '0 0 8px 0'
              }}>Resultado Líquido</p>
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: stats.netResult >= 0 ? '#10b981' : '#ef4444',
                margin: 0
              }}>{formatCurrency(stats.netResult)}</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                margin: '0 0 8px 0'
              }}>Resultado Médio</p>
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: stats.averageResult >= 0 ? '#10b981' : '#ef4444',
                margin: 0
              }}>{formatCurrency(stats.averageResult)}</p>
            </div>
          </div>
        )}

        {/* Lista de Operações */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>Histórico de Operações</h2>
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}>
              Exportar CSV
            </button>
          </div>

          {/* Filtros */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            <select 
              value={filters.exchange}
              onChange={(e) => setFilters({...filters, exchange: e.target.value})}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white'
              }}
            >
              <option value="">Todas as Exchanges</option>
              <option value="binance">Binance</option>
              <option value="bybit">Bybit</option>
            </select>

            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white'
              }}
            >
              <option value="">Todos os Tipos</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>

            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white'
              }}
            >
              <option value="closed">Fechadas</option>
              <option value="active">Ativas</option>
              <option value="all">Todas</option>
            </select>

            <button 
              onClick={loadOperations}
              style={{
                backgroundColor: '#fbbf24',
                color: 'black',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Filtrar
            </button>
          </div>

          {/* Tabela de Operações */}
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
                  }}>Moeda</th>
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
                  }}>Entrada</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Saída</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Resultado</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Data</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>Exchange</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((operation) => (
                  <tr key={operation.id} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <td style={{
                      padding: '12px',
                      color: 'white',
                      fontWeight: '500'
                    }}>{operation.symbol}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: operation.type === 'LONG' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: operation.type === 'LONG' ? '#10b981' : '#ef4444'
                      }}>
                        {operation.type}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px',
                      color: 'white'
                    }}>${operation.entryPrice.toLocaleString()}</td>
                    <td style={{
                      padding: '12px',
                      color: 'white'
                    }}>{operation.exitPrice ? `$${operation.exitPrice.toLocaleString()}` : '-'}</td>
                    <td style={{
                      padding: '12px',
                      color: getResultColor(operation.result),
                      fontWeight: '500'
                    }}>
                      {operation.result ? formatCurrency(operation.result) : '-'}
                      {operation.resultPercentage && (
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          ({operation.resultPercentage.toFixed(2)}%)
                        </div>
                      )}
                    </td>
                    <td style={{
                      padding: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px'
                    }}>{formatDateTime(operation.openedAt)}</td>
                    <td style={{
                      padding: '12px',
                      color: 'white',
                      textTransform: 'capitalize'
                    }}>{operation.exchange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {operations.length === 0 && (
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserOperations;

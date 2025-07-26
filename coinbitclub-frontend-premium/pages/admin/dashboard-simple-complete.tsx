import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const SimpleDashboard = () => {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📊 Buscando dados do dashboard...');
      
      const response = await fetch('/api/admin/dashboard-complete-fixed');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Dados recebidos:', result);
      
      setData(result);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading && !data) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', fontSize: '24px' }}>⏳</div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', fontSize: '24px' }}>❌</div>
          <p style={{ color: 'red', marginBottom: '20px' }}>Erro: {error}</p>
          <button 
            onClick={fetchData}
            style={{
              backgroundColor: '#4A9EDB',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #4A9EDB 0%, #BA55D3 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Head>
        <title>Dashboard Admin - CoinBitClub</title>
      </Head>

      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '28px',
            background: 'linear-gradient(45deg, #4A9EDB, #BA55D3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚀 Dashboard Completo - CoinBitClub
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              Última atualização: {data?.timestamp ? formatDate(data.timestamp) : '--'}
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#4A9EDB',
                color: 'white',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
              }}
              title="Atualizar dados"
            >
              {loading ? '🔄' : '↻'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* LEITURA DO MERCADO */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', color: '#333' }}>
            🎯 Leitura do Mercado
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div style={{
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: data?.marketReading?.direction === 'LONG' ? '#d4edda' : 
                              data?.marketReading?.direction === 'SHORT' ? '#f8d7da' : '#fff3cd',
              color: data?.marketReading?.direction === 'LONG' ? '#155724' : 
                     data?.marketReading?.direction === 'SHORT' ? '#721c24' : '#856404'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                {data?.marketReading?.direction === 'LONG' ? '⬆️' : 
                 data?.marketReading?.direction === 'SHORT' ? '⬇️' : '➡️'} {data?.marketReading?.direction || 'NEUTRO'}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Direção do Sistema</div>
            </div>
            
            <div style={{
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: '#e7e3ff',
              color: '#6f42c1'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                📊 {data?.marketReading?.confidence || 0}%
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Confiança</div>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            borderLeft: '4px solid #4A9EDB'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Justificativa:</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
              {data?.marketReading?.justification || 'Análise em processamento...'}
            </p>
          </div>
        </div>

        {/* KPIs PRINCIPAIS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Usuários Total</p>
                <p style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                  {data?.users?.total || 0}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#28a745' }}>
                  +{data?.users?.newToday || 0} hoje
                </p>
              </div>
              <div style={{ fontSize: '40px' }}>👥</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Operações</p>
                <p style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                  {data?.trading?.totalOperations || 0}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#fd7e14' }}>
                  {data?.trading?.openOperations || 0} abertas
                </p>
              </div>
              <div style={{ fontSize: '40px' }}>📈</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Assertividade Hoje</p>
                <p style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                  {formatPercentage(data?.performance?.accuracy?.today || 0)}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Histórico: {formatPercentage(data?.performance?.accuracy?.historical || 0)}
                </p>
              </div>
              <div style={{ fontSize: '40px' }}>🎯</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Retorno Hoje</p>
                <p style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                  {formatCurrency(data?.performance?.returns?.today || 0)}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Total: {formatCurrency(data?.performance?.returns?.historical || 0)}
                </p>
              </div>
              <div style={{ fontSize: '40px' }}>💰</div>
            </div>
          </div>
        </div>

        {/* MICROSERVIÇOS */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', color: '#333' }}>
            ⚙️ Status dos Microserviços
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Signal Ingestor</h4>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: data?.microservices?.signalIngestor?.status === 'online' ? '#d4edda' : '#f8d7da',
                  color: data?.microservices?.signalIngestor?.status === 'online' ? '#155724' : '#721c24'
                }}>
                  {data?.microservices?.signalIngestor?.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>Processados 24h: {data?.microservices?.signalIngestor?.processed24h || 0}</p>
                <p style={{ margin: '5px 0' }}>Erros 24h: {data?.microservices?.signalIngestor?.errors24h || 0}</p>
              </div>
            </div>

            <div style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Decision Engine</h4>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: data?.microservices?.decisionEngine?.status === 'online' ? '#d4edda' : '#f8d7da',
                  color: data?.microservices?.decisionEngine?.status === 'online' ? '#155724' : '#721c24'
                }}>
                  {data?.microservices?.decisionEngine?.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>Decisões 24h: {data?.microservices?.decisionEngine?.decisions24h || 0}</p>
                <p style={{ margin: '5px 0' }}>Precisão: {formatPercentage(data?.microservices?.decisionEngine?.accuracy || 0)}</p>
              </div>
            </div>

            <div style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Order Executor</h4>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: data?.microservices?.orderExecutor?.status === 'online' ? '#d4edda' : '#f8d7da',
                  color: data?.microservices?.orderExecutor?.status === 'online' ? '#155724' : '#721c24'
                }}>
                  {data?.microservices?.orderExecutor?.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>Executadas 24h: {data?.microservices?.orderExecutor?.executed24h || 0}</p>
                <p style={{ margin: '5px 0' }}>Taxa sucesso: {formatPercentage(data?.microservices?.orderExecutor?.successRate || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SINAIS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
              📡 Sinais CoinStars
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {data?.signals?.coinStars?.slice(0, 5).map((signal, index) => (
                <div key={signal.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{signal.symbol}</span>
                    <span style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      backgroundColor: signal.signal === 'BUY' ? '#d4edda' : '#f8d7da',
                      color: signal.signal === 'BUY' ? '#155724' : '#721c24'
                    }}>
                      {signal.signal}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{signal.confidence}%</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>{formatDate(signal.time)}</p>
                  </div>
                </div>
              ))}
              {(!data?.signals?.coinStars || data.signals.coinStars.length === 0) && (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Nenhum sinal disponível</p>
              )}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
              📊 Sinais TradingView
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {data?.signals?.tradingView?.slice(0, 5).map((signal, index) => (
                <div key={signal.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{signal.symbol}</span>
                    <span style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      backgroundColor: signal.action === 'BUY' ? '#d4edda' : '#f8d7da',
                      color: signal.action === 'BUY' ? '#155724' : '#721c24'
                    }}>
                      {signal.action}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{signal.source}</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>{formatDate(signal.time)}</p>
                  </div>
                </div>
              ))}
              {(!data?.signals?.tradingView || data.signals.tradingView.length === 0) && (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Nenhum sinal disponível</p>
              )}
            </div>
          </div>
        </div>

        {/* OPERAÇÕES EM ANDAMENTO */}
        {data?.liveOperations && data.liveOperations.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', color: '#333' }}>
              👁️ Operações em Tempo Real
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Símbolo</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Lado</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>P&L</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Ambiente</th>
                  </tr>
                </thead>
                <tbody>
                  {data.liveOperations.map((operation) => (
                    <tr key={operation.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>#{operation.id}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{operation.symbol}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: '12px',
                          backgroundColor: operation.side === 'LONG' ? '#d4edda' : '#f8d7da',
                          color: operation.side === 'LONG' ? '#155724' : '#721c24'
                        }}>
                          {operation.side}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: '12px',
                          backgroundColor: '#fff3cd',
                          color: '#856404'
                        }}>
                          {operation.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: operation.unrealizedPnL >= 0 ? '#28a745' : '#dc3545'
                        }}>
                          {formatCurrency(operation.unrealizedPnL)}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: '12px',
                          backgroundColor: operation.environment === 'mainnet' ? '#e7e3ff' : '#cce7ff',
                          color: operation.environment === 'mainnet' ? '#6f42c1' : '#0066cc'
                        }}>
                          {operation.environment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRESCIMENTO DE USUÁRIOS */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', color: '#333' }}>
            📈 Evolução de Usuários
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#cce7ff',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#0066cc', fontWeight: 'bold' }}>Novos Usuários Hoje</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{data?.users?.newToday || 0}</p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#d4edda',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#155724', fontWeight: 'bold' }}>Testnet Ativos</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{data?.users?.activeTestnet || 0}</p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#e7e3ff',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6f42c1', fontWeight: 'bold' }}>Mainnet Ativos</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>{data?.users?.activeMainnet || 0}</p>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Crescimento Diário</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                +{formatPercentage(data?.users?.growth?.daily || 0)}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Crescimento Semanal</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#4A9EDB' }}>
                +{formatPercentage(data?.users?.growth?.weekly || 0)}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Crescimento Mensal</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#BA55D3' }}>
                +{formatPercentage(data?.users?.growth?.monthly || 0)}
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SimpleDashboard;

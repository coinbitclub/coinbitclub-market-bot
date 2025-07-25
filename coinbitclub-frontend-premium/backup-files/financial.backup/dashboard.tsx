import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

interface FinancialData {
  totalBalance: number;
  totalPnL: number;
  totalPnLPercentage: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  winRate: number;
  totalTrades: number;
  activeBots: number;
  topPerformer: string;
}

interface TradeHistory {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  pnl: number;
  pnlPercentage: number;
  exchange: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface PortfolioAllocation {
  exchange: string;
  balance: number;
  percentage: number;
  pnl24h: number;
  icon: string;
}

const FinancialDashboard: NextPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalBalance: 125847.32,
    totalPnL: 15247.89,
    totalPnLPercentage: 13.8,
    dailyPnL: 2847.32,
    weeklyPnL: 8942.17,
    monthlyPnL: 15247.89,
    winRate: 78.4,
    totalTrades: 1247,
    activeBots: 8,
    topPerformer: 'BTC/USDT Grid'
  });

  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([
    {
      id: '1',
      symbol: 'BTC/USDT',
      side: 'buy',
      amount: 0.125,
      price: 67890.50,
      pnl: 847.32,
      pnlPercentage: 2.4,
      exchange: 'bybit',
      timestamp: '2025-01-17T14:30:00Z',
      status: 'completed'
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      side: 'sell',
      amount: 2.5,
      price: 3420.75,
      pnl: -156.89,
      pnlPercentage: -1.8,
      exchange: 'binance',
      timestamp: '2025-01-17T13:45:00Z',
      status: 'completed'
    },
    {
      id: '3',
      symbol: 'SOL/USDT',
      side: 'buy',
      amount: 15.7,
      price: 189.23,
      pnl: 432.17,
      pnlPercentage: 5.2,
      exchange: 'bybit',
      timestamp: '2025-01-17T12:15:00Z',
      status: 'completed'
    }
  ]);

  const [portfolioAllocation, setPortfolioAllocation] = useState<PortfolioAllocation[]>([
    {
      exchange: 'Bybit',
      balance: 78934.21,
      percentage: 62.7,
      pnl24h: 1847.32,
      icon: '🔶'
    },
    {
      exchange: 'Binance',
      balance: 34782.56,
      percentage: 27.6,
      pnl24h: 742.18,
      icon: '🟡'
    },
    {
      exchange: 'OKX',
      balance: 12130.55,
      percentage: 9.7,
      pnl24h: 257.82,
      icon: '⚫'
    }
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

  const cardStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    border: '1px solid rgba(5, 167, 78, 0.2)',
    borderRadius: '20px',
    padding: isMobile ? '1.5rem' : '2rem',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <>
      <Head>
        <title>Dashboard Financeiro - CoinBitClub</title>
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
            💰 Dashboard Financeiro
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['24h', '7d', '30d'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                style={{
                  background: timeframe === period ? '#05A74E' : 'rgba(5, 167, 78, 0.1)',
                  color: timeframe === period ? '#FAFBFD' : '#05A74E',
                  border: '1px solid rgba(5, 167, 78, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </header>

        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem'
        }}>
          {/* Balance Principal */}
          <section style={{
            ...cardStyle,
            marginBottom: '3rem',
            background: 'linear-gradient(135deg, rgba(5, 167, 78, 0.1), rgba(110, 162, 151, 0.05))',
            border: '1px solid rgba(5, 167, 78, 0.3)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ color: '#AFB4B1', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  Balanço Total
                </p>
                <p style={{
                  fontSize: isMobile ? '2.5rem' : '3rem',
                  fontWeight: '800',
                  color: '#FAFBFD',
                  marginBottom: '0.5rem'
                }}>
                  {formatCurrency(financialData.totalBalance)}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {financialData.totalPnL >= 0 ? (
                    <span style={{ color: '#05A74E' }}>📈</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>📉</span>
                  )}
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: financialData.totalPnL >= 0 ? '#05A74E' : '#ef4444'
                  }}>
                    {formatCurrency(financialData.totalPnL)} ({formatPercentage(financialData.totalPnLPercentage)})
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center' as const }}>
                  <p style={{ color: '#AFB4B1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    P&L 24h
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: financialData.dailyPnL >= 0 ? '#05A74E' : '#ef4444'
                  }}>
                    {formatCurrency(financialData.dailyPnL)}
                  </p>
                </div>
                <div style={{ textAlign: 'center' as const }}>
                  <p style={{ color: '#AFB4B1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Win Rate
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#05A74E'
                  }}>
                    {financialData.winRate}%
                  </p>
                </div>
                <div style={{ textAlign: 'center' as const }}>
                  <p style={{ color: '#AFB4B1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Total Trades
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#6EA297'
                  }}>
                    {financialData.totalTrades.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Métricas de Performance */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={cardStyle}>            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📊 P&L por Período
            </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#AFB4B1' }}>Hoje</span>
                  <span style={{
                    fontWeight: '700',
                    color: financialData.dailyPnL >= 0 ? '#05A74E' : '#ef4444'
                  }}>
                    {formatCurrency(financialData.dailyPnL)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#AFB4B1' }}>7 dias</span>
                  <span style={{
                    fontWeight: '700',
                    color: financialData.weeklyPnL >= 0 ? '#05A74E' : '#ef4444'
                  }}>
                    {formatCurrency(financialData.weeklyPnL)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#AFB4B1' }}>30 dias</span>
                  <span style={{
                    fontWeight: '700',
                    color: financialData.monthlyPnL >= 0 ? '#05A74E' : '#ef4444'
                  }}>
                    {formatCurrency(financialData.monthlyPnL)}
                  </span>
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
                💰 Alocação por Exchange
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                {portfolioAllocation.map((allocation, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(5, 167, 78, 0.1)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{allocation.icon}</span>
                      <div>
                        <p style={{ fontWeight: '600', color: '#FAFBFD' }}>
                          {allocation.exchange}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                          {allocation.percentage}%
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <p style={{ fontWeight: '700', color: '#FAFBFD' }}>
                        {formatCurrency(allocation.balance)}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: allocation.pnl24h >= 0 ? '#05A74E' : '#ef4444'
                      }}>
                        {allocation.pnl24h >= 0 ? '+' : ''}{formatCurrency(allocation.pnl24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Histórico de Trades */}
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
              ⏰ Histórico de Trades Recentes
            </h2>

            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse' as const,
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(5, 167, 78, 0.2)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' as const, color: '#AFB4B1' }}>Par</th>
                    <th style={{ padding: '1rem', textAlign: 'left' as const, color: '#AFB4B1' }}>Lado</th>
                    <th style={{ padding: '1rem', textAlign: 'right' as const, color: '#AFB4B1' }}>Quantidade</th>
                    <th style={{ padding: '1rem', textAlign: 'right' as const, color: '#AFB4B1' }}>Preço</th>
                    <th style={{ padding: '1rem', textAlign: 'right' as const, color: '#AFB4B1' }}>P&L</th>
                    <th style={{ padding: '1rem', textAlign: 'center' as const, color: '#AFB4B1' }}>Exchange</th>
                    <th style={{ padding: '1rem', textAlign: 'center' as const, color: '#AFB4B1' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' as const, color: '#AFB4B1' }}>Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade) => (
                    <tr key={trade.id} style={{ borderBottom: '1px solid rgba(5, 167, 78, 0.1)' }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: '#FAFBFD' }}>
                        {trade.symbol}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: trade.side === 'buy' ? 'rgba(5, 167, 78, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: trade.side === 'buy' ? '#05A74E' : '#ef4444'
                        }}>
                          {trade.side === 'buy' ? 'COMPRA' : 'VENDA'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' as const, color: '#FAFBFD' }}>
                        {trade.amount}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' as const, color: '#FAFBFD' }}>
                        {formatCurrency(trade.price)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' as const }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.25rem'
                        }}>
                          {trade.pnl >= 0 ? (
                            <span style={{ color: '#05A74E' }}>↗️</span>
                          ) : (
                            <span style={{ color: '#ef4444' }}>↘️</span>
                          )}
                          <span style={{
                            fontWeight: '700',
                            color: trade.pnl >= 0 ? '#05A74E' : '#ef4444'
                          }}>
                            {formatCurrency(trade.pnl)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: trade.pnl >= 0 ? '#05A74E' : '#ef4444',
                          textAlign: 'right' as const
                        }}>
                          {formatPercentage(trade.pnlPercentage)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' as const }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: 'rgba(5, 167, 78, 0.1)',
                          color: '#05A74E'
                        }}>
                          {trade.exchange.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' as const }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: trade.status === 'completed' ? 'rgba(5, 167, 78, 0.2)' : 
                                     trade.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: trade.status === 'completed' ? '#05A74E' : 
                                trade.status === 'pending' ? '#f59e0b' : '#ef4444'
                        }}>
                          {trade.status === 'completed' ? 'EXECUTADO' : 
                           trade.status === 'pending' ? 'PENDENTE' : 'FALHOU'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' as const, color: '#AFB4B1' }}>
                        {new Date(trade.timestamp).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default FinancialDashboard;

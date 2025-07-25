import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '../../src/components/AdminLayout';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  DocumentTextIcon,
  SparklesIcon,
  CpuChipIcon,
  SignalIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

// Types
interface KPI {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

interface Position {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openTime: string;
}

interface ClosedPosition {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  openTime: string;
  closeTime: string;
  created_at: string;
}

interface MarketReading {
  direction: 'LONG' | 'SHORT' | 'NEUTRO';
  confidence: number;
  lastUpdate: string;
  ai_justification: string;
  day_tracking: string;
}

interface ProcessingSignal {
  id: string;
  source: 'TRADINGVIEW' | 'COINTARS';
  symbol: string;
  direction: 'LONG' | 'SHORT';
  strategy: string;
  confidence: number;
  timestamp: string;
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED';
}

interface IngestorStrategy {
  name: string;
  is_active: boolean;
  last_signal_at: string;
  signals_today: number;
  accuracy: number;
}

interface AccuracyMetrics {
  day: {
    accuracy: number;
    totalSignals: number;
    correctSignals: number;
  };
  historical: {
    accuracy: number;
    totalSignals: number;
    correctSignals: number;
    period: string;
  };
}

interface ReturnMetrics {
  day: {
    return: number;
    percentage: number;
  };
  historical: {
    return: number;
    percentage: number;
    period: string;
  };
}

interface Operation {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entry_price: number;
  current_price: number;
  profit_loss: number;
  profit_loss_percentage: number;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED';
  created_at: string;
}

interface AIReport {
  id: string;
  type: string;
  title: string;
  content: any;
  createdAt: string;
}

const UserDashboard: NextPage = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [equityData, setEquityData] = useState<Array<{ date: string; value: number }>>([]);
  const [aiReports, setAiReports] = useState<AIReport[]>([]);

  // Mock data - será substituído pela API real
  useEffect(() => {
    fetchDashboardData();
    fetchAIReports();
    
    // Update AI reports every 4 hours
    const interval = setInterval(fetchAIReports, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = () => {
    setKpis([
      {
        title: 'Accuracy Rate',
        value: '87.3%',
        change: '+2.1%',
        trend: 'up',
      },
      {
        title: 'Daily Return',
        value: '2.45%',
        change: '+0.3%',
        trend: 'up',
      },
      {
        title: 'Lifetime Return',
        value: '156.7%',
        change: '+4.2%',
        trend: 'up',
      },
      {
        title: 'Current Drawdown',
        value: '3.2%',
        change: '-0.5%',
        trend: 'down',
      },
    ]);

    setOpenPositions([
      {
        id: '1',
        symbol: 'BTCUSDT',
        type: 'LONG',
        size: 0.5,
        entryPrice: 43250,
        currentPrice: 43890,
        pnl: 320,
        pnlPercent: 1.48,
        openTime: '2025-01-17T08:30:00Z',
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        type: 'SHORT',
        size: 2.1,
        entryPrice: 2680,
        currentPrice: 2645,
        pnl: 73.5,
        pnlPercent: 1.31,
        openTime: '2025-01-17T09:15:00Z',
      },
    ]);

    setClosedPositions([
      {
        id: '3',
        symbol: 'ADAUSDT',
        type: 'LONG',
        size: 1000,
        entryPrice: 0.45,
        exitPrice: 0.478,
        pnl: 28,
        pnlPercent: 6.22,
        openTime: '2025-01-17T07:45:00Z',
        closeTime: '2025-01-17T08:45:00Z',
        created_at: '2025-01-17T07:45:00Z',
      },
      {
        id: '4',
        symbol: 'SOLUSDT',
        type: 'SHORT',
        size: 5,
        entryPrice: 89.2,
        exitPrice: 87.1,
        pnl: 10.5,
        pnlPercent: 2.35,
        openTime: '2025-01-17T06:20:00Z',
        closeTime: '2025-01-17T07:20:00Z',
        created_at: '2025-01-17T06:20:00Z',
      },
    ]);

    // Mock equity curve data
    setEquityData([
      { date: '2025-01-10', value: 10000 },
      { date: '2025-01-11', value: 10150 },
      { date: '2025-01-12', value: 10087 },
      { date: '2025-01-13', value: 10234 },
      { date: '2025-01-14', value: 10456 },
      { date: '2025-01-15', value: 10389 },
      { date: '2025-01-16', value: 10567 },
      { date: '2025-01-17', value: 10678 },
    ]);
  };

  const fetchAIReports = async () => {
    try {
      // Mock AI reports - será substituído pela API real
      setAiReports([
        {
          id: '1',
          type: 'portfolio_performance',
          title: 'Análise de Performance da Carteira',
          content: {
            performance: '+6.8%',
            risk_score: 4.2,
            recommendations: [
              'Performance acima da média do mercado',
              'Risco controlado dentro dos parâmetros',
              'Considerar realização de lucros parciais'
            ],
            next_signals: [
              'BTC: Aguardar correção para entrada',
              'ETH: Manter posição atual'
            ]
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'market_analysis',
          title: 'Análise de Mercado 4h',
          content: {
            sentiment: 'bullish',
            confidence: 82,
            recommendations: [
              'Mercado em tendência de alta consolidada',
              'Volume de negociação saudável',
              'Suporte forte em níveis atuais'
            ],
            signals: ['BTC breakout confirmado', 'ALTs seguindo BTC']
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching AI reports:', error);
    }
  };

  const exportData = (type: 'csv' | 'json') => {
    const data = type === 'csv' ? 'Symbol,Side,PnL\n' + closedPositions.map(p => `${p.symbol},${p.type},${p.pnl}`).join('\n') : JSON.stringify(closedPositions);
    const blob = new Blob([data], { type: type === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `positions.${type}`;
    a.click();
  };

  const closePosition = (positionId: string) => {
    // Implementar lógica de fechamento via API
    console.log('Closing position:', positionId);
  };

  const adjustStopLoss = (positionId: string) => {
    // Implementar lógica de ajuste de SL via API
    console.log('Adjusting stop loss:', positionId);
  };

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub MarketBot</title>
        <meta name="description" content="Dashboard do usuário com métricas e posições" />
      </Head>

      <div className="min-h-screen bg-background text-foreground">        
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                  Acompanhe suas métricas e posições em tempo real
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => exportData('csv')}
                  leftIcon={<ArrowDownTrayIcon className="size-4" />}
                >
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => exportData('json')}
                  leftIcon={<ArrowDownTrayIcon className="size-4" />}
                >
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto space-y-8 px-4 py-8">
          {/* KPI Cards */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
                    <p className={`mt-1 flex items-center text-sm ${
                      kpi.trend === 'up' ? 'text-success' : kpi.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {kpi.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="mr-1 size-4" />
                      ) : kpi.trend === 'down' ? (
                        <ArrowTrendingDownIcon className="mr-1 size-4" />
                      ) : (
                        <MinusIcon className="mr-1 size-4" />
                      )}
                      {kpi.change}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    kpi.trend === 'up' ? 'bg-success/10 text-success' : kpi.trend === 'down' ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                  }`}>
                    <ChartBarIcon className="size-6" />
                  </div>
                </div>
              </Card>
            ))}
          </section>

          {/* Equity Curve */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <ChartBarIcon className="mr-2 size-5 text-primary" />
                  Curva de Equity
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Evolução do seu saldo ao longo do tempo
                </p>
              </div>
              
              {/* Placeholder para gráfico Recharts */}
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto mb-2 size-12 text-muted" />
                  <p className="text-muted-foreground">
                    Gráfico Recharts aqui (Line Chart)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Última atualização: {equityData[equityData.length - 1]?.date}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* AI Reports Section */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <SparklesIcon className="mr-2 size-5 text-primary" />
                  Relatórios de IA (Atualizados a cada 4h)
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Análises automáticas da sua carteira e mercado
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {aiReports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{report.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    {report.content.performance && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Performance:</span>
                          <span className="text-sm font-medium text-success">{report.content.performance}</span>
                        </div>
                        {report.content.risk_score && (
                          <div className="flex justify-between">
                            <span className="text-sm">Score de Risco:</span>
                            <span className="text-sm font-medium">{report.content.risk_score}/10</span>
                          </div>
                        )}
                      </div>
                    )}

                    {report.content.sentiment && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Sentimento:</span>
                          <span className={`text-sm font-medium ${
                            report.content.sentiment === 'bullish' ? 'text-success' : 
                            report.content.sentiment === 'bearish' ? 'text-destructive' : 'text-warning'
                          }`}>
                            {report.content.sentiment === 'bullish' ? 'Alta' : 
                             report.content.sentiment === 'bearish' ? 'Baixa' : 'Neutro'}
                          </span>
                        </div>
                        {report.content.confidence && (
                          <div className="flex justify-between">
                            <span className="text-sm">Confiança:</span>
                            <span className="text-sm font-medium">{report.content.confidence}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {report.content.recommendations && (
                      <div className="mb-3">
                        <h4 className="mb-2 text-sm font-medium">Recomendações:</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {report.content.recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.content.next_signals && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-primary">Próximos Sinais:</h4>
                        <ul className="space-y-1 text-xs text-primary">
                          {report.content.next_signals.map((signal: string, index: number) => (
                            <li key={index}>📈 {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.content.signals && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-success">Sinais Atuais:</h4>
                        <ul className="space-y-1 text-xs text-success">
                          {report.content.signals.map((signal: string, index: number) => (
                            <li key={index}>✅ {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Open Positions */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <CurrencyDollarIcon className="mr-2 size-5 text-primary" />
                  Posições Abertas ({openPositions.length})
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Gerencie suas posições ativas
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-medium text-muted-foreground">Symbol</th>
                      <th className="py-3 text-left font-medium text-muted-foreground">Side</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Size</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Entry</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Current</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">PnL</th>
                      <th className="py-3 text-center font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((position) => (
                      <tr key={position.id} className="border-b border-border">
                        <td className="py-4 font-medium">{position.symbol}</td>
                        <td className="py-4">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            position.type === 'LONG' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {position.type}
                          </span>
                        </td>
                        <td className="py-4 text-right">{position.size}</td>
                        <td className="py-4 text-right">${position.entryPrice.toLocaleString()}</td>
                        <td className="py-4 text-right">${position.currentPrice.toLocaleString()}</td>
                        <td className="py-4 text-right">
                          <div className={`font-medium ${
                            position.pnl >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            ${position.pnl.toFixed(2)}
                            <div className="text-xs">
                              ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => closePosition(position.id)}
                              leftIcon={<XMarkIcon className="size-3" />}
                            >
                              Close
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjustStopLoss(position.id)}
                              leftIcon={<AdjustmentsHorizontalIcon className="size-3" />}
                            >
                              Adjust SL
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Closed Positions */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <CheckCircleIcon className="mr-2 size-5 text-primary" />
                  Posições Fechadas
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Histórico das suas últimas operações
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-medium text-muted-foreground">Symbol</th>
                      <th className="py-3 text-left font-medium text-muted-foreground">Side</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Entry</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Exit</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">PnL</th>
                      <th className="py-3 text-center font-medium text-muted-foreground">Reason</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedPositions.map((position) => (
                      <tr key={position.id} className="border-b border-border">
                        <td className="py-4 font-medium">{position.symbol}</td>
                        <td className="py-4">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            position.type === 'LONG' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {position.type}
                          </span>
                        </td>
                        <td className="py-4 text-right">${position.entryPrice.toFixed(3)}</td>
                        <td className="py-4 text-right">${position.exitPrice.toFixed(3)}</td>
                        <td className="py-4 text-right">
                          <div className={`font-medium ${
                            position.pnl >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            ${position.pnl.toFixed(2)}
                            <div className="text-xs">
                              ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            position.exitReason === 'TAKE_PROFIT' ? 'bg-success/10 text-success' :
                            position.exitReason === 'STOP_LOSS' ? 'bg-destructive/10 text-destructive' :
                            position.exitReason === 'IA_SIGNAL' ? 'bg-info/10 text-info' :
                            'bg-muted/10 text-muted-foreground'
                          }`}>
                            {position.exitReason.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 text-right text-sm text-muted-foreground">
                          {new Date(position.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </>
  );
};

export default UserDashboard;

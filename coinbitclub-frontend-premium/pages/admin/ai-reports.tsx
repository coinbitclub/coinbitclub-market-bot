import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '../../src/components/AdminLayout';
import {
  DocumentTextIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface AIReport {
  id: string;
  type: 'USER_REPORT' | 'SYSTEM_REPORT';
  title: string;
  generatedAt: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  content?: string;
  summary?: string;
  marketAnalysis?: MarketAnalysis;
  systemMetrics?: SystemMetrics;
  userMetrics?: UserMetrics;
  processingTimeMs?: number;
  tokenCount?: number;
  model: 'gpt-4' | 'gpt-3.5-turbo';
}

interface MarketAnalysis {
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  keyIndicators: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  topCryptos: Array<{
    symbol: string;
    price: number;
    change24h: number;
    analysis: string;
  }>;
}

interface SystemMetrics {
  uptime: number;
  apiLatency: number;
  errorRate: number;
  activeUsers: number;
  openPositions: number;
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  performanceScore: number;
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  churnRate: number;
  avgSessionTime: number;
  conversionRate: number;
}

const AdminAIReports: NextPage = () => {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadAIReports = async () => {
    setLoading(true);
    try {
      // Simular dados - substituir por chamada real da API
      const mockReports: AIReport[] = [
        {
          id: 'report1',
          type: 'USER_REPORT',
          title: 'RADAR DA ÁGUIA - Análise de Mercado',
          generatedAt: new Date().toISOString(),
          status: 'COMPLETED',
          summary: 'Mercado apresenta tendência de alta com Bitcoin rompendo resistência de $95k. Altcoins seguem movimento positivo.',
          processingTimeMs: 3500,
          tokenCount: 1850,
          model: 'gpt-4',
          marketAnalysis: {
            direction: 'BULLISH',
            confidence: 85,
            keyIndicators: [
              'RSI Bitcoin em 65 - zona neutra com espaço para alta',
              'Volume crescente nas últimas 24h (+15%)',
              'Rompimento de resistência em $95,000',
              'Dominância BTC estável em 56.8%'
            ],
            riskLevel: 'MEDIUM',
            recommendations: [
              'Manter posições LONG em Bitcoin e Ethereum',
              'Considerar entrada em Solana e BNB',
              'Stop loss sugerido: 5% abaixo da entrada',
              'Take profit parcial: 8-12% de ganho'
            ],
            topCryptos: [
              {
                symbol: 'BTC',
                price: 95420.50,
                change24h: 3.2,
                analysis: 'Forte rompimento de resistência. Próximo alvo: $98,000'
              },
              {
                symbol: 'ETH',
                price: 3845.30,
                change24h: 2.8,
                analysis: 'Acompanhando movimento do Bitcoin. Suporte em $3,700'
              },
              {
                symbol: 'SOL',
                price: 245.60,
                change24h: 4.5,
                analysis: 'Outperformance vs mercado. Momentum altista confirmado'
              }
            ]
          }
        },
        {
          id: 'report2',
          type: 'SYSTEM_REPORT',
          title: 'Relatório de Funcionamento do Sistema',
          generatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'COMPLETED',
          summary: 'Sistema operando dentro dos parâmetros normais. Latência API estável, sem erros críticos detectados.',
          processingTimeMs: 2100,
          tokenCount: 950,
          model: 'gpt-3.5-turbo',
          systemMetrics: {
            uptime: 99.8,
            apiLatency: 185,
            errorRate: 0.2,
            activeUsers: 156,
            openPositions: 28,
            systemHealth: 'HEALTHY',
            performanceScore: 94
          },
          userMetrics: {
            totalUsers: 1248,
            activeUsers: 156,
            newSignups: 12,
            churnRate: 2.1,
            avgSessionTime: 1450,
            conversionRate: 8.5
          }
        },
        {
          id: 'report3',
          type: 'USER_REPORT',
          title: 'RADAR DA ÁGUIA - Análise de Mercado',
          generatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'COMPLETED',
          summary: 'Correção técnica em andamento. Recomendação de cautela e aguardar sinais de reversão.',
          processingTimeMs: 4200,
          tokenCount: 2100,
          model: 'gpt-4',
          marketAnalysis: {
            direction: 'BEARISH',
            confidence: 72,
            keyIndicators: [
              'RSI sobrecomprado em múltiplas altcoins',
              'Volume de vendas aumentando',
              'Divergência bearish no MACD do Bitcoin',
              'Rejeição em resistência histórica'
            ],
            riskLevel: 'HIGH',
            recommendations: [
              'Reduzir exposição em altcoins',
              'Manter apenas posições core em BTC/ETH',
              'Aguardar reteste de suportes para entrada',
              'Stop loss apertado em posições abertas'
            ],
            topCryptos: [
              {
                symbol: 'BTC',
                price: 92150.30,
                change24h: -2.8,
                analysis: 'Correção saudável. Suporte em $90,000'
              },
              {
                symbol: 'ETH',
                price: 3620.80,
                change24h: -3.5,
                analysis: 'Retestando suporte importante em $3,600'
              }
            ]
          }
        },
        {
          id: 'report4',
          type: 'SYSTEM_REPORT',
          title: 'Relatório de Funcionamento do Sistema',
          generatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'FAILED',
          summary: 'Falha na geração do relatório devido a timeout na API OpenAI.',
          processingTimeMs: 30000,
          model: 'gpt-4'
        }
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Erro ao carregar relatórios IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewReport = async (type: 'USER_REPORT' | 'SYSTEM_REPORT') => {
    setGenerating(true);
    try {
      // Simular geração de novo relatório
      const newReport: AIReport = {
        id: `report_${Date.now()}`,
        type,
        title: type === 'USER_REPORT' ? 'RADAR DA ÁGUIA - Análise de Mercado' : 'Relatório de Funcionamento do Sistema',
        generatedAt: new Date().toISOString(),
        status: 'GENERATING',
        model: 'gpt-4'
      };

      setReports(prev => [newReport, ...prev]);

      // Simular processamento
      setTimeout(() => {
        setReports(prev => prev.map(r => 
          r.id === newReport.id 
            ? { ...r, status: 'COMPLETED', summary: 'Relatório gerado com sucesso', processingTimeMs: 3800, tokenCount: 1950 }
            : r
        ));
        setGenerating(false);
      }, 5000);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadAIReports();
    // Auto-refresh every 4 hours to match report generation
    const interval = setInterval(loadAIReports, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesType = !filterType || report.type === filterType;
    const matchesStatus = !filterStatus || report.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-900 text-green-300';
      case 'GENERATING': return 'bg-blue-900 text-blue-300';
      case 'FAILED': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircleIcon className="size-4" />;
      case 'GENERATING': return <ArrowPathIcon className="size-4 animate-spin" />;
      case 'FAILED': return <ExclamationTriangleIcon className="size-4" />;
      default: return <ClockIcon className="size-4" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'BULLISH': return 'text-green-400';
      case 'BEARISH': return 'text-red-400';
      case 'NEUTRAL': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <Head>
        <title>Relatórios IA - Admin CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Relatórios de IA">
        <div className="space-y-6">
          
          {/* Controles de Geração */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center text-lg font-semibold text-white">
                <CpuChipIcon className="mr-2 size-6 text-blue-400" />
                Geração de Relatórios IA
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => generateNewReport('USER_REPORT')}
                  disabled={generating}
                  className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <DocumentTextIcon className="size-4" />
                  <span>Gerar Relatório Usuário</span>
                </button>
                <button
                  onClick={() => generateNewReport('SYSTEM_REPORT')}
                  disabled={generating}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  <BeakerIcon className="size-4" />
                  <span>Gerar Relatório Sistema</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Tipo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Todos</option>
                  <option value="USER_REPORT">Relatórios Usuário</option>
                  <option value="SYSTEM_REPORT">Relatórios Sistema</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm text-gray-400">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Todos</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="GENERATING">Gerando</option>
                  <option value="FAILED">Falhou</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={loadAIReports}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                >
                  <ArrowPathIcon className="size-4" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Relatórios */}
          <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            <div className="border-b border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white">Histórico de Relatórios</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Tipo</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Título</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Gerado em</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Modelo</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Tempo/Tokens</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-yellow-400"></div>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Nenhum relatório encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <span className={`rounded px-2 py-1 text-xs ${
                            report.type === 'USER_REPORT' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                          }`}>
                            {report.type === 'USER_REPORT' ? 'Usuário' : 'Sistema'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">{report.title}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(report.status)}
                            <span className={`rounded px-2 py-1 text-xs ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
                          <div>{new Date(report.generatedAt).toLocaleTimeString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{report.model}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {report.processingTimeMs ? `${report.processingTimeMs}ms` : '-'}
                          <div>{report.tokenCount ? `${report.tokenCount} tokens` : '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {report.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setShowModal(true);
                              }}
                              className="p-1 text-blue-400 hover:text-blue-300"
                            >
                              <EyeIcon className="size-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Relatórios</p>
                  <p className="text-2xl font-bold text-white">{reports.length}</p>
                </div>
                <DocumentTextIcon className="size-8 text-blue-400" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Concluídos</p>
                  <p className="text-2xl font-bold text-green-400">
                    {reports.filter(r => r.status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircleIcon className="size-8 text-green-400" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Falharam</p>
                  <p className="text-2xl font-bold text-red-400">
                    {reports.filter(r => r.status === 'FAILED').length}
                  </p>
                </div>
                <ExclamationTriangleIcon className="size-8 text-red-400" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Tempo Médio</p>
                  <p className="text-2xl font-bold text-white">
                    {reports.filter(r => r.processingTimeMs).length > 0
                      ? Math.round(reports.filter(r => r.processingTimeMs).reduce((sum, r) => sum + (r.processingTimeMs || 0), 0) / reports.filter(r => r.processingTimeMs).length)
                      : 0
                    }ms
                  </p>
                </div>
                <ClockIcon className="size-8 text-yellow-400" />
              </div>
            </div>
          </div>

        </div>

        {/* Modal de Detalhes */}
        {showModal && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-gray-800">
              <div className="border-b border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{selectedReport.title}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ExclamationTriangleIcon className="size-6" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {new Date(selectedReport.generatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div className="p-6">
                {selectedReport.summary && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-lg font-semibold text-white">Resumo</h3>
                    <div className="rounded-lg bg-gray-900 p-4 text-white">
                      {selectedReport.summary}
                    </div>
                  </div>
                )}

                {selectedReport.marketAnalysis && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Análise de Mercado</h3>
                    
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Direção</div>
                        <div className={`text-lg font-bold ${getDirectionColor(selectedReport.marketAnalysis.direction)}`}>
                          {selectedReport.marketAnalysis.direction}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Confiança</div>
                        <div className="text-lg font-bold text-white">
                          {selectedReport.marketAnalysis.confidence}%
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Risco</div>
                        <div className={`text-lg font-bold ${getRiskColor(selectedReport.marketAnalysis.riskLevel)}`}>
                          {selectedReport.marketAnalysis.riskLevel}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 font-medium text-white">Indicadores Chave</h4>
                        <div className="rounded-lg bg-gray-900 p-4">
                          <ul className="space-y-2">
                            {selectedReport.marketAnalysis.keyIndicators.map((indicator, index) => (
                              <li key={index} className="text-sm text-gray-300">• {indicator}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="mb-2 font-medium text-white">Recomendações</h4>
                        <div className="rounded-lg bg-gray-900 p-4">
                          <ul className="space-y-2">
                            {selectedReport.marketAnalysis.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-300">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="mb-2 font-medium text-white">Top Criptomoedas</h4>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="space-y-3">
                          {selectedReport.marketAnalysis.topCryptos.map((crypto, index) => (
                            <div key={index} className="flex items-center justify-between border-b border-gray-700 pb-2">
                              <div>
                                <div className="font-medium text-white">{crypto.symbol}</div>
                                <div className="text-sm text-gray-400">{crypto.analysis}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-white">${crypto.price.toLocaleString()}</div>
                                <div className={`text-sm ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.systemMetrics && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Métricas do Sistema</h3>
                    
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Uptime</div>
                        <div className="text-lg font-bold text-green-400">
                          {selectedReport.systemMetrics.uptime}%
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Latência API</div>
                        <div className="text-lg font-bold text-white">
                          {selectedReport.systemMetrics.apiLatency}ms
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Taxa de Erro</div>
                        <div className="text-lg font-bold text-white">
                          {selectedReport.systemMetrics.errorRate}%
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Usuários Ativos</div>
                        <div className="text-lg font-bold text-white">
                          {selectedReport.systemMetrics.activeUsers}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Posições Abertas</div>
                        <div className="text-lg font-bold text-white">
                          {selectedReport.systemMetrics.openPositions}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Score Performance</div>
                        <div className="text-lg font-bold text-green-400">
                          {selectedReport.systemMetrics.performanceScore}/100
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.userMetrics && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Métricas de Usuários</h3>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Total Usuários</div>
                        <div className="text-lg font-bold text-white">
                          {selectedReport.userMetrics.totalUsers}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Usuários Ativos</div>
                        <div className="text-lg font-bold text-green-400">
                          {selectedReport.userMetrics.activeUsers}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Novos Cadastros</div>
                        <div className="text-lg font-bold text-blue-400">
                          {selectedReport.userMetrics.newSignups}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Taxa Churn</div>
                        <div className="text-lg font-bold text-yellow-400">
                          {selectedReport.userMetrics.churnRate}%
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Tempo Médio Sessão</div>
                        <div className="text-lg font-bold text-white">
                          {Math.round(selectedReport.userMetrics.avgSessionTime / 60)}min
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <div className="text-sm text-gray-400">Taxa Conversão</div>
                        <div className="text-lg font-bold text-green-400">
                          {selectedReport.userMetrics.conversionRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminAIReports;

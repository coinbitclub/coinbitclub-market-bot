import React, { useState, useEffect } from 'react';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { User, TrendingUp, DollarSign, Activity, Clock, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    country: string;
    planType: string;
    subscriptionStatus?: string;
    subscriptionEndsAt?: string;
  };
  balance: {
    prepaidBalance: number;
    totalProfit: number;
    totalLoss: number;
    netResult: number;
    pendingCommission: number;
    paidCommission: number;
  };
  latestReport?: {
    id: string;
    title: string;
    content: string;
    marketScenario: string;
    createdAt: string;
  };
  openOperations: Array<{
    id: string;
    exchange: string;
    symbol: string;
    type: string;
    entryPrice: number;
    quantity: number;
    leverage: number;
    stopLoss: number;
    takeProfit?: number;
    investedAmount: number;
    openedAt: string;
  }>;
  todayStats: {
    totalOperations: number;
    successfulOperations: number;
    dayProfit: number;
    dayLoss: number;
    daySuccessRate: number;
  };
  historicalStats: {
    totalOperations: number;
    successfulOperations: number;
    netResult: number;
    overallSuccessRate: number;
    bestResult: number;
    worstResult: number;
  };
  monthlyStats: Array<{
    month: string;
    operations: number;
    profit: number;
    successRate: number;
  }>;
}

const UserDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        toast.error('Erro ao carregar dados do dashboard');
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'alta':
        return 'text-green-600 bg-green-100';
      case 'baixa':
        return 'text-red-600 bg-red-100';
      case 'lateralizacao_alta_volatilidade':
        return 'text-yellow-600 bg-yellow-100';
      case 'alta_pullback_tecnico':
        return 'text-blue-600 bg-blue-100';
      case 'baixa_suporte_forte':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScenarioText = (scenario: string) => {
    switch (scenario) {
      case 'alta':
        return 'Alta';
      case 'baixa':
        return 'Baixa';
      case 'lateralizacao_alta_volatilidade':
        return 'Lateralização com Alta Volatilidade';
      case 'alta_pullback_tecnico':
        return 'Alta com Pullback Técnico';
      case 'baixa_suporte_forte':
        return 'Baixa com Suporte Forte';
      default:
        return scenario;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 size-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Erro ao carregar dados</h2>
          <Button onClick={loadDashboardData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header com boas-vindas */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {data.user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Plano: {data.user.planType === 'monthly' ? 'Mensal' : 'Pré-Pago'} • 
            {data.user.subscriptionStatus && ` Status: ${data.user.subscriptionStatus}`}
          </p>
        </div>

        {/* Cards principais */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Saldo Pré-Pago */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Pré-Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.balance.prepaidBalance)}
                </p>
              </div>
              <DollarSign className="size-12 text-green-500" />
            </div>
            <Button 
              size="sm" 
              className="mt-3 w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/user/plans'}
            >
              Adicionar Saldo
            </Button>
          </Card>

          {/* Resultado Líquido */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resultado Líquido</p>
                <p className={`text-2xl font-bold ${
                  data.balance.netResult >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(data.balance.netResult)}
                </p>
              </div>
              <TrendingUp className={`size-12 ${
                data.balance.netResult >= 0 ? 'text-green-500' : 'text-red-500'
              }`} />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Lucro: {formatCurrency(data.balance.totalProfit)} • 
              Perda: {formatCurrency(data.balance.totalLoss)}
            </div>
          </Card>

          {/* Taxa de Assertividade do Dia */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assertividade Hoje</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.todayStats.daySuccessRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="size-12 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {data.todayStats.successfulOperations}/{data.todayStats.totalOperations} operações
            </div>
          </Card>

          {/* Assertividade Histórica */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assertividade Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.historicalStats.overallSuccessRate.toFixed(1)}%
                </p>
              </div>
              <User className="size-12 text-purple-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {data.historicalStats.successfulOperations}/{data.historicalStats.totalOperations} total
            </div>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Relatório IA */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">🦅 RADAR DA ÁGUIA NEWS</h3>
              {data.latestReport && (
                <Button
                  size="sm"
                  onClick={() => setShowReportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="mr-2 size-4" />
                  Ver Completo
                </Button>
              )}
            </div>

            {data.latestReport ? (
              <div>
                <div className="mb-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    getScenarioColor(data.latestReport.marketScenario)
                  }`}>
                    {getScenarioText(data.latestReport.marketScenario)}
                  </span>
                </div>
                
                <h4 className="mb-2 font-medium">{data.latestReport.title}</h4>
                
                <div className="line-clamp-4 text-sm text-gray-600">
                  {data.latestReport.content.substring(0, 200)}...
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  <Clock className="mr-1 inline size-4" />
                  {formatDateTime(data.latestReport.createdAt)}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Activity className="mx-auto mb-3 size-12 opacity-50" />
                <p>Aguardando próximo relatório...</p>
                <p className="text-sm">Relatórios são gerados a cada 4 horas</p>
              </div>
            )}
          </Card>

          {/* Operações Abertas */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Operações Abertas</h3>
              <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">
                {data.openOperations.length}/2
              </span>
            </div>

            {data.openOperations.length > 0 ? (
              <div className="space-y-4">
                {data.openOperations.map((operation) => (
                  <div key={operation.id} className="rounded-lg border bg-gray-50 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="font-medium">{operation.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {operation.exchange.toUpperCase()} • {operation.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(operation.investedAmount)}</div>
                        <div className="text-sm text-gray-600">{operation.leverage}x</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Entrada:</span>
                        <span className="ml-1">${operation.entryPrice.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Stop Loss:</span>
                        <span className="ml-1">${operation.stopLoss.toFixed(4)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Aberta em: {formatDateTime(operation.openedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <TrendingUp className="mx-auto mb-3 size-12 opacity-50" />
                <p>Nenhuma operação aberta</p>
                <p className="text-sm">As operações serão executadas automaticamente</p>
              </div>
            )}
          </Card>
        </div>

        {/* Estatísticas Mensais */}
        <Card className="mb-8 p-6">
          <h3 className="mb-4 text-lg font-semibold">Performance Mensal</h3>
          
          {data.monthlyStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Mês</th>
                    <th className="p-2 text-left">Operações</th>
                    <th className="p-2 text-left">Resultado</th>
                    <th className="p-2 text-left">Assertividade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyStats.map((stat, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {new Date(stat.month).toLocaleDateString('pt-BR', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </td>
                      <td className="p-2">{stat.operations}</td>
                      <td className={`p-2 font-medium ${
                        stat.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(stat.profit)}
                      </td>
                      <td className="p-2">
                        <span className={`inline-block rounded px-2 py-1 text-sm ${
                          stat.successRate >= 70 ? 'bg-green-100 text-green-800' :
                          stat.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stat.successRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Activity className="mx-auto mb-3 size-12 opacity-50" />
              <p>Nenhum dado histórico disponível</p>
            </div>
          )}
        </Card>

        {/* Ações Rápidas */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button 
              onClick={() => window.location.href = '/user/operations'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver Todas as Operações
            </Button>
            <Button 
              onClick={() => window.location.href = '/user/settings'}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Configurações
            </Button>
            <Button 
              onClick={() => window.location.href = '/user/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              Gerenciar Planos
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal do Relatório Completo */}
      {showReportModal && data.latestReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-2xl font-bold">🦅 RADAR DA ÁGUIA NEWS</h2>
                <Button
                  onClick={() => setShowReportModal(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Fechar
                </Button>
              </div>
              
              <div className="mb-4">
                <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                  getScenarioColor(data.latestReport.marketScenario)
                }`}>
                  {getScenarioText(data.latestReport.marketScenario)}
                </span>
              </div>
              
              <h3 className="mb-4 text-xl font-semibold">{data.latestReport.title}</h3>
              
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {data.latestReport.content}
                </pre>
              </div>
              
              <div className="mt-6 border-t pt-4 text-sm text-gray-500">
                <Clock className="mr-1 inline size-4" />
                Publicado em: {formatDateTime(data.latestReport.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

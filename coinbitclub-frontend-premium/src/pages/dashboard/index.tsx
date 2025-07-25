import React from 'react';
import useSWR from 'swr';
import {
  fetchDashboardMetrics,
  fetchDashboardBalances,
  fetchOpenPositions,
} from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import Notifications from '../../components/Notifications';
import Card from '../../components/Card';
import Chart from '../../components/Chart';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import Head from 'next/head';

const fetcher = (url: string) => {
  switch (url) {
    case 'metrics':
      return fetchDashboardMetrics().then((r) => r.data);
    case 'balances':
      return fetchDashboardBalances().then((r) => r.data);
    case 'positions':
      return fetchOpenPositions().then((r) => r.data);
    default:
      throw new Error('Unknown fetcher URL');
  }
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <FiLoader className="animate-spin text-2xl text-emerald-400" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center space-x-2 text-red-400">
    <FiAlertTriangle />
    <span>{message}</span>
  </div>
);

export default function Dashboard() {
  const { data: metrics, error: metricsError } = useSWR('metrics', fetcher);
  const { data: balances, error: balancesError } = useSWR('balances', fetcher);
  const { data: positions, error: positionsError } = useSWR('positions', fetcher);

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub</title>
      </Head>
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        
        <main className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-400 glow-gold">Dashboard</h1>
              <p className="text-blue-400 glow-blue">Suas operações em tempo real.</p>
            </div>
            <button className="bg-black border border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black transition-all duration-300 rounded-md px-4 py-2 glow-pink">
              🔄 Atualizar Dados
            </button>
          </div>

          {/* Métricas Principais */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black border border-amber-400 rounded-lg p-5 shadow-lg hover:shadow-amber-400/20 transition-all duration-300">
              {metricsError ? <ErrorMessage message="Erro ao carregar" /> : !metrics ? <LoadingSpinner /> : (
                <>
                  <p className="text-sm text-blue-400">Precisão</p>
                  <p className="text-2xl font-bold text-amber-400 glow-gold">{metrics.accuracy}%</p>
                </>
              )}
            </Card>
            <Card className="bg-black border border-pink-500 rounded-lg p-5 shadow-lg hover:shadow-pink-400/20 transition-all duration-300">
              {metricsError ? <ErrorMessage message="Erro ao carregar" /> : !metrics ? <LoadingSpinner /> : (
                <>
                  <p className="text-sm text-blue-400">Retorno Diário</p>
                  <p className="text-2xl font-bold text-pink-500 glow-pink">+{metrics.dailyReturnPct}%</p>
                </>
              )}
            </Card>
            <Card className="bg-black border border-blue-500 rounded-lg p-5 shadow-lg hover:shadow-blue-400/20 transition-all duration-300">
              {metricsError ? <ErrorMessage message="Erro ao carregar" /> : !metrics ? <LoadingSpinner /> : (
                <>
                  <p className="text-sm text-amber-400">Retorno Total</p>
                  <p className="text-2xl font-bold text-blue-500 glow-blue">+{metrics.lifetimeReturnPct}%</p>
                </>
              )}
            </Card>
            <Card className="bg-black border border-amber-400 rounded-lg p-5 shadow-lg hover:shadow-amber-400/20 transition-all duration-300">
              {metricsError ? <ErrorMessage message="Erro ao carregar" /> : !metrics ? <LoadingSpinner /> : (
                <>
                  <p className="text-sm text-pink-500">Win Rate</p>
                  <p className="text-2xl font-bold text-amber-400 glow-gold">{metrics.winRate}%</p>
                </>
              )}
            </Card>
          </div>

          {/* Gráfico e Estatísticas */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="bg-black border border-blue-500 rounded-lg p-5 shadow-lg hover:shadow-blue-400/20 transition-all duration-300 lg:col-span-2">
              <h3 className="mb-4 text-xl font-semibold text-blue-500 glow-blue">Performance da Carteira</h3>
              <Chart />
            </Card>
            
            <Card className="bg-black border border-pink-500 rounded-lg p-5 shadow-lg hover:shadow-pink-400/20 transition-all duration-300">
              <h3 className="mb-4 text-xl font-semibold text-pink-500 glow-pink">Estatísticas Gerais</h3>
              {metricsError ? <ErrorMessage message="Erro ao carregar" /> : !metrics ? <LoadingSpinner /> : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Total de Trades</span>
                    <span className="font-semibold text-amber-400 glow-gold">{metrics.totalTrades}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Lucro Total</span>
                    <span className="font-semibold text-pink-500 glow-pink">${metrics.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400">Status da Conta</span>
                    <span className="font-semibold text-amber-400 glow-gold">🟢 Ativo</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Saldos e Posições */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="bg-black border border-amber-500 rounded-lg p-5 shadow-lg hover:shadow-amber-400/20 transition-all duration-300">
              <h3 className="mb-4 text-xl font-semibold text-amber-500 glow-gold">Saldos nas Exchanges</h3>
              {balancesError ? <ErrorMessage message="Erro ao carregar saldos." /> : !balances ? <LoadingSpinner /> : (
                <div className="space-y-4">
                  {balances.map((bal: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-black/50 p-3 border border-blue-500/30">
                      <span className="font-medium text-blue-400">{bal.exchange}</span>
                      <div className="text-right">
                        <div className="font-semibold text-amber-400 glow-gold-sm">{bal.balance}</div>
                        <div className={`text-sm ${bal.change.startsWith('+') ? 'text-pink-500 glow-pink-sm' : 'text-red-400'}`}>{bal.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="bg-black border border-pink-500 rounded-lg p-5 shadow-lg hover:shadow-pink-400/20 transition-all duration-300">
              <h3 className="mb-4 text-xl font-semibold text-pink-500 glow-pink">Posições Abertas</h3>
              {positionsError ? <ErrorMessage message="Erro ao carregar posições." /> : !positions ? <LoadingSpinner /> : (
                <div className="space-y-3">
                  {positions.map((pos: any) => (
                    <div key={pos.id} className="rounded-lg bg-black/50 p-3 border border-blue-500/30">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-blue-400">{pos.pair}</span>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${pos.side === 'LONG' ? 'bg-blue-900/30 text-blue-400 border border-blue-500' : 'bg-pink-900/30 text-pink-400 border border-pink-500'}`}>{pos.side}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Qtd: {pos.qty}</span>
                        <span className={`font-semibold ${pos.pnl.startsWith('+') ? 'text-amber-400 glow-gold-sm' : 'text-red-400'}`}>{pos.pnl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <Notifications />
        </main>
      </div>
    </>
  );
}

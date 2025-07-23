import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss' | 'commission';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  user: string;
  description: string;
  createdAt: string;
}

export default function SimpleAdminFinancial() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState('7d');
  const [transactionType, setTransactionType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Dados mockados
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'deposit',
        amount: 5000,
        currency: 'USD',
        status: 'completed',
        user: 'João Silva',
        description: 'Depósito via PIX',
        createdAt: '2024-01-20T10:30:00Z'
      },
      {
        id: '2',
        type: 'trade_profit',
        amount: 1250,
        currency: 'USD',
        status: 'completed',
        user: 'Maria Santos',
        description: 'Lucro - BTC/USD Long',
        createdAt: '2024-01-20T09:15:00Z'
      },
      {
        id: '3',
        type: 'withdrawal',
        amount: -2000,
        currency: 'USD',
        status: 'pending',
        user: 'Pedro Costa',
        description: 'Saque para conta bancária',
        createdAt: '2024-01-20T08:45:00Z'
      },
      {
        id: '4',
        type: 'commission',
        amount: 125,
        currency: 'USD',
        status: 'completed',
        user: 'Ana Oliveira',
        description: 'Comissão de afiliado',
        createdAt: '2024-01-19T16:20:00Z'
      },
      {
        id: '5',
        type: 'trade_loss',
        amount: -450,
        currency: 'USD',
        status: 'completed',
        user: 'Carlos Lima',
        description: 'Perda - ETH/USD Short',
        createdAt: '2024-01-19T14:10:00Z'
      }
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 1000);
  }, []);

  const stats = {
    totalDeposits: transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: Math.abs(transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)),
    totalProfits: transactions
      .filter(t => t.type === 'trade_profit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalLosses: Math.abs(transactions
      .filter(t => t.type === 'trade_loss' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)),
    totalCommissions: transactions
      .filter(t => t.type === 'commission' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingWithdrawals: Math.abs(transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0))
  };

  const netBalance = stats.totalDeposits + stats.totalProfits + stats.totalCommissions - stats.totalWithdrawals - stats.totalLosses;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownIcon className="size-5 text-green-400" />;
      case 'withdrawal': return <ArrowUpIcon className="size-5 text-red-400" />;
      case 'trade_profit': return <ArrowTrendingUpIcon className="size-5 text-green-400" />;
      case 'trade_loss': return <ArrowTrendingDownIcon className="size-5 text-red-400" />;
      case 'commission': return <CurrencyDollarIcon className="size-5 text-cyan-400" />;
      default: return <CurrencyDollarIcon className="size-5 text-gray-400" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Depósito';
      case 'withdrawal': return 'Saque';
      case 'trade_profit': return 'Lucro Trade';
      case 'trade_loss': return 'Perda Trade';
      case 'commission': return 'Comissão';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionType === 'all') return true;
    return transaction.type === transactionType;
  });

  return (
    <>
      <Head>
        <title>Gestão Financeira - Admin CoinBitClub</title>
        <meta name="description" content="Painel administrativo para gestão financeira" />
      </Head>

      <div className="min-h-screen bg-gray-900 p-6 text-white">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="size-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Gestão Financeira</h1>
                <p className="text-gray-400">Monitore todas as transações e balanços da plataforma</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Saldo Líquido</p>
                  <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${netBalance.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Entradas - Saídas</p>
                </div>
                <BanknotesIcon className="size-8 text-cyan-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Depósitos</p>
                  <p className="text-2xl font-bold text-green-400">${stats.totalDeposits.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-green-500">+12.5% vs mês anterior</p>
                </div>
                <ArrowDownIcon className="size-8 text-green-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Saques</p>
                  <p className="text-2xl font-bold text-red-400">${stats.totalWithdrawals.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-red-500">+8.3% vs mês anterior</p>
                </div>
                <ArrowUpIcon className="size-8 text-red-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Saques Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">${stats.pendingWithdrawals.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-500">Aguardando aprovação</p>
                </div>
                <CalendarIcon className="size-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Lucros Trading</h3>
                <ArrowTrendingUpIcon className="size-6 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">${stats.totalProfits.toLocaleString()}</p>
              <p className="mt-2 text-sm text-gray-400">Lucros totais dos trades</p>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Perdas Trading</h3>
                <ArrowTrendingDownIcon className="size-6 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">${stats.totalLosses.toLocaleString()}</p>
              <p className="mt-2 text-sm text-gray-400">Perdas totais dos trades</p>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Comissões</h3>
                <CurrencyDollarIcon className="size-6 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400">${stats.totalCommissions.toLocaleString()}</p>
              <p className="mt-2 text-sm text-gray-400">Comissões de afiliados</p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold">Transações Recentes</h3>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="deposit">Depósitos</option>
                  <option value="withdrawal">Saques</option>
                  <option value="trade_profit">Lucros Trading</option>
                  <option value="trade_loss">Perdas Trading</option>
                  <option value="commission">Comissões</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {filteredTransactions.length} transações
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-lg bg-gray-800">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-gray-400">Carregando transações...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-800">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-700">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <span className="text-sm font-medium text-white">
                              {getTransactionLabel(transaction.type)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {transaction.user}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {transaction.description}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`text-sm font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString()} {transaction.currency}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`text-sm font-medium capitalize ${getStatusColor(transaction.status)}`}>
                            {transaction.status === 'completed' ? 'Completo' : 
                             transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold">Ações Rápidas</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <button className="rounded-lg bg-green-600 p-4 text-center text-white transition-colors duration-200 hover:bg-green-700">
                <ArrowDownIcon className="mx-auto mb-2 size-6" />
                <span className="block font-medium">Aprovar Depósitos</span>
                <span className="text-sm opacity-80">3 pendentes</span>
              </button>

              <button className="rounded-lg bg-yellow-600 p-4 text-center text-white transition-colors duration-200 hover:bg-yellow-700">
                <ArrowUpIcon className="mx-auto mb-2 size-6" />
                <span className="block font-medium">Processar Saques</span>
                <span className="text-sm opacity-80">5 pendentes</span>
              </button>

              <button className="rounded-lg bg-blue-600 p-4 text-center text-white transition-colors duration-200 hover:bg-blue-700">
                <ChartBarIcon className="mx-auto mb-2 size-6" />
                <span className="block font-medium">Gerar Relatório</span>
                <span className="text-sm opacity-80">Exportar dados</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

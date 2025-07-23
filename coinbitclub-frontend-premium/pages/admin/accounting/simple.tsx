import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon,
  ChartBarIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  type: 'revenue' | 'expense' | 'asset' | 'liability';
  category: string;
  amount: number;
  balance: number;
  reference: string;
  status: 'posted' | 'pending' | 'reconciled';
}

export default function SimpleAdminAccounting() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AccountingEntry[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [entryType, setEntryType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(null);

  // Dados mockados
  useEffect(() => {
    const mockEntries: AccountingEntry[] = [
      {
        id: '1',
        date: '2024-01-20',
        description: 'Receita de comissões de trading',
        type: 'revenue',
        category: 'Trading Commissions',
        amount: 2500.00,
        balance: 45750.00,
        reference: 'TXN-2024-001',
        status: 'posted'
      },
      {
        id: '2',
        date: '2024-01-20',
        description: 'Pagamento de servidor AWS',
        type: 'expense',
        category: 'Infrastructure',
        amount: -450.00,
        balance: 43250.00,
        reference: 'AWS-INV-2024',
        status: 'reconciled'
      },
      {
        id: '3',
        date: '2024-01-19',
        description: 'Receita de assinaturas Premium',
        type: 'revenue',
        category: 'Subscriptions',
        amount: 1800.00,
        balance: 43700.00,
        reference: 'SUB-2024-019',
        status: 'posted'
      },
      {
        id: '4',
        date: '2024-01-19',
        description: 'Pagamento de licenças de software',
        type: 'expense',
        category: 'Software Licenses',
        amount: -299.00,
        balance: 41900.00,
        reference: 'LIC-2024-003',
        status: 'posted'
      },
      {
        id: '5',
        date: '2024-01-18',
        description: 'Receita de afiliados',
        type: 'revenue',
        category: 'Affiliate Revenue',
        amount: 875.00,
        balance: 42199.00,
        reference: 'AFF-2024-007',
        status: 'pending'
      },
      {
        id: '6',
        date: '2024-01-18',
        description: 'Compra de equipamento de TI',
        type: 'asset',
        category: 'Equipment',
        amount: -3200.00,
        balance: 41324.00,
        reference: 'EQ-2024-001',
        status: 'reconciled'
      }
    ];

    setTimeout(() => {
      setEntries(mockEntries);
      setFilteredEntries(mockEntries);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filtrar entradas
  useEffect(() => {
    let filtered = entries;
    
    if (entryType !== 'all') {
      filtered = filtered.filter(entry => entry.type === entryType);
    }

    setFilteredEntries(filtered);
  }, [entries, entryType]);

  const stats = {
    totalRevenue: entries.filter(e => e.type === 'revenue' && e.status !== 'pending').reduce((sum, e) => sum + e.amount, 0),
    totalExpenses: Math.abs(entries.filter(e => e.type === 'expense' && e.status !== 'pending').reduce((sum, e) => sum + e.amount, 0)),
    currentBalance: entries.length > 0 ? entries[0].balance : 0,
    pendingEntries: entries.filter(e => e.status === 'pending').length,
    monthlyProfit: 0
  };

  stats.monthlyProfit = stats.totalRevenue - stats.totalExpenses;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'text-green-400 bg-green-900/30';
      case 'expense': return 'text-red-400 bg-red-900/30';
      case 'asset': return 'text-blue-400 bg-blue-900/30';
      case 'liability': return 'text-yellow-400 bg-yellow-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'revenue': return 'Receita';
      case 'expense': return 'Despesa';
      case 'asset': return 'Ativo';
      case 'liability': return 'Passivo';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'reconciled': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const handleExport = () => {
    alert('Funcionalidade de exportação será implementada em breve!');
  };

  const handleViewEntry = (entry: AccountingEntry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  return (
    <>
      <Head>
        <title>Contabilidade - Admin CoinBitClub</title>
        <meta name="description" content="Painel administrativo de contabilidade" />
      </Head>

      <div className="min-h-screen bg-gray-900 p-6 text-white">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="size-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Contabilidade</h1>
                <p className="text-gray-400">Gestão completa dos registros contábeis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="size-5" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Saldo Atual</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    ${stats.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Posição consolidada</p>
                </div>
                <CurrencyDollarIcon className="size-8 text-cyan-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Receita Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-green-500">+15.2% vs mês anterior</p>
                </div>
                <ChartBarIcon className="size-8 text-green-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Despesas Totais</p>
                  <p className="text-2xl font-bold text-red-400">
                    ${stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-red-500">+5.8% vs mês anterior</p>
                </div>
                <CalculatorIcon className="size-8 text-red-400" />
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Lucro Mensal</p>
                  <p className={`text-2xl font-bold ${stats.monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${stats.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{stats.pendingEntries} registros pendentes</p>
                </div>
                <DocumentTextIcon className="size-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="size-5 text-gray-400" />
                  <span className="text-gray-300">Filtros:</span>
                </div>
                
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="revenue">Receitas</option>
                  <option value="expense">Despesas</option>
                  <option value="asset">Ativos</option>
                  <option value="liability">Passivos</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="year">Este ano</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <CalendarIcon className="size-5 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {filteredEntries.length} registros encontrados
                </span>
              </div>
            </div>
          </div>

          {/* Accounting Entries Table */}
          <div className="overflow-hidden rounded-lg bg-gray-800">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-gray-400">Carregando registros contábeis...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Saldo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-800">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-700">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="max-w-xs truncate px-6 py-4 text-sm text-white">
                          {entry.description}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {getTypeLabel(entry.type)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          {entry.category}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`text-sm font-medium ${entry.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                          ${entry.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`text-sm font-medium capitalize ${getStatusColor(entry.status)}`}>
                            {entry.status === 'posted' ? 'Lançado' : 
                             entry.status === 'pending' ? 'Pendente' : 'Conciliado'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() => handleViewEntry(entry)}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <EyeIcon className="size-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Reports */}
          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold">Relatórios Rápidos</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <button className="rounded-lg bg-blue-600 p-4 text-center text-white transition-colors duration-200 hover:bg-blue-700">
                <DocumentTextIcon className="mx-auto mb-2 size-6" />
                <span className="block font-medium">Balancete</span>
                <span className="text-sm opacity-80">Posições consolidadas</span>
              </button>

              <button className="rounded-lg bg-green-600 p-4 text-center text-white transition-colors duration-200 hover:bg-green-700">
                <ChartBarIcon className="mx-auto mb-2 size-6" />
                <span className="block font-medium">DRE</span>
                <span className="text-sm opacity-80">Demonstração de resultados</span>
              </button>

              <button className="rounded-lg bg-purple-600 p-4 text-center text-white transition-colors duration-200 hover:bg-purple-700">
                <CalculatorIcon className="mx-auto mb-2 size-6" />
                <span className="block font-medium">Fluxo de Caixa</span>
                <span className="text-sm opacity-80">Entradas e saídas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes */}
        {showModal && selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-2xl rounded-lg bg-gray-800 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Detalhes do Registro</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Referência</label>
                    <p className="text-white">{selectedEntry.reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Data</label>
                    <p className="text-white">{new Date(selectedEntry.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Tipo</label>
                    <p className="text-white">{getTypeLabel(selectedEntry.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Categoria</label>
                    <p className="text-white">{selectedEntry.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Valor</label>
                    <p className={`font-medium ${selectedEntry.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedEntry.amount >= 0 ? '+' : ''}${Math.abs(selectedEntry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <p className={`font-medium ${getStatusColor(selectedEntry.status)}`}>
                      {selectedEntry.status === 'posted' ? 'Lançado' : 
                       selectedEntry.status === 'pending' ? 'Pendente' : 'Conciliado'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Descrição</label>
                  <p className="text-white">{selectedEntry.description}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                  Fechar
                </button>
                <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                  Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

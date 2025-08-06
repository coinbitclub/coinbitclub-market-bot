import React from 'react';
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface FinancialOverview {
  overview: {
    total_entradas: number;
    pagos_usuarios: number;
    pagos_afiliados: number;
    saldo_comprometido: number;
    retiradas: number;
    saldo_liquido: number;
  };
  by_currency: Array<{
    currency: string;
    entradas: number;
    saidas: number;
    saldo_liquido: number;
  }>;
}

interface MonthlyFlow {
  mes: string;
  currency: string;
  entradas: number;
  saidas: number;
  saldo_liquido: number;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  user_name: string;
  user_email: string;
  affiliate_name: string;
  affiliate_email: string;
  operation_symbol: string;
  operation_profit: number;
  created_at: string;
}

interface PendingObligation {
  type: string;
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount: number;
  currency: string;
  created_at: string;
  affiliate_id: string;
  affiliate_name: string;
}

export default function AccountingPage() {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [monthlyFlow, setMonthlyFlow] = useState<MonthlyFlow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingObligations, setPendingObligations] = useState<PendingObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'entrada',
    description: '',
    amount: 0,
    currency: 'BRL',
    related_user_id: '',
    related_affiliate_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch overview
      const overviewResponse = await fetch('/api/admin/accounting/overview');
      const overviewData = await overviewResponse.json();
      if (overviewData.success) {
        setOverview(overviewData.data);
      }

      // Fetch monthly flow
      const flowResponse = await fetch('/api/admin/accounting/monthly-flow');
      const flowData = await flowResponse.json();
      if (flowData.success) {
        setMonthlyFlow(flowData.data);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/admin/accounting/transactions?limit=50');
      const transactionsData = await transactionsResponse.json();
      if (transactionsData.success) {
        setTransactions(transactionsData.data);
      }

      // Fetch pending obligations
      const pendingResponse = await fetch('/api/admin/accounting/pending');
      const pendingData = await pendingResponse.json();
      if (pendingData.success) {
        setPendingObligations(pendingData.data);
      }
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async () => {
    try {
      const response = await fetch('/api/admin/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Transação criada com sucesso!');
        setShowTransactionModal(false);
        setNewTransaction({
          type: 'entrada',
          description: '',
          amount: 0,
          currency: 'BRL',
          related_user_id: '',
          related_affiliate_id: ''
        });
        fetchData();
      } else {
        alert('Erro ao criar transação: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Erro ao criar transação');
    }
  };

  const processRefund = async (refundId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/accounting/refunds/${refundId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Reembolso ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        fetchData();
      } else {
        alert('Erro ao processar reembolso: ' + data.error);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Erro ao processar reembolso');
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTransactionTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'entrada': 'Entrada',
      'pagamento_usuario': 'Pagamento Usuário',
      'pagamento_afiliado': 'Pagamento Afiliado',
      'retirada_empresa': 'Retirada Empresa',
      'reserva': 'Reserva'
    };
    return types[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600 bg-green-100';
      case 'pagamento_usuario': return 'text-blue-600 bg-blue-100';
      case 'pagamento_afiliado': return 'text-purple-600 bg-purple-100';
      case 'retirada_empresa': return 'text-red-600 bg-red-100';
      case 'reserva': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Contabilidade</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowTransactionModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Nova Transação
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Visão Geral' },
              { id: 'transactions', name: 'Transações' },
              { id: 'pending', name: 'Pendências' },
              { id: 'monthly', name: 'Fluxo Mensal' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total de Entradas</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(overview.overview.total_entradas)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total de Saídas</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(overview.overview.pagos_usuarios + overview.overview.pagos_afiliados + overview.overview.retiradas)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Saldo Líquido</h3>
                <p className={`text-2xl font-bold ${overview.overview.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(overview.overview.saldo_liquido)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Pagamentos Usuários</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(overview.overview.pagos_usuarios)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Pagamentos Afiliados</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(overview.overview.pagos_afiliados)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Saldo Comprometido</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(overview.overview.saldo_comprometido)}
                </p>
              </div>
            </div>

            {overview.by_currency.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Saldo por Moeda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overview.by_currency.map((currency) => (
                    <div key={currency.currency} className="border rounded-lg p-4">
                      <div className="text-lg font-bold text-gray-900">{currency.currency}</div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Entradas:</span>
                          <span className="text-green-600 ml-2">
                            {formatCurrency(currency.entradas, currency.currency)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Saídas:</span>
                          <span className="text-red-600 ml-2">
                            {formatCurrency(currency.saidas, currency.currency)}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          <span className="text-gray-500">Líquido:</span>
                          <span className={`ml-2 ${currency.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(currency.saldo_liquido, currency.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relacionado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{transaction.description}</div>
                        {transaction.operation_symbol && (
                          <div className="text-xs text-gray-500">
                            Operação: {transaction.operation_symbol} 
                            ({formatCurrency(transaction.operation_profit, 'USD')})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.user_name && (
                          <div className="text-sm text-gray-900">
                            Usuário: {transaction.user_name}
                          </div>
                        )}
                        {transaction.affiliate_name && (
                          <div className="text-sm text-gray-900">
                            Afiliado: {transaction.affiliate_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pendências Financeiras ({pendingObligations.length})
              </h3>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beneficiário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingObligations.map((obligation) => (
                      <tr key={obligation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            obligation.type === 'refund_request' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {obligation.type === 'refund_request' ? 'Reembolso' : 'Comissão Afiliado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {obligation.user_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {obligation.user_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(obligation.amount, obligation.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(obligation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {obligation.type === 'refund_request' ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => processRefund(obligation.id, 'approve')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => processRefund(obligation.id, 'reject')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <button className="text-purple-600 hover:text-purple-900">
                              Processar Pagamento
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pendingObligations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">Nenhuma pendência encontrada</div>
              </div>
            )}
          </div>
        )}

        {/* Monthly Tab */}
        {activeTab === 'monthly' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fluxo Mensal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mês
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Moeda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entradas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saídas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Líquido
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyFlow.map((flow, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {flow.mes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {flow.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(flow.entradas, flow.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(flow.saidas, flow.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${flow.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(flow.saldo_liquido, flow.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Nova Transação
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({
                        ...newTransaction,
                        type: e.target.value
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="pagamento_usuario">Pagamento Usuário</option>
                      <option value="pagamento_afiliado">Pagamento Afiliado</option>
                      <option value="retirada_empresa">Retirada Empresa</option>
                      <option value="reserva">Reserva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({
                        ...newTransaction,
                        description: e.target.value
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({
                        ...newTransaction,
                        amount: parseFloat(e.target.value)
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Moeda
                    </label>
                    <select
                      value={newTransaction.currency}
                      onChange={(e) => setNewTransaction({
                        ...newTransaction,
                        currency: e.target.value
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BRL">BRL - Real</option>
                      <option value="USD">USD - Dólar</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setShowTransactionModal(false);
                      setNewTransaction({
                        type: 'entrada',
                        description: '',
                        amount: 0,
                        currency: 'BRL',
                        related_user_id: '',
                        related_affiliate_id: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createTransaction}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Criar Transação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}




import React from 'react';
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';

interface Affiliate {
  affiliate_id: string;
  affiliate_name: string;
  affiliate_email: string;
  affiliate_code: string;
  created_at: string;
  financial_credits: number;
  total_referrals: number;
  total_operations: number;
  total_commissions: number;
  total_profits_generated: number;
  last_commission_date: string;
}

interface AffiliateStats {
  total_affiliates: number;
  total_referrals: number;
  total_commissions_paid: number;
  total_profits_generated: number;
  total_affiliate_operations: number;
  avg_commission_per_operation: number;
  top_affiliates: Array<{
    affiliate_name: string;
    affiliate_email: string;
    total_earned: number;
    referrals_count: number;
  }>;
}

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    affiliate_id: '',
    amount: 0,
    currency: 'BRL',
    reference_period: ''
  });

  useEffect(() => {
    fetchAffiliates();
    fetchStats();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();
      if (data.success) {
        setAffiliates(data.data);
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    try {
      const response = await fetch(`/api/admin/affiliates/${paymentData.affiliate_id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference_period: paymentData.reference_period
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Pagamento processado com sucesso!');
        setShowPaymentModal(false);
        setPaymentData({ affiliate_id: '', amount: 0, currency: 'BRL', reference_period: '' });
        fetchAffiliates();
      } else {
        alert('Erro ao processar pagamento: ' + data.error);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Erro ao processar pagamento');
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => 
    affiliate.affiliate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.affiliate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.affiliate_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Afiliados</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Processar Pagamento
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Criar Afiliado
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total de Afiliados</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.total_affiliates}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total_referrals} referências total
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Comissões Pagas</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.total_commissions_paid)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total_affiliate_operations} operações
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Lucros Gerados</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.total_profits_generated)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Média: {formatCurrency(stats.avg_commission_per_operation)}
              </p>
            </div>
          </div>
        )}

        {/* Top Affiliates */}
        {stats?.top_affiliates && stats.top_affiliates.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Afiliados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.top_affiliates.slice(0, 6).map((affiliate, index) => (
                <div key={affiliate.affiliate_email} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{affiliate.affiliate_name}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">{affiliate.affiliate_email}</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(affiliate.total_earned)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {affiliate.referrals_count} referências
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            placeholder="Buscar por nome, email ou código..."
            value={searchTerm}
            onChange={(e) = /> setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Afiliado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referências
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comissões
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créditos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Comissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.affiliate_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {affiliate.affiliate_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {affiliate.affiliate_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {affiliate.affiliate_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {affiliate.affiliate_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{affiliate.total_referrals}</div>
                      <div className="text-xs text-gray-500">usuários</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{affiliate.total_operations}</div>
                      <div className="text-xs text-gray-500">operações</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium text-green-600">
                        {formatCurrency(affiliate.total_commissions)}
                      </div>
                      <div className="text-xs text-gray-500">
                        De {formatCurrency(affiliate.total_profits_generated)} gerados
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">
                        {formatCurrency(affiliate.financial_credits, 'BRL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(affiliate.last_commission_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedAffiliate(affiliate.affiliate_id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => {
                          setPaymentData({
                            ...paymentData,
                            affiliate_id: affiliate.affiliate_id,
                            amount: affiliate.total_commissions
                          });
                          setShowPaymentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Pagar
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAffiliates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Nenhum afiliado encontrado</div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Processar Pagamento de Afiliado
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) = /> setPaymentData({
                        ...paymentData,
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
                      value={paymentData.currency}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        currency: e.target.value
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BRL">BRL - Real</option>
                      <option value="USD">USD - Dólar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Período de Referência
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2024-01"
                      value={paymentData.reference_period}
                      onChange={(e) = /> setPaymentData({
                        ...paymentData,
                        reference_period: e.target.value
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentData({ affiliate_id: '', amount: 0, currency: 'BRL', reference_period: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processPayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Processar Pagamento
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

import React from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiDollarSign, FiClock, FiCheck, FiX, FiUser, FiUsers,
  FiFilter, FiDownload, FiRefreshCw, FiEye, FiEdit, FiSearch 
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';

interface RefundRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  affiliate_id?: string;
  affiliate_name?: string;
  request_type: 'user_refund' | 'affiliate_payment';
  amount: number;
  reason: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  processed_by?: string;
  processing_notes?: string;
  original_transaction_id?: string;
  payment_method?: string;
  bank_details?: any;
}

export default function AdjustmentsManagement() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');

  const { data: refundRequests, error, mutate } = useSWR('/api/admin/refund-requests', {
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const { data: statistics } = useSWR('/api/admin/refund-requests/stats');

  const filteredRequests = (refundRequests || []).filter((request: RefundRequest) => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = searchTerm === '' || 
      request.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.affiliate_name && request.affiliate_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/admin/refund-requests/${selectedRequest.id}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: processingStatus,
          notes: processingNotes
        })
      });

      if (response.ok) {
        mutate();
        setIsProcessingModalOpen(false);
        setSelectedRequest(null);
        setProcessingStatus('');
        setProcessingNotes('');
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  const handleExportRequests = async () => {
    try {
      const response = await fetch('/api/admin/refund-requests/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter, searchTerm })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `refund-requests-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting requests:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Acertos - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Acertos</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Controle de pedidos de reembolso de usuários e afiliados
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleExportRequests}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Exportar
                  </button>
                  
                  <button
                    onClick={() => mutate()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiClock className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.pending}</dd>
                          <dd className="text-sm text-gray-600">{formatCurrency(statistics.pending_amount)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiEdit className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Em Andamento</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.in_progress}</dd>
                          <dd className="text-sm text-gray-600">{formatCurrency(statistics.in_progress_amount)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiCheck className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Concluídos</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.completed}</dd>
                          <dd className="text-sm text-gray-600">{formatCurrency(statistics.completed_amount)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiDollarSign className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Geral</dt>
                          <dd className="text-lg font-medium text-gray-900">{statistics.total}</dd>
                          <dd className="text-sm text-gray-600">{formatCurrency(statistics.total_amount)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nome, email ou afiliado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="sm:w-48">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="pending">Pendentes</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="approved">Aprovados</option>
                      <option value="rejected">Rejeitados</option>
                      <option value="completed">Concluídos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solicitante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {filteredRequests.map((request: RefundRequest) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                {request.request_type === 'affiliate_payment' ? (
                                  <FiUsers className="h-5 w-5 text-gray-600" />
                                ) : (
                                  <FiUser className="h-5 w-5 text-gray-600" />
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.request_type === 'affiliate_payment' ? request.affiliate_name : request.user_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.request_type === 'affiliate_payment' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {request.request_type === 'affiliate_payment' ? 'Afiliado' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(request.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                            {(request.status === 'pending' || request.status === 'in_progress') && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsProcessingModalOpen(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <FiEdit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      <Modal
        isOpen={selectedRequest !== null && !isProcessingModalOpen}
        onClose={() => setSelectedRequest(null)}
        title="Detalhes da Solicitação"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <p className="text-sm text-gray-900">
                  {selectedRequest.request_type === 'affiliate_payment' ? 'Pagamento de Afiliado' : 'Reembolso de Usuário'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valor</label>
                <p className="text-sm text-gray-900">{formatCurrency(selectedRequest.amount)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Solicitante</label>
              <p className="text-sm text-gray-900">
                {selectedRequest.request_type === 'affiliate_payment' ? selectedRequest.affiliate_name : selectedRequest.user_name}
              </p>
              <p className="text-sm text-gray-500">{selectedRequest.user_email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Motivo</label>
              <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                {getStatusText(selectedRequest.status)}
              </span>
            </div>

            {selectedRequest.processing_notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Observações do Processamento</label>
                <p className="text-sm text-gray-900">{selectedRequest.processing_notes}</p>
              </div>
            )}

            {selectedRequest.bank_details && (
              <div>
                <label className="text-sm font-medium text-gray-500">Dados Bancários</label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {JSON.stringify(selectedRequest.bank_details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Processing Modal */}
      <Modal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        title="Processar Solicitação"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novo Status
            </label>
            <select
              value={processingStatus}
              onChange={(e) => setProcessingStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione um status</option>
              <option value="in_progress">Em Andamento</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={processingNotes}
              onChange={(e) => setProcessingNotes(e.target.value)}
              rows={4}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Adicione observações sobre o processamento..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsProcessingModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcessRequest}
              disabled={!processingStatus}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Processar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}




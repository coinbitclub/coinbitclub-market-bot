import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  CogIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';
import { systemService, downloadFile } from '../../src/services/api';
import { useNotifications } from '../../src/contexts/NotificationContext';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'user' | 'financial' | 'admin' | 'security';
  status: 'success' | 'failed' | 'warning';
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'login_attempt' | 'permission_denied' | 'suspicious_activity' | 'data_breach' | 'system_intrusion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  description: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

const AuditLogsPage: NextPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'security'>('audit');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    severity: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });
  const [exporting, setExporting] = useState(false);
  const { addNotification } = useNotifications();

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  useEffect(() => {
    fetchAuditData();
  }, [filters]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      // Mock data - substituir por chamadas reais à API
      const mockAuditLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2024-01-24T14:30:00Z',
          userId: 'admin_001',
          userName: 'Admin Principal',
          action: 'CREATE_AFFILIATE',
          resource: 'affiliates',
          resourceId: 'aff_123',
          details: { affiliateName: 'Pedro Silva', isVip: true, commission: 5 },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'medium',
          category: 'admin',
          status: 'success'
        },
        {
          id: '2',
          timestamp: '2024-01-24T14:15:00Z',
          userId: 'admin_001',
          userName: 'Admin Principal',
          action: 'UPDATE_SYSTEM_CONFIG',
          resource: 'settings',
          resourceId: 'email_config',
          details: { provider: 'sendgrid', previousProvider: 'smtp' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'high',
          category: 'system',
          status: 'success'
        },
        {
          id: '3',
          timestamp: '2024-01-24T13:45:00Z',
          userId: 'user_456',
          userName: 'João Cliente',
          action: 'WITHDRAW_REQUEST',
          resource: 'withdrawals',
          resourceId: 'with_789',
          details: { amount: 1500.00, method: 'PIX' },
          ipAddress: '201.45.123.89',
          userAgent: 'Mozilla/5.0 (Android 12; Mobile) AppleWebKit/537.36',
          severity: 'medium',
          category: 'financial',
          status: 'success'
        },
        {
          id: '4',
          timestamp: '2024-01-24T13:30:00Z',
          userId: 'unknown',
          userName: 'Usuário Desconhecido',
          action: 'LOGIN_ATTEMPT',
          resource: 'auth',
          details: { email: 'admin@fake.com', attempts: 5 },
          ipAddress: '45.123.67.89',
          userAgent: 'curl/7.68.0',
          severity: 'critical',
          category: 'security',
          status: 'failed'
        },
        {
          id: '5',
          timestamp: '2024-01-24T12:00:00Z',
          userId: 'admin_001',
          userName: 'Admin Principal',
          action: 'EMERGENCY_STOP',
          resource: 'trading_system',
          details: { reason: 'Volatilidade extrema detectada', tradersAffected: 12 },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'critical',
          category: 'system',
          status: 'success'
        }
      ];

      const mockSecurityEvents: SecurityEvent[] = [
        {
          id: 'sec_1',
          timestamp: '2024-01-24T13:30:00Z',
          type: 'login_attempt',
          severity: 'critical',
          ipAddress: '45.123.67.89',
          description: 'Múltiplas tentativas de login falharam para conta admin',
          resolved: false
        },
        {
          id: 'sec_2',
          timestamp: '2024-01-24T10:15:00Z',
          type: 'suspicious_activity',
          severity: 'medium',
          userId: 'user_789',
          ipAddress: '198.51.100.42',
          description: 'Usuário acessando sistema de localização incomum',
          resolved: true,
          resolvedBy: 'Admin Principal',
          resolvedAt: '2024-01-24T11:00:00Z',
          notes: 'Usuário confirmou viagem. Atividade legítima.'
        }
      ];

      setAuditLogs(mockAuditLogs);
      setSecurityEvents(mockSecurityEvents);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Carregar Logs',
        message: 'Não foi possível carregar os logs de auditoria'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      setExporting(true);
      
      const blob = await systemService.exportLogs({
        ...filters,
        format: 'csv',
        includeDetails: true
      });
      
      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(blob, filename);
      
      addNotification({
        type: 'success',
        title: 'Logs Exportados',
        message: 'Arquivo de logs foi baixado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      addNotification({
        type: 'error',
        title: 'Erro na Exportação',
        message: 'Não foi possível exportar os logs'
      });
    } finally {
      setExporting(false);
    }
  };

  const resolveSecurityEvent = async (eventId: string, notes: string) => {
    try {
      // Aqui seria feita a chamada real à API
      setSecurityEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              resolved: true, 
              resolvedBy: 'Admin Principal',
              resolvedAt: new Date().toISOString(),
              notes 
            }
          : event
      ));
      
      addNotification({
        type: 'success',
        title: 'Evento Resolvido',
        message: 'Evento de segurança foi marcado como resolvido'
      });
    } catch (error) {
      console.error('Erro ao resolver evento:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Resolver',
        message: 'Não foi possível resolver o evento'
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs border border-red-700';
      case 'high': return 'px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs border border-orange-700';
      case 'medium': return 'px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs border border-yellow-700';
      case 'low': return 'px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs border border-green-700';
      default: return 'px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'system': return 'px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs';
      case 'security': return 'px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs';
      case 'financial': return 'px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs';
      case 'admin': return 'px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs';
      case 'user': return 'px-2 py-1 bg-cyan-900/50 text-cyan-300 rounded text-xs';
      default: return 'px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs';
      case 'failed': return 'px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs';
      case 'warning': return 'px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs';
      default: return 'px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filters.search && !log.action.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.userName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.resource.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category !== 'all' && log.category !== filters.category) return false;
    if (filters.severity !== 'all' && log.severity !== filters.severity) return false;
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    return true;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando logs de auditoria...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Auditoria e Logs - CoinBit Club</title>
      </Head>

      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Auditoria e Segurança</h1>
                  <p className="text-gray-400">Monitoramento completo de atividades e eventos de segurança</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportLogs}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  {exporting ? (
                    <ClockIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  )}
                  Exportar Logs
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'audit'
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Logs de Auditoria
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'security'
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LockClosedIcon className="w-5 h-5" />
                    Eventos de Segurança
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'audit' && (
            <>
              {/* Filtros */}
              <div style={cardStyle} className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <FunnelIcon className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Filtros de Auditoria</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="Ação, usuário, recurso..."
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">Todas</option>
                      <option value="system">Sistema</option>
                      <option value="security">Segurança</option>
                      <option value="financial">Financeiro</option>
                      <option value="admin">Admin</option>
                      <option value="user">Usuário</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Severidade</label>
                    <select
                      value={filters.severity}
                      onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">Todas</option>
                      <option value="critical">Crítica</option>
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Baixa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">Todos</option>
                      <option value="success">Sucesso</option>
                      <option value="failed">Falha</option>
                      <option value="warning">Aviso</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data Inicial</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data Final</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tabela de Logs */}
              <div style={cardStyle}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Logs de Auditoria ({filteredLogs.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-300">Timestamp</th>
                        <th className="text-left p-3 text-gray-300">Usuário</th>
                        <th className="text-left p-3 text-gray-300">Ação</th>
                        <th className="text-left p-3 text-gray-300">Recurso</th>
                        <th className="text-left p-3 text-gray-300">Categoria</th>
                        <th className="text-left p-3 text-gray-300">Severidade</th>
                        <th className="text-left p-3 text-gray-300">Status</th>
                        <th className="text-left p-3 text-gray-300">IP</th>
                        <th className="text-left p-3 text-gray-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3 text-gray-300">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-white font-medium">{log.userName}</p>
                              <p className="text-xs text-gray-400">{log.userId}</p>
                            </div>
                          </td>
                          <td className="p-3 text-blue-400 font-medium">
                            {log.action.replace(/_/g, ' ')}
                          </td>
                          <td className="p-3 text-gray-300">
                            {log.resource}
                            {log.resourceId && (
                              <p className="text-xs text-gray-400">{log.resourceId}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={getCategoryBadge(log.category)}>
                              {log.category}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={getSeverityBadge(log.severity)}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={getStatusBadge(log.status)}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400 text-sm">
                            {log.ipAddress}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                              title="Ver Detalhes"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Não há logs para os filtros selecionados.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div style={cardStyle}>
              <h3 className="text-xl font-bold text-white mb-6">Eventos de Segurança</h3>
              
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${
                      event.resolved 
                        ? 'bg-green-900/10 border-green-700' 
                        : event.severity === 'critical' 
                          ? 'bg-red-900/10 border-red-700'
                          : 'bg-yellow-900/10 border-yellow-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={getSeverityBadge(event.severity)}>
                            {event.severity}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(event.timestamp).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-sm text-gray-400">
                            IP: {event.ipAddress}
                          </span>
                        </div>
                        <h4 className="text-white font-medium mb-1">
                          {event.type.replace(/_/g, ' ').toUpperCase()}
                        </h4>
                        <p className="text-gray-300 text-sm mb-2">{event.description}</p>
                        
                        {event.resolved && (
                          <div className="text-sm text-green-400">
                            ✅ Resolvido por {event.resolvedBy} em {new Date(event.resolvedAt!).toLocaleString('pt-BR')}
                            {event.notes && (
                              <p className="text-gray-400 mt-1">{event.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!event.resolved && (
                        <button
                          onClick={() => {
                            const notes = prompt('Adicione uma nota sobre a resolução:');
                            if (notes) {
                              resolveSecurityEvent(event.id, notes);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500 transition-colors"
                        >
                          Resolver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal de Detalhes do Log */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-yellow-500/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Detalhes do Log de Auditoria</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Timestamp</label>
                      <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Usuário</label>
                      <p className="text-white">{selectedLog.userName} ({selectedLog.userId})</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Ação</label>
                      <p className="text-blue-400 font-medium">{selectedLog.action.replace(/_/g, ' ')}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Recurso</label>
                      <p className="text-white">{selectedLog.resource}</p>
                      {selectedLog.resourceId && (
                        <p className="text-gray-400 text-sm">ID: {selectedLog.resourceId}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                      <span className={getCategoryBadge(selectedLog.category)}>
                        {selectedLog.category}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Severidade</label>
                      <span className={getSeverityBadge(selectedLog.severity)}>
                        {selectedLog.severity}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <span className={getStatusBadge(selectedLog.status)}>
                        {selectedLog.status}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Endereço IP</label>
                      <p className="text-white">{selectedLog.ipAddress}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">User Agent</label>
                  <p className="text-gray-400 text-sm bg-gray-800 p-2 rounded break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
                
                {selectedLog.details && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Detalhes</label>
                    <pre className="text-gray-300 text-sm bg-gray-800 p-4 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogsPage;

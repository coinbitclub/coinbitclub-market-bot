import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  CogIcon,
  ServerIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  PowerIcon,
  CommandLineIcon,
  CircleStackIcon,
  BellIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  KeyIcon,
  CloudIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface SystemStatus {
  apiGateway: 'online' | 'offline' | 'error';
  database: 'connected' | 'disconnected' | 'error';
  tradingEngine: 'running' | 'stopped' | 'error';
  binanceAPI: 'connected' | 'disconnected' | 'rate_limited';
  bybitAPI: 'connected' | 'disconnected' | 'rate_limited';
  redis: 'connected' | 'disconnected' | 'error';
  scheduler: 'active' | 'inactive' | 'error';
  monitoring: 'active' | 'inactive' | 'error';
}

interface SystemConfig {
  tradingEnabled: boolean;
  maintenanceMode: boolean;
  autoRestart: boolean;
  logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  maxConcurrentTrades: number;
  emergencyStopEnabled: boolean;
  binanceEnabled: boolean;
  bybitEnabled: boolean;
  notificationsEnabled: boolean;
  backupEnabled: boolean;
  rateLimitBypass: boolean;
}

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string;
  message: string;
  details?: string;
}

const ConfiguracoesAvancadas: NextPage = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiGateway: 'online',
    database: 'connected',
    tradingEngine: 'running',
    binanceAPI: 'connected',
    bybitAPI: 'connected',
    redis: 'connected',
    scheduler: 'active',
    monitoring: 'active'
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    tradingEnabled: true,
    maintenanceMode: false,
    autoRestart: true,
    logLevel: 'INFO',
    maxConcurrentTrades: 10,
    emergencyStopEnabled: false,
    binanceEnabled: true,
    bybitEnabled: true,
    notificationsEnabled: true,
    backupEnabled: true,
    rateLimitBypass: false
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStatus();
    fetchSystemConfig();
    fetchRecentLogs();
    
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      // API call para status do sistema
      // Simular dados em tempo real
      const randomStatus = () => Math.random() > 0.1 ? 'online' : 'error';
      
      setSystemStatus({
        apiGateway: 'online',
        database: 'connected',
        tradingEngine: systemConfig.tradingEnabled ? 'running' : 'stopped',
        binanceAPI: systemConfig.binanceEnabled ? 'connected' : 'disconnected',
        bybitAPI: systemConfig.bybitEnabled ? 'connected' : 'disconnected',
        redis: 'connected',
        scheduler: 'active',
        monitoring: 'active'
      });
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      // API call para configurações do sistema
      // Dados virão do backend
      console.log('Configurações carregadas');
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const mockLogs: LogEntry[] = [
        {
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          level: 'INFO',
          service: 'API Gateway',
          message: 'Sistema iniciado com sucesso',
          details: 'Todas as rotas carregadas corretamente'
        },
        {
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          level: 'WARN',
          service: 'Trading Engine',
          message: 'Alto volume de trades detectado',
          details: 'Volume acima de 80% da capacidade máxima'
        },
        {
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          level: 'ERROR',
          service: 'Binance API',
          message: 'Rate limit temporário atingido',
          details: 'Sistema aguardando reset automático em 60 segundos'
        },
        {
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          level: 'INFO',
          service: 'Database',
          message: 'Backup automático concluído',
          details: 'Backup salvo em /backups/auto_2024-01-20.sql'
        }
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    }
  };

  const handleSystemAction = async (action: string, service?: string) => {
    try {
      setProcessing(action);
      setLoading(true);

      // Simular delay de operação
      await new Promise(resolve => setTimeout(resolve, 2000));

      switch (action) {
        case 'restart_all':
          alert('Sistema reiniciado com sucesso!');
          break;
        case 'emergency_stop':
          setSystemConfig(prev => ({
            ...prev,
            tradingEnabled: false,
            binanceEnabled: false,
            bybitEnabled: false,
            emergencyStopEnabled: true
          }));
          alert('PARADA DE EMERGÊNCIA ATIVADA! Todas as operações foram interrompidas.');
          break;
        case 'clear_logs':
          setLogs([]);
          alert('Logs limpos com sucesso!');
          break;
        case 'reset_system':
          if (confirm('ATENÇÃO: Esta ação irá resetar TODAS as configurações para o padrão. Confirma?')) {
            setSystemConfig({
              tradingEnabled: false,
              maintenanceMode: true,
              autoRestart: true,
              logLevel: 'INFO',
              maxConcurrentTrades: 5,
              emergencyStopEnabled: false,
              binanceEnabled: false,
              bybitEnabled: false,
              notificationsEnabled: true,
              backupEnabled: true,
              rateLimitBypass: false
            });
            alert('Sistema resetado! Por favor, reconfigure as opções necessárias.');
          }
          break;
        case 'start_trading':
          setSystemConfig(prev => ({ ...prev, tradingEnabled: true }));
          alert('Trading Engine iniciado!');
          break;
        case 'stop_trading':
          setSystemConfig(prev => ({ ...prev, tradingEnabled: false }));
          alert('Trading Engine parado!');
          break;
        case 'restart_api':
          alert('API Gateway reiniciado!');
          break;
        case 'backup_now':
          alert('Backup manual iniciado! Você será notificado quando concluído.');
          break;
      }

      await fetchSystemStatus();
    } catch (error) {
      alert('Erro ao executar ação: ' + error);
    } finally {
      setProcessing(null);
      setLoading(false);
      setShowConfirmDialog(null);
    }
  };

  const updateConfig = async (key: keyof SystemConfig, value: any) => {
    try {
      setSystemConfig(prev => ({ ...prev, [key]: value }));
      
      // API call para salvar configuração
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Configuração ${key} atualizada para:`, value);
    } catch (error) {
      alert('Erro ao salvar configuração');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'running':
      case 'active':
        return 'bg-green-500';
      case 'offline':
      case 'disconnected':
      case 'stopped':
      case 'inactive':
        return 'bg-red-500';
      case 'rate_limited':
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      case 'INFO': return 'text-blue-400';
      case 'DEBUG': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const ConfirmDialog = ({ action, title, message, onConfirm, onCancel }: any) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <Head>
        <title>Configurações Avançadas - CoinBitClub Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 flex items-center">
              <CogIcon className="h-8 w-8 mr-3" />
              Configurações Avançadas do Sistema
            </h1>
            <p className="text-gray-400 mt-2">Controle completo do sistema e operações críticas</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor('online')} animate-pulse`}></div>
            <span className="text-green-400 text-sm font-medium">Sistema Online</span>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-lg p-6 border border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <ShieldExclamationIcon className="h-6 w-6 mr-2 text-red-300" />
                Controles de Emergência
              </h2>
              <p className="text-red-200 text-sm mt-1">Use apenas em situações críticas</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog('emergency_stop')}
                disabled={systemConfig.emergencyStopEnabled || processing === 'emergency_stop'}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                PARADA DE EMERGÊNCIA
              </button>
              
              <button
                onClick={() => setShowConfirmDialog('reset_system')}
                disabled={processing === 'reset_system'}
                className="px-4 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Reset Sistema
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-black/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
            <ServerIcon className="h-6 w-6 mr-2" />
            Status dos Serviços
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemStatus).map(([service, status]) => (
              <div key={service} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm capitalize">
                    {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                </div>
                <span className="text-white font-medium capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
              <PowerIcon className="h-6 w-6 mr-2" />
              Controle de Serviços
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-white">Trading Engine</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSystemAction('start_trading')}
                    disabled={systemConfig.tradingEnabled || processing === 'start_trading'}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSystemAction('stop_trading')}
                    disabled={!systemConfig.tradingEnabled || processing === 'stop_trading'}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    <StopIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-white">API Gateway</span>
                <button
                  onClick={() => handleSystemAction('restart_api')}
                  disabled={processing === 'restart_api'}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-white">Sistema Completo</span>
                <button
                  onClick={() => setShowConfirmDialog('restart_all')}
                  disabled={processing === 'restart_all'}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
              <AdjustmentsHorizontalIcon className="h-6 w-6 mr-2" />
              Configurações Operacionais
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Trading Ativo</span>
                <button
                  onClick={() => updateConfig('tradingEnabled', !systemConfig.tradingEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    systemConfig.tradingEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    systemConfig.tradingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white">Binance API</span>
                <button
                  onClick={() => updateConfig('binanceEnabled', !systemConfig.binanceEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    systemConfig.binanceEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    systemConfig.binanceEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white">Bybit API</span>
                <button
                  onClick={() => updateConfig('bybitEnabled', !systemConfig.bybitEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    systemConfig.bybitEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    systemConfig.bybitEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white">Modo Manutenção</span>
                <button
                  onClick={() => updateConfig('maintenanceMode', !systemConfig.maintenanceMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    systemConfig.maintenanceMode ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    systemConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div>
                <label className="block text-white text-sm mb-2">Trades Simultâneos (Max)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={systemConfig.maxConcurrentTrades}
                  onChange={(e) => updateConfig('maxConcurrentTrades', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm mb-2">Nível de Log</label>
                <select
                  value={systemConfig.logLevel}
                  onChange={(e) => updateConfig('logLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="ERROR">ERROR</option>
                  <option value="WARN">WARN</option>
                  <option value="INFO">INFO</option>
                  <option value="DEBUG">DEBUG</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="bg-black/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-yellow-400 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Logs do Sistema
            </h2>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog('clear_logs')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Limpar Logs
              </button>
              
              <button
                onClick={fetchRecentLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Atualizar
              </button>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <span className="text-gray-500 w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`w-16 flex-shrink-0 font-medium ${getLogLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-blue-400 w-24 flex-shrink-0">{log.service}</span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum log disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Tools */}
        <div className="bg-black/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
            <CommandLineIcon className="h-6 w-6 mr-2" />
            Ferramentas Avançadas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleSystemAction('backup_now')}
              disabled={processing === 'backup_now'}
              className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              <CircleStackIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Backup Manual</span>
            </button>
            
            <button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg text-white hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              <ChartBarIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Análise Performance</span>
            </button>
            
            <button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              className="p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white hover:from-green-700 hover:to-green-800 transition-all"
            >
              <KeyIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Regenerar Tokens</span>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-black/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
            <CloudIcon className="h-6 w-6 mr-2" />
            Informações do Sistema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-white font-medium mb-2">Versão</h3>
              <p className="text-gray-300 text-sm">CoinBitClub v2.1.0</p>
              <p className="text-gray-300 text-sm">Build: 20240120</p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-2">Uptime</h3>
              <p className="text-gray-300 text-sm">15h 32m 41s</p>
              <p className="text-gray-300 text-sm">Última reinicialização: 20/01 08:00</p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-2">Recursos</h3>
              <p className="text-gray-300 text-sm">CPU: 45% | RAM: 68%</p>
              <p className="text-gray-300 text-sm">Disco: 234GB/500GB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {showConfirmDialog === 'emergency_stop' && (
        <ConfirmDialog
          action="emergency_stop"
          title="⚠️ PARADA DE EMERGÊNCIA"
          message="Esta ação irá PARAR IMEDIATAMENTE todas as operações de trading e desconectar todas as APIs. Use apenas em situações críticas. Confirma?"
          onConfirm={() => handleSystemAction('emergency_stop')}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}

      {showConfirmDialog === 'reset_system' && (
        <ConfirmDialog
          action="reset_system"
          title="Reset Completo do Sistema"
          message="Esta ação irá resetar TODAS as configurações para os valores padrão e pode causar perda de dados temporários. Confirma?"
          onConfirm={() => handleSystemAction('reset_system')}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}

      {showConfirmDialog === 'restart_all' && (
        <ConfirmDialog
          action="restart_all"
          title="Reiniciar Sistema Completo"
          message="Esta ação irá reiniciar todos os serviços do sistema. O sistema ficará indisponível por alguns minutos. Confirma?"
          onConfirm={() => handleSystemAction('restart_all')}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}

      {showConfirmDialog === 'clear_logs' && (
        <ConfirmDialog
          action="clear_logs"
          title="Limpar Logs"
          message="Esta ação irá remover todos os logs do sistema. Esta operação não pode ser desfeita. Confirma?"
          onConfirm={() => handleSystemAction('clear_logs')}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-gray-900 rounded-lg p-6 flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mr-4"></div>
            <span className="text-white">Processando {processing}...</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ConfiguracoesAvancadas;

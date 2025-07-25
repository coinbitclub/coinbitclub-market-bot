import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  CogIcon,
  KeyIcon,
  BellIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CloudIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';
import { settingsService } from '../../src/services/api';
import { FormValidator, systemConfigValidator } from '../../src/utils/validation';
import { useNotifications } from '../../src/contexts/NotificationContext.simple';

interface SystemConfig {
  // APIs
  tradingViewApiKey: string;
  coinStatsApiKey: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  whatsappApiToken: string;
  openaiApiKey: string;
  
  // Trading Settings
  maxOrderSize: number;
  defaultStopLoss: number;
  defaultTakeProfit: number;
  maxConcurrentOrders: number;
  
  // Commission Settings
  basicCommissionRate: number;
  premiumCommissionRate: number;
  vipCommissionRate: number;
  
  // Notification Settings
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
  
  // System Settings
  maintenanceMode: boolean;
  autoBackup: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  sessionTimeout: number;
}

const ConfiguracoesAdmin: NextPage = () => {
  const { addNotification } = useNotifications();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'apis' | 'trading' | 'commission' | 'notifications' | 'system'>('apis');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  // Função para buscar configurações
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const configData = await settingsService.getSystemConfig();
      setConfig(configData);
      addNotification('Configurações carregadas com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      addNotification('Erro ao carregar configurações. Usando dados locais.', 'warning');
      
      // Fallback para dados mockados
      const mockConfig: SystemConfig = {
        tradingViewApiKey: 'tv_***************',
        coinStatsApiKey: 'cs_***************',
        stripePublicKey: 'pk_test_***************',
        stripeSecretKey: 'sk_test_***************',
        whatsappApiToken: 'wa_***************',
        openaiApiKey: 'sk-***************',
        
        maxOrderSize: 10000,
        defaultStopLoss: 5,
        defaultTakeProfit: 10,
        maxConcurrentOrders: 5,
        
        basicCommissionRate: 30,
        premiumCommissionRate: 25,
        vipCommissionRate: 20,
        
        emailNotifications: true,
        whatsappNotifications: true,
        pushNotifications: false,
        
        maintenanceMode: false,
        autoBackup: true,
        logLevel: 'INFO',
        sessionTimeout: 3600
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      // Aqui será feita a integração real com a API
      console.log('Salvando configurações:', config);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações!');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof SystemConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  const tabs = [
    { id: 'apis', name: 'APIs & Integrações', icon: KeyIcon },
    { id: 'trading', name: 'Trading', icon: ChartBarIcon },
    { id: 'commission', name: 'Comissões', icon: CurrencyDollarIcon },
    { id: 'notifications', name: 'Notificações', icon: BellIcon },
    { id: 'system', name: 'Sistema', icon: CogIcon }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Configurações do Sistema - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Configurações">
        <div className="min-h-screen" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Configurações do Sistema
                </h1>
                <p className="text-gray-400">Gerencie todas as configurações da plataforma</p>
              </div>
              
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <CheckIcon className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={cardStyle} className="mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content based on active tab */}
          <div style={cardStyle}>
            {activeTab === 'apis' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <KeyIcon className="w-6 h-6 text-yellow-400" />
                  APIs & Integrações
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">TradingView API Key</label>
                    <input
                      type="password"
                      value={config?.tradingViewApiKey || ''}
                      onChange={(e) => updateConfig('tradingViewApiKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CoinStats API Key</label>
                    <input
                      type="password"
                      value={config?.coinStatsApiKey || ''}
                      onChange={(e) => updateConfig('coinStatsApiKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Public Key</label>
                    <input
                      type="password"
                      value={config?.stripePublicKey || ''}
                      onChange={(e) => updateConfig('stripePublicKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Secret Key</label>
                    <input
                      type="password"
                      value={config?.stripeSecretKey || ''}
                      onChange={(e) => updateConfig('stripeSecretKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp API Token</label>
                    <input
                      type="password"
                      value={config?.whatsappApiToken || ''}
                      onChange={(e) => updateConfig('whatsappApiToken', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">OpenAI API Key</label>
                    <input
                      type="password"
                      value={config?.openaiApiKey || ''}
                      onChange={(e) => updateConfig('openaiApiKey', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trading' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6 text-blue-400" />
                  Configurações de Trading
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tamanho Máximo da Ordem (USD)</label>
                    <input
                      type="number"
                      value={config?.maxOrderSize || 0}
                      onChange={(e) => updateConfig('maxOrderSize', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss Padrão (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config?.defaultStopLoss || 0}
                      onChange={(e) => updateConfig('defaultStopLoss', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit Padrão (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config?.defaultTakeProfit || 0}
                      onChange={(e) => updateConfig('defaultTakeProfit', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Máximo de Ordens Simultâneas</label>
                    <input
                      type="number"
                      value={config?.maxConcurrentOrders || 0}
                      onChange={(e) => updateConfig('maxConcurrentOrders', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'commission' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                  Configurações de Comissão
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Taxa Básica (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config?.basicCommissionRate || 0}
                      onChange={(e) => updateConfig('basicCommissionRate', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Para plano Básico</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Taxa Premium (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config?.premiumCommissionRate || 0}
                      onChange={(e) => updateConfig('premiumCommissionRate', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Para plano Premium</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Taxa VIP (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config?.vipCommissionRate || 0}
                      onChange={(e) => updateConfig('vipCommissionRate', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Para plano VIP</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BellIcon className="w-6 h-6 text-purple-400" />
                  Configurações de Notificação
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <h4 className="text-white font-semibold">Notificações por E-mail</h4>
                      <p className="text-gray-400 text-sm">Enviar alertas e relatórios por e-mail</p>
                    </div>
                    <button
                      onClick={() => updateConfig('emailNotifications', !config?.emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config?.emailNotifications ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config?.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <h4 className="text-white font-semibold">Notificações WhatsApp</h4>
                      <p className="text-gray-400 text-sm">Enviar sinais e alertas via WhatsApp</p>
                    </div>
                    <button
                      onClick={() => updateConfig('whatsappNotifications', !config?.whatsappNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config?.whatsappNotifications ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config?.whatsappNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <h4 className="text-white font-semibold">Push Notifications</h4>
                      <p className="text-gray-400 text-sm">Notificações push no navegador</p>
                    </div>
                    <button
                      onClick={() => updateConfig('pushNotifications', !config?.pushNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config?.pushNotifications ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config?.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CogIcon className="w-6 h-6 text-red-400" />
                  Configurações do Sistema
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Log</label>
                      <select
                        value={config?.logLevel || 'INFO'}
                        onChange={(e) => updateConfig('logLevel', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value="DEBUG">DEBUG</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Timeout de Sessão (segundos)</label>
                      <input
                        type="number"
                        value={config?.sessionTimeout || 0}
                        onChange={(e) => updateConfig('sessionTimeout', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <h4 className="text-white font-semibold">Modo de Manutenção</h4>
                        <p className="text-gray-400 text-sm">Bloquear acesso de usuários regulares</p>
                      </div>
                      <button
                        onClick={() => updateConfig('maintenanceMode', !config?.maintenanceMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config?.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <h4 className="text-white font-semibold">Backup Automático</h4>
                        <p className="text-gray-400 text-sm">Realizar backup diário do banco de dados</p>
                      </div>
                      <button
                        onClick={() => updateConfig('autoBackup', !config?.autoBackup)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config?.autoBackup ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config?.autoBackup ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default ConfiguracoesAdmin;

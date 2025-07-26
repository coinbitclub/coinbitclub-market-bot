import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiSettings, FiMenu, FiX, FiActivity, FiCreditCard,
  FiShield, FiRefreshCw, FiEye, FiEyeOff, FiTrash2, FiPlus,
  FiKey, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar,
  FiSave, FiEdit, FiCheck, FiAlertTriangle, FiLock,
  FiBell, FiToggleLeft, FiToggleRight, FiLink, FiCopy
} from 'react-icons/fi';

interface ApiKey {
  id: string;
  name: string;
  exchange: 'binance' | 'bybit';
  environment: 'testnet' | 'production';
  api_key: string;
  secret_key: string;
  created_at: string;
  last_used: string;
  status: 'active' | 'inactive' | 'error';
  permissions: string[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  timezone: string;
  two_factor_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  last_login: string;
}

interface SettingsData {
  profile: UserProfile;
  api_keys: ApiKey[];
  security_settings: {
    password_last_changed: string;
    login_sessions: number;
    failed_login_attempts: number;
  };
}

export default function UserSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    exchange: 'binance' as 'binance' | 'bybit',
    environment: 'testnet' as 'testnet' | 'production',
    api_key: '',
    secret_key: ''
  });
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/settings');
      
      if (response.ok) {
        const data = await response.json();
        setSettingsData(data);
      } else {
        console.error('Erro ao buscar configurações');
        setSettingsData(getMockData());
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setSettingsData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): SettingsData => ({
    profile: {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '+55 11 99999-9999',
      country: 'BR',
      timezone: 'America/Sao_Paulo',
      two_factor_enabled: true,
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      created_at: '2024-01-15T00:00:00Z',
      last_login: '2024-07-25T08:30:00Z'
    },
    api_keys: [
      {
        id: '1',
        name: 'Binance Principal',
        exchange: 'binance',
        environment: 'production',
        api_key: 'VGhpcyBpcyBhIGZha2UgQVBJIGtleQ==',
        secret_key: '••••••••••••••••••••••••••••••••',
        created_at: '2024-06-01T00:00:00Z',
        last_used: '2024-07-25T08:00:00Z',
        status: 'active',
        permissions: ['SPOT', 'FUTURES', 'READ_ONLY']
      },
      {
        id: '2',
        name: 'Bybit Teste',
        exchange: 'bybit',
        environment: 'testnet',
        api_key: 'VGVzdCBieWJpdCBBUEkga2V5',
        secret_key: '••••••••••••••••••••••••••••••••',
        created_at: '2024-07-01T00:00:00Z',
        last_used: '2024-07-24T15:30:00Z',
        status: 'active',
        permissions: ['SPOT', 'DERIVATIVES']
      }
    ],
    security_settings: {
      password_last_changed: '2024-06-15T00:00:00Z',
      login_sessions: 3,
      failed_login_attempts: 0
    }
  });

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData?.profile),
      });

      if (response.ok) {
        setEditingProfile(false);
        fetchSettings();
      } else {
        console.error('Erro ao salvar perfil');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  const handleAddApiKey = async () => {
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApiKey),
      });

      if (response.ok) {
        setShowNewApiKeyForm(false);
        setNewApiKey({
          name: '',
          exchange: 'binance',
          environment: 'testnet',
          api_key: '',
          secret_key: ''
        });
        fetchSettings();
      } else {
        console.error('Erro ao adicionar API key');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta API Key?')) return;

    try {
      const response = await fetch(`/api/user/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSettings();
      } else {
        console.error('Erro ao remover API key');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  const handleToggleNotification = async (type: string, value: boolean) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [type]: value }),
      });

      if (response.ok) {
        fetchSettings();
      } else {
        console.error('Erro ao atualizar notificações');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aqui poderia adicionar um toast de confirmação
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const data = settingsData || getMockData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'inactive': return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
      case 'error': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Configurações | CoinBitClub</title>
        <meta name="description" content="Configurações da conta - CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64`}>
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
            <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-yellow-400 hover:text-pink-400"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-3">
              <a href="/user/dashboard" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/user/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiCreditCard className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="/user/settings" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 border border-yellow-400/30 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-400">
                <FiShield className="w-4 h-4 mr-2 text-pink-400" />
                {data.profile.name}
              </div>
              <p className="text-xs text-blue-400 mt-1">
                Conta Premium
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:w-0">
          {/* Header */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-yellow-400">Configurações</h2>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchSettings}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-black min-h-screen">
            {/* Tabs */}
            <div className="flex space-x-1 bg-black/80 border border-yellow-400/30 rounded-lg p-1 mb-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'text-blue-400 hover:text-yellow-400'
                }`}
              >
                <FiUser className="w-5 h-5 inline mr-2" />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'api-keys'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'text-blue-400 hover:text-yellow-400'
                }`}
              >
                <FiKey className="w-5 h-5 inline mr-2" />
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'security'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'text-blue-400 hover:text-yellow-400'
                }`}
              >
                <FiShield className="w-5 h-5 inline mr-2" />
                Segurança
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                    : 'text-blue-400 hover:text-yellow-400'
                }`}
              >
                <FiBell className="w-5 h-5 inline mr-2" />
                Notificações
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                    <FiUser className="w-6 h-6 mr-3" />
                    Informações Pessoais
                  </h3>
                  <button
                    onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
                    className="flex items-center px-4 py-2 text-yellow-400 bg-yellow-400/20 border border-yellow-400/50 rounded-lg hover:bg-yellow-400/30 transition-colors"
                  >
                    {editingProfile ? <FiSave className="w-4 h-4 mr-2" /> : <FiEdit className="w-4 h-4 mr-2" />}
                    {editingProfile ? 'Salvar' : 'Editar'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-blue-400 text-sm font-medium mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={data.profile.name}
                      onChange={(e) => setSettingsData(prev => prev ? {
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value }
                      } : null)}
                      disabled={!editingProfile}
                      className={`w-full px-4 py-3 bg-black border rounded-lg text-blue-400 ${
                        editingProfile 
                          ? 'border-blue-400/50 focus:border-yellow-400 focus:outline-none' 
                          : 'border-gray-400/30 text-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-blue-400 text-sm font-medium mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={data.profile.email}
                      onChange={(e) => setSettingsData(prev => prev ? {
                        ...prev,
                        profile: { ...prev.profile, email: e.target.value }
                      } : null)}
                      disabled={!editingProfile}
                      className={`w-full px-4 py-3 bg-black border rounded-lg text-blue-400 ${
                        editingProfile 
                          ? 'border-blue-400/50 focus:border-yellow-400 focus:outline-none' 
                          : 'border-gray-400/30 text-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-blue-400 text-sm font-medium mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={data.profile.phone || ''}
                      onChange={(e) => setSettingsData(prev => prev ? {
                        ...prev,
                        profile: { ...prev.profile, phone: e.target.value }
                      } : null)}
                      disabled={!editingProfile}
                      className={`w-full px-4 py-3 bg-black border rounded-lg text-blue-400 ${
                        editingProfile 
                          ? 'border-blue-400/50 focus:border-yellow-400 focus:outline-none' 
                          : 'border-gray-400/30 text-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-blue-400 text-sm font-medium mb-2">
                      País
                    </label>
                    <select
                      value={data.profile.country}
                      onChange={(e) => setSettingsData(prev => prev ? {
                        ...prev,
                        profile: { ...prev.profile, country: e.target.value }
                      } : null)}
                      disabled={!editingProfile}
                      className={`w-full px-4 py-3 bg-black border rounded-lg text-blue-400 ${
                        editingProfile 
                          ? 'border-blue-400/50 focus:border-yellow-400 focus:outline-none' 
                          : 'border-gray-400/30 text-gray-400'
                      }`}
                    >
                      <option value="BR">Brasil</option>
                      <option value="US">Estados Unidos</option>
                      <option value="UK">Reino Unido</option>
                      <option value="CA">Canadá</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-yellow-400/30">
                  <h4 className="text-lg font-bold text-blue-400 mb-4">Informações da Conta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-300">Membro desde:</span>
                      <span className="ml-2 text-yellow-400">
                        {new Date(data.profile.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-300">Último acesso:</span>
                      <span className="ml-2 text-yellow-400">
                        {new Date(data.profile.last_login).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                      <FiKey className="w-6 h-6 mr-3" />
                      API Keys das Exchanges
                    </h3>
                    <button
                      onClick={() => setShowNewApiKeyForm(true)}
                      className="flex items-center px-4 py-2 text-green-400 bg-green-400/20 border border-green-400/50 rounded-lg hover:bg-green-400/30 transition-colors"
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Adicionar API Key
                    </button>
                  </div>

                  <div className="space-y-4">
                    {data.api_keys.map((apiKey) => (
                      <div key={apiKey.id} className="bg-black/50 rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <h4 className="text-lg font-bold text-blue-400">{apiKey.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apiKey.status)}`}>
                              {apiKey.status === 'active' ? 'Ativa' : 
                               apiKey.status === 'inactive' ? 'Inativa' : 'Erro'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-blue-300 text-sm">Exchange:</span>
                            <span className="ml-2 text-yellow-400 font-medium capitalize">
                              {apiKey.exchange}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-300 text-sm">Ambiente:</span>
                            <span className={`ml-2 font-medium ${
                              apiKey.environment === 'production' ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {apiKey.environment === 'production' ? 'Produção' : 'Testnet'}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-300 text-sm">Último uso:</span>
                            <span className="ml-2 text-blue-400">
                              {new Date(apiKey.last_used).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-300 text-sm">Permissões:</span>
                            <span className="ml-2 text-purple-400">
                              {apiKey.permissions.join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-300 text-sm">API Key:</span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                                  className="text-yellow-400 hover:text-yellow-300"
                                >
                                  {showApiKey === apiKey.id ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(apiKey.api_key)}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <FiCopy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="bg-black border border-gray-400/30 rounded p-3 font-mono text-sm text-gray-400">
                              {showApiKey === apiKey.id ? apiKey.api_key : '••••••••••••••••••••••••••••••••'}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-300 text-sm">Secret Key:</span>
                              <button
                                onClick={() => copyToClipboard(apiKey.secret_key)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="bg-black border border-gray-400/30 rounded p-3 font-mono text-sm text-gray-400">
                              {apiKey.secret_key}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulário Nova API Key */}
                {showNewApiKeyForm && (
                  <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
                    <h3 className="text-xl font-bold text-green-400 mb-6">Adicionar Nova API Key</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-blue-400 text-sm font-medium mb-2">
                            Nome da Configuração
                          </label>
                          <input
                            type="text"
                            value={newApiKey.name}
                            onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Binance Principal"
                            className="w-full px-4 py-3 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-blue-400 text-sm font-medium mb-2">
                            Exchange
                          </label>
                          <select
                            value={newApiKey.exchange}
                            onChange={(e) => setNewApiKey(prev => ({ ...prev, exchange: e.target.value as 'binance' | 'bybit' }))}
                            className="w-full px-4 py-3 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                          >
                            <option value="binance">Binance</option>
                            <option value="bybit">Bybit</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-blue-400 text-sm font-medium mb-2">
                            Ambiente
                          </label>
                          <select
                            value={newApiKey.environment}
                            onChange={(e) => setNewApiKey(prev => ({ ...prev, environment: e.target.value as 'testnet' | 'production' }))}
                            className="w-full px-4 py-3 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                          >
                            <option value="testnet">Testnet (Recomendado)</option>
                            <option value="production">Produção</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-blue-400 text-sm font-medium mb-2">
                          API Key
                        </label>
                        <input
                          type="text"
                          value={newApiKey.api_key}
                          onChange={(e) => setNewApiKey(prev => ({ ...prev, api_key: e.target.value }))}
                          placeholder="Cole sua API Key aqui"
                          className="w-full px-4 py-3 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-blue-400 text-sm font-medium mb-2">
                          Secret Key
                        </label>
                        <input
                          type="password"
                          value={newApiKey.secret_key}
                          onChange={(e) => setNewApiKey(prev => ({ ...prev, secret_key: e.target.value }))}
                          placeholder="Cole sua Secret Key aqui"
                          className="w-full px-4 py-3 bg-black border border-blue-400/50 rounded-lg text-blue-400 focus:border-yellow-400 focus:outline-none"
                        />
                      </div>

                      <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                        <div className="flex items-start">
                          <FiAlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-yellow-400 font-medium text-sm">Importante:</p>
                            <ul className="text-yellow-300 text-sm mt-1 space-y-1">
                              <li>• Configure apenas permissões de leitura e trading</li>
                              <li>• NUNCA ative permissões de saque</li>
                              <li>• Recomendamos começar com testnet</li>
                              <li>• Suas chaves são criptografadas e seguras</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          onClick={handleAddApiKey}
                          className="flex-1 py-3 px-6 bg-green-400/20 text-green-400 border border-green-400/50 rounded-lg hover:bg-green-400/30 transition-colors font-medium"
                        >
                          Adicionar API Key
                        </button>
                        <button
                          onClick={() => setShowNewApiKeyForm(false)}
                          className="flex-1 py-3 px-6 bg-gray-400/20 text-gray-400 border border-gray-400/50 rounded-lg hover:bg-gray-400/30 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center mb-6">
                  <FiShield className="w-6 h-6 mr-3" />
                  Configurações de Segurança
                </h3>

                <div className="space-y-6">
                  {/* Autenticação 2FA */}
                  <div className="bg-black/50 rounded-lg p-4 border border-blue-400/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-blue-400 mb-2">Autenticação de Dois Fatores (2FA)</h4>
                        <p className="text-blue-300 text-sm">
                          Adicione uma camada extra de segurança à sua conta
                        </p>
                      </div>
                      <div className="flex items-center">
                        {data.profile.two_factor_enabled ? (
                          <FiToggleRight className="w-8 h-8 text-green-400" />
                        ) : (
                          <FiToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {data.profile.two_factor_enabled && (
                      <div className="mt-4 p-3 bg-green-400/10 border border-green-400/30 rounded-lg">
                        <p className="text-green-400 text-sm flex items-center">
                          <FiCheck className="w-4 h-4 mr-2" />
                          2FA está ativo e protegendo sua conta
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Informações de Segurança */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/50 rounded-lg p-4 border border-purple-400/30">
                      <div className="flex items-center mb-2">
                        <FiLock className="w-5 h-5 text-purple-400 mr-2" />
                        <span className="text-purple-300 text-sm">Senha alterada</span>
                      </div>
                      <p className="text-purple-400 font-bold">
                        {new Date(data.security_settings.password_last_changed).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-blue-400/30">
                      <div className="flex items-center mb-2">
                        <FiLink className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-blue-300 text-sm">Sessões ativas</span>
                      </div>
                      <p className="text-blue-400 font-bold">
                        {data.security_settings.login_sessions}
                      </p>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4 border border-yellow-400/30">
                      <div className="flex items-center mb-2">
                        <FiAlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
                        <span className="text-yellow-300 text-sm">Tentativas falhadas</span>
                      </div>
                      <p className="text-yellow-400 font-bold">
                        {data.security_settings.failed_login_attempts}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Segurança */}
                  <div className="space-y-4">
                    <button className="w-full md:w-auto px-6 py-3 bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 rounded-lg hover:bg-yellow-400/30 transition-colors">
                      Alterar Senha
                    </button>
                    <button className="w-full md:w-auto px-6 py-3 bg-red-400/20 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/30 transition-colors ml-4">
                      Encerrar Todas as Sessões
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <h3 className="text-xl font-bold text-yellow-400 flex items-center mb-6">
                  <FiBell className="w-6 h-6 mr-3" />
                  Preferências de Notificações
                </h3>

                <div className="space-y-4">
                  <div className="bg-black/50 rounded-lg p-4 border border-blue-400/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-blue-400 mb-1">Notificações por E-mail</h4>
                        <p className="text-blue-300 text-sm">
                          Receba atualizações importantes por e-mail
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('email_notifications', !data.profile.email_notifications)}
                        className="text-4xl"
                      >
                        {data.profile.email_notifications ? (
                          <FiToggleRight className="text-green-400" />
                        ) : (
                          <FiToggleLeft className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-purple-400/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-purple-400 mb-1">Notificações por SMS</h4>
                        <p className="text-purple-300 text-sm">
                          Receba alertas críticos por SMS
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('sms_notifications', !data.profile.sms_notifications)}
                        className="text-4xl"
                      >
                        {data.profile.sms_notifications ? (
                          <FiToggleRight className="text-green-400" />
                        ) : (
                          <FiToggleLeft className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-pink-400/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-pink-400 mb-1">Notificações Push</h4>
                        <p className="text-pink-300 text-sm">
                          Receba notificações em tempo real no navegador
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('push_notifications', !data.profile.push_notifications)}
                        className="text-4xl"
                      >
                        {data.profile.push_notifications ? (
                          <FiToggleRight className="text-green-400" />
                        ) : (
                          <FiToggleLeft className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-400/10 border border-blue-400/30 rounded-lg">
                  <h4 className="text-blue-400 font-bold mb-2">Tipos de Notificações</h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Abertura e fechamento de operações</li>
                    <li>• Atingimento de stop loss ou take profit</li>
                    <li>• Alertas de saldo insuficiente</li>
                    <li>• Atualizações de segurança da conta</li>
                    <li>• Renovação de planos e pagamentos</li>
                  </ul>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

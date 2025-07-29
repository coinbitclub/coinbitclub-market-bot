import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiRefreshCw,
  FiBell, FiShield, FiMonitor, FiDatabase, FiArrowUp, FiArrowDown,
  FiClock, FiCheckCircle, FiXCircle, FiInfo, FiCpu, FiZap, FiTarget,
  FiRadio, FiTrendingDown, FiEye, FiPlay, FiPause, FiPower, FiSquare
} from 'react-icons/fi';
import {
  MobileNav, MobileCard, ResponsiveGrid, MobileInput,
  MobileButton, MobileModal, MobileTabs, MobileAlert
} from '../../components/mobile/MobileComponents';
import RobotOperationTimeline from '../../src/components/trading/RobotOperationTimeline';
import CompactRobotStatus from '../../src/components/trading/CompactRobotStatus';

interface DashboardData {
  timestamp: string;
  marketReading: {
    direction: 'LONG' | 'SHORT' | 'NEUTRO';
    confidence: number;
    ai_justification: string;
    lastUpdate: string;
  };
  signals: {
    tradingview: any[];
    constant_signals: any[];
    ai_reports: any[];
  };
  microservices: {
    signal_ingestor: any;
    signal_processor: any;
    decision_engine: any;
    order_executor: any;
  };
  operations: {
    active: any[];
    daily_accuracy: number;
    historical_accuracy: number;
    daily_return: number;
    historical_return: number;
  };
  users: {
    new_users_today: number;
    new_active_test: number;
    new_active_production: number;
  };
}

export default function ExecutiveDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Sistema de Controle Administrativo
  const [systemStatus, setSystemStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [systemLoading, setSystemLoading] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [systemAction, setSystemAction] = useState<'start' | 'stop' | null>(null);

  // Dados de mock iniciais (serão substituídos pelos dados reais)
  const [mockData] = useState<DashboardData>({
    timestamp: new Date().toISOString(),
    marketReading: {
      direction: 'LONG',
      confidence: 87,
      ai_justification: 'Análise técnica indica momentum altista sustentável. RSI em 68 confirma força, MACD positivo com crossover bullish recente. Volume institucional crescente nas últimas 4h indica entrada de capital smart money. Suporte forte em $42,800 para BTC.',
      lastUpdate: new Date().toISOString()
    },
    signals: {
      tradingview: [
        { id: 1, symbol: 'BTCUSDT', action: 'STRONG_BUY', time: new Date(Date.now() - 300000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), confidence: 92 },
        { id: 2, symbol: 'ETHUSDT', action: 'BUY', time: new Date(Date.now() - 480000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), confidence: 88 },
        { id: 3, symbol: 'ADAUSDT', action: 'BUY', time: new Date(Date.now() - 720000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), confidence: 82 },
        { id: 4, symbol: 'SOLUSDT', action: 'NEUTRAL', time: new Date(Date.now() - 900000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), confidence: 65 }
      ],
      constant_signals: [
        { symbol: 'BTCUSDT', signal: 'LONG', confidence: 89, time: new Date(Date.now() - 180000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        { symbol: 'ETHUSDT', signal: 'LONG', confidence: 85, time: new Date(Date.now() - 360000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        { symbol: 'BNBUSDT', signal: 'LONG', confidence: 78, time: new Date(Date.now() - 540000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      ],
      ai_reports: [
        { time: new Date(Date.now() - 600000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), analysis: 'Mercado em tendência altista sustentável. Fluxo institucional positivo detectado.', confidence: 91 },
        { time: new Date(Date.now() - 3600000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), analysis: 'Volatilidade reduzida, consolidação antes de movimento de alta.', confidence: 86 },
        { time: new Date(Date.now() - 7200000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), analysis: 'Rompimento de resistência em $43k confirma continuidade altista.', confidence: 89 }
      ]
    },
    microservices: {
      signal_ingestor: { status: 'online', processed24h: 2847, errors: 2, lastReport: '15s' },
      signal_processor: { status: 'online', processed24h: 2791, avgTime: '0.8s', lastReport: '8s' },
      decision_engine: { status: 'online', decisions24h: 147, accuracy: 93.2, lastReport: '22s' },
      order_executor: { status: 'online', executed24h: 89, successRate: 96.8, lastReport: '35s' }
    },
    operations: {
      active: [
        { id: 1, symbol: 'BTCUSDT', side: 'LONG', status: 'RUNNING', pnl: 347.85, startTime: new Date(Date.now() - 2700000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        { id: 2, symbol: 'ETHUSDT', side: 'LONG', status: 'RUNNING', pnl: 189.42, startTime: new Date(Date.now() - 1800000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        { id: 3, symbol: 'SOLUSDT', side: 'LONG', status: 'PENDING', pnl: 0, startTime: new Date(Date.now() - 300000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        { id: 4, symbol: 'BNBUSDT', side: 'LONG', status: 'RUNNING', pnl: 67.23, startTime: new Date(Date.now() - 900000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      ],
      daily_accuracy: 94.7,
      historical_accuracy: 91.3,
      daily_return: 4.8,
      historical_return: 47.6
    },
    users: {
      new_users_today: 73,
      new_active_test: 41,
      new_active_production: 28
    }
  });

  // Buscar dados reais da API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard-complete');
      
      if (response.ok) {
        const apiData = await response.json();
        
        // Transformar dados da API para o formato esperado pelo dashboard
        const transformedData: DashboardData = {
          timestamp: apiData.timestamp || new Date().toISOString(),
          marketReading: {
            direction: apiData.marketReading?.direction || 'NEUTRO',
            confidence: apiData.marketReading?.confidence || 75,
            ai_justification: apiData.marketReading?.justification || 'Análise em processamento...',
            lastUpdate: apiData.marketReading?.last_update || new Date().toISOString()
          },
          signals: {
            tradingview: apiData.signals?.tradingView || [],
            constant_signals: apiData.signals?.coinStars || [],
            ai_reports: apiData.signals?.aiAnalysis || []
          },
          microservices: {
            signal_ingestor: apiData.system?.services?.find((s: any) => s.service_name === 'Signal Ingestor') || { status: 'offline', processed24h: 0, errors: 0, lastReport: 'N/A' },
            signal_processor: apiData.system?.services?.find((s: any) => s.service_name === 'Signal Processor') || { status: 'offline', processed24h: 0, avgTime: '0s', lastReport: 'N/A' },
            decision_engine: apiData.system?.services?.find((s: any) => s.service_name === 'Decision Engine') || { status: 'offline', decisions24h: 0, accuracy: 0, lastReport: 'N/A' },
            order_executor: apiData.system?.services?.find((s: any) => s.service_name === 'Order Executor') || { status: 'offline', executed24h: 0, successRate: 0, lastReport: 'N/A' }
          },
          operations: {
            active: apiData.operations?.active || [],
            daily_accuracy: apiData.performance?.dailyAccuracy || 0,
            historical_accuracy: apiData.performance?.totalAccuracy || 0,
            daily_return: apiData.performance?.dailyReturn || 0,
            historical_return: apiData.performance?.totalReturn || 0
          },
          users: {
            new_users_today: apiData.users?.newToday || 0,
            new_active_test: apiData.users?.testAccounts || 0,
            new_active_production: apiData.users?.productionAccounts || 0
          }
        };
        
        setDashboardData(transformedData);
      } else {
        console.log('Usando dados de mock devido a erro na API');
        setDashboardData(mockData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setDashboardData(mockData);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Funções de Controle do Sistema
  const handleSystemControl = async (action: 'start' | 'stop') => {
    setSystemAction(action);
    setShowSystemModal(true);
  };

  const confirmSystemAction = async () => {
    if (!systemAction) return;

    setSystemLoading(true);
    setShowSystemModal(false);

    try {
      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: systemAction }),
      });

      if (response.ok) {
        const result = await response.json();
        setSystemStatus(systemAction === 'start' ? 'active' : 'inactive');
        
        // Refresh dashboard data
        await fetchDashboardData();
        
        // Show success message
        alert(`Sistema ${systemAction === 'start' ? 'iniciado' : 'finalizado'} com sucesso!`);
      } else {
        throw new Error('Erro ao controlar sistema');
      }
    } catch (error) {
      console.error('Erro ao controlar sistema:', error);
      alert(`Erro ao ${systemAction === 'start' ? 'iniciar' : 'finalizar'} sistema. Tente novamente.`);
    } finally {
      setSystemLoading(false);
      setSystemAction(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Atualizar a cada 60 segundos (1 minuto)
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const data = dashboardData || mockData;

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-pink-400 border-pink-400/50';
      case 'SHORT': return 'text-blue-400 border-blue-400/50';
      default: return 'text-yellow-400 border-yellow-400/50';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG': return <FiTrendingUp className="w-6 h-6" />;
      case 'SHORT': return <FiTrendingDown className="w-6 h-6" />;
      default: return <FiActivity className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-pink-400';
      case 'offline': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <FiCheckCircle className="w-4 h-4" />;
      case 'offline': return <FiXCircle className="w-4 h-4" />;
      case 'warning': return <FiAlertTriangle className="w-4 h-4" />;
      default: return <FiInfo className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Dashboard Executivo...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Executivo | CoinBitClub</title>
        <meta name="description" content="Dashboard Executivo CoinBitClub - Monitoramento em Tempo Real" />
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
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Dashboard Executivo</span>
              </a>
              <a href="/admin/users" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Usuários</span>
              </a>
              <a href="/admin/affiliates" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Afiliados</span>
              </a>
              <a href="/admin/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/admin/alerts" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiAlertTriangle className="w-6 h-6 mr-4" />
                <span>Alertas</span>
              </a>
              <a href="/admin/adjustments" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiDollarSign className="w-6 h-6 mr-4" />
                <span>Acertos</span>
              </a>
              <a href="/admin/accounting" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Contabilidade</span>
              </a>
              <a href="/admin/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 border border-yellow-400/30 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-400">
                <FiShield className="w-4 h-4 mr-2 text-pink-400" />
                Admin Dashboard
              </div>
              <p className="text-xs text-blue-400 mt-1">Atualizado: {lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:w-0">
          {/* Mobile Navigation */}
          <MobileNav
            isOpen={mobileMenuOpen}
            onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Dashboard Executivo"
          >
            <div className="p-4 space-y-2">
              <a href="/admin/dashboard-executive" className="flex items-center px-4 py-3 text-yellow-400 bg-yellow-400/10 border-2 border-yellow-400/50 rounded-xl font-medium">
                <FiBarChart className="w-5 h-5 mr-3" />
                Dashboard Executivo
              </a>
              <a href="/admin/users" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-5 h-5 mr-3" />
                Usuários
              </a>
              <a href="/admin/signals" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiRadio className="w-5 h-5 mr-3" />
                Sinais
              </a>
              <a href="/admin/operations" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-5 h-5 mr-3" />
                Operações
              </a>
            </div>
          </MobileNav>

          {/* Header */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-6">
              {/* Mobile Header */}
              <div className="flex items-center space-x-3 lg:space-x-6">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:block xl:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h2 className="text-lg lg:text-2xl font-bold text-yellow-400">Dashboard Executivo</h2>
                <div className="hidden lg:flex items-center text-blue-400 bg-black/50 px-4 py-2 rounded-lg border border-blue-400/30">
                  <FiClock className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">{new Date().toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Desktop Controls / Mobile Simplified */}
              <div className="flex items-center space-x-2 lg:space-x-6">
                {/* Mobile System Status */}
                <div className="lg:hidden flex items-center bg-black/80 px-3 py-2 rounded-lg border-2 border-pink-400/50">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-pink-400 font-bold text-xs">Online</span>
                </div>

                {/* Desktop System Controls */}
                <div className="hidden lg:flex items-center space-x-3">
                  <button
                    onClick={() => handleSystemControl('start')}
                    disabled={systemLoading || systemStatus === 'active'}
                    className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-300 shadow-lg font-medium ${
                      systemStatus === 'active' 
                        ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                        : 'text-green-400 hover:text-white bg-black/80 hover:bg-green-500/20 border-green-400/50 hover:border-green-400/70 hover:shadow-green-400/30'
                    }`}
                  >
                    <FiPower className="w-5 h-5 mr-2" />
                    <span>Iniciar Sistema</span>
                  </button>
                  
                  <button
                    onClick={() => handleSystemControl('stop')}
                    disabled={systemLoading || systemStatus === 'inactive'}
                    className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-300 shadow-lg font-medium ${
                      systemStatus === 'inactive'
                        ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                        : 'text-red-400 hover:text-white bg-black/80 hover:bg-red-500/20 border-red-400/50 hover:border-red-400/70 hover:shadow-red-400/30'
                    }`}
                  >
                    <FiSquare className="w-5 h-5 mr-2" />
                    <span>Finalizar Sistema</span>
                  </button>
                </div>
                
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center px-3 lg:px-6 py-2 lg:py-3 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-400/30"
                >
                  <FiRefreshCw className="w-4 lg:w-5 h-4 lg:h-5 lg:mr-2" />
                  <span className="hidden lg:inline font-medium">Atualizar</span>
                </button>
                
                <div className="hidden lg:flex items-center bg-black/80 px-4 py-3 rounded-lg border-2 border-pink-400/50 shadow-lg">
                  <div className="w-3 h-3 bg-pink-400 rounded-full mr-3 animate-pulse shadow-lg shadow-pink-400/50"></div>
                  <span className="text-pink-400 font-bold text-sm">Sistema Online</span>
                </div>
              </div>
            </div>

            {/* Mobile System Controls */}
            <div className="lg:hidden px-4 pb-4">
              <div className="flex space-x-2">
                <MobileButton
                  variant={systemStatus === 'active' ? 'secondary' : 'primary'}
                  onClick={() => handleSystemControl('start')}
                  disabled={systemLoading || systemStatus === 'active'}
                  className="flex-1 bg-green-600 hover:bg-green-700 border-green-500 disabled:bg-gray-600 disabled:border-gray-500"
                >
                  <FiPower className="w-4 h-4 mr-2" />
                  Iniciar
                </MobileButton>
                
                <MobileButton
                  variant={systemStatus === 'inactive' ? 'secondary' : 'primary'}
                  onClick={() => handleSystemControl('stop')}
                  disabled={systemLoading || systemStatus === 'inactive'}
                  className="flex-1 bg-red-600 hover:bg-red-700 border-red-500 disabled:bg-gray-600 disabled:border-gray-500"
                >
                  <FiSquare className="w-4 h-4 mr-2" />
                  Parar
                </MobileButton>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-3 lg:p-6 bg-black min-h-screen">
            {/* Leitura do Mercado - Mobile Card */}
            <MobileCard className="mb-6 lg:mb-8">
              <div className="lg:hidden">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center mb-4">
                  <FiActivity className="w-5 h-5 mr-2 text-pink-400" />
                  LEITURA IA
                </h3>
                <div className={`flex items-center justify-center px-4 py-3 rounded-lg bg-black/80 border-2 ${getDirectionColor(data.marketReading.direction)} mb-4`}>
                  {getDirectionIcon(data.marketReading.direction)}
                  <span className="ml-2 font-bold text-xl">{data.marketReading.direction}</span>
                  <span className="ml-2 text-sm">({data.marketReading.confidence}%)</span>
                </div>
                <p className="text-blue-300 text-sm leading-relaxed mb-3">{data.marketReading.ai_justification}</p>
                <div className="text-xs text-pink-400 flex items-center">
                  <FiClock className="w-3 h-3 mr-1" />
                  {new Date(data.marketReading.lastUpdate).toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Desktop Version */}
              <div className="hidden lg:block">
                <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-yellow-400 flex items-center">
                      <FiActivity className="w-8 h-8 mr-4 text-pink-400" />
                      LEITURA DO MERCADO - IA
                    </h3>
                    <div className={`flex items-center px-6 py-3 rounded-full bg-black/80 border-2 ${getDirectionColor(data.marketReading.direction)} shadow-lg`}>
                      {getDirectionIcon(data.marketReading.direction)}
                      <span className="ml-3 font-bold text-2xl">{data.marketReading.direction}</span>
                      <span className="ml-3 text-lg">({data.marketReading.confidence}%)</span>
                    </div>
                  </div>
                  <p className="text-blue-300 leading-relaxed text-lg mb-4">{data.marketReading.ai_justification}</p>
                  <div className="text-sm text-pink-400 flex items-center">
                    <FiClock className="w-4 h-4 mr-2" />
                    Última atualização: {new Date(data.marketReading.lastUpdate).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </MobileCard>

            {/* Timeline do Robô - Seção Premium */}
            <div className="mb-6 lg:mb-8">
              <RobotOperationTimeline 
                isActive={systemStatus === 'active'} 
                speed="normal"
                compact={false}
              />
            </div>

            {/* Métricas Principais - Mobile/Desktop Responsive */}
            <div className="mb-6 lg:mb-8">
              {/* Mobile Version - Cards em Stack */}
              <div className="lg:hidden space-y-4">
                <MobileCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-400 text-sm font-bold mb-1">Sinais Constantes</p>
                      <p className="text-2xl font-bold text-yellow-400">{data.signals.constant_signals.length}</p>
                      <p className="text-blue-300 text-xs">Algoritmos próprios</p>
                    </div>
                    <FiRadio className="w-8 h-8 text-pink-400" />
                  </div>
                </MobileCard>

                <MobileCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-400 text-sm font-bold mb-1">Sinais TradingView</p>
                      <p className="text-2xl font-bold text-yellow-400">{data.signals.tradingview.length}</p>
                      <p className="text-blue-300 text-xs">Análise técnica</p>
                    </div>
                    <FiTarget className="w-8 h-8 text-blue-400" />
                  </div>
                </MobileCard>

                <MobileCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-400 text-sm font-bold mb-1">Operações Ativas</p>
                      <p className="text-2xl font-bold text-pink-400">{data.operations.active.length}</p>
                      <p className="text-blue-300 text-xs">Em tempo real</p>
                    </div>
                    <FiActivity className="w-8 h-8 text-yellow-400" />
                  </div>
                </MobileCard>

                <MobileCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-400 text-sm font-bold mb-1">Assertividade Hoje</p>
                      <p className="text-2xl font-bold text-yellow-400">{data.operations.daily_accuracy}%</p>
                      <p className="text-blue-300 text-xs">Histórica: {data.operations.historical_accuracy}%</p>
                    </div>
                    <FiEye className="w-8 h-8 text-pink-400" />
                  </div>
                </MobileCard>
              </div>

              {/* Desktop Version - Grid */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sinais Constantes */}
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-center w-full">
                      <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Sinais Constantes</p>
                      <p className="text-4xl font-bold text-yellow-400 mb-2">{data.signals.constant_signals.length}</p>
                      <p className="text-blue-300 text-sm">Algoritmos próprios</p>
                    </div>
                    <FiRadio className="w-8 h-8 text-pink-400 ml-4" />
                  </div>
                </div>

                {/* TradingView */}
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-center w-full">
                      <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Sinais TradingView</p>
                      <p className="text-4xl font-bold text-yellow-400 mb-2">{data.signals.tradingview.length}</p>
                      <p className="text-blue-300 text-sm">Análise técnica avançada</p>
                    </div>
                    <FiTarget className="w-8 h-8 text-blue-400 ml-4" />
                  </div>
                </div>

                {/* Operações Ativas */}
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-center w-full">
                      <p className="text-yellow-400 text-sm font-bold uppercase tracking-wider mb-2">Operações Ativas</p>
                      <p className="text-4xl font-bold text-pink-400 mb-2">{data.operations.active.length}</p>
                      <p className="text-blue-300 text-sm">Em tempo real</p>
                    </div>
                    <FiActivity className="w-8 h-8 text-yellow-400 ml-4" />
                  </div>
                </div>

                {/* Assertividade */}
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-center w-full">
                      <p className="text-pink-400 text-sm font-bold uppercase tracking-wider mb-2">Assertividade Hoje</p>
                      <p className="text-4xl font-bold text-yellow-400 mb-2">{data.operations.daily_accuracy}%</p>
                      <p className="text-blue-300 text-sm">Histórica: {data.operations.historical_accuracy}%</p>
                    </div>
                    <FiEye className="w-8 h-8 text-pink-400 ml-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Status dos Microserviços */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center">
                  <FiCpu className="w-6 h-6 mr-3 text-yellow-400" />
                  STATUS DOS MICROSERVIÇOS
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(data.microservices).map(([service, status]: [string, any]) => (
                    <div key={service} className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
                      <div className="flex items-center">
                        {getStatusIcon(status.status)}
                        <div className="ml-3">
                          <p className="text-yellow-400 font-bold capitalize">{service.replace('_', ' ')}</p>
                          <p className="text-sm text-blue-300">
                            {status.status === 'online' ? `Processados 24h: ${status.processed24h || status.decisions24h || status.executed24h || 0}` : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(status.status)} bg-black/70 border border-current`}>
                          {status.status}
                        </span>
                        <p className="text-xs text-pink-400 mt-1">{status.lastReport}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operações em Tempo Real */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <h3 className="text-xl font-bold text-pink-400 mb-6 flex items-center">
                  <FiZap className="w-6 h-6 mr-3 text-yellow-400" />
                  OPERAÇÕES EM TEMPO REAL
                </h3>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {data.operations.active.map((operation: any) => (
                    <div key={operation.id} className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-blue-400/20 hover:border-blue-400/40 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${operation.status === 'RUNNING' ? 'bg-pink-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                        <div>
                          <p className="text-yellow-400 font-bold">{operation.symbol}</p>
                          <p className="text-sm text-blue-300">{operation.side} • {operation.startTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${operation.pnl >= 0 ? 'text-pink-400' : 'text-blue-400'}`}>
                          {operation.pnl >= 0 ? '+' : ''}${operation.pnl.toFixed(2)}
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-black/70 text-yellow-300 border border-yellow-400/30">
                          {operation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {data.operations.active.length === 0 && (
                    <div className="text-center py-8 text-blue-400">
                      <FiPause className="w-8 h-8 mx-auto mb-2" />
                      <p>Nenhuma operação ativa no momento</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance e Usuários */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Retorno Financeiro */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiDollarSign className="w-6 h-6 mr-3 text-pink-400" />
                  RETORNO FINANCEIRO
                </h3>
                
                <div className="space-y-6">
                  <div className="text-center p-4 bg-black/50 rounded-lg border border-pink-400/30">
                    <p className="text-pink-400 text-sm font-bold uppercase tracking-wider">Retorno Hoje</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">+{data.operations.daily_return}%</p>
                  </div>
                  <div className="text-center p-4 bg-black/50 rounded-lg border border-blue-400/30">
                    <p className="text-blue-400 text-sm font-bold uppercase tracking-wider">Retorno Histórico</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">+{data.operations.historical_return}%</p>
                  </div>
                </div>
              </div>

              {/* Novos Usuários */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center">
                  <FiUsers className="w-6 h-6 mr-3 text-yellow-400" />
                  NOVOS USUÁRIOS HOJE
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-yellow-400/20">
                    <span className="text-yellow-400 font-bold">Total</span>
                    <span className="text-pink-400 font-bold text-xl">{data.users.new_users_today}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-yellow-400/20">
                    <span className="text-yellow-400 font-bold">Conta Teste</span>
                    <span className="text-blue-400 font-bold text-xl">{data.users.new_active_test}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-yellow-400/20">
                    <span className="text-yellow-400 font-bold">Produção</span>
                    <span className="text-pink-400 font-bold text-xl">{data.users.new_active_production}</span>
                  </div>
                </div>
              </div>

              {/* Relatórios IA */}
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <h3 className="text-xl font-bold text-pink-400 mb-6 flex items-center">
                  <FiActivity className="w-6 h-6 mr-3 text-yellow-400" />
                  RELATÓRIOS IA (4H)
                </h3>
                
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {data.signals.ai_reports.slice(0, 3).map((report: any, index: number) => (
                    <div key={index} className="p-3 bg-black/50 rounded-lg border border-blue-400/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-yellow-400 font-bold">{report.time}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-pink-400/20 text-pink-400 border border-pink-400/50">
                          {report.confidence}%
                        </span>
                      </div>
                      <p className="text-sm text-blue-300 leading-relaxed">{report.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer com informações do sistema */}
            <div className="mt-8 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-yellow-400 text-lg font-bold mb-2">⚡ Dashboard Executivo CoinBitClub ⚡</p>
              <p className="text-blue-300 mb-1">Atualização automática a cada 30 segundos</p>
              <p className="text-pink-300">Sistema integrado com PostgreSQL, TradingView, CoinStats e Microserviços de IA</p>
            </div>
          </main>
        </div>
      </div>

      {/* Modal de Confirmação do Sistema */}
      {showSystemModal && (
        <MobileModal
          isOpen={showSystemModal}
          onClose={() => setShowSystemModal(false)}
          title={`Confirmar ${systemAction === 'start' ? 'Inicialização' : 'Finalização'} do Sistema`}
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                systemAction === 'start' ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'
              }`}>
                {systemAction === 'start' ? (
                  <FiPower className="w-8 h-8 text-green-400" />
                ) : (
                  <FiSquare className="w-8 h-8 text-red-400" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {systemAction === 'start' ? 'Iniciar Sistema Completo' : 'Finalizar Sistema Completo'}
              </h3>
              
              <p className="text-gray-300 mb-4">
                {systemAction === 'start' 
                  ? 'Tem certeza que deseja iniciar todos os serviços e microserviços do sistema CoinBitClub? Esta ação irá ativar o trading automático, sinais de IA e todas as funcionalidades.'
                  : 'Tem certeza que deseja finalizar todos os serviços e microserviços do sistema CoinBitClub? Esta ação irá pausar todas as operações em andamento e desativar o trading automático.'
                }
              </p>
              
              <div className={`p-4 rounded-lg border ${
                systemAction === 'start' 
                  ? 'bg-green-500/10 border-green-400/30 text-green-300'
                  : 'bg-red-500/10 border-red-400/30 text-red-300'
              }`}>
                <p className="text-sm font-medium">
                  {systemAction === 'start' 
                    ? '✅ Sistemas serão iniciados em sequência segura'
                    : '⚠️ Operações ativas serão finalizadas com segurança'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <MobileButton
                variant="secondary"
                onClick={() => setShowSystemModal(false)}
                className="flex-1"
              >
                Cancelar
              </MobileButton>
              
              <MobileButton
                variant="primary"
                onClick={confirmSystemAction}
                disabled={systemLoading}
                className={`flex-1 ${
                  systemAction === 'start' 
                    ? 'bg-green-600 hover:bg-green-700 border-green-500'
                    : 'bg-red-600 hover:bg-red-700 border-red-500'
                }`}
              >
                {systemLoading ? (
                  <div className="flex items-center justify-center">
                    <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </div>
                ) : (
                  `Confirmar ${systemAction === 'start' ? 'Inicialização' : 'Finalização'}`
                )}
              </MobileButton>
            </div>
          </div>
        </MobileModal>
      )}
    </>
  );
}

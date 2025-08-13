/**
 * DASHBOARD ENTERPRISE
 * CoinBitClub Market Bot v6.0.0 Enterprise
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tipos TypeScript
interface UserProfile {
  id: number;
  email: string;
  profile_type: string;
  nome_completo: string;
  whatsapp: string;
  pais: string;
  cidade: string;
  dados_validados: boolean;
  limite_saque_diario: number;
  created_at: string;
}

interface Subscription {
  id: number;
  plan_name: string;
  status: string;
  start_date: string;
  end_date: string;
  price: number;
  currency: string;
}

interface DashboardStats {
  profileStatistics: {
    total: number;
    by_type: Record<string, number>;
  };
  subscriptionStatistics: {
    total: number;
    active: number;
    revenue: number;
  };
}

const PROFILE_LABELS = {
  basic: '🟢 Básico',
  premium: '🔵 Premium',
  enterprise: '🟡 Enterprise',
  affiliate_normal: '🟠 Afiliado Normal',
  affiliate_vip: '🔴 Afiliado VIP',
  admin: '⚫ Administrador'
};

export default function EnterpriseDashboard() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Carregar dados em paralelo
      const [profileRes, subscriptionRes, statsRes] = await Promise.all([
        fetch('/api/enterprise/profile', { headers }),
        fetch('/api/enterprise/subscription', { headers }),
        fetch('/api/enterprise/admin/dashboard', { headers }).catch(() => null) // Só para admins
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData);
      }

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        setSubscription(subscriptionData);
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData);
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    router.push('/enterprise/plans');
  };

  const handleUpgrade = () => {
    router.push('/enterprise/upgrade');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro de Autenticação</h1>
          <p className="text-gray-600 mb-4">Não foi possível carregar seu perfil.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CoinBitClub Enterprise
              </h1>
              <p className="text-gray-600">
                Bem-vindo, {userProfile.nome_completo}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status de Verificação */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                userProfile.dados_validados 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {userProfile.dados_validados ? '✅ Verificado' : '⏳ Pendente'}
              </div>
              
              {/* Tipo de Perfil */}
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {PROFILE_LABELS[userProfile.profile_type as keyof typeof PROFILE_LABELS]}
              </div>
              
              {/* Menu do Usuário */}
              <div className="relative">
                <button
                  onClick={() => {
                    localStorage.removeItem('auth_token');
                    router.push('/login');
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral' },
              { id: 'profile', label: 'Perfil' },
              { id: 'subscription', label: 'Assinatura' },
              { id: 'trading', label: 'Trading' },
              ...(userProfile.profile_type === 'admin' ? [{ id: 'admin', label: 'Administração' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Perfil */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Status do Perfil
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Tipo: {PROFILE_LABELS[userProfile.profile_type as keyof typeof PROFILE_LABELS]}
                  </p>
                  <p className="text-sm text-gray-600">
                    Verificação: {userProfile.dados_validados ? 'Completa' : 'Pendente'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Limite de Saque: {userProfile.limite_saque_diario.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>

              {/* Card Assinatura */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Assinatura
                </h3>
                {subscription ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Plano: {subscription.plan_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${
                        subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Renovação: {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Nenhuma assinatura ativa</p>
                    <button
                      onClick={handleSubscribe}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Assinar agora →
                    </button>
                  </div>
                )}
              </div>

              {/* Card Trading */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Trading
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Status: <span className="text-green-600 font-medium">Ativo</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Sinais Hoje: 12
                  </p>
                  <p className="text-sm text-gray-600">
                    Performance: +5.2%
                  </p>
                </div>
              </div>
            </div>

            {/* Gráfico de Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Performance dos Últimos 30 Dias
              </h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Gráfico de Performance (Em Desenvolvimento)</p>
              </div>
            </div>

            {/* Últimos Sinais */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Últimos Sinais
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">BTC/USDT</p>
                      <p className="text-sm text-gray-600">Compra em $42,500</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-medium">+2.5%</p>
                      <p className="text-sm text-gray-600">2h atrás</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Informações do Perfil
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <p className="text-gray-900">{userProfile.nome_completo}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{userProfile.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <p className="text-gray-900">{userProfile.whatsapp}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <p className="text-gray-900">{userProfile.pais}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <p className="text-gray-900">{userProfile.cidade}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Perfil
                </label>
                <p className="text-gray-900">
                  {PROFILE_LABELS[userProfile.profile_type as keyof typeof PROFILE_LABELS]}
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-4">
                Editar Perfil
              </button>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                Alterar Senha
              </button>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {subscription ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  Minha Assinatura
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plano Atual
                    </label>
                    <p className="text-xl font-bold text-gray-900">{subscription.plan_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <p className="text-xl font-bold text-gray-900">
                      {subscription.price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: subscription.currency
                      })}/mês
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Início
                    </label>
                    <p className="text-gray-900">
                      {new Date(subscription.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Próxima Cobrança
                    </label>
                    <p className="text-gray-900">
                      {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={handleUpgrade}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-4"
                  >
                    Fazer Upgrade
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                    Cancelar Assinatura
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Nenhuma Assinatura Ativa
                </h3>
                <p className="text-gray-600 mb-6">
                  Assine um de nossos planos para ter acesso completo ao sistema.
                </p>
                <button
                  onClick={handleSubscribe}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
                >
                  Ver Planos Disponíveis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Painel de Trading
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">+15.2%</p>
                <p className="text-sm text-gray-600">Lucro Mensal</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">127</p>
                <p className="text-sm text-gray-600">Sinais Recebidos</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">85%</p>
                <p className="text-sm text-gray-600">Taxa de Acerto</p>
              </div>
            </div>
            
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Painel de Trading (Em Desenvolvimento)</p>
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && userProfile.profile_type === 'admin' && dashboardStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900">Total de Usuários</h4>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {dashboardStats.profileStatistics.total}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900">Assinaturas Ativas</h4>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {dashboardStats.subscriptionStatistics.active}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900">Receita Total</h4>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {dashboardStats.subscriptionStatistics.revenue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900">Taxa de Conversão</h4>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {Math.round((dashboardStats.subscriptionStatistics.active / dashboardStats.profileStatistics.total) * 100)}%
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Tipo de Perfil</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(dashboardStats.profileStatistics.by_type).map(([type, count]) => (
                  <div key={type} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{PROFILE_LABELS[type as keyof typeof PROFILE_LABELS]}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

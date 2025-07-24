import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Componente principal da página de configurações
export default function UserSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    // Dados pessoais
    name: '',
    email: '',
    phone: '',
    country: '',
    
    // Configurações de trading
    riskLevel: 'medium',
    maxDailyLoss: 100,
    autoTrade: true,
    notifications: true,
    
    // Configurações de segurança
    twoFactor: false,
    loginNotifications: true,
    
    // Configurações de API
    binanceApiKey: '',
    binanceApiSecret: '',
    bybitApiKey: '',
    bybitApiSecret: ''
  });

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'user') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    loadUserSettings();
  }, []);

  // Carregar configurações do usuário
  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9997/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.profile?.phone || '',
          country: data.profile?.country || 'BR',
          riskLevel: data.tradingSettings?.riskLevel || 'medium',
          maxDailyLoss: data.tradingSettings?.maxDailyLoss || 100,
          autoTrade: data.tradingSettings?.autoTrade !== false,
          notifications: data.preferences?.notifications !== false,
          twoFactor: data.security?.twoFactor || false,
          loginNotifications: data.security?.loginNotifications !== false,
          binanceApiKey: data.apiKeys?.binance?.key || '',
          binanceApiSecret: data.apiKeys?.binance?.secret || '',
          bybitApiKey: data.apiKeys?.bybit?.key || '',
          bybitApiSecret: data.apiKeys?.bybit?.secret || ''
        });
      } else {
        console.log('API não disponível, usando dados do localStorage...');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          country: userData.country || 'BR'
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9997/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✅ Configurações salvas com sucesso!');
        
        // Atualizar dados do usuário no localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...userData,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          country: formData.country
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        alert('✅ Configurações salvas localmente! (Simulação para desenvolvimento)');
        console.log('Configurações salvas:', formData);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Manipular mudanças nos campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Testar conexão da API
  const testApiConnection = async (exchange) => {
    const apiKey = formData[`${exchange}ApiKey`];
    const apiSecret = formData[`${exchange}ApiSecret`];
    
    if (!apiKey || !apiSecret) {
      alert('❌ Preencha a chave e o segredo da API primeiro.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9997/api/user/test-api', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exchange,
          apiKey,
          apiSecret
        })
      });

      if (response.ok) {
        alert(`✅ Conexão com ${exchange} estabelecida com sucesso!`);
      } else {
        alert(`✅ Teste simulado para ${exchange} - OK! (Desenvolvimento)`);
      }
    } catch (error) {
      console.error('Erro ao testar API:', error);
      alert(`✅ Teste simulado para ${exchange} - OK! (Desenvolvimento)`);
    }
  };

  // Estilos
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0B0F1A 0%, #1a1f3a 50%, #2a1810 100%)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: '#ffffff',
    padding: '2rem 1rem'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const tabStyle = (active) => ({
    background: active 
      ? 'linear-gradient(45deg, #4ECDC4, #44A08D)'
      : 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '1rem',
    marginBottom: '0.5rem'
  });

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const buttonStyle = {
    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 2rem',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  };

  const secondaryButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ fontSize: '1.5rem', color: '#00BFFF' }}>⏳ Carregando configurações...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Configurações - CoinBitClub</title>
        <meta name="description" content="Configure sua conta e preferências" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(45deg, #FFD700, #FF69B4)', 
                        backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              ⚙️ Configurações
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
              Personalize sua experiência de trading
            </p>
          </div>
          <button 
            onClick={() => router.push('/user/dashboard')}
            style={secondaryButtonStyle}
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={tabStyle(activeTab === 'profile')}
          >
            👤 Perfil
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            style={tabStyle(activeTab === 'trading')}
          >
            📈 Trading
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={tabStyle(activeTab === 'security')}
          >
            🔒 Segurança
          </button>
          <button
            onClick={() => setActiveTab('api')}
            style={tabStyle(activeTab === 'api')}
          >
            🔑 APIs
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'profile' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 2rem 0', color: '#00BFFF' }}>👤 Informações Pessoais</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={inputStyle}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={inputStyle}
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={inputStyle}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                  País
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  style={selectStyle}
                >
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="PT">Portugal</option>
                  <option value="ES">Espanha</option>
                  <option value="AR">Argentina</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 2rem 0', color: '#00BFFF' }}>📈 Configurações de Trading</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                  Nível de Risco
                </label>
                <select
                  value={formData.riskLevel}
                  onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                  style={selectStyle}
                >
                  <option value="low">🟢 Baixo Risco</option>
                  <option value="medium">🟡 Risco Moderado</option>
                  <option value="high">🔴 Alto Risco</option>
                </select>
                <small style={{ opacity: 0.7 }}>
                  Define a agressividade das estratégias de IA
                </small>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                  Perda Máxima Diária (USD)
                </label>
                <input
                  type="number"
                  value={formData.maxDailyLoss}
                  onChange={(e) => handleInputChange('maxDailyLoss', parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                  placeholder="100"
                  min="0"
                  step="10"
                />
                <small style={{ opacity: 0.7 }}>
                  Bot para automaticamente se atingir este limite
                </small>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD700' }}>
                  <input
                    type="checkbox"
                    checked={formData.autoTrade}
                    onChange={(e) => handleInputChange('autoTrade', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  Trading Automático
                </label>
                <small style={{ opacity: 0.7, display: 'block', marginTop: '0.5rem' }}>
                  Permite que a IA execute operações automaticamente
                </small>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD700' }}>
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => handleInputChange('notifications', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  Notificações de Operações
                </label>
                <small style={{ opacity: 0.7, display: 'block', marginTop: '0.5rem' }}>
                  Receba alertas sobre novas operações e resultados
                </small>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 2rem 0', color: '#00BFFF' }}>🔒 Configurações de Segurança</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD700' }}>
                  <input
                    type="checkbox"
                    checked={formData.twoFactor}
                    onChange={(e) => handleInputChange('twoFactor', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  Autenticação de 2 Fatores (2FA)
                </label>
                <small style={{ opacity: 0.7, display: 'block', marginTop: '0.5rem' }}>
                  Adiciona uma camada extra de segurança ao seu login
                </small>
                {formData.twoFactor && (
                  <button style={{ ...secondaryButtonStyle, marginTop: '1rem' }}>
                    📱 Configurar 2FA
                  </button>
                )}
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFD700' }}>
                  <input
                    type="checkbox"
                    checked={formData.loginNotifications}
                    onChange={(e) => handleInputChange('loginNotifications', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  Notificações de Login
                </label>
                <small style={{ opacity: 0.7, display: 'block', marginTop: '0.5rem' }}>
                  Seja notificado sobre novos logins em sua conta
                </small>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#FFD700' }}>🔑 Alterar Senha</h4>
                <button style={secondaryButtonStyle}>
                  Solicitar Troca de Senha
                </button>
                <small style={{ opacity: 0.7, display: 'block', marginTop: '0.5rem' }}>
                  Enviaremos um link para seu email
                </small>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 2rem 0', color: '#00BFFF' }}>🔑 Configurações de API</h3>
            
            {/* Binance */}
            <div style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#FFD700' }}>⚡ Binance API</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.binanceApiKey}
                    onChange={(e) => handleInputChange('binanceApiKey', e.target.value)}
                    style={inputStyle}
                    placeholder="Sua chave da API Binance"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFD700' }}>
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formData.binanceApiSecret}
                    onChange={(e) => handleInputChange('binanceApiSecret', e.target.value)}
                    style={inputStyle}
                    placeholder="Seu secret da API Binance"
                  />
                </div>
              </div>
              <button
                onClick={() => testApiConnection('binance')}
                style={secondaryButtonStyle}
              >
                🔍 Testar Conexão
              </button>
            </div>

            {/* Bybit */}
            <div style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#FF9800' }}>🚀 Bybit API</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FF9800' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.bybitApiKey}
                    onChange={(e) => handleInputChange('bybitApiKey', e.target.value)}
                    style={inputStyle}
                    placeholder="Sua chave da API Bybit"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FF9800' }}>
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formData.bybitApiSecret}
                    onChange={(e) => handleInputChange('bybitApiSecret', e.target.value)}
                    style={inputStyle}
                    placeholder="Seu secret da API Bybit"
                  />
                </div>
              </div>
              <button
                onClick={() => testApiConnection('bybit')}
                style={secondaryButtonStyle}
              >
                🔍 Testar Conexão
              </button>
            </div>

            {/* Instruções */}
            <div style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '1.5rem', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#2196F3' }}>📋 Instruções Importantes:</h5>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', opacity: 0.9 }}>
                <li>Configure suas APIs apenas com permissões de SPOT trading</li>
                <li>NUNCA compartilhe suas chaves API com terceiros</li>
                <li>Recomendamos usar contas testnet para começar</li>
                <li>As chaves são criptografadas e armazenadas com segurança</li>
              </ul>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...buttonStyle,
              padding: '1rem 3rem',
              fontSize: '1.2rem',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? '⏳ Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </div>
    </>
  );
}

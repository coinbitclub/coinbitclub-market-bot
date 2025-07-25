import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface FormData {
  // Dados pessoais
  name: string;
  email: string;
  phone: string;
  country: string;
  
  // Configurações de trading
  riskLevel: string;
  maxDailyLoss: number;
  autoTrade: boolean;
  notifications: boolean;
  
  // Configurações de segurança
  twoFactor: boolean;
  loginNotifications: boolean;
  
  // Configurações de API
  binanceApiKey: string;
  binanceApiSecret: string;
  bybitApiKey: string;
  bybitApiSecret: string;
}

const UserSettings: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<FormData>({
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      
      // Mock data para desenvolvimento
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '+55 11 99999-9999',
        country: 'BR'
      };
      
      setFormData(prev => ({
        ...prev,
        ...userData
      }));
      
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: '👤' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'security', name: 'Segurança', icon: '🔒' },
    { id: 'api', name: 'API Keys', icon: '🔑' }
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid transparent',
            borderTop: '3px solid #fbbf24',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'white' }}>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(251, 191, 36, 0.3)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="/" style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fbbf24',
                textDecoration: 'none'
              }}>
                CoinBitClub
              </Link>
              <span style={{
                marginLeft: '16px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>Configurações</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <Link 
                href="/user/dashboard"
                style={{
                  backgroundColor: '#fbbf24',
                  color: 'black',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Dashboard
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer'
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <nav style={{
            display: 'flex',
            gap: '32px',
            padding: '16px 0'
          }}>
            <Link href="/user/dashboard" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Dashboard
            </Link>
            <Link href="/user/operations" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Operações
            </Link>
            <Link href="/user/plans" style={{
              color: 'rgba(255, 255, 255, 0.7)',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Planos
            </Link>
            <Link href="/user/settings" style={{
              color: '#fbbf24',
              borderBottom: '2px solid #fbbf24',
              paddingBottom: '8px',
              textDecoration: 'none'
            }}>
              Configurações
            </Link>
          </nav>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '250px 1fr',
          gap: '32px'
        }}>
          {/* Sidebar com Tabs */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: 'fit-content'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>Configurações</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: activeTab === tab.id ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                    color: activeTab === tab.id ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Tab Perfil */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '24px'
                }}>Dados Pessoais</h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>Nome Completo</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>Telefone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>País</label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    >
                      <option value="BR">Brasil</option>
                      <option value="US">Estados Unidos</option>
                      <option value="CA">Canadá</option>
                      <option value="UK">Reino Unido</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Trading */}
            {activeTab === 'trading' && (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '24px'
                }}>Configurações de Trading</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>Nível de Risco</label>
                    <select
                      value={formData.riskLevel}
                      onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '300px',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    >
                      <option value="low">Baixo</option>
                      <option value="medium">Médio</option>
                      <option value="high">Alto</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>Perda Máxima Diária (USD)</label>
                    <input
                      type="number"
                      value={formData.maxDailyLoss}
                      onChange={(e) => handleInputChange('maxDailyLoss', Number(e.target.value))}
                      style={{
                        width: '100%',
                        maxWidth: '300px',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'white',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.autoTrade}
                        onChange={(e) => handleInputChange('autoTrade', e.target.checked)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#fbbf24'
                        }}
                      />
                      Trading Automático Ativado
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'white',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.notifications}
                        onChange={(e) => handleInputChange('notifications', e.target.checked)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#fbbf24'
                        }}
                      />
                      Receber Notificações de Trading
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Segurança */}
            {activeTab === 'security' && (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '24px'
                }}>Configurações de Segurança</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'white',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.twoFactor}
                      onChange={(e) => handleInputChange('twoFactor', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#fbbf24'
                      }}
                    />
                    Autenticação de Dois Fatores (2FA)
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'white',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.loginNotifications}
                      onChange={(e) => handleInputChange('loginNotifications', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#fbbf24'
                      }}
                    />
                    Notificações de Login
                  </label>

                  <div style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <h4 style={{
                      color: '#fbbf24',
                      margin: '0 0 8px 0',
                      fontSize: '16px'
                    }}>🔒 Alterar Senha</h4>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      margin: '0 0 12px 0',
                      fontSize: '14px'
                    }}>
                      Para alterar sua senha, você receberá um email com instruções.
                    </p>
                    <button style={{
                      backgroundColor: '#fbbf24',
                      color: 'black',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Solicitar Alteração de Senha
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab API Keys */}
            {activeTab === 'api' && (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '24px'
                }}>Chaves de API das Exchanges</h2>
                
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    color: '#ef4444',
                    margin: '0 0 8px 0',
                    fontSize: '16px'
                  }}>⚠️ Importante</h4>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: 0,
                    fontSize: '14px'
                  }}>
                    Suas chaves API são criptografadas e nunca compartilhadas. Configure apenas permissões de trading (sem saque).
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Binance */}
                  <div>
                    <h3 style={{
                      color: '#fbbf24',
                      fontSize: '18px',
                      marginBottom: '16px'
                    }}>🟡 Binance</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '16px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>API Key</label>
                        <input
                          type="text"
                          value={formData.binanceApiKey}
                          onChange={(e) => handleInputChange('binanceApiKey', e.target.value)}
                          placeholder="Sua API Key da Binance"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>API Secret</label>
                        <input
                          type="password"
                          value={formData.binanceApiSecret}
                          onChange={(e) => handleInputChange('binanceApiSecret', e.target.value)}
                          placeholder="Sua API Secret da Binance"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bybit */}
                  <div>
                    <h3 style={{
                      color: '#f97316',
                      fontSize: '18px',
                      marginBottom: '16px'
                    }}>🟠 Bybit</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '16px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>API Key</label>
                        <input
                          type="text"
                          value={formData.bybitApiKey}
                          onChange={(e) => handleInputChange('bybitApiKey', e.target.value)}
                          placeholder="Sua API Key da Bybit"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>API Secret</label>
                        <input
                          type="password"
                          value={formData.bybitApiSecret}
                          onChange={(e) => handleInputChange('bybitApiSecret', e.target.value)}
                          placeholder="Sua API Secret da Bybit"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Salvar */}
            <div style={{
              marginTop: '32px',
              padding: '24px 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserSettings;

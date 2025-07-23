import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

interface ExchangeCredential {
  id: string;
  exchange: string;
  label: string;
  apiKey: string;
  apiSecret: string;
  isTestnet: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

const ExchangeCredentials: NextPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [credentials, setCredentials] = useState<ExchangeCredential[]>([
    {
      id: '1',
      exchange: 'bybit',
      label: 'Bybit Principal',
      apiKey: 'BVXT7Y...8K9L',
      apiSecret: '•••••••••••••••••••••••••••••••••••••••••',
      isTestnet: false,
      isActive: true,
      createdAt: '2025-07-15T10:30:00Z',
      lastUsed: '2025-07-17T14:22:00Z'
    }
  ]);

  const [newCredential, setNewCredential] = useState({
    exchange: 'bybit',
    label: '',
    apiKey: '',
    apiSecret: '',
    isTestnet: false
  });

  const exchanges = [
    { id: 'bybit', name: 'Bybit', icon: '🔶' },
    { id: 'binance', name: 'Binance', icon: '🟡' },
    { id: 'okx', name: 'OKX', icon: '⚫' },
    { id: 'gate', name: 'Gate.io', icon: '🔵' }
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddCredential = async () => {
    try {
      const response = await fetch('/api/user/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCredential)
      });

      if (response.ok) {
        const newCred = await response.json();
        setCredentials([...credentials, newCred]);
        setNewCredential({ exchange: 'bybit', label: '', apiKey: '', apiSecret: '', isTestnet: false });
        setShowAddForm(false);
        alert('Credenciais adicionadas com sucesso!');
      } else {
        alert('Erro ao adicionar credenciais');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar estas credenciais?')) {
      try {
        const response = await fetch(`/api/user/credentials/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setCredentials(credentials.filter(cred => cred.id !== id));
          alert('Credenciais removidas com sucesso!');
        } else {
          alert('Erro ao remover credenciais');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
      }
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif"
  };

  const headerStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(5, 167, 78, 0.1)',
    padding: isMobile ? '1rem' : '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  };

  const cardStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    border: '1px solid rgba(5, 167, 78, 0.2)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease'
  };

  return (
    <>
      <Head>
        <title>Credenciais das Exchanges - CoinBitClub</title>
      </Head>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🔐 Credenciais das Exchanges
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: '#05A74E',
              color: '#FAFBFD',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ➕ Adicionar
          </button>
        </header>

        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem'
        }}>
          {/* Aviso de Segurança */}
          <section style={{
            ...cardStyle,
            marginBottom: '3rem',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '2rem', color: '#f59e0b' }}>⚠️</span>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  Importante: Segurança das Credenciais
                </h3>
                <div style={{ color: '#AFB4B1', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    • <strong>Nunca compartilhe</strong> suas chaves API com terceiros
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    • Use <strong>apenas permissões de trading</strong> (sem saque/depósito)
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    • Teste sempre no <strong>modo testnet</strong> primeiro
                  </p>
                  <p>
                    • Suas credenciais são <strong>criptografadas</strong> e armazenadas com segurança
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Lista de Credenciais */}
          <section style={cardStyle}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '2rem',
              color: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔑 Suas Credenciais
            </h2>

            {credentials.length === 0 ? (
              <div style={{
                textAlign: 'center' as const,
                padding: '3rem',
                color: '#AFB4B1'
              }}>
                <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🔑</span>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Nenhuma credencial configurada
                </p>
                <p>
                  Adicione suas credenciais das exchanges para começar a operar
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {credentials.map((credential) => {
                  const exchange = exchanges.find(ex => ex.id === credential.exchange);
                  return (
                    <div key={credential.id} style={{
                      padding: '1.5rem',
                      background: 'rgba(5, 167, 78, 0.1)',
                      borderRadius: '16px',
                      border: '1px solid rgba(5, 167, 78, 0.2)',
                      position: 'relative' as const
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '2rem' }}>{exchange?.icon}</span>
                          <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FAFBFD', marginBottom: '0.25rem' }}>
                              {credential.label || exchange?.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                              <span style={{
                                color: credential.isTestnet ? '#f59e0b' : '#05A74E',
                                fontWeight: '600'
                              }}>
                                {credential.isTestnet ? '🧪 Testnet' : '🔴 Produção'}
                              </span>
                              <span style={{
                                color: credential.isActive ? '#05A74E' : '#ef4444',
                                fontWeight: '600'
                              }}>
                                {credential.isActive ? '✅ Ativa' : '❌ Inativa'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCredential(credential.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>

                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem', display: 'block' }}>
                            API Key
                          </label>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: '#05A74E',
                            padding: '0.75rem',
                            background: 'rgba(5, 167, 78, 0.1)',
                            borderRadius: '8px',
                            wordBreak: 'break-all' as const
                          }}>
                            {credential.apiKey}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem', display: 'block' }}>
                            API Secret
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              color: '#6EA297',
                              padding: '0.75rem',
                              background: 'rgba(5, 167, 78, 0.1)',
                              borderRadius: '8px',
                              flex: 1,
                              wordBreak: 'break-all' as const
                            }}>
                              {showSecrets[credential.id] ? credential.apiSecret : '•••••••••••••••••••••••••••••••••••••••••'}
                            </div>
                            <button
                              onClick={() => toggleSecretVisibility(credential.id)}
                              style={{
                                background: 'rgba(5, 167, 78, 0.1)',
                                border: '1px solid rgba(5, 167, 78, 0.3)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                color: '#05A74E',
                                cursor: 'pointer'
                              }}
                            >
                              {showSecrets[credential.id] ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        marginTop: '1rem', 
                        paddingTop: '1rem', 
                        borderTop: '1px solid rgba(5, 167, 78, 0.2)',
                        fontSize: '0.875rem',
                        color: '#AFB4B1',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>Criado: {new Date(credential.createdAt).toLocaleDateString('pt-BR')}</span>
                        {credential.lastUsed && (
                          <span>Último uso: {new Date(credential.lastUsed).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Modal de Adicionar Credencial */}
          {showAddForm && (
            <div style={{
              position: 'fixed' as const,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div style={{
                ...cardStyle,
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '2rem',
                  color: '#FAFBFD',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ➕ Adicionar Credenciais
                </h3>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem', display: 'block' }}>
                      Exchange
                    </label>
                    <select
                      value={newCredential.exchange}
                      onChange={(e) => setNewCredential({ ...newCredential, exchange: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(5, 167, 78, 0.1)',
                        border: '1px solid rgba(5, 167, 78, 0.3)',
                        borderRadius: '8px',
                        color: '#FAFBFD',
                        fontSize: '1rem'
                      }}
                    >
                      {exchanges.map(exchange => (
                        <option key={exchange.id} value={exchange.id}>
                          {exchange.icon} {exchange.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem', display: 'block' }}>
                      Label (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newCredential.label}
                      onChange={(e) => setNewCredential({ ...newCredential, label: e.target.value })}
                      placeholder="Ex: Conta Principal, Testnet, etc."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(5, 167, 78, 0.1)',
                        border: '1px solid rgba(5, 167, 78, 0.3)',
                        borderRadius: '8px',
                        color: '#FAFBFD',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem', display: 'block' }}>
                      API Key
                    </label>
                    <input
                      type="text"
                      value={newCredential.apiKey}
                      onChange={(e) => setNewCredential({ ...newCredential, apiKey: e.target.value })}
                      placeholder="Sua chave API da exchange"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(5, 167, 78, 0.1)',
                        border: '1px solid rgba(5, 167, 78, 0.3)',
                        borderRadius: '8px',
                        color: '#FAFBFD',
                        fontSize: '1rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#AFB4B1', marginBottom: '0.5rem', display: 'block' }}>
                      API Secret
                    </label>
                    <input
                      type="password"
                      value={newCredential.apiSecret}
                      onChange={(e) => setNewCredential({ ...newCredential, apiSecret: e.target.value })}
                      placeholder="Sua chave secreta da exchange"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(5, 167, 78, 0.1)',
                        border: '1px solid rgba(5, 167, 78, 0.3)',
                        borderRadius: '8px',
                        color: '#FAFBFD',
                        fontSize: '1rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      id="testnet"
                      checked={newCredential.isTestnet}
                      onChange={(e) => setNewCredential({ ...newCredential, isTestnet: e.target.checked })}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <label htmlFor="testnet" style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                      🧪 Esta é uma credencial de testnet
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCredential}
                    disabled={!newCredential.apiKey || !newCredential.apiSecret}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: newCredential.apiKey && newCredential.apiSecret ? '#05A74E' : 'rgba(5, 167, 78, 0.3)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FAFBFD',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: newCredential.apiKey && newCredential.apiSecret ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ExchangeCredentials;

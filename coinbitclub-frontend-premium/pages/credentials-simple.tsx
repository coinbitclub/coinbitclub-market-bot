import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';

const CredenciaisSimples: NextPage = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <>
      <Head>
        <title>Credenciais - CoinBitClub</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
        color: '#FAFBFD',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem'
      }}>
        {/* Header */}
        <header style={{
          background: 'rgba(5, 167, 78, 0.05)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(5, 167, 78, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0'
          }}>
            🔐 Credenciais das Exchanges
          </h1>
          
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            style={{
              background: '#05A74E',
              color: '#FAFBFD',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {mostrarFormulario ? 'Cancelar' : '+ Adicionar'}
          </button>
        </header>

        {/* Aviso de Segurança */}
        <section style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#f59e0b', marginBottom: '1rem' }}>⚠️ Importante: Segurança</h2>
          <ul style={{ color: '#AFB4B1', lineHeight: '1.6' }}>
            <li>• Nunca compartilhe suas chaves API</li>
            <li>• Use apenas permissões de trading</li>
            <li>• Teste sempre no modo testnet primeiro</li>
            <li>• Suas credenciais são criptografadas</li>
          </ul>
        </section>

        {/* Formulário (se mostrar) */}
        {mostrarFormulario && (
          <section style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '2rem', color: '#FAFBFD' }}>Adicionar Nova Credencial</h3>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#AFB4B1' }}>
                  Exchange
                </label>
                <select style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  border: '1px solid rgba(5, 167, 78, 0.3)',
                  borderRadius: '8px',
                  color: '#FAFBFD',
                  fontSize: '1rem'
                }}>
                  <option value="bybit">🔶 Bybit</option>
                  <option value="binance">🟡 Binance</option>
                  <option value="okx">⚫ OKX</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#AFB4B1' }}>
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="Sua chave API"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(5, 167, 78, 0.1)',
                    border: '1px solid rgba(5, 167, 78, 0.3)',
                    borderRadius: '8px',
                    color: '#FAFBFD',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#AFB4B1' }}>
                  API Secret
                </label>
                <input
                  type="password"
                  placeholder="Sua chave secreta"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(5, 167, 78, 0.1)',
                    border: '1px solid rgba(5, 167, 78, 0.3)',
                    borderRadius: '8px',
                    color: '#FAFBFD',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button style={{
                background: '#05A74E',
                color: '#FAFBFD',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '1rem'
              }}>
                Salvar Credenciais
              </button>
            </div>
          </section>
        )}

        {/* Lista de Credenciais */}
        <section style={{
          background: 'rgba(5, 167, 78, 0.05)',
          border: '1px solid rgba(5, 167, 78, 0.2)',
          borderRadius: '20px',
          padding: '2rem'
        }}>
          <h3 style={{ marginBottom: '2rem', color: '#FAFBFD' }}>Credenciais Configuradas</h3>
          
          {/* Exemplo de credencial */}
          <div style={{
            background: 'rgba(5, 167, 78, 0.1)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🔶</span>
                <div>
                  <h4 style={{ color: '#FAFBFD', margin: '0' }}>Bybit Principal</h4>
                  <p style={{ color: '#05A74E', margin: '0', fontSize: '0.875rem' }}>✅ Ativa • 🔴 Produção</p>
                </div>
              </div>
              <button style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: '#ef4444',
                cursor: 'pointer'
              }}>
                Remover
              </button>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
              <p>API Key: BVXT7Y...8K9L</p>
              <p>Criado: 15/07/2025</p>
              <p>Último uso: 17/07/2025 14:22</p>
            </div>
          </div>

          {/* Mensagem se vazio */}
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#AFB4B1'
          }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Suas credenciais aparecerão aqui
            </p>
            <p>Clique em "Adicionar" para configurar sua primeira exchange</p>
          </div>
        </section>
      </div>
    </>
  );
};

export default CredenciaisSimples;

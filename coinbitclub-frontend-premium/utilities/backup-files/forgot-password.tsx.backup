import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const ForgotPasswordPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Email é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setMessage(data.message);
        
        // Para desenvolvimento, mostrar o link de reset
        if (data.debug?.resetUrl) {
          console.log('🔗 Reset URL (DEV):', data.debug.resetUrl);
        }
      } else {
        setError(data.message || 'Erro ao solicitar recuperação de senha');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Esqueci minha senha - CoinBitClub</title>
        <meta name="description" content="Recupere sua senha do CoinBitClub" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '400px',
          width: '100%',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/" style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none',
            }}>
              ⚡ CoinBitClub
            </Link>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginTop: '1rem',
              color: '#B0B3B8',
            }}>
              {emailSent ? 'Email Enviado' : 'Esqueci minha senha'}
            </h1>
            <p style={{
              color: '#888',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
            }}>
              {emailSent 
                ? 'Verifique sua caixa de entrada' 
                : 'Digite seu email para recuperar a senha'
              }
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit}>
              {/* Error/Success Message */}
              {(error || message) && (
                <div style={{
                  background: error ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                  border: `1px solid ${error ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  color: error ? '#ff6b6b' : '#4ade80',
                  textAlign: 'center',
                }}>
                  {error || message}
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#B0B3B8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #00BFFF',
                  background: loading 
                    ? 'rgba(0, 191, 255, 0.5)' 
                    : 'linear-gradient(135deg, #00BFFF, #1E90FF)',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? '🔄 Enviando...' : '📧 Enviar Link de Recuperação'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {/* Success State */}
              <div style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem',
                color: '#4ade80',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                <p style={{ marginBottom: '1rem' }}>{message}</p>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>
                  O link expira em 1 hora por segurança
                </p>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  setMessage('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  marginBottom: '1rem',
                }}
              >
                ↩️ Tentar outro email
              </button>
            </div>
          )}

          {/* Links */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <p style={{ color: '#B0B3B8', marginBottom: '1rem' }}>
              Lembrou da senha?
            </p>
            <Link href="/auth/login" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '2px solid #FFD700',
              background: 'linear-gradient(135deg, #FFD70020, #FFA50020)',
              color: '#FFD700',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              🔑 Fazer Login
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/" style={{
              color: '#B0B3B8',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}>
              ← Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

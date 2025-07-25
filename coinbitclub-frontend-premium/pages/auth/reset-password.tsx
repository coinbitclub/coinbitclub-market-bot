import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    // Obter token da URL
    const urlToken = router.query.token as string;
    if (urlToken) {
      setToken(urlToken);
    } else if (router.isReady) {
      setError('Token de recuperação não encontrado na URL');
    }
  }, [router.query.token, router.isReady]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token) {
      setError('Token de recuperação não encontrado');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordReset(true);
        setMessage(data.message);
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/auth/login?message=Senha redefinida com sucesso! Faça login com sua nova senha.');
        }, 3000);
      } else {
        setError(data.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  if (!router.isReady) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>🔄 Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Redefinir Senha - CoinBitClub</title>
        <meta name="description" content="Redefina sua senha do CoinBitClub" />
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
              {passwordReset ? 'Senha Redefinida!' : 'Redefinir Senha'}
            </h1>
            <p style={{
              color: '#888',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
            }}>
              {passwordReset 
                ? 'Redirecionando para login...' 
                : 'Digite sua nova senha'
              }
            </p>
          </div>

          {!passwordReset ? (
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
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
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

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#B0B3B8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  placeholder="Digite a senha novamente"
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
                disabled={loading || !token}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #00BFFF',
                  background: (loading || !token)
                    ? 'rgba(0, 191, 255, 0.5)' 
                    : 'linear-gradient(135deg, #00BFFF, #1E90FF)',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? '🔄 Redefinindo...' : '🔐 Redefinir Senha'}
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ marginBottom: '1rem' }}>{message}</p>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>
                  Redirecionando para o login em 3 segundos...
                </p>
              </div>
            </div>
          )}

          {/* Links */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
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
              🔑 Ir para Login
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

export default ResetPasswordPage;

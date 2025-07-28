import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Chamar diretamente o backend Railway
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coinbitclub-market-bot.up.railway.app';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Login successful:', data);
        
        // Salvar token no localStorage (usando as chaves corretas para o DashboardLayout)
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));

        // Redirecionar baseado no tipo de usuário
        const userType = data.user.userType || data.user.type || data.user.user_type;
        console.log('User type detected:', userType);
        
        switch (userType) {
          case 'admin':
            console.log('Redirecting to admin dashboard');
            router.push('/admin/dashboard');
            break;
          case 'affiliate':
            console.log('Redirecting to affiliate dashboard');
            router.push('/affiliate/dashboard');
            break;
          case 'user':
          default:
            console.log('Redirecting to user dashboard');
            router.push('/dashboard');
            break;
        }
      } else {
        console.error('❌ Login failed:', data);
        setError(data.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Login - CoinBitClub</title>
        <meta name="description" content="Faça login na sua conta CoinBitClub" />
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
              Faça login na sua conta
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#ff6b6b',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
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
                  transition: 'border-color 0.3s ease',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#B0B3B8',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}>
                Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
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
                  transition: 'border-color 0.3s ease',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                color: '#B0B3B8',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Lembrar de mim
              </label>
              <Link href="/auth/forgot-password" style={{
                color: '#00BFFF',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}>
                Esqueci a senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid #FFD700',
                background: loading ? 'rgba(255, 215, 0, 0.5)' : 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '🔄 Entrando...' : '🔑 Entrar'}
            </button>
          </form>

          {/* Links */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <p style={{ color: '#B0B3B8', marginBottom: '1rem' }}>
              Não tem uma conta?
            </p>
            <Link href="/auth/register" style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '2px solid #00BFFF',
              background: 'linear-gradient(135deg, #00BFFF20, #FF69B420)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
              textAlign: 'center',
            }}>
              🚀 Criar Conta
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
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

export default LoginPage;

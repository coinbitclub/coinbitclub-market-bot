import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    userType: 'user' // user, affiliate
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

    // Validações
    if (!formData.termsAccepted) {
      setError('Você deve aceitar os Termos de Uso para continuar.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          userType: formData.userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar dados do usuário no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirecionar para login com mensagem de sucesso
        router.push('/auth/login?message=Conta criada com sucesso! Faça login para continuar.');
      } else {
        setError(data.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Cadastro - CoinBitClub</title>
        <meta name="description" content="Crie sua conta no CoinBitClub e comece seu teste gratuito" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
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
              Crie sua conta gratuitamente
            </h1>
            <p style={{
              color: '#888',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
            }}>
              7 dias de teste grátis • Sem compromisso
            </p>
          </div>

          {/* User Type Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '1rem',
              color: '#B0B3B8',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}>
              Tipo de Conta
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => handleInputChange('userType', 'user')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: formData.userType === 'user' 
                    ? '2px solid #FFD700' 
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  background: formData.userType === 'user'
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: formData.userType === 'user' ? '#000' : '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                👤 Usuário
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('userType', 'affiliate')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: formData.userType === 'affiliate' 
                    ? '2px solid #FFD700' 
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  background: formData.userType === 'affiliate'
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: formData.userType === 'affiliate' ? '#000' : '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                🤝 Afiliado
              </button>
            </div>
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
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
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
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
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
                Confirmar Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                color: '#B0B3B8',
                fontSize: '0.9rem',
                cursor: 'pointer',
                lineHeight: '1.4',
              }}>
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  required
                  style={{ marginRight: '0.75rem', marginTop: '0.1rem' }}
                />
                Eu aceito os{' '}
                <Link 
                  href="/privacy" 
                  target="_blank"
                  style={{ 
                    color: '#00BFFF', 
                    textDecoration: 'underline',
                    marginLeft: '0.25rem'
                  }}
                >
                  Termos de Uso e Política de Privacidade
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.termsAccepted}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid #FFD700',
                background: (loading || !formData.termsAccepted) 
                  ? 'rgba(255, 215, 0, 0.5)' 
                  : 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: (loading || !formData.termsAccepted) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '🔄 Criando conta...' : '🚀 Criar Conta Grátis'}
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
              Já tem uma conta?
            </p>
            <Link href="/auth/login" style={{
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
              🔑 Fazer Login
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

export default RegisterPage;

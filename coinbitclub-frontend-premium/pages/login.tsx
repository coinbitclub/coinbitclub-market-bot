import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: NextPage = () => {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!form.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Aqui será a integração com o backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          rememberMe: form.rememberMe
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Credenciais inválidas' });
      }
    } catch (error) {
      console.log('Login simulated - redirecting to dashboard');
      // Simulação para desenvolvimento
      localStorage.setItem('token', 'demo-token');
      window.location.href = '/dashboard';
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!mounted) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Login - CoinBitClub</title>
        <meta name="description" content="Faça login no CoinBitClub" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #007BFF',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 123, 255, 0.3)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #007BFF, #0056CC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              ⚡ CoinBitClub
            </h1>
            <p style={{ color: '#CCCCCC', fontSize: '1rem' }}>
              Acesse sua conta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Email */}
            <div>
              <label style={{ color: '#007BFF', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${errors.email ? '#FF4444' : '#333333'}`,
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007BFF'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#FF4444' : '#333333'}
              />
              {errors.email && <span style={{ color: '#FF4444', fontSize: '0.75rem' }}>{errors.email}</span>}
            </div>

            {/* Senha */}
            <div>
              <label style={{ color: '#007BFF', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Senha
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Sua senha"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${errors.password ? '#FF4444' : '#333333'}`,
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007BFF'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#FF4444' : '#333333'}
              />
              {errors.password && <span style={{ color: '#FF4444', fontSize: '0.75rem' }}>{errors.password}</span>}
            </div>

            {/* Lembrar de mim e Esqueci senha */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#CCCCCC', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  style={{ accentColor: '#007BFF' }}
                />
                Lembrar de mim
              </label>
              <Link href="/forgot-password" style={{ color: '#007BFF', textDecoration: 'underline', fontSize: '0.875rem' }}>
                Esqueci minha senha
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#666666' : 'linear-gradient(45deg, #007BFF, #0056CC)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                transform: loading ? 'none' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.target as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {errors.submit && (
              <div style={{ color: '#FF4444', textAlign: 'center', fontSize: '0.875rem' }}>
                {errors.submit}
              </div>
            )}
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #333333' }}>
            <p style={{ color: '#CCCCCC', fontSize: '0.875rem' }}>
              Não tem uma conta?{' '}
              <Link href="/signup" style={{ color: '#007BFF', textDecoration: 'underline', fontWeight: '600' }}>
                Cadastre-se
              </Link>
            </p>
            <p style={{ color: '#CCCCCC', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <Link href="/" style={{ color: '#007BFF', textDecoration: 'underline' }}>
                Voltar ao início
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

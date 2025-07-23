import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0b 25%, #1a1a1c 50%, #0a0a0b 75%, #000000 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  };

  const formContainerStyle = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '20px',
    padding: '3rem',
    maxWidth: '400px',
    width: '100%',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 40px rgba(255, 215, 0, 0.2)',
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    textAlign: 'center' as const,
  };

  const subtitleStyle = {
    color: '#B0B3B8',
    textAlign: 'center' as const,
    marginBottom: '2rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '1rem',
  };

  const linkStyle = {
    color: '#00BFFF',
    textDecoration: 'none',
    fontSize: '0.9rem',
  };

  const errorStyle = {
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem',
    color: '#ff6b6b',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Tenta primeiro a API local para desenvolvimento
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        const user = data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Direcionar conforme o role do usuário
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'affiliate') {
          router.push('/dashboard?affiliate=true');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Se a API local falhar, tenta o backend
        const backendResponse = await fetch('http://localhost:8081/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          const token = data.tokens?.accessToken || data.token;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Direcionar conforme o role do usuário
          if (data.user.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (data.user.role === 'affiliate') {
            router.push('/dashboard?affiliate=true');
          } else {
            router.push('/dashboard');
          }
        } else {
          const errorData = await backendResponse.json();
          setError(errorData.error || errorData.message || 'Erro ao fazer login');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro de conexão. Verifique se os serviços estão rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - CoinBitClub</title>
        <meta name="description" content="Faça login na sua conta CoinBitClub" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        <div style={formContainerStyle}>
          <Link href="/" style={{ 
            display: 'block', 
            textAlign: 'center', 
            marginBottom: '2rem',
            fontSize: '1.5rem',
            background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>
            ⚡ CoinBitClub
          </Link>
          
          <h1 style={titleStyle}>Bem-vindo!</h1>
          <p style={subtitleStyle}>Faça login para acessar sua conta</p>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            
            <button 
              type="submit" 
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? '🔄 Entrando...' : '🚀 Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: '#B0B3B8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Não tem uma conta?{' '}
              <Link href="/auth/register" style={linkStyle}>
                Cadastre-se aqui
              </Link>
            </p>
            
            <p style={{ fontSize: '0.875rem' }}>
              <Link href="/auth/forgot-password" style={linkStyle}>
                Esqueceu sua senha?
              </Link>
            </p>
            
            <div style={{ margin: '1.5rem 0', height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Link href="/landing" style={{
              ...linkStyle,
              display: 'inline-block',
              padding: '0.5rem 1rem',
              border: '1px solid rgba(0, 191, 255, 0.3)',
              borderRadius: '8px',
              background: 'rgba(0, 191, 255, 0.1)',
            }}>
              ← Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

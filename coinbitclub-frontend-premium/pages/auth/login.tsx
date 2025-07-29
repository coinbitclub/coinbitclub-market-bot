import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações básicas
      if (!formData.email || !formData.password) {
        throw new Error('Email e senha são obrigatórios');
      }

      if (!formData.email.includes('@')) {
        throw new Error('Email inválido');
      }

      console.log('🔐 Tentando login para:', formData.email);

      // Fazer login
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: formData.email,
        password: formData.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (response.status === 200 && data.success !== false) {
        console.log('✅ Login realizado com sucesso:', data);
        
        // Salvar token
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));

        // Redirecionar baseado no role
        const userRole = data.user.role || data.user.user_type || 'user';
        console.log('User role detected:', userRole);
        
        switch (userRole) {
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
        }
      } else {
        throw new Error(data.message || data.error || 'Erro no login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      // Tratar diferentes tipos de erro
      if (error.response?.status === 401) {
        setError('Email ou senha incorretos');
      } else if (error.response?.status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
      } else if (error.response?.status >= 500) {
        setError('Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        setError('Erro de conexão. Verifique se o servidor está rodando na porta 3000.');
      } else {
        setError(error.message || 'Erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'faleconosco@coinbitclub.vip',
      password: 'password'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0f0f23',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #16213e'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#ffa500',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            ₿
          </div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: '#a0a0a0', margin: '8px 0 0', fontSize: '14px' }}>
            Entre na sua conta CoinBitClub
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '12px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="faleconosco@coinbitclub.vip"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #333',
                backgroundColor: '#2d2d44',
                color: 'white',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #333',
                backgroundColor: '#2d2d44',
                color: 'white',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px', fontSize: '12px' }}>
            <label style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" style={{ marginRight: '8px' }} />
              Lembrar de mim
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#666' : '#ffa500',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#ffa500',
              border: '1px solid #ffa500',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Usar Credenciais Demo
          </button>
        </form>

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#16213e', 
          borderRadius: '5px',
          border: '1px solid #1e3a2e'
        }}>
          <h4 style={{ color: '#4ade80', margin: '0 0 10px', fontSize: '14px' }}>
            🔒 Login Seguro
          </h4>
          <p style={{ color: '#a0a0a0', margin: 0, fontSize: '12px' }}>
            ✅ Autenticação JWT<br/>
            ✅ Verificação SMS<br/>
            ✅ SSL/TLS Encryption
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a 
            href="/auth/register" 
            style={{ color: '#ffa500', textDecoration: 'none', fontSize: '14px' }}
          >
            Não tem uma conta? Cadastre-se
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
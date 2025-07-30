import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginSimple() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: 'faleconosco@coinbitclub.vip',
    password: '12345678'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando login...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📡 Resposta da API:', data);

      if (response.ok && data.success) {
        console.log('✅ Login bem-sucedido');
        
        // Salvar token e dados do usuário
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Salvar também nos cookies para o middleware
        document.cookie = `auth_token=${data.token}; path=/; max-age=86400`;
        document.cookie = `user_data=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400`;

        console.log('💾 Dados salvos, redirecionando...');
        
        // Redirecionar baseado no role
        const role = data.user.role.toLowerCase();
        if (role === 'admin') {
          console.log('👑 Redirecionando admin para /admin/dashboard');
          window.location.href = '/admin/dashboard';
        } else {
          console.log('👤 Redirecionando usuário para /user/dashboard');
          window.location.href = '/user/dashboard';
        }
        
      } else {
        setError(data.message || 'Erro no login');
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - CoinBitClub</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: '#1a1a1a',
          padding: '40px',
          borderRadius: '15px',
          border: '1px solid #333',
          boxShadow: '0 10px 30px rgba(0,255,136,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ 
              color: '#00ff88', 
              margin: '0 0 10px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              🚀 CoinBitClub
            </h1>
            <p style={{ color: '#888', margin: 0 }}>
              Market Bot - Login Simplificado
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                📧 Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a2a',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                🔒 Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a2a',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
              />
            </div>

            {error && (
              <div style={{
                background: '#4d1a1a',
                border: '1px solid #dc3545',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                background: loading ? '#666' : 'linear-gradient(45deg, #00ff88, #00cc6a)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '🔄 Entrando...' : '🚀 Entrar'}
            </button>
          </form>

          <div style={{
            marginTop: '30px',
            padding: '15px',
            background: '#2a2a2a',
            borderRadius: '8px',
            border: '1px solid #555'
          }}>
            <p style={{ 
              color: '#888', 
              fontSize: '12px', 
              margin: '0 0 10px 0',
              textAlign: 'center'
            }}>
              🧪 Credenciais de Teste
            </p>
            <p style={{ color: '#00ff88', fontSize: '12px', margin: 0, textAlign: 'center' }}>
              Email: faleconosco@coinbitclub.vip<br/>
              Senha: 12345678
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

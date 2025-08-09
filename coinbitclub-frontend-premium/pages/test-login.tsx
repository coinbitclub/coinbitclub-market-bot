import { useState } from 'react';
import { useRouter } from 'next/router';

export default function TestLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('faleconosco@coinbitclub.vip');
  const [password, setPassword] = useState('12345678');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTestLogin = async () => {
    setLoading(true);
    setMessage('🔄 Iniciando teste de login...');

    try {
      // 1. Fazer login
      setMessage('📡 Enviando credenciais para API...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('✅ Login bem-sucedido! Dados recebidos...');
        
        // 2. Salvar dados
        setMessage('💾 Salvando dados de autenticação...');
        const userData = {
          id: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          role: data.user.role
        };

        // Salvar no localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Salvar nos cookies
        document.cookie = `auth_token=${data.token}; path=/; max-age=86400`;
        document.cookie = `user_data=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400`;

        setMessage(`🎭 Usuário logado como: ${userData.role} (${userData.email})`);

        // 3. Determinar redirecionamento
        const role = userData.role.toLowerCase();
        let targetUrl;
        
        switch (role) {
          case 'admin':
            targetUrl = '/admin/dashboard';
            break;
          case 'gestor':
            targetUrl = '/gestor/dashboard';
            break;
          case 'operador':
            targetUrl = '/operador/dashboard';
            break;
          case 'afiliado':
          case 'affiliate':
            targetUrl = '/affiliate/dashboard';
            break;
          default:
            targetUrl = '/user/dashboard';
        }

        setMessage(`🎯 Redirecionando para: ${targetUrl}`);
        
        // 4. Aguardar um pouco e redirecionar
        setTimeout(() => {
          setMessage(`🚀 Executando redirecionamento...`);
          window.location.href = targetUrl;
        }, 2000);

      } else {
        setMessage(`❌ Erro no login: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      setMessage(`💥 Erro na requisição: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setMessage('🧹 Autenticação limpa!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: '#1a1a1a',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #333'
      }}>
        <h1 style={{ textAlign: 'center', color: '#00ff88' }}>
          🧪 Teste de Login - CoinBitClub
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#2a2a2a',
              border: '1px solid #555',
              borderRadius: '5px',
              color: '#fff'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#2a2a2a',
              border: '1px solid #555',
              borderRadius: '5px',
              color: '#fff'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={handleTestLogin}
            disabled={loading}
            style={{
              background: loading ? '#666' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            {loading ? '🔄 Testando...' : '🚀 Testar Login'}
          </button>

          <button
            onClick={clearAuth}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🧹 Limpar Auth
          </button>
        </div>

        {message && (
          <div style={{
            background: '#2a2a2a',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #555',
            marginTop: '20px',
            whiteSpace: 'pre-wrap'
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#2a2a2a',
          borderRadius: '5px',
          border: '1px solid #555'
        }}>
          <h3 style={{ color: '#17a2b8' }}>ℹ️ Informações do Teste</h3>
          <p><strong>Objetivo:</strong> Testar login e redirecionamento para dashboard admin</p>
          <p><strong>Email padrão:</strong> faleconosco@coinbitclub.vip</p>
          <p><strong>Senha padrão:</strong> 12345678</p>
          <p><strong>Role esperado:</strong> admin</p>
          <p><strong>Dashboard esperado:</strong> /admin/dashboard</p>
        </div>
      </div>
    </div>
  );
}

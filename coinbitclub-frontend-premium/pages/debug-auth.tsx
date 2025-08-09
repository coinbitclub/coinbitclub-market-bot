import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState({});
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Verificar localStorage
      const localToken = localStorage.getItem('auth_token');
      const localUser = localStorage.getItem('user_data');
      
      // Verificar cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      // Parse user data
      let parsedUser = null;
      try {
        if (localUser) {
          parsedUser = JSON.parse(localUser);
        }
      } catch (e) {
        console.error('Erro ao parsear user data:', e);
      }

      setDebugInfo({
        localStorage: {
          token: localToken,
          user: parsedUser
        },
        cookies: cookies,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };

    checkAuth();
    
    // Verificar a cada 2 segundos
    const interval = setInterval(checkAuth, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const testRedirect = () => {
    console.log('🧪 Testando redirecionamento para /admin/dashboard');
    router.push('/admin/dashboard');
  };

  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setDebugInfo({});
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug de Autenticação</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testRedirect} style={{ marginRight: '10px', padding: '10px' }}>
          🧪 Testar Redirect para Admin Dashboard
        </button>
        <button onClick={clearAuth} style={{ padding: '10px' }}>
          🗑️ Limpar Autenticação
        </button>
      </div>

      <h2>📊 Informações de Debug:</h2>
      <pre style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        borderRadius: '5px',
        overflow: 'auto',
        maxHeight: '600px'
      }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>

      <h2>🍪 Cookies Raw:</h2>
      <pre style={{ 
        background: '#e8f4f8', 
        padding: '15px', 
        borderRadius: '5px' 
      }}>
        {document.cookie || 'Nenhum cookie encontrado'}
      </pre>
    </div>
  );
}

const FallbackPage = () => {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#10b981', marginBottom: '20px' }}>CoinbitClub - Página de Emergência</h1>
      <p style={{ marginBottom: '15px' }}>
        Esta é uma página de fallback criada para verificar o funcionamento básico do Next.js.
      </p>
      <p style={{ marginBottom: '15px' }}>
        Se você está vendo esta mensagem, o servidor Next.js está rodando, mas pode haver problemas com outros componentes.
      </p>
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#10b981', 
        color: 'white', 
        borderRadius: '4px',
        marginTop: '20px',
        fontWeight: 'bold'
      }}>
        Funcionando ✓
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#10b981', marginBottom: '15px' }}>Links de Teste</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0' }}>
            <a href="/" style={{ color: '#10b981', textDecoration: 'none' }}>Página Inicial</a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href="/dashboard-simple" style={{ color: '#10b981', textDecoration: 'none' }}>Dashboard Simples</a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href="/auth" style={{ color: '#10b981', textDecoration: 'none' }}>Autenticação</a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href="/settings" style={{ color: '#10b981', textDecoration: 'none' }}>Configurações</a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href="/test-integration" style={{ color: '#10b981', textDecoration: 'none' }}>Teste de Integração</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FallbackPage;

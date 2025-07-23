export default function Dashboard() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
      color: '#FFFFFF',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #333333',
        background: 'rgba(0, 0, 0, 0.9)'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          ⚡ CoinBitClub Dashboard
        </h1>
      </header>

      {/* Main Content */}
      <main style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🚀 Bem-vindo ao MarketBot
        </h2>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0.8))',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              💰 Lucro Total
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00FF88' }}>
              R$ 47.592,34
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(0, 0, 0, 0.8))',
            border: '1px solid rgba(0, 191, 255, 0.4)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#00BFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              📊 Trades Hoje
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00BFFF' }}>
              12
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(0, 0, 0, 0.8))',
            border: '1px solid rgba(255, 105, 180, 0.4)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#FF69B4', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              🎯 Taxa de Acerto
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00FF88' }}>
              92.8%
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0.8))',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#FFD700', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              🤖 Status do Bot
            </h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00FF88' }}>
              ✅ Ativo
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          <a href="/bot-config" style={{
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: '2px solid #FFD700',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#000',
            textDecoration: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            display: 'inline-block',
            textAlign: 'center'
          }}>
            ⚙️ Configurar Bot
          </a>
          
          <a href="/reports" style={{
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: '2px solid #00BFFF',
            background: 'rgba(0, 191, 255, 0.1)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            display: 'inline-block',
            textAlign: 'center'
          }}>
            📈 Ver Relatórios
          </a>

          <a href="/settings" style={{
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: '2px solid #FF69B4',
            background: 'rgba(255, 105, 180, 0.1)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            display: 'inline-block',
            textAlign: 'center'
          }}>
            🔧 Configurações
          </a>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(255, 215, 0, 0.05))',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '16px',
          padding: '2rem'
        }}>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            📊 Atividade Recente
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✅ BTC/USDT - Compra executada</span>
              <span style={{ color: '#00FF88' }}>+R$ 156,78</span>
            </div>
            
            <div style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✅ ETH/USDT - Venda executada</span>
              <span style={{ color: '#00FF88' }}>+R$ 234,12</span>
            </div>
            
            <div style={{
              background: 'rgba(0, 191, 255, 0.1)',
              border: '1px solid rgba(0, 191, 255, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🔄 ADA/USDT - Trade em andamento</span>
              <span style={{ color: '#00BFFF' }}>Monitorando...</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

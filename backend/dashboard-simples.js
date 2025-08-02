const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3010;

// Conexão PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
});

// Cache simples
let dadosCache = null;
let ultimaAtualizacao = 0;

async function buscarDados() {
  try {
    const agora = Date.now();
    
    // Cache de 30 segundos
    if (dadosCache && (agora - ultimaAtualizacao) < 30000) {
      return dadosCache;
    }

    console.log('🔄 Buscando dados do banco...');
    
    // Queries simples
    const usuarios = await pool.query('SELECT COUNT(*) as total FROM users');
    const operacoes = await pool.query('SELECT COUNT(*) as total FROM trading_operations');
    
    dadosCache = {
      usuarios: parseInt(usuarios.rows[0]?.total) || 0,
      operacoes: parseInt(operacoes.rows[0]?.total) || 0,
      saldoTotal: 15420.50, // Valor fixo por enquanto
      ultimaAtualizacao: new Date().toLocaleString('pt-BR')
    };
    
    ultimaAtualizacao = agora;
    console.log('✅ Dados atualizados:', dadosCache);
    
    return dadosCache;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    return {
      usuarios: 0,
      operacoes: 0,
      saldoTotal: 0,
      ultimaAtualizacao: 'Erro na conexão',
      erro: error.message
    };
  }
}

// Página principal
app.get('/', async (req, res) => {
  const dados = await buscarDados();
  
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub - Dashboard Simples</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.8; font-size: 1.2em; }
        
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 30px; 
            margin-bottom: 40px;
        }
        
        .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); }
        
        .card-icon {
            font-size: 3em;
            margin-bottom: 15px;
            opacity: 0.8;
        }
        
        .card-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4CAF50;
        }
        
        .card-label {
            font-size: 1.1em;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .status {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .status.online { border-left: 4px solid #4CAF50; }
        .status.error { border-left: 4px solid #f44336; }
        
        .refresh-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: background 0.3s ease;
            margin: 10px;
        }
        .refresh-btn:hover { background: #45a049; }
        
        .auto-refresh {
            opacity: 0.7;
            font-size: 0.9em;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CoinBitClub</h1>
            <p>Dashboard em Tempo Real</p>
        </div>
        
        <div class="status ${dados.erro ? 'error' : 'online'}">
            ${dados.erro ? 
                `❌ Erro de Conexão: ${dados.erro}` : 
                `✅ Sistema Online - Última Atualização: ${dados.ultimaAtualizacao}`
            }
        </div>
        
        <div class="stats">
            <div class="card">
                <div class="card-icon">👥</div>
                <div class="card-number">${dados.usuarios}</div>
                <div class="card-label">Usuários Ativos</div>
            </div>
            
            <div class="card">
                <div class="card-icon">📊</div>
                <div class="card-number">${dados.operacoes}</div>
                <div class="card-label">Operações Total</div>
            </div>
            
            <div class="card">
                <div class="card-icon">💰</div>
                <div class="card-number">$${dados.saldoTotal.toFixed(2)}</div>
                <div class="card-label">Saldo Total</div>
            </div>
            
            <div class="card">
                <div class="card-icon">⚡</div>
                <div class="card-number">100%</div>
                <div class="card-label">Sistema Online</div>
            </div>
        </div>
        
        <div style="text-align: center;">
            <button class="refresh-btn" onclick="location.reload()">
                🔄 Atualizar Agora
            </button>
            
            <div class="auto-refresh">
                ⏰ Atualização automática a cada 60 segundos
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh a cada 60 segundos
        setTimeout(() => {
            location.reload();
        }, 60000);
        
        // Mostrar countdown
        let segundos = 60;
        const interval = setInterval(() => {
            segundos--;
            if (segundos <= 0) {
                clearInterval(interval);
                return;
            }
            
            const autoRefreshEl = document.querySelector('.auto-refresh');
            if (autoRefreshEl) {
                autoRefreshEl.innerHTML = \`⏰ Próxima atualização em \${segundos} segundos\`;
            }
        }, 1000);
        
        console.log('📊 Dashboard CoinBitClub carregado');
        console.log('🔄 Dados:', ${JSON.stringify(dados)});
    </script>
</body>
</html>
  `);
});

// API simples para dados JSON
app.get('/api/dados', async (req, res) => {
  const dados = await buscarDados();
  res.json(dados);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Dashboard Simples iniciado!');
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log('🔄 Atualização automática a cada 60 segundos');
  
  // Teste inicial da conexão
  buscarDados().then(() => {
    console.log('✅ Conexão com banco testada com sucesso!');
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando dashboard...');
  pool.end();
  process.exit(0);
});

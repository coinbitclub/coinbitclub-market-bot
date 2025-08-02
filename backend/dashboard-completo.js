const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');

const app = express();
const PORT = 3011;

// Conexão PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
});

// WebSocket Server para atualizações em tempo real
const wss = new WebSocket.Server({ port: 3016 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 Cliente conectado. Total: ${clients.size}`);
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 Cliente desconectado. Total: ${clients.size}`);
  });
});

// Broadcast para todos os clientes
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Cache de dados
let sistemaCacheCompleto = null;
let ultimaAtualizacao = 0;

async function buscarDadosCompletos() {
  try {
    const agora = Date.now();
    
    // Cache de 10 segundos para dados em tempo real
    if (sistemaCacheCompleto && (agora - ultimaAtualizacao) < 10000) {
      return sistemaCacheCompleto;
    }

    console.log('🔄 Buscando dados completos do sistema...');
    
    // Queries para todos os componentes
    const [
      usuarios,
      sinais,
      operacoes,
      gestores,
      indicadores,
      logs,
      operacoesAndamento,
      resultadosRecentes
    ] = await Promise.allSettled([
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
          COUNT(CASE WHEN vip_status = true THEN 1 END) as vip,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as online_1h
        FROM users
      `),
      
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora,
          COUNT(CASE WHEN action = 'BUY' THEN 1 END) as buy_signals,
          COUNT(CASE WHEN action = 'SELL' THEN 1 END) as sell_signals
        FROM trading_signals
      `),
      
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as concluidas,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as falhadas,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora
        FROM trading_operations
      `),
      
      pool.query(`
        SELECT 
          u.name as user_id,
          u.status,
          CASE 
            WHEN u.name = 'signals_manager' THEN 'Processando sinais de trading'
            WHEN u.name = 'operations_manager' THEN 'Gerenciando operações ativas'
            WHEN u.name = 'fear_greed_manager' THEN 'Monitorando Fear & Greed Index'
            WHEN u.name = 'financial_supervisor' THEN 'Supervisionando transações financeiras'
            WHEN u.name = 'trade_supervisor' THEN 'Supervisionando trades em tempo real'
            WHEN u.name = 'users_manager' THEN 'Gerenciando usuários do sistema'
            WHEN u.name = 'risk_manager' THEN 'Analisando riscos do sistema'
            WHEN u.name = 'analytics_manager' THEN 'Gerando analytics do sistema'
            ELSE 'Gestor ativo'
          END as last_action,
          COALESCE(
            (SELECT SUM(pnl) FROM trading_operations 
             WHERE user_id = u.id AND completed_at > NOW() - INTERVAL '24 hours'), 
            0
          ) as profit_loss,
          COALESCE(
            (SELECT COUNT(*) FROM trading_operations 
             WHERE user_id = u.id AND status IN ('pending', 'active', 'partially_filled')), 
            0
          ) as active_trades
        FROM users u
        WHERE u.status = 'active'
          AND u.name IN (
            'signals_manager', 'operations_manager', 'fear_greed_manager',
            'financial_supervisor', 'trade_supervisor', 'users_manager',
            'risk_manager', 'analytics_manager'
          )
        ORDER BY u.created_at
      `),
      
      pool.query(`
        SELECT 
          'fear_greed' as indicator_name,
          'BTCUSDT' as symbol,
          value::text as value,
          classificacao_pt as signal,
          created_at as updated_at
        FROM fear_greed_index 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC 
        LIMIT 1
      `),
      
      pool.query(`
        SELECT 
          'INFO' as level,
          'Sistema iniciado - Fear & Greed: ' || value || ' (' || classificacao_pt || ')' as message,
          'SISTEMA' as component,
          created_at
        FROM fear_greed_index 
        WHERE created_at > NOW() - INTERVAL '2 hours'
        ORDER BY created_at DESC 
        LIMIT 10
      `),
      
      // Operações em andamento - dados reais
      pool.query(`
        SELECT 
          id,
          user_id,
          symbol,
          side,
          quantity,
          entry_price,
          current_price,
          pnl,
          status,
          created_at
        FROM trading_operations 
        WHERE status IN ('pending', 'active', 'partially_filled')
        ORDER BY created_at DESC 
        LIMIT 10
      `),
      
      // Resultados recentes - dados reais
      pool.query(`
        SELECT 
          id,
          user_id,
          symbol,
          side,
          quantity,
          entry_price,
          exit_price,
          pnl,
          pnl_percentage,
          status,
          completed_at
        FROM trading_operations 
        WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours'
        ORDER BY completed_at DESC 
        LIMIT 15
      `)
    ]);

    // Processar resultados
    const dadosCompletos = {
      timestamp: new Date().toISOString(),
      ultimaAtualizacao: new Date().toLocaleString('pt-BR'),
      
      // Estatísticas dos usuários
      usuarios: {
        total: parseInt(usuarios.value?.rows[0]?.total) || 0,
        ativos: parseInt(usuarios.value?.rows[0]?.ativos) || 0,
        vip: parseInt(usuarios.value?.rows[0]?.vip) || 0,
        online_1h: parseInt(usuarios.value?.rows[0]?.online_1h) || 0,
        status: usuarios.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Sinais de trading
      sinais: {
        total: parseInt(sinais.value?.rows[0]?.total) || 0,
        ultima_hora: parseInt(sinais.value?.rows[0]?.ultima_hora) || 0,
        buy_signals: parseInt(sinais.value?.rows[0]?.buy_signals) || 0,
        sell_signals: parseInt(sinais.value?.rows[0]?.sell_signals) || 0,
        status: sinais.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Operações de trading
      operacoes: {
        total: parseInt(operacoes.value?.rows[0]?.total) || 0,
        concluidas: parseInt(operacoes.value?.rows[0]?.concluidas) || 0,
        pendentes: parseInt(operacoes.value?.rows[0]?.pendentes) || 0,
        falhadas: parseInt(operacoes.value?.rows[0]?.falhadas) || 0,
        ultima_hora: parseInt(operacoes.value?.rows[0]?.ultima_hora) || 0,
        status: operacoes.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Gestores ativos
      gestores: {
        ativos: gestores.value?.rows?.length || 0,
        lista: gestores.value?.rows || [],
        status: gestores.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Indicadores de mercado
      indicadores: {
        total: indicadores.value?.rows?.length || 0,
        lista: indicadores.value?.rows || [],
        status: indicadores.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Logs do sistema
      logs: {
        total: logs.value?.rows?.length || 0,
        lista: logs.value?.rows || [],
        status: logs.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Operações em andamento
      operacoesAndamento: {
        total: operacoesAndamento.value?.rows?.length || 0,
        lista: operacoesAndamento.value?.rows || [],
        status: operacoesAndamento.status === 'fulfilled' ? 'OK' : 'ERRO'
      },
      
      // Resultados recentes
      resultadosRecentes: {
        total: resultadosRecentes.value?.rows?.length || 0,
        lista: resultadosRecentes.value?.rows || [],
        status: resultadosRecentes.status === 'fulfilled' ? 'OK' : 'ERRO',
        lucroTotal: resultadosRecentes.value?.rows?.reduce((acc, op) => acc + (parseFloat(op.pnl) || 0), 0) || 0
      },
      
      // Status geral do sistema
      sistema: {
        database: 'ONLINE',
        websocket: clients.size > 0 ? 'CONECTADO' : 'DISPONÍVEL',
        clientes_conectados: clients.size,
        uptime: process.uptime()
      }
    };

    sistemaCacheCompleto = dadosCompletos;
    ultimaAtualizacao = agora;
    
    console.log('✅ Dados completos atualizados:', {
      usuarios: dadosCompletos.usuarios.total,
      sinais: dadosCompletos.sinais.total,
      operacoes: dadosCompletos.operacoes.total,
      clientes_ws: clients.size
    });
    
    // Broadcast para clientes WebSocket
    broadcast({
      type: 'sistema_update',
      data: dadosCompletos
    });
    
    return dadosCompletos;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados completos:', error.message);
    return {
      erro: error.message,
      timestamp: new Date().toISOString(),
      ultimaAtualizacao: 'Erro na conexão'
    };
  }
}

// Página principal do dashboard
app.get('/', async (req, res) => {
  const dados = await buscarDadosCompletos();
  
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBitClub - Dashboard Completo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', sans-serif; 
            background: #0a0a0a;
            color: #fff;
            overflow-x: auto;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header h1 { font-size: 1.8em; }
        .header .status { 
            display: flex; 
            gap: 15px; 
            font-size: 0.9em; 
        }
        
        .status-item {
            padding: 5px 10px;
            border-radius: 15px;
            background: rgba(255,255,255,0.1);
        }
        .status-item.online { background: rgba(76, 175, 80, 0.3); }
        .status-item.error { background: rgba(244, 67, 54, 0.3); }
        
        .container { padding: 20px; }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            position: relative;
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #333;
        }
        
        .card-title {
            font-size: 1.1em;
            font-weight: bold;
        }
        
        .card-status {
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .card-status.ok { background: #4CAF50; }
        .card-status.error { background: #f44336; }
        
        .stats-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 5px;
        }
        
        .stat-label { opacity: 0.8; }
        .stat-value { 
            font-weight: bold; 
            color: #4CAF50;
        }
        
        .list-item {
            background: rgba(255,255,255,0.05);
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            border-left: 3px solid #4CAF50;
            font-size: 0.9em;
        }
        
        .list-item.buy { border-left-color: #4CAF50; }
        .list-item.sell { border-left-color: #f44336; }
        .list-item.error { border-left-color: #ff9800; }
        
        .fluxo-container {
            display: flex;
            gap: 20px;
            overflow-x: auto;
            margin: 20px 0;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 10px;
        }
        
        .fluxo-step {
            min-width: 200px;
            text-align: center;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            position: relative;
        }
        
        .fluxo-step::after {
            content: '→';
            position: absolute;
            right: -15px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.5em;
            color: #4CAF50;
        }
        
        .fluxo-step:last-child::after { display: none; }
        
        .fluxo-step.ativo {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
        }
        
        .conexao-status {
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            z-index: 1000;
        }
        .conexao-status.conectado { background: rgba(76, 175, 80, 0.8); }
        .conexao-status.desconectado { background: rgba(244, 67, 54, 0.8); }
        
        .log-container {
            max-height: 300px;
            overflow-y: auto;
            background: #0a0a0a;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 0.8em;
        }
        
        .log-entry {
            margin: 2px 0;
            padding: 2px 5px;
        }
        .log-entry.error { color: #f44336; }
        .log-entry.warning { color: #ff9800; }
        .log-entry.success { color: #4CAF50; }
        .log-entry.info { color: #2196F3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 CoinBitClub - Dashboard Completo</h1>
        <div class="status">
            <div class="status-item ${dados.sistema?.database === 'ONLINE' ? 'online' : 'error'}">
                📊 DB: ${dados.sistema?.database || 'ERRO'}
            </div>
            <div class="status-item online">
                🔌 WS: ${dados.sistema?.clientes_conectados || 0} clientes
            </div>
            <div class="status-item online">
                ⏱️ ${dados.ultimaAtualizacao}
            </div>
        </div>
    </div>
    
    <div id="conexaoStatus" class="conexao-status desconectado">
        🔴 WebSocket Desconectado
    </div>
    
    <div class="container">
        <!-- Fluxo do Sistema -->
        <div class="fluxo-container">
            <div class="fluxo-step ${dados.sinais?.ultima_hora > 0 ? 'ativo' : ''}">
                <strong>📡 Sinais Recebidos</strong>
                <div>Última Hora: ${dados.sinais?.ultima_hora || 0}</div>
                <div>BUY: ${dados.sinais?.buy_signals || 0} | SELL: ${dados.sinais?.sell_signals || 0}</div>
            </div>
            
            <div class="fluxo-step ${dados.indicadores?.total > 0 ? 'ativo' : ''}">
                <strong>📈 Indicadores</strong>
                <div>Ativos: ${dados.indicadores?.total || 0}</div>
                <div>Processando Mercado</div>
            </div>
            
            <div class="fluxo-step ${dados.gestores?.ativos > 0 ? 'ativo' : ''}">
                <strong>🤖 Gestores</strong>
                <div>Ativos: ${dados.gestores?.ativos || 0}</div>
                <div>Analisando Sinais</div>
            </div>
            
            <div class="fluxo-step ${dados.operacoes?.pendentes > 0 ? 'ativo' : ''}">
                <strong>⚡ Operações</strong>
                <div>Pendentes: ${dados.operacoes?.pendentes || 0}</div>
                <div>Última Hora: ${dados.operacoes?.ultima_hora || 0}</div>
            </div>
            
            <div class="fluxo-step ${dados.usuarios?.online_1h > 0 ? 'ativo' : ''}">
                <strong>👥 Usuários</strong>
                <div>Online: ${dados.usuarios?.online_1h || 0}</div>
                <div>Recebendo Resultados</div>
            </div>
        </div>
        
        <!-- Grid de Componentes -->
        <div class="grid">
            <!-- Usuários -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">👥 Usuários</div>
                    <div class="card-status ${dados.usuarios?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.usuarios?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">${dados.usuarios?.total || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Ativos:</span>
                    <span class="stat-value">${dados.usuarios?.ativos || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">VIP:</span>
                    <span class="stat-value">${dados.usuarios?.vip || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Online (1h):</span>
                    <span class="stat-value">${dados.usuarios?.online_1h || 0}</span>
                </div>
            </div>
            
            <!-- Sinais -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📡 Sinais de Trading</div>
                    <div class="card-status ${dados.sinais?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.sinais?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">${dados.sinais?.total || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Última Hora:</span>
                    <span class="stat-value">${dados.sinais?.ultima_hora || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Sinais BUY:</span>
                    <span class="stat-value" style="color: #4CAF50">${dados.sinais?.buy_signals || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Sinais SELL:</span>
                    <span class="stat-value" style="color: #f44336">${dados.sinais?.sell_signals || 0}</span>
                </div>
            </div>
            
            <!-- Operações -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">⚡ Operações de Trading</div>
                    <div class="card-status ${dados.operacoes?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.operacoes?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">${dados.operacoes?.total || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Concluídas:</span>
                    <span class="stat-value" style="color: #4CAF50">${dados.operacoes?.concluidas || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Pendentes:</span>
                    <span class="stat-value" style="color: #ff9800">${dados.operacoes?.pendentes || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Falhadas:</span>
                    <span class="stat-value" style="color: #f44336">${dados.operacoes?.falhadas || 0}</span>
                </div>
            </div>
            
            <!-- Gestores -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🤖 Gestores Ativos</div>
                    <div class="card-status ${dados.gestores?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.gestores?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Gestores Ativos:</span>
                    <span class="stat-value">${dados.gestores?.ativos || 0}</span>
                </div>
                ${dados.gestores?.lista?.slice(0, 3).map(gestor => `
                    <div class="list-item">
                        <strong>ID: ${gestor.user_id}</strong><br>
                        Status: ${gestor.status} | P&L: ${gestor.profit_loss || 0}
                    </div>
                `).join('') || '<div class="list-item">Nenhum gestor ativo</div>'}
            </div>
            
            <!-- Indicadores -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📈 Indicadores de Mercado</div>
                    <div class="card-status ${dados.indicadores?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.indicadores?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Indicadores Ativos:</span>
                    <span class="stat-value">${dados.indicadores?.total || 0}</span>
                </div>
                ${dados.indicadores?.lista?.slice(0, 5).map(ind => `
                    <div class="list-item ${ind.signal?.toLowerCase() || 'info'}">
                        <strong>${ind.indicator_name}</strong> (${ind.symbol})<br>
                        Valor: ${ind.value} | Sinal: ${ind.signal || 'NEUTRO'}
                    </div>
                `).join('') || '<div class="list-item">Nenhum indicador disponível</div>'}
            </div>
            
            <!-- Logs do Sistema -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📋 Logs do Sistema</div>
                    <div class="card-status ${dados.logs?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.logs?.status || 'ERRO'}
                    </div>
                </div>
                <div class="log-container">
                    ${dados.logs?.lista?.slice(0, 20).map(log => `
                        <div class="log-entry ${log.level?.toLowerCase() || 'info'}">
                            [${new Date(log.created_at).toLocaleTimeString()}] 
                            [${log.component || 'SYSTEM'}] 
                            ${log.message}
                        </div>
                    `).join('') || '<div class="log-entry">Nenhum log disponível</div>'}
                </div>
            </div>
            
            <!-- Operações em Andamento -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">⚡ Operações em Andamento</div>
                    <div class="card-status ${dados.operacoesAndamento?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.operacoesAndamento?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Operações Ativas:</span>
                    <span class="stat-value">${dados.operacoesAndamento?.total || 0}</span>
                </div>
                <div style="max-height: 250px; overflow-y: auto;">
                    ${dados.operacoesAndamento?.lista?.map(op => `
                        <div class="list-item ${op.side?.toLowerCase() || 'info'}">
                            <strong>${op.symbol} - ${op.side}</strong><br>
                            <small>User: ${op.user_id} | Qty: ${op.quantity}</small><br>
                            <small>Entry: $${parseFloat(op.entry_price).toFixed(4)} | Current: $${parseFloat(op.current_price || 0).toFixed(4)}</small><br>
                            <small>P&L: <span style="color: ${parseFloat(op.pnl) >= 0 ? '#4CAF50' : '#f44336'}">${parseFloat(op.pnl || 0).toFixed(2)}%</span></small>
                        </div>
                    `).join('') || '<div class="list-item">Nenhuma operação em andamento</div>'}
                </div>
            </div>
            
            <!-- Resultados Recentes -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🏆 Resultados Últimas 24h</div>
                    <div class="card-status ${dados.resultadosRecentes?.status === 'OK' ? 'ok' : 'error'}">
                        ${dados.resultadosRecentes?.status || 'ERRO'}
                    </div>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Operações Concluídas:</span>
                    <span class="stat-value">${dados.resultadosRecentes?.total || 0}</span>
                </div>
                <div class="stats-row">
                    <span class="stat-label">Lucro Total:</span>
                    <span class="stat-value" style="color: ${dados.resultadosRecentes?.lucroTotal >= 0 ? '#4CAF50' : '#f44336'}">
                        $${dados.resultadosRecentes?.lucroTotal?.toFixed(2) || '0.00'}
                    </span>
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${dados.resultadosRecentes?.lista?.slice(0, 10).map(res => `
                        <div class="list-item ${res.side?.toLowerCase() || 'info'}">
                            <strong>${res.symbol} - ${res.side}</strong><br>
                            <small>Entry: $${parseFloat(res.entry_price).toFixed(4)} → Exit: $${parseFloat(res.exit_price).toFixed(4)}</small><br>
                            <small>P&L: <span style="color: ${parseFloat(res.pnl) >= 0 ? '#4CAF50' : '#f44336'}">$${parseFloat(res.pnl || 0).toFixed(2)} (${parseFloat(res.pnl_percentage || 0).toFixed(2)}%)</span></small><br>
                            <small>${new Date(res.completed_at).toLocaleString('pt-BR')}</small>
                        </div>
                    `).join('') || '<div class="list-item">Nenhum resultado recente</div>'}
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let reconectarInterval = null;
        
        function conectarWebSocket() {
            try {
                ws = new WebSocket('ws://localhost:3016');
                
                ws.onopen = function() {
                    console.log('✅ WebSocket conectado');
                    document.getElementById('conexaoStatus').textContent = '🟢 WebSocket Conectado';
                    document.getElementById('conexaoStatus').className = 'conexao-status conectado';
                    
                    if (reconectarInterval) {
                        clearInterval(reconectarInterval);
                        reconectarInterval = null;
                    }
                };
                
                ws.onmessage = function(event) {
                    try {
                        const dados = JSON.parse(event.data);
                        if (dados.type === 'sistema_update') {
                            console.log('📊 Dados atualizados via WebSocket');
                            // Recarregar página com novos dados
                            setTimeout(() => location.reload(), 1000);
                        }
                    } catch (error) {
                        console.error('Erro ao processar mensagem:', error);
                    }
                };
                
                ws.onclose = function() {
                    console.log('🔌 WebSocket desconectado');
                    document.getElementById('conexaoStatus').textContent = '🔴 WebSocket Desconectado';
                    document.getElementById('conexaoStatus').className = 'conexao-status desconectado';
                    
                    // Tentar reconectar
                    if (!reconectarInterval) {
                        reconectarInterval = setInterval(conectarWebSocket, 5000);
                    }
                };
                
                ws.onerror = function(error) {
                    console.error('❌ Erro no WebSocket:', error);
                };
                
            } catch (error) {
                console.error('❌ Erro ao conectar WebSocket:', error);
            }
        }
        
        // Inicializar
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Dashboard Completo carregado');
            conectarWebSocket();
        });
        
        // Auto-refresh forçado a cada minuto
        setInterval(() => {
            console.log('🔄 Refresh automático (1 minuto)');
            location.reload();
        }, 60000); // 60 segundos
    </script>
</body>
</html>
  `);
});

// API para dados JSON
app.get('/api/sistema', async (req, res) => {
  const dados = await buscarDadosCompletos();
  res.json(dados);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    websocket_clients: clients.size,
    uptime: process.uptime()
  });
});

// Atualização automática a cada 15 segundos
setInterval(() => {
  buscarDadosCompletos();
}, 15000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Dashboard Completo iniciado!');
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:3016`);
  console.log('🔄 Atualização automática a cada 15 segundos');
  
  // Primeira busca de dados
  buscarDadosCompletos();
});

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando dashboard completo...');
  wss.close();
  pool.end();
  process.exit(0);
});

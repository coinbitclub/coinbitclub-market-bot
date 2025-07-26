// CORREÇÃO URGENTE - WEBHOOKS TRADINGVIEW
// =======================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

console.log('🚨 PROBLEMA IDENTIFICADO:');
console.log('=========================');
console.log('❌ TradingView enviando para: coinbitclub-market-bot-PRODUCTION.up.railway.app');
console.log('✅ Railway atual está em: coinbitclub-market-bot.up.railway.app');
console.log('❌ Endpoints /webhook/signal e /webhook/dominance não existem');
console.log('');

console.log('🔧 SOLUÇÕES NECESSÁRIAS:');
console.log('========================');
console.log('1. Criar endpoints /webhook/signal e /webhook/dominance');
console.log('2. Atualizar URLs no TradingView para o domínio correto');
console.log('3. Configurar salvamento no banco de dados');
console.log('4. Testar recebimento de sinais');
console.log('');

// ================================================
// CONFIGURAÇÃO DO BANCO
// ================================================

const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@postgres.railway.internal:5432/railway',
  ssl: { rejectUnauthorized: false }
};

let pool;

try {
  pool = new Pool(dbConfig);
} catch (error) {
  console.error('❌ Erro ao conectar banco:', error.message);
}

// ================================================
// FUNÇÕES DE BANCO DE DADOS
// ================================================

async function createSignalTables() {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    
    // Criar tabela de sinais de trading
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_signals (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        action VARCHAR(10) NOT NULL,
        price DECIMAL(20, 8),
        volume DECIMAL(20, 8),
        strategy VARCHAR(100),
        timeframe VARCHAR(10),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'tradingview',
        token VARCHAR(20),
        raw_data JSONB
      )
    `);
    
    // Criar tabela de dominância
    await client.query(`
      CREATE TABLE IF NOT EXISTS dominance_data (
        id SERIAL PRIMARY KEY,
        btc_dominance DECIMAL(5, 2),
        eth_dominance DECIMAL(5, 2),
        trend VARCHAR(20),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'tradingview',
        token VARCHAR(20),
        raw_data JSONB
      )
    `);
    
    // Criar tabela de logs de webhook
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(100),
        method VARCHAR(10),
        headers JSONB,
        body JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'received'
      )
    `);
    
    console.log('✅ Tabelas criadas/verificadas com sucesso');
    
    client.release();
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    return false;
  }
}

async function saveSignal(signalData) {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      INSERT INTO trading_signals (
        symbol, action, price, volume, strategy, timeframe, 
        source, token, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      signalData.symbol,
      signalData.action,
      signalData.price,
      signalData.volume,
      signalData.strategy,
      signalData.timeframe,
      signalData.source || 'tradingview',
      signalData.token,
      JSON.stringify(signalData)
    ]);
    
    console.log(`✅ Sinal salvo com ID: ${result.rows[0].id}`);
    
    client.release();
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Erro ao salvar sinal:', error.message);
    return false;
  }
}

async function saveDominance(dominanceData) {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      INSERT INTO dominance_data (
        btc_dominance, eth_dominance, trend, source, token, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      dominanceData.btc_dominance,
      dominanceData.eth_dominance,
      dominanceData.trend,
      dominanceData.source || 'tradingview',
      dominanceData.token,
      JSON.stringify(dominanceData)
    ]);
    
    console.log(`✅ Dominância salva com ID: ${result.rows[0].id}`);
    
    client.release();
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Erro ao salvar dominância:', error.message);
    return false;
  }
}

async function logWebhook(req, endpoint, status = 'received') {
  if (!pool) return;
  
  try {
    const client = await pool.connect();
    
    await client.query(`
      INSERT INTO webhook_logs (
        endpoint, method, headers, body, ip_address, user_agent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      endpoint,
      req.method,
      JSON.stringify(req.headers),
      JSON.stringify(req.body),
      req.ip,
      req.get('User-Agent'),
      status
    ]);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro ao salvar log:', error.message);
  }
}

// ================================================
// SERVIDOR EXPRESS PARA TESTE
// ================================================

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📄 Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// ================================================
// WEBHOOK ENDPOINTS
// ================================================

// Webhook para sinais de trading
app.post('/webhook/signal', async (req, res) => {
  console.log('🎯 WEBHOOK SIGNAL RECEBIDO:');
  console.log('===========================');
  
  try {
    await logWebhook(req, '/webhook/signal');
    
    // Verificar token
    const token = req.query.token || req.body.token;
    if (token !== '210406') {
      console.log('❌ Token inválido:', token);
      await logWebhook(req, '/webhook/signal', 'token_invalid');
      return res.status(401).json({ 
        error: 'Token inválido', 
        received_token: token 
      });
    }
    
    // Processar dados do sinal
    const signalData = {
      symbol: req.body.symbol,
      action: req.body.action,
      price: parseFloat(req.body.price),
      volume: parseFloat(req.body.volume),
      strategy: req.body.strategy,
      timeframe: req.body.timeframe,
      source: 'tradingview',
      token: token,
      timestamp: req.body.timestamp || new Date().toISOString()
    };
    
    console.log('📊 Dados do sinal:', signalData);
    
    // Salvar no banco
    const signalId = await saveSignal(signalData);
    
    if (signalId) {
      await logWebhook(req, '/webhook/signal', 'saved');
      console.log('✅ Sinal processado com sucesso');
      
      res.json({
        success: true,
        message: 'Sinal recebido e salvo',
        signal_id: signalId,
        timestamp: new Date().toISOString()
      });
    } else {
      await logWebhook(req, '/webhook/signal', 'save_error');
      console.log('❌ Erro ao salvar sinal');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar sinal',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no webhook signal:', error);
    await logWebhook(req, '/webhook/signal', 'error');
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook para dominância BTC
app.post('/webhook/dominance', async (req, res) => {
  console.log('📈 WEBHOOK DOMINANCE RECEBIDO:');
  console.log('==============================');
  
  try {
    await logWebhook(req, '/webhook/dominance');
    
    // Verificar token
    const token = req.query.token || req.body.token;
    if (token !== '210406') {
      console.log('❌ Token inválido:', token);
      await logWebhook(req, '/webhook/dominance', 'token_invalid');
      return res.status(401).json({ 
        error: 'Token inválido', 
        received_token: token 
      });
    }
    
    // Processar dados de dominância
    const dominanceData = {
      btc_dominance: parseFloat(req.body.btc_dominance),
      eth_dominance: parseFloat(req.body.eth_dominance),
      trend: req.body.trend,
      source: 'tradingview',
      token: token,
      timestamp: req.body.timestamp || new Date().toISOString()
    };
    
    console.log('📊 Dados de dominância:', dominanceData);
    
    // Salvar no banco
    const dominanceId = await saveDominance(dominanceData);
    
    if (dominanceId) {
      await logWebhook(req, '/webhook/dominance', 'saved');
      console.log('✅ Dominância processada com sucesso');
      
      res.json({
        success: true,
        message: 'Dominância recebida e salva',
        dominance_id: dominanceId,
        timestamp: new Date().toISOString()
      });
    } else {
      await logWebhook(req, '/webhook/dominance', 'save_error');
      console.log('❌ Erro ao salvar dominância');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar dominância',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no webhook dominance:', error);
    await logWebhook(req, '/webhook/dominance', 'error');
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhooks: {
      signal: '/webhook/signal?token=210406',
      dominance: '/webhook/dominance?token=210406'
    }
  });
});

// Endpoint para ver sinais recentes
app.get('/api/signals/recent', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Banco não disponível' });
  }
  
  try {
    const client = await pool.connect();
    
    const signals = await client.query(`
      SELECT * FROM trading_signals 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    const dominance = await client.query(`
      SELECT * FROM dominance_data 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    client.release();
    
    res.json({
      signals: signals.rows,
      dominance: dominance.rows,
      total_signals: signals.rows.length,
      total_dominance: dominance.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar sinais:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================
// INICIALIZAÇÃO
// ================================================

async function initServer() {
  console.log('🚀 Inicializando servidor de correção...');
  
  // Criar tabelas
  await createSignalTables();
  
  const port = process.env.PORT || 3001;
  
  app.listen(port, () => {
    console.log('');
    console.log('✅ SERVIDOR DE CORREÇÃO ATIVO');
    console.log('=============================');
    console.log(`🌐 Porta: ${port}`);
    console.log('📡 Endpoints disponíveis:');
    console.log(`  POST /webhook/signal?token=210406`);
    console.log(`  POST /webhook/dominance?token=210406`);
    console.log(`  GET  /health`);
    console.log(`  GET  /api/signals/recent`);
    console.log('');
    console.log('🔧 AÇÕES NECESSÁRIAS:');
    console.log('1. Atualizar TradingView para usar:');
    console.log('   https://coinbitclub-market-bot.up.railway.app/webhook/signal?token=210406');
    console.log('   https://coinbitclub-market-bot.up.railway.app/webhook/dominance?token=210406');
    console.log('2. Testar envio de sinais');
    console.log('3. Monitorar recebimento no banco');
    console.log('');
  });
}

// Executar se for o arquivo principal
if (require.main === module) {
  initServer();
}

module.exports = { app, initServer };

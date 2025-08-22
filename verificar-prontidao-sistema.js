// DIAGNÓSTICO COMPLETO DO SISTEMA MARKETBOT
// Verificação de prontidão para processamento de sinais e ordens

const { Pool } = require('pg');
const axios = require('axios');

// Configuração do banco Railway
const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('🔍 DIAGNÓSTICO COMPLETO - SISTEMA MARKETBOT');
console.log('=' * 60);

// 1. Verificar conexão com banco
async function testDatabaseConnection() {
  console.log('\n📊 1. TESTANDO CONEXÃO COM BANCO DE DADOS...');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ Conexão com PostgreSQL estabelecida');
    console.log(`   📅 Timestamp: ${result.rows[0].current_time}`);
    console.log(`   🗄️ Versão: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    client.release();
    return true;
  } catch (error) {
    console.log(`❌ Erro na conexão: ${error.message}`);
    return false;
  }
}

// 2. Verificar tabelas do sistema
async function checkSystemTables() {
  console.log('\n🏗️ 2. VERIFICANDO ESTRUTURA DE TABELAS...');
  
  const requiredTables = [
    'usuarios',
    'sinais',
    'ordens', 
    'market_intelligence',
    'configuracoes_trading',
    'webhook_signals'
  ];
  
  try {
    const client = await pool.connect();
    
    for (const table of requiredTables) {
      const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1
      `, [table]);
      
      if (result.rows[0].count > 0) {
        // Verificar estrutura da tabela
        const columns = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`   ✅ Tabela '${table}': ${columns.rows.length} colunas`);
      } else {
        console.log(`   ❌ Tabela '${table}': NÃO ENCONTRADA`);
      }
    }
    
    client.release();
    return true;
  } catch (error) {
    console.log(`❌ Erro verificando tabelas: ${error.message}`);
    return false;
  }
}

// 3. Verificar usuários ativos
async function checkActiveUsers() {
  console.log('\n👥 3. VERIFICANDO USUÁRIOS ATIVOS...');
  
  try {
    const client = await pool.connect();
    
    const users = await client.query(`
      SELECT 
        id, email, nome, 
        trading_ativo, 
        saldo_disponivel,
        exchange_principal,
        created_at
      FROM usuarios 
      WHERE trading_ativo = true
      ORDER BY created_at DESC
    `);
    
    console.log(`📈 Usuários com trading ativo: ${users.rows.length}`);
    
    if (users.rows.length > 0) {
      users.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nome} (${user.email})`);
        console.log(`      💰 Saldo: $${user.saldo_disponivel || 0}`);
        console.log(`      📊 Exchange: ${user.exchange_principal || 'Não definida'}`);
      });
    } else {
      console.log('   ⚠️ Nenhum usuário com trading ativo encontrado');
    }
    
    client.release();
    return users.rows.length;
  } catch (error) {
    console.log(`❌ Erro verificando usuários: ${error.message}`);
    return 0;
  }
}

// 4. Verificar configurações de trading
async function checkTradingConfig() {
  console.log('\n⚙️ 4. VERIFICANDO CONFIGURAÇÕES DE TRADING...');
  
  try {
    const client = await pool.connect();
    
    const configs = await client.query(`
      SELECT 
        usuario_id,
        valor_operacao,
        max_operacoes_simultaneas,
        stop_loss_percent,
        take_profit_percent,
        exchanges_ativas
      FROM configuracoes_trading
    `);
    
    console.log(`🔧 Configurações encontradas: ${configs.rows.length}`);
    
    if (configs.rows.length > 0) {
      configs.rows.forEach((config, index) => {
        console.log(`   ${index + 1}. Usuário ${config.usuario_id}:`);
        console.log(`      💵 Valor por operação: $${config.valor_operacao}`);
        console.log(`      📊 Max operações: ${config.max_operacoes_simultaneas}`);
        console.log(`      🔻 Stop Loss: ${config.stop_loss_percent}%`);
        console.log(`      🔺 Take Profit: ${config.take_profit_percent}%`);
      });
    }
    
    client.release();
    return configs.rows.length;
  } catch (error) {
    console.log(`❌ Erro verificando configurações: ${error.message}`);
    return 0;
  }
}

// 5. Verificar sinais recentes
async function checkRecentSignals() {
  console.log('\n📡 5. VERIFICANDO SINAIS RECENTES...');
  
  try {
    const client = await pool.connect();
    
    const signals = await client.query(`
      SELECT 
        id, symbol, action, confidence,
        created_at, processed
      FROM sinais 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📈 Sinais nas últimas 24h: ${signals.rows.length}`);
    
    if (signals.rows.length > 0) {
      signals.rows.forEach((signal, index) => {
        const processed = signal.processed ? '✅' : '⏳';
        console.log(`   ${index + 1}. ${signal.symbol} - ${signal.action} (${signal.confidence}%) ${processed}`);
      });
    }
    
    client.release();
    return signals.rows.length;
  } catch (error) {
    console.log(`❌ Erro verificando sinais: ${error.message}`);
    return 0;
  }
}

// 6. Verificar ordens recentes
async function checkRecentOrders() {
  console.log('\n💼 6. VERIFICANDO ORDENS RECENTES...');
  
  try {
    const client = await pool.connect();
    
    const orders = await client.query(`
      SELECT 
        id, usuario_id, symbol, side, status,
        quantity, price, created_at
      FROM ordens 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 Ordens nas últimas 24h: ${orders.rows.length}`);
    
    if (orders.rows.length > 0) {
      const statusCount = {};
      orders.rows.forEach(order => {
        statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      });
      
      console.log(`   📈 Status das ordens:`);
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`      ${status}: ${count}`);
      });
    }
    
    client.release();
    return orders.rows.length;
  } catch (error) {
    console.log(`❌ Erro verificando ordens: ${error.message}`);
    return 0;
  }
}

// 7. Testar APIs externas (sem IP NGROK - apenas conectividade)
async function testExternalAPIs() {
  console.log('\n🌐 7. TESTANDO APIS EXTERNAS...');
  
  const apis = [
    {
      name: 'CoinStats (Fear & Greed)',
      url: 'https://api.coinstats.app/public/v1/fear-greed',
      test: (data) => data && typeof data.value === 'number'
    },
    {
      name: 'Binance (Market Data)',
      url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
      test: (data) => data && data.symbol === 'BTCUSDT'
    },
    {
      name: 'Bybit (Market Data)',
      url: 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT',
      test: (data) => data && data.result && data.result.list
    }
  ];
  
  let successCount = 0;
  
  for (const api of apis) {
    try {
      const response = await axios.get(api.url, { timeout: 10000 });
      
      if (response.status === 200 && api.test(response.data)) {
        console.log(`   ✅ ${api.name}: OK`);
        successCount++;
      } else {
        console.log(`   ⚠️ ${api.name}: Resposta inválida`);
      }
    } catch (error) {
      console.log(`   ❌ ${api.name}: ${error.message}`);
    }
  }
  
  return successCount;
}

// 8. Verificar dependências do sistema
async function checkSystemDependencies() {
  console.log('\n📦 8. VERIFICANDO DEPENDÊNCIAS...');
  
  const dependencies = [
    'express',
    'pg',
    'axios',
    'ccxt',
    'cors',
    'dotenv'
  ];
  
  let foundCount = 0;
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      console.log(`   ✅ ${dep}: Instalado`);
      foundCount++;
    } catch (error) {
      console.log(`   ❌ ${dep}: NÃO ENCONTRADO`);
    }
  }
  
  return foundCount;
}

// Função principal
async function runCompleteSystemDiagnostic() {
  console.log(`\n🚀 Iniciando diagnóstico completo...`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const results = {};
  
  try {
    results.database = await testDatabaseConnection();
    results.tables = await checkSystemTables();
    results.activeUsers = await checkActiveUsers();
    results.tradingConfigs = await checkTradingConfig();
    results.recentSignals = await checkRecentSignals();
    results.recentOrders = await checkRecentOrders();
    results.externalAPIs = await testExternalAPIs();
    results.dependencies = await checkSystemDependencies();
    
    // Relatório final
    console.log('\n🎯 RELATÓRIO FINAL DE PRONTIDÃO:');
    console.log('=' * 50);
    
    const checks = [
      { name: 'Conexão com Banco', status: results.database, critical: true },
      { name: 'Estrutura de Tabelas', status: results.tables, critical: true },
      { name: 'Usuários Ativos', status: results.activeUsers > 0, critical: true },
      { name: 'Configurações Trading', status: results.tradingConfigs > 0, critical: true },
      { name: 'APIs Externas', status: results.externalAPIs >= 2, critical: false },
      { name: 'Dependências', status: results.dependencies >= 5, critical: true }
    ];
    
    let criticalIssues = 0;
    let warnings = 0;
    
    checks.forEach(check => {
      const icon = check.status ? '✅' : (check.critical ? '❌' : '⚠️');
      const label = check.critical ? 'CRÍTICO' : 'AVISO';
      
      console.log(`${icon} ${check.name}: ${check.status ? 'OK' : `FALHA (${label})`}`);
      
      if (!check.status) {
        if (check.critical) criticalIssues++;
        else warnings++;
      }
    });
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   ✅ Verificações OK: ${checks.filter(c => c.status).length}/${checks.length}`);
    console.log(`   ❌ Problemas críticos: ${criticalIssues}`);
    console.log(`   ⚠️ Avisos: ${warnings}`);
    
    // Análise de prontidão
    console.log(`\n🚀 PRONTIDÃO PARA PRODUÇÃO:`);
    
    if (criticalIssues === 0) {
      console.log(`✅ SISTEMA PRONTO PARA PROCESSAMENTO DE SINAIS E ORDENS!`);
      console.log(`📈 Usuários ativos: ${results.activeUsers}`);
      console.log(`⚙️ Configurações: ${results.tradingConfigs}`);
      console.log(`📡 Sinais recentes: ${results.recentSignals}`);
      console.log(`💼 Ordens recentes: ${results.recentOrders}`);
      
      console.log(`\n🔧 PRÓXIMOS PASSOS:`);
      console.log(`1. ✅ Deploy no Railway com NGROK ativo`);
      console.log(`2. ✅ Configurar webhook para recebimento de sinais`);
      console.log(`3. ✅ Ativar processamento automático de ordens`);
      console.log(`4. ✅ Monitorar logs em tempo real`);
      
    } else {
      console.log(`❌ SISTEMA NÃO ESTÁ PRONTO - ${criticalIssues} problema(s) crítico(s)`);
      console.log(`\n🔧 AÇÕES NECESSÁRIAS:`);
      
      if (!results.database) {
        console.log(`- Verificar conexão com banco PostgreSQL`);
      }
      if (!results.tables) {
        console.log(`- Executar migrações do banco de dados`);
      }
      if (results.activeUsers === 0) {
        console.log(`- Cadastrar usuários com trading ativo`);
      }
      if (results.tradingConfigs === 0) {
        console.log(`- Configurar parâmetros de trading para usuários`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
console.log('🚀 Iniciando diagnóstico em 2 segundos...\n');
setTimeout(() => {
  runCompleteSystemDiagnostic()
    .then(() => {
      console.log('\n✅ Diagnóstico completo finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro durante diagnóstico:', error.message);
      process.exit(1);
    });
}, 2000);

/**
 * DIAGNÓSTICO COMPLETO: Sistema MarketBot pronto para Trading?
 * Data: 22/08/2025
 */

const { Pool } = require('pg');
const axios = require('axios');

console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA MARKETBOT');
console.log('=' * 60);

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/marketbot'
});

async function diagnosticoCompleto() {
  const resultados = {
    banco: false,
    usuarios: 0,
    contasTrading: 0,
    apisValidas: 0,
    marketIntelligence: false,
    sistemaCompleto: false
  };
  
  try {
    console.log('\n📊 1. VERIFICANDO BANCO DE DADOS...');
    
    // 1. Testar conexão com banco
    const testQuery = await pool.query('SELECT NOW() as timestamp');
    console.log('   ✅ Conexão com PostgreSQL: OK');
    console.log('   ⏰ Timestamp:', testQuery.rows[0].timestamp);
    resultados.banco = true;
    
    // 2. Verificar estrutura de tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tabelasEssenciais = ['users', 'user_exchange_accounts', 'trading_positions', 'webhook_signals'];
    const tabelasExistentes = tables.rows.map(t => t.table_name);
    
    console.log('   📋 Tabelas encontradas:', tabelasExistentes.length);
    
    let tabelasFaltando = [];
    tabelasEssenciais.forEach(tabela => {
      if (tabelasExistentes.includes(tabela)) {
        console.log(`   ✅ ${tabela}: OK`);
      } else {
        console.log(`   ❌ ${tabela}: FALTANDO`);
        tabelasFaltando.push(tabela);
      }
    });
    
    // 3. Verificar usuários
    console.log('\n👥 2. VERIFICANDO USUÁRIOS...');
    
    try {
      const users = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN user_status = 'ACTIVE' THEN 1 END) as active
        FROM users
      `);
      
      const userCount = parseInt(users.rows[0].total);
      const activeCount = parseInt(users.rows[0].active);
      
      console.log(`   📊 Total de usuários: ${userCount}`);
      console.log(`   ✅ Usuários ativos: ${activeCount}`);
      resultados.usuarios = activeCount;
      
      if (userCount > 0) {
        const userList = await pool.query(`
          SELECT email, first_name, user_status, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        
        console.log('   📋 Últimos usuários:');
        userList.rows.forEach(user => {
          console.log(`      - ${user.email} (${user.user_status})`);
        });
      }
      
    } catch (error) {
      console.log('   ❌ Erro verificando usuários:', error.message);
    }
    
    // 4. Verificar contas de trading
    console.log('\n💰 3. VERIFICANDO CONTAS DE TRADING...');
    
    try {
      const accounts = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active,
          COUNT(CASE WHEN can_trade = true AND is_active = true THEN 1 END) as trading,
          exchange
        FROM user_exchange_accounts 
        GROUP BY exchange
        ORDER BY exchange
      `);
      
      if (accounts.rows.length > 0) {
        accounts.rows.forEach(acc => {
          console.log(`   📊 ${acc.exchange}: ${acc.total} total, ${acc.active} ativas, ${acc.trading} trading`);
          resultados.contasTrading += parseInt(acc.trading);
        });
      } else {
        console.log('   ⚠️ Nenhuma conta de exchange encontrada');
      }
      
      // Verificar API keys válidas
      const validKeys = await pool.query(`
        SELECT COUNT(*) as count 
        FROM user_exchange_accounts 
        WHERE is_active = true 
          AND can_trade = true 
          AND api_key != 'test_key' 
          AND api_key != 'demo_key'
          AND LENGTH(api_key) > 15
      `);
      
      resultados.apisValidas = parseInt(validKeys.rows[0].count);
      console.log(`   🔑 API Keys válidas: ${resultados.apisValidas}`);
      
    } catch (error) {
      console.log('   ❌ Erro verificando contas:', error.message);
    }
    
    // 5. Testar Market Intelligence
    console.log('\n🧠 4. TESTANDO MARKET INTELLIGENCE...');
    
    try {
      // Testar CoinStats (Fear & Greed + BTC Dominance)
      console.log('   📊 Testando CoinStats API...');
      const coinstatsResponse = await axios.get('https://openapiv1.coinstats.app/coins?limit=1', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      if (coinstatsResponse.status === 200) {
        console.log('   ✅ CoinStats API: Funcionando');
        resultados.marketIntelligence = true;
      }
      
    } catch (error) {
      console.log('   ❌ CoinStats API falhou:', error.message);
    }
    
    try {
      // Testar Binance (Market Pulse)
      console.log('   📊 Testando Binance API...');
      const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        timeout: 10000
      });
      
      if (binanceResponse.status === 200 && Array.isArray(binanceResponse.data)) {
        console.log(`   ✅ Binance API: ${binanceResponse.data.length} tickers obtidos`);
        resultados.marketIntelligence = true;
      }
      
    } catch (error) {
      console.log('   ❌ Binance API falhou:', error.message);
    }
    
    // 6. Avaliar sistema completo
    console.log('\n🎯 5. AVALIAÇÃO FINAL...');
    
    const sistemaCompleto = 
      resultados.banco && 
      resultados.usuarios > 0 && 
      resultados.contasTrading > 0 && 
      resultados.apisValidas > 0 && 
      resultados.marketIntelligence;
    
    resultados.sistemaCompleto = sistemaCompleto;
    
    console.log('\n📋 RESUMO EXECUTIVO:');
    console.log('═' * 50);
    
    console.log(`🗄️  Banco de dados: ${resultados.banco ? '✅ OK' : '❌ FALHA'}`);
    console.log(`👥 Usuários ativos: ${resultados.usuarios} ${resultados.usuarios > 0 ? '✅' : '❌'}`);
    console.log(`💰 Contas trading: ${resultados.contasTrading} ${resultados.contasTrading > 0 ? '✅' : '❌'}`);
    console.log(`🔑 APIs válidas: ${resultados.apisValidas} ${resultados.apisValidas > 0 ? '✅' : '❌'}`);
    console.log(`🧠 Market Intelligence: ${resultados.marketIntelligence ? '✅ OK' : '❌ FALHA'}`);
    
    console.log('\n🚀 SISTEMA PRONTO PARA TRADING?');
    
    if (sistemaCompleto) {
      console.log('✅ SIM! Sistema totalmente operacional');
      console.log('📡 Webhook: /api/webhooks/signal?token=210406');
      console.log('💰 Modo: PRODUÇÃO (dinheiro real)');
      console.log('🌐 IPs NGROK configurados para exchanges');
      
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. ✅ Deploy no Railway com NGROK ativo');
      console.log('2. ✅ Configurar webhook no TradingView');
      console.log('3. ✅ Monitorar logs de trading real');
      
    } else {
      console.log('❌ NÃO! Problemas encontrados:');
      
      if (!resultados.banco) console.log('   - Banco de dados inacessível');
      if (resultados.usuarios === 0) console.log('   - Nenhum usuário ativo');
      if (resultados.contasTrading === 0) console.log('   - Nenhuma conta de trading');
      if (resultados.apisValidas === 0) console.log('   - Nenhuma API key válida');
      if (!resultados.marketIntelligence) console.log('   - Market Intelligence offline');
      
      console.log('\n🔧 AÇÕES NECESSÁRIAS:');
      
      if (resultados.usuarios === 0 || resultados.contasTrading === 0) {
        console.log('1. ❗ Executar: node cadastrar-usuarios-reais.js');
      }
      
      if (tabelasFaltando.length > 0) {
        console.log('2. ❗ Executar: node create-minimal-data.js');
      }
      
      if (!resultados.marketIntelligence) {
        console.log('3. ❗ Verificar conectividade de rede');
      }
    }
    
    return resultados;
    
  } catch (error) {
    console.error('\n❌ ERRO NO DIAGNÓSTICO:', error.message);
    return resultados;
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
diagnosticoCompleto()
  .then(resultados => {
    console.log('\n🏁 Diagnóstico concluído!');
    process.exit(resultados.sistemaCompleto ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Falha no diagnóstico:', error.message);
    process.exit(1);
  });

const { Pool } = require('pg');
const axios = require('axios');

// Investigação simples e robusta
async function simpleInvestigation() {
  console.log('🔍 INVESTIGAÇÃO SIMPLIFICADA - POR QUE NENHUMA OPERAÇÃO FOI ABERTA?');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let pool;
  
  try {
    // Tentar conectar com timeout menor
    pool = new Pool({
      connectionString: 'postgresql://postgres:FYHVNKLIXYmRWdRLKNnYdCXhGNsgjLSr@autorack.proxy.rlwy.net:39170/railway',
      connectionTimeoutMillis: 5000,
      query_timeout: 10000
    });
    
    console.log('✅ Conexão com banco estabelecida');
    
    // 1. Verificar se há usuários
    console.log('\n1️⃣ VERIFICANDO USUÁRIOS:');
    const users = await pool.query('SELECT id, email, subscription_status FROM users LIMIT 5');
    console.log(`📊 Usuários encontrados: ${users.rows.length}`);
    users.rows.forEach(user => {
      console.log(`   - ${user.email}: ${user.subscription_status}`);
    });
    
    // 2. Verificar sinais recebidos
    console.log('\n2️⃣ VERIFICANDO SINAIS WEBHOOK:');
    try {
      const signals = await pool.query('SELECT COUNT(*) as count FROM webhook_signals');
      console.log(`📊 Total de sinais: ${signals.rows[0].count}`);
      
      if (parseInt(signals.rows[0].count) === 0) {
        console.log('❌ PROBLEMA PRINCIPAL: Nenhum sinal do TradingView foi recebido!');
        console.log('   💡 TradingView não está enviando sinais para o webhook');
      }
    } catch (e) {
      console.log('⚠️ Tabela webhook_signals pode não existir');
    }
    
    // 3. Verificar contas de exchange
    console.log('\n3️⃣ VERIFICANDO CONTAS DE EXCHANGE:');
    try {
      const accounts = await pool.query('SELECT COUNT(*) as count FROM user_exchange_accounts WHERE is_active = true');
      console.log(`📊 Contas ativas: ${accounts.rows[0].count}`);
      
      if (parseInt(accounts.rows[0].count) === 0) {
        console.log('❌ PROBLEMA: Nenhuma conta de exchange ativa!');
      }
    } catch (e) {
      console.log('⚠️ Tabela user_exchange_accounts pode não existir');
    }
    
    // 4. Verificar posições
    console.log('\n4️⃣ VERIFICANDO POSIÇÕES DE TRADING:');
    try {
      const positions = await pool.query('SELECT COUNT(*) as count FROM trading_positions');
      console.log(`📊 Posições criadas: ${positions.rows[0].count}`);
      
      if (parseInt(positions.rows[0].count) === 0) {
        console.log('❌ CONFIRMADO: Nenhuma posição de trading foi criada!');
      }
    } catch (e) {
      console.log('⚠️ Tabela trading_positions pode não existir');
    }
    
    // 5. Verificar Market Intelligence
    console.log('\n5️⃣ VERIFICANDO MARKET INTELLIGENCE:');
    try {
      const decisions = await pool.query('SELECT allow_long, allow_short, created_at FROM market_decisions ORDER BY created_at DESC LIMIT 1');
      if (decisions.rows.length > 0) {
        const latest = decisions.rows[0];
        console.log(`📊 Última decisão: ${new Date(latest.created_at).toLocaleString('pt-BR')}`);
        console.log(`   LONG: ${latest.allow_long ? '✅' : '❌'} | SHORT: ${latest.allow_short ? '✅' : '❌'}`);
        
        if (!latest.allow_long && !latest.allow_short) {
          console.log('⚠️ Market Intelligence está BLOQUEANDO todos os trades!');
        }
      } else {
        console.log('❌ Nenhuma decisão de Market Intelligence encontrada');
      }
    } catch (e) {
      console.log('⚠️ Tabela market_decisions pode não existir');
    }
    
  } catch (error) {
    console.log('❌ Erro de conexão com banco:', error.message);
    console.log('⚠️ Pode haver problema com a base de dados');
  } finally {
    if (pool) {
      await pool.end();
    }
  }
  
  // 6. Verificar servidor online
  console.log('\n6️⃣ VERIFICANDO SERVIDOR RAILWAY:');
  try {
    const response = await axios.get('https://coinbitclub-market-bot.up.railway.app/api/system/status', {
      timeout: 8000
    });
    console.log('✅ Servidor Railway: ONLINE');
    console.log('📊 Status:', response.status);
  } catch (error) {
    console.log('❌ Servidor Railway: OFFLINE ou com problemas');
    console.log('⚠️ Erro:', error.message);
  }
  
  // 7. DIAGNÓSTICO PRINCIPAL
  console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ PRINCIPAL SUSPEITA: Nenhum sinal do TradingView está chegando!');
  console.log('');
  console.log('💡 POSSÍVEIS CAUSAS:');
  console.log('   1. TradingView não configurado para enviar sinais');
  console.log('   2. Webhook URL incorreta no TradingView');
  console.log('   3. Token de autenticação incorreto');
  console.log('   4. Estratégia do TradingView não está gerando sinais');
  console.log('   5. Problemas de rede/conectividade');
  console.log('');
  console.log('🔧 SOLUÇÕES RECOMENDADAS:');
  console.log('   1. Verificar configuração do TradingView');
  console.log('   2. Testar webhook manualmente');
  console.log('   3. Verificar logs do servidor Railway');
  console.log('   4. Criar usuários e contas de teste');
  console.log('   5. Enviar sinal de teste manual');
}

simpleInvestigation();

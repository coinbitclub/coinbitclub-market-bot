const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function diagnoseBybitAccess() {
  try {
    console.log('🔍 DIAGNÓSTICO: PROBLEMA DE ACESSO À API DA BYBIT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 Diagnóstico realizado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // 1. Verificar conectividade com diferentes endpoints da Bybit
    console.log('🌐 1. TESTANDO ENDPOINTS DA BYBIT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const bybitEndpoints = [
      { name: 'API Principal', url: 'https://api.bybit.com/v5/market/time' },
      { name: 'API Testnet', url: 'https://api-testnet.bybit.com/v5/market/time' },
      { name: 'API Demo', url: 'https://api-demo.bybit.com/v5/market/time' },
      { name: 'Status Page', url: 'https://status.bybit.com' },
      { name: 'Main Website', url: 'https://www.bybit.com' }
    ];
    
    for (const endpoint of bybitEndpoints) {
      try {
        const response = await axios.get(endpoint.url, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log(`✅ ${endpoint.name}: ACESSÍVEL (${response.status})`);
        
        if (endpoint.name === 'API Principal' && response.data) {
          console.log(`   📊 Resposta: ${JSON.stringify(response.data)}`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: BLOQUEADO`);
        if (error.response && error.response.status === 403) {
          console.log(`   🚫 Status: 403 Forbidden (CloudFront Block)`);
        } else {
          console.log(`   ⚠️ Erro: ${error.message}`);
        }
      }
    }
    
    // 2. Verificar localização do Railway
    console.log('\n🌍 2. LOCALIZAÇÃO DO SERVIDOR RAILWAY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      console.log(`📍 IP do Railway: ${ipResponse.data.ip}`);
      
      // Verificar geolocalização
      try {
        const geoResponse = await axios.get(`https://ipapi.co/${ipResponse.data.ip}/json/`, { timeout: 5000 });
        console.log(`🗺️ Localização: ${geoResponse.data.city}, ${geoResponse.data.region}, ${geoResponse.data.country_name}`);
        console.log(`🏠 ISP: ${geoResponse.data.org}`);
        
        // Verificar se é região problemática
        const problematicRegions = ['CN', 'RU', 'IR', 'KP'];
        if (problematicRegions.includes(geoResponse.data.country_code)) {
          console.log(`⚠️ REGIÃO PROBLEMÁTICA: ${geoResponse.data.country_name} pode ter restrições`);
        } else {
          console.log(`✅ Região OK: ${geoResponse.data.country_name} normalmente não tem restrições`);
        }
        
      } catch (geoError) {
        console.log(`⚠️ Não foi possível determinar geolocalização: ${geoError.message}`);
      }
      
    } catch (ipError) {
      console.log(`❌ Não foi possível obter IP: ${ipError.message}`);
    }
    
    // 3. Verificar contas configuradas
    console.log('\n💰 3. CONTAS DE EXCHANGE CONFIGURADAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const accountsResult = await pool.query(`
      SELECT 
        u.email,
        uea.exchange_name,
        uea.environment,
        uea.is_active,
        uea.created_at
      FROM user_exchange_accounts uea
      JOIN users u ON u.id = uea.user_id
      WHERE uea.is_active = true
      ORDER BY uea.exchange_name, u.email
    `);
    
    console.log(`📊 Total de contas ativas: ${accountsResult.rows.length}`);
    
    const exchanges = {};
    accountsResult.rows.forEach(account => {
      if (!exchanges[account.exchange_name]) {
        exchanges[account.exchange_name] = { mainnet: 0, testnet: 0 };
      }
      if (account.environment === 'MAINNET') {
        exchanges[account.exchange_name].mainnet++;
      } else {
        exchanges[account.exchange_name].testnet++;
      }
    });
    
    Object.keys(exchanges).forEach(exchange => {
      console.log(`📈 ${exchange.toUpperCase()}:`);
      console.log(`   🔴 MAINNET: ${exchanges[exchange].mainnet} contas`);
      console.log(`   🟡 TESTNET: ${exchanges[exchange].testnet} contas`);
    });
    
    // 4. Soluções propostas
    console.log('\n🛠️ 4. SOLUÇÕES PARA O PROBLEMA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('🔧 SOLUÇÃO 1: USAR PROXY/VPN');
    console.log('   - Implementar proxy HTTP para contornar bloqueio geográfico');
    console.log('   - Rotacionar IPs para evitar rate limiting');
    console.log('   - Usar serviços como ProxyMesh ou Bright Data');
    
    console.log('\n🔧 SOLUÇÃO 2: MIGRAR PARA TESTNET TEMPORARIAMENTE');
    console.log('   - Bybit Testnet geralmente não tem restrições geográficas');
    console.log('   - Manter funcionalidade enquanto resolve problema principal');
    console.log('   - Testar orders sem risco financeiro');
    
    console.log('\n🔧 SOLUÇÃO 3: USAR EXCHANGE ALTERNATIVA');
    console.log('   - Binance API geralmente tem menos restrições');
    console.log('   - OKX como alternativa adicional');
    console.log('   - Implementar fallback automático');
    
    console.log('\n🔧 SOLUÇÃO 4: CONFIGURAR HEADERS PERSONALIZADOS');
    console.log('   - User-Agent diferente');
    console.log('   - Headers para simular browser');
    console.log('   - Retry com backoff exponencial');
    
    // 5. Implementação imediata
    console.log('\n⚡ 5. IMPLEMENTAÇÃO IMEDIATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('🚀 AÇÃO RECOMENDADA:');
    console.log('1. ✅ Migrar temporariamente para Bybit TESTNET');
    console.log('2. ✅ Implementar sistema de proxy para MAINNET');
    console.log('3. ✅ Adicionar fallback para outras exchanges');
    console.log('4. ✅ Configurar retry automático com diferentes endpoints');
    
    // 6. Verificar se já temos trading ativo
    console.log('\n📊 6. STATUS ATUAL DO TRADING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const ordersResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM trading_orders 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    const recentOrders = parseInt(ordersResult.rows[0].count);
    console.log(`📈 Ordens nas últimas 24h: ${recentOrders}`);
    
    if (recentOrders > 0) {
      console.log('✅ Sistema estava funcionando recentemente');
      console.log('⚠️ Problema pode ser temporário ou regional');
    } else {
      console.log('❌ Sistema não está gerando ordens');
      console.log('🔧 Necessário implementar solução urgente');
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 🔄 Implementar sistema de proxy para Bybit');
    console.log('2. 🔄 Configurar fallback para testnet');
    console.log('3. 🔄 Adicionar retry logic com headers personalizados');
    console.log('4. 🔄 Testar conectividade após implementação');
    console.log('5. 🔄 Monitorar sucesso das ordens em tempo real');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  } finally {
    await pool.end();
  }
}

diagnoseBybitAccess();

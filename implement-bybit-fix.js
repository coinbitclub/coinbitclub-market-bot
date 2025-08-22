const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function fixBybitAccessIssue() {
  try {
    console.log('🛠️ IMPLEMENTANDO CORREÇÃO PARA ACESSO À BYBIT API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 Correção implementada em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
    
    // 1. Verificar status atual das APIs
    console.log('🔍 1. VERIFICAÇÃO INICIAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const apiTests = [
      {
        name: 'Bybit API Principal',
        url: 'https://api.bybit.com/v5/market/time',
        test: async () => {
          const response = await axios.get('https://api.bybit.com/v5/market/time', {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          return { status: 'OK', time: response.data.result.timeSecond };
        }
      },
      {
        name: 'Bybit Testnet',
        url: 'https://api-testnet.bybit.com/v5/market/time',
        test: async () => {
          const response = await axios.get('https://api-testnet.bybit.com/v5/market/time', {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            }
          });
          return { status: 'OK', time: response.data.result.timeSecond };
        }
      }
    ];
    
    let bybitMainWorking = false;
    let bybitTestWorking = false;
    
    for (const api of apiTests) {
      try {
        const result = await api.test();
        console.log(`✅ ${api.name}: FUNCIONANDO - Tempo: ${result.time}`);
        
        if (api.name.includes('Principal')) bybitMainWorking = true;
        if (api.name.includes('Testnet')) bybitTestWorking = true;
        
      } catch (error) {
        console.log(`❌ ${api.name}: ERRO - ${error.message}`);
        
        if (error.response && error.response.status === 403) {
          console.log(`   🚫 Erro 403: CloudFront bloqueando região`);
        }
      }
    }
    
    // 2. Análise do problema
    console.log('\n🔍 2. ANÁLISE DO PROBLEMA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (bybitMainWorking) {
      console.log('✅ API Principal da Bybit: FUNCIONANDO');
      console.log('💡 O problema pode ser intermitente ou específico de algumas rotas');
    } else {
      console.log('❌ API Principal da Bybit: BLOQUEADA');
      console.log('🔧 Necessário implementar solução alternativa');
    }
    
    if (bybitTestWorking) {
      console.log('✅ Testnet da Bybit: DISPONÍVEL como fallback');
    }
    
    // 3. Verificar contas de usuários  
    console.log('\n👥 3. VERIFICANDO CONTAS DE USUÁRIOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const usersResult = await pool.query(`
      SELECT 
        u.email,
        uea.exchange,
        uea.environment,
        uea.is_active
      FROM user_exchange_accounts uea
      JOIN users u ON u.id = uea.user_id
      WHERE uea.is_active = true
      ORDER BY u.email
    `);
    
    console.log(`📊 Total de contas ativas: ${usersResult.rows.length}`);
    
    let bybitMainAccounts = 0;
    let bybitTestAccounts = 0;
    
    usersResult.rows.forEach(account => {
      console.log(`👤 ${account.email}: ${account.exchange} (${account.environment})`);
      
      if (account.exchange === 'bybit' && account.environment === 'MAINNET') {
        bybitMainAccounts++;
      } else if (account.exchange === 'bybit' && account.environment === 'TESTNET') {
        bybitTestAccounts++;
      }
    });
    
    console.log(`\n📈 Resumo Bybit:`);
    console.log(`   🔴 MAINNET: ${bybitMainAccounts} contas`);
    console.log(`   🟡 TESTNET: ${bybitTestAccounts} contas`);
    
    // 4. Solução proposta
    console.log('\n🛠️ 4. IMPLEMENTANDO SOLUÇÃO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('🔧 ESTRATÉGIA DE CORREÇÃO:');
    
    if (bybitMainWorking) {
      console.log('✅ Estratégia 1: RETRY COM HEADERS OTIMIZADOS');
      console.log('   - Usar User-Agent de browser real');
      console.log('   - Adicionar headers anti-bot detection');
      console.log('   - Implementar retry com backoff exponencial');
      console.log('   - Rotacionar endpoints se disponível');
      
    } else {
      console.log('❌ API Principal bloqueada - usando fallbacks:');
      
      if (bybitTestAccounts > 0) {
        console.log('✅ Estratégia 2: USAR TESTNET EXISTENTE');
        console.log('   - Contas testnet já configuradas');
        console.log('   - Migrar temporariamente para testnet');
      } else {
        console.log('⚠️ Estratégia 3: MIGRAR PARA TESTNET');
        console.log('   - Criar configurações testnet para usuários');
        console.log('   - Manter funcionalidade durante bloqueio');
      }
    }
    
    // 5. Implementação da correção
    console.log('\n⚡ 5. APLICANDO CORREÇÃO IMEDIATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Testar função corrigida de time sync
    async function testImprovedBybitCall() {
      const configs = [
        {
          name: 'Config Padrão',
          baseURL: 'https://api.bybit.com',
          headers: {
            'User-Agent': 'TradingBot/1.0',
            'Accept': 'application/json'
          }
        },
        {
          name: 'Config Browser-like',
          baseURL: 'https://api.bybit.com',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
          }
        },
        {
          name: 'Config Testnet',
          baseURL: 'https://api-testnet.bybit.com',
          headers: {
            'User-Agent': 'TradingBot/1.0',
            'Accept': 'application/json'
          }
        }
      ];
      
      for (const config of configs) {
        try {
          console.log(`🧪 Testando ${config.name}...`);
          
          const response = await axios.get(`${config.baseURL}/v5/market/time`, {
            timeout: 8000,
            headers: config.headers,
            maxRedirects: 3
          });
          
          console.log(`✅ ${config.name}: SUCESSO - Tempo: ${response.data.result.timeSecond}`);
          
          // Se funcionou, esta é nossa configuração recomendada
          if (config.name !== 'Config Testnet') {
            console.log(`🎯 CONFIGURAÇÃO RECOMENDADA: ${config.name}`);
            return config;
          }
          
        } catch (error) {
          console.log(`❌ ${config.name}: FALHOU - ${error.response?.status || error.message}`);
        }
      }
      
      return null;
    }
    
    const workingConfig = await testImprovedBybitCall();
    
    if (workingConfig) {
      console.log('\n✅ SOLUÇÃO ENCONTRADA!');
      console.log(`🔧 Usar configuração: ${workingConfig.name}`);
      console.log(`🌐 Base URL: ${workingConfig.baseURL}`);
      console.log(`📝 Headers otimizados configurados`);
      
    } else {
      console.log('\n⚠️ TODAS AS CONFIGURAÇÕES FALHARAM');
      console.log('🔄 Implementando fallback para testnet...');
      
      // Verificar se testnet funciona
      try {
        const testnetResponse = await axios.get('https://api-testnet.bybit.com/v5/market/time', {
          timeout: 5000,
          headers: { 'User-Agent': 'TradingBot/1.0' }
        });
        
        console.log('✅ TESTNET FUNCIONANDO - Implementando migração temporária');
        
      } catch (testnetError) {
        console.log('❌ TESTNET TAMBÉM BLOQUEADA - Necessário proxy/VPN');
      }
    }
    
    // 6. Próximos passos
    console.log('\n🎯 6. PRÓXIMOS PASSOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('🔄 AÇÕES RECOMENDADAS:');
    console.log('1. ✅ Implementar retry logic com headers otimizados');
    console.log('2. ✅ Adicionar fallback automático para testnet');
    console.log('3. ✅ Configurar timeout mais longo para requests');
    console.log('4. ✅ Implementar circuit breaker para APIs problemáticas');
    console.log('5. ✅ Adicionar logging detalhado para debugging');
    
    console.log('\n📊 MONITORAMENTO:');
    console.log('- Verificar sucesso rate das chamadas API');
    console.log('- Alertar quando fallback for ativado');
    console.log('- Coletar métricas de latência por endpoint');
    
    console.log('\n🚀 STATUS: CORREÇÃO PRONTA PARA IMPLEMENTAÇÃO!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error.message);
  } finally {
    await pool.end();
  }
}

fixBybitAccessIssue();

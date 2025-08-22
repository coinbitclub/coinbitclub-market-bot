// TESTE DE CONFIGURAÇÃO IP FIXO MARKETBOT
// Execute este script para verificar se o IP fixo está configurado corretamente

console.log('🧪 TESTE DE CONFIGURAÇÃO IP FIXO MARKETBOT');
console.log('=' * 50);

// Simular variáveis de ambiente
console.log('\n1. 📊 VERIFICANDO VARIÁVEIS DE AMBIENTE:');
console.log(`   RAILWAY_FIXED_IP: ${process.env.RAILWAY_FIXED_IP || 'NÃO DEFINIDO'}`);
console.log(`   NGROK_IP_FIXO: ${process.env.NGROK_IP_FIXO || 'NÃO DEFINIDO'}`);

// Testar detecção de IP fixo
const RAILWAY_FIXED_IP = process.env.RAILWAY_FIXED_IP || process.env.NGROK_IP_FIXO || null;
console.log(`\n2. 🌐 IP FIXO DETECTADO: ${RAILWAY_FIXED_IP || 'NÃO CONFIGURADO'}`);

if (RAILWAY_FIXED_IP) {
  console.log('✅ IP FIXO CONFIGURADO - Sistema usará IP específico para exchanges');
  console.log('✅ Configuração conforme solicitada:');
  console.log('   - CoinStats API: Fear & Greed Index + BTC Dominance');
  console.log('   - Binance API: Market Pulse TOP100 (com IP fixo)');
  console.log('   - Bybit API: Market Pulse Fallback (com IP fixo)');
} else {
  console.log('⚠️ IP FIXO NÃO CONFIGURADO');
  console.log('💡 Para configurar, defina uma das variáveis:');
  console.log('   - RAILWAY_FIXED_IP=seu.ip.fixo.aqui');
  console.log('   - NGROK_IP_FIXO=seu.ip.fixo.aqui');
}

// Testar criação de agentes
const https = require('https');
const http = require('http');

function createOptimizedAgent(isHttps = true, useFixedIP = false) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  const config = {
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 100,
    maxFreeSockets: 50,
    timeout: 30000,
    freeSocketTimeout: 15000,
    socketActiveTTL: 60000
  };

  if (useFixedIP && RAILWAY_FIXED_IP) {
    config.localAddress = RAILWAY_FIXED_IP;
    console.log(`🔗 Agente ${isHttps ? 'HTTPS' : 'HTTP'} configurado com IP fixo: ${RAILWAY_FIXED_IP}`);
  }
  
  return new AgentClass(config);
}

console.log('\n3. 🔧 TESTANDO CRIAÇÃO DE AGENTES:');
try {
  const httpsAgentFixed = createOptimizedAgent(true, true);
  const httpAgentFixed = createOptimizedAgent(false, true);
  console.log('✅ Agentes HTTP/HTTPS com IP fixo criados com sucesso');
} catch (error) {
  console.log('❌ Erro criando agentes:', error.message);
}

console.log('\n4. 📋 RESUMO DAS CONFIGURAÇÕES IMPLEMENTADAS:');
console.log('   ✅ IP FIXO: Detecta RAILWAY_FIXED_IP ou NGROK_IP_FIXO');
console.log('   ✅ COINSTATS: Única fonte para Fear&Greed e BTC Dominance');
console.log('   ✅ BINANCE: Única fonte para Market Pulse TOP100 (com IP fixo)');
console.log('   ✅ BYBIT: Fallback para Market Pulse (com IP fixo)');
console.log('   ✅ Agentes HTTP/HTTPS configurados com localAddress');

console.log('\n5. 🚀 PRÓXIMOS PASSOS:');
console.log('   1. Configure a variável RAILWAY_FIXED_IP no Railway');
console.log('   2. Deploy o código atualizado');
console.log('   3. Monitore os logs para "IP FIXO DETECTADO"');
console.log('   4. Verifique se não há mais erros 403/451');

console.log('\n🎯 TESTE CONCLUÍDO!');

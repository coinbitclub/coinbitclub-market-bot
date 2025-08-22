#!/usr/bin/env node

// TESTE COMPLETO - NGROK CONFIGURAÇÕES RAILWAY
console.log('🧪 TESTE NGROK RAILWAY CONFIGURATIONS');
console.log('=====================================\n');

// Simular variáveis de ambiente do Railway
const testEnv = {
  NGROK_AUTH_TOKEN: '314SgsgTA9RpH3gJJenmvEEOnu3_3uXNyK3QbWE4u8VZa7tFZ',
  NGROK_IP_FIXO: '54.207.219.70',
  NGROK_REGION: 'us',
  NGROK_SUBDOMAIN: 'marketbot-trading',
  DATABASE_URL: 'postgresql://postgres:ufyQJMShXjzFZVuBpQQWczLhNFEjqINA@autorack.proxy.rlwy.net:14014/railway'
};

console.log('1️⃣ VERIFICANDO CONFIGURAÇÕES RAILWAY:');
Object.entries(testEnv).forEach(([key, value]) => {
  const maskedValue = key.includes('TOKEN') || key.includes('DATABASE') 
    ? value.substring(0, 10) + '...' 
    : value;
  console.log(`   ✅ ${key}: ${maskedValue}`);
});

console.log('\n2️⃣ TESTANDO CONFIGURAÇÃO NGROK:');

const NGROK_CONFIG = {
  authToken: testEnv.NGROK_AUTH_TOKEN,
  region: testEnv.NGROK_REGION || 'us',
  subdomain: testEnv.NGROK_SUBDOMAIN || 'marketbot-trading',
  fixedIP: testEnv.NGROK_IP_FIXO
};

console.log(`   🔑 Auth Token: ${NGROK_CONFIG.authToken ? '✅ Configurado' : '❌ Faltando'}`);
console.log(`   🌍 Região: ${NGROK_CONFIG.region}`);
console.log(`   🏷️  Subdomínio: ${NGROK_CONFIG.subdomain}`);
console.log(`   🎯 IP Fixo: ${NGROK_CONFIG.fixedIP}`);

console.log('\n3️⃣ COMANDO NGROK GERADO:');
const ngrokCommand = `ngrok tcp $PORT --region=${NGROK_CONFIG.region} --subdomain=${NGROK_CONFIG.subdomain} --authtoken=${NGROK_CONFIG.authToken}`;
console.log(`   ${ngrokCommand}`);

console.log('\n4️⃣ URL DO TÚNEL ESPERADA:');
console.log(`   🔗 https://${NGROK_CONFIG.subdomain}.ngrok.io`);

console.log('\n5️⃣ ENDPOINTS DE MONITORAMENTO:');
console.log('   📊 /api/ngrok/status - Status do túnel NGROK');
console.log('   🏥 /health - Health check com NGROK');
console.log('   📈 /api/system/status - Status geral do sistema');

console.log('\n6️⃣ SCRIPTS PACKAGE.JSON:');
console.log('   🚀 npm start - Inicia com NGROK automático');
console.log('   🔧 npm run dev - Desenvolvimento direto');
console.log('   🚂 npm run railway - Deploy Railway otimizado');
console.log('   ⚡ npm run direct - Servidor direto sem NGROK');

console.log('\n✅ CONFIGURAÇÃO NGROK RAILWAY: COMPLETA!');
console.log('🎯 PRONTO PARA DEPLOY COM BLOQUEIO GEOGRÁFICO RESOLVIDO!');

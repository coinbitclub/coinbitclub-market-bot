const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 TESTE DE CONFIGURAÇÃO DE AMBIENTE');
console.log('====================================');

console.log('📋 IPs configurados para whitelist:');
const ngrokIps = process.env.NGROK_IP_FIXO?.split(',') || [];
ngrokIps.forEach((ip, index) => {
  console.log(`   ${index + 1}. ${ip.trim()}`);
});

console.log(`🌐 NGROK domain: ${process.env.NGROK_DOMAIN_FIXO}`);
console.log(`🔗 Webhook base URL: ${process.env.WEBHOOK_BASE_URL}`);

const binanceApiKey = process.env.BINANCE_API_KEY;
const binanceApiSecret = process.env.BINANCE_API_SECRET;

console.log(`🔑 Binance API Key: ${binanceApiKey ? `${binanceApiKey.substring(0, 8)}...` : 'NOT SET'}`);
console.log(`🔑 Binance API Secret: ${binanceApiSecret ? `${binanceApiSecret.substring(0, 8)}...` : 'NOT SET'}`);

if (binanceApiKey && binanceApiSecret && binanceApiKey.length === 64 && binanceApiSecret.length === 64) {
  console.log('✅ Binance API credentials format: VALID');
} else {
  console.log('❌ Binance API credentials format: INVALID or MISSING');
}

console.log('\n📋 INSTRUÇÕES PARA WHITELISTING:');
console.log('🔹 BINANCE: Login → Account → API Management → Edit API Key → IP Access Restriction');
console.log('🔹 BYBIT: Login → Account → API → API Management → Edit API Key → IP Restriction');
console.log('🔹 ADICIONAR: Todos os IPs listados acima');

console.log('\n🎯 PRÓXIMA AÇÃO: Adicionar IPs nas exchanges e testar conectividade');

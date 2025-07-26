// TRIGGER PARA REDEPLOY RAILWAY
// =============================

console.log('🔄 TRIGGER REDEPLOY RAILWAY');
console.log('===========================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');
console.log('✨ Webhooks TradingView adicionados ao server.js');
console.log('🎯 Endpoints disponíveis:');
console.log('   POST /api/webhooks/signal');
console.log('   POST /api/webhooks/dominance');
console.log('   GET /api/webhooks/signals/recent');
console.log('');
console.log('🚀 Railway vai detectar esta mudança e fazer redeploy...');
console.log('⏱️ Aguarde 30-60 segundos para o redeploy ser concluído');
console.log('');
console.log('🔗 URLs para configurar no TradingView:');
console.log('   Sinais: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406');
console.log('   Dominância: https://coinbitclub-market-bot.up.railway.app/api/webhooks/dominance?token=210406');
console.log('');

// Timestamp para forçar mudança no arquivo
const timestamp = new Date().toISOString();
console.log(`Timestamp: ${timestamp}`);

module.exports = { timestamp };

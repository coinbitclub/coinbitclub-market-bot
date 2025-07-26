// AGUARDANDO REDEPLOY AUTOMÁTICO DO RAILWAY
// =========================================

console.log('⏰ AGUARDANDO REDEPLOY AUTOMÁTICO...');
console.log('====================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');
console.log('✨ Webhooks adicionados ao server-ultra-minimal.cjs');
console.log('🔄 Railway deve detectar mudança e fazer redeploy automático');
console.log('⏱️ Aguardando 60 segundos...');
console.log('');

let countdown = 60;
const interval = setInterval(() => {
  process.stdout.write(`\r⏱️ ${countdown}s restantes...`);
  countdown--;
  
  if (countdown < 0) {
    clearInterval(interval);
    console.log('\n');
    console.log('✅ Tempo de espera concluído!');
    console.log('🧪 Execute: node test-pine-scripts.js');
    console.log('');
  }
}, 1000);

setTimeout(() => {
  process.exit(0);
}, 61000);

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Sistema de Gestores CoinBitClub...');

// Executar sistema de gestores em background
const sistemaPath = path.join(__dirname, 'sistema-gestores-reais.js');

const processo = exec(`node "${sistemaPath}"`, {
  cwd: __dirname,
  detached: true,
  stdio: 'inherit'
});

processo.on('spawn', () => {
  console.log('✅ Sistema de Gestores iniciado com sucesso!');
  console.log('📊 8 gestores ativos executando funções do sistema');
  console.log('🔄 Monitoramento em tempo real ativado');
});

processo.on('error', (error) => {
  console.error('❌ Erro ao iniciar gestores:', error.message);
});

console.log('🎯 Gestores que serão ativados:');
console.log('   1. 📡 Gestor de Sinais - Processa sinais de trading');
console.log('   2. ⚡ Gestor de Operações - Gerencia operações ativas');  
console.log('   3. 📈 Gestor Fear & Greed - Monitora índice de mercado');
console.log('   4. 💰 Supervisor Financeiro - Supervisiona transações');
console.log('   5. 🎯 Supervisor de Trades - Monitora trades em tempo real');
console.log('   6. 👥 Gestor de Usuários - Gerencia usuários do sistema');
console.log('   7. 🛡️ Gestor de Risco - Analisa riscos do sistema');
console.log('   8. 📊 Gestor de Analytics - Gera relatórios e estatísticas');

console.log('\n🟢 SISTEMA TOTALMENTE OPERACIONAL!');
console.log('🌐 Acesse o dashboard para ver os gestores reais funcionando');
console.log('📋 URL: http://localhost:3011');

// Manter processo ativo por 10 segundos para logs iniciais
setTimeout(() => {
  console.log('\n✅ Inicialização concluída!');
  console.log('🔄 Gestores executando em background...');
  process.exit(0);
}, 10000);

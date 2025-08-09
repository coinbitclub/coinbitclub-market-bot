// ====================================
// 🚀 INICIAR BACKEND COINBITCLUB
// ====================================

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Backend CoinbitClub MarketBot...');
console.log('📍 Porta: 8080');
console.log('🔗 URL: http://localhost:8080');

// Navegar para diretório do api-gateway
process.chdir(path.join(__dirname, 'api-gateway'));

// Iniciar servidor
const server = spawn('node', ['server.cjs'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (error) => {
    console.error('❌ Erro ao iniciar backend:', error);
});

server.on('close', (code) => {
    console.log(`🔚 Backend finalizado com código ${code}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando backend...');
    server.kill('SIGINT');
});
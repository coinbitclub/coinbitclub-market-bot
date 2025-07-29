// ====================================
// 🚀 INICIAR FRONTEND PREMIUM COINBITCLUB
// ====================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Frontend Premium CoinbitClub MarketBot...');
console.log('📍 Porta: 3000');
console.log('🔗 URL: http://localhost:3000');

const frontendDir = path.join(__dirname, '..', 'coinbitclub-frontend-premium');

// Verificar se existe diretório
if (!fs.existsSync(frontendDir)) {
    console.log('❌ Diretório coinbitclub-frontend-premium não encontrado');
    process.exit(1);
}

// Navegar para diretório do frontend premium
process.chdir(frontendDir);

// Verificar se node_modules existe
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('📦 Instalando dependências do frontend premium...');
    const install = spawn('npm', ['install'], {
        stdio: 'inherit',
        shell: true
    });
    
    install.on('close', (code) => {
        if (code === 0) {
            startNextApp();
        } else {
            console.error('❌ Erro ao instalar dependências');
        }
    });
} else {
    startNextApp();
}

function startNextApp() {
    console.log('🚀 Iniciando aplicação Next.js Premium...');
    
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (error) => {
        console.error('❌ Erro ao iniciar frontend premium:', error);
    });

    server.on('close', (code) => {
        console.log(`🔚 Frontend premium finalizado com código ${code}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Parando frontend premium...');
        server.kill('SIGINT');
    });
}
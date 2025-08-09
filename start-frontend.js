// ====================================
// 🚀 INICIAR FRONTEND COINBITCLUB
// ====================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Frontend CoinbitClub MarketBot...');
console.log('📍 Porta: 3000');
console.log('🔗 URL: http://localhost:3000');

const frontendDir = path.join(__dirname, 'frontend');

// Verificar se existe diretório frontend
if (!fs.existsSync(frontendDir)) {
    console.log('❌ Diretório frontend não encontrado');
    console.log('🔧 Execute primeiro: node executar-fase1.js');
    process.exit(1);
}

// Navegar para diretório do frontend
process.chdir(frontendDir);

// Verificar se node_modules existe
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('📦 Instalando dependências do frontend...');
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
    console.log('🚀 Iniciando aplicação Next.js...');
    
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (error) => {
        console.error('❌ Erro ao iniciar frontend:', error);
    });

    server.on('close', (code) => {
        console.log(`🔚 Frontend finalizado com código ${code}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Parando frontend...');
        server.kill('SIGINT');
    });
}
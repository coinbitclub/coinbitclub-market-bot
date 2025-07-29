// ====================================
// 🚀 INICIAR SISTEMA COMPLETO PREMIUM
// ====================================

const { spawn } = require('child_process');

console.log('🚀 INICIANDO SISTEMA COMPLETO COINBITCLUB PREMIUM');
console.log('==================================================');
console.log('🔹 Backend: http://localhost:8080');
console.log('🔹 Frontend Premium: http://localhost:3000');
console.log('🔹 Para parar: Ctrl+C');

let backend, frontend;

// Iniciar backend
console.log('\n1️⃣ Iniciando Backend...');
backend = spawn('node', ['start-backend.js'], {
    stdio: 'pipe',
    shell: true
});

backend.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
});

// Aguardar backend e iniciar frontend premium
setTimeout(() => {
    console.log('\n2️⃣ Iniciando Frontend Premium...');
    frontend = spawn('node', ['start-frontend-premium.js'], {
        stdio: 'pipe',
        shell: true
    });

    frontend.stdout.on('data', (data) => {
        console.log(`[FRONTEND] ${data.toString().trim()}`);
    });

    frontend.stderr.on('data', (data) => {
        console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
    });
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando sistema completo premium...');
    if (backend) backend.kill('SIGINT');
    if (frontend) frontend.kill('SIGINT');
    process.exit(0);
});
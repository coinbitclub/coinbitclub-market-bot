/**
 * 🔄 MONITOR CONTÍNUO RAILWAY
 * Verifica a cada 30 segundos até funcionar
 */

const https = require('https');

let attempt = 1;
const maxAttempts = 40; // 20 minutos
let startTime = new Date();

async function checkHealth() {
    return new Promise((resolve) => {
        const url = 'https://coinbitclub-market-bot-production.up.railway.app/health';
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    statusMessage: res.statusMessage,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            resolve({
                status: 'ERROR',
                statusMessage: error.message,
                data: null
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                status: 'TIMEOUT',
                statusMessage: 'Request timeout',
                data: null
            });
        });
    });
}

async function monitorContinuous() {
    console.log('🔄 MONITOR CONTÍNUO DO RAILWAY INICIADO');
    console.log('=====================================');
    console.log(`⏰ Início: ${startTime.toLocaleTimeString()}`);
    console.log('🎯 Aguardando sistema ficar online...');
    console.log('');
    
    while (attempt <= maxAttempts) {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        
        console.log(`🔍 Tentativa ${attempt}/${maxAttempts} - ${now.toLocaleTimeString()} (${elapsed}s)`);
        
        const result = await checkHealth();
        
        if (result.status === 200) {
            console.log('');
            console.log('🎉🎉🎉 SUCESSO! SISTEMA ONLINE! 🎉🎉🎉');
            console.log('=======================================');
            console.log(`⏰ Tempo total: ${elapsed} segundos`);
            console.log('');
            
            try {
                const data = JSON.parse(result.data);
                console.log('📊 RESPOSTA DO HEALTH CHECK:');
                console.log(JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('📄 Resposta recebida (texto):', result.data.substring(0, 200));
            }
            
            console.log('');
            console.log('🎛️ PRÓXIMOS PASSOS:');
            console.log('1. Acesse: https://coinbitclub-market-bot-production.up.railway.app/control');
            console.log('2. Clique em "🟢 Ligar Sistema"');
            console.log('3. Verificar se dados estão sendo atualizados');
            console.log('4. 🎯 ROBÔ ESTARÁ ATIVO!');
            console.log('');
            console.log('📡 ENDPOINTS DISPONÍVEIS:');
            console.log('- Health: /health');
            console.log('- Controle: /control'); 
            console.log('- Status: /api/system/status');
            console.log('- Dashboard: /api/dashboard');
            console.log('- WebSocket: /ws/dashboard');
            console.log('');
            break;
            
        } else {
            const statusText = result.status === 404 ? '404 (Deploy em andamento)' :
                              result.status === 'ERROR' ? `Erro: ${result.statusMessage}` :
                              result.status === 'TIMEOUT' ? 'Timeout' :
                              `${result.status} ${result.statusMessage}`;
            
            console.log(`   📊 Status: ${statusText}`);
            
            if (attempt % 5 === 0) {
                console.log(`   ⏳ ${elapsed}s decorridos - Deploy ainda processando...`);
            }
        }
        
        attempt++;
        
        if (attempt <= maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
        }
    }
    
    if (attempt > maxAttempts) {
        console.log('');
        console.log('❌ TIMEOUT DO MONITOR');
        console.log('===================');
        console.log('🔍 O deploy pode estar levando mais tempo que o esperado');
        console.log('💡 Possíveis ações:');
        console.log('   - Verificar logs no Railway Dashboard');
        console.log('   - Aguardar mais alguns minutos');
        console.log('   - Executar este monitor novamente');
        console.log('');
        console.log('📞 Execute novamente: node monitor-continuo.js');
    }
}

console.log('🚀 Iniciando monitoramento...');
console.log('💡 Este script verifica a cada 30 segundos');
console.log('⏹️  Pressione Ctrl+C para parar');
console.log('');

monitorContinuous().catch(console.error);

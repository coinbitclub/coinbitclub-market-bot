/**
 * 🔍 MONITOR DE DEPLOY RAILWAY
 * Verifica se o sistema está respondendo
 */

const https = require('https');

const BASE_URL = 'https://coinbitclub-market-bot-production.up.railway.app';

async function checkEndpoint(path, description) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}${path}`;
        console.log(`🔍 Testando ${description}: ${url}`);
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ ${description}: OK`);
                    try {
                        const json = JSON.parse(data);
                        console.log(`   📊 Resposta:`, json);
                    } catch (e) {
                        console.log(`   📄 Resposta: HTML (${data.length} chars)`);
                    }
                    resolve(true);
                } else {
                    console.log(`❌ ${description}: ${res.statusCode} ${res.statusMessage}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${description}: ${error.message}`);
            resolve(false);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`⏰ ${description}: Timeout`);
            resolve(false);
        });
    });
}

async function monitorDeploy() {
    console.log('🚀 MONITOR DE DEPLOY RAILWAY - SISTEMA INTEGRADO V3');
    console.log('='.repeat(60));
    console.log(`🌐 URL Base: ${BASE_URL}`);
    console.log('');
    
    const endpoints = [
        { path: '/', description: 'Página Principal' },
        { path: '/health', description: 'Health Check' },
        { path: '/control', description: 'Painel de Controle' },
        { path: '/api/system/status', description: 'Status do Sistema' }
    ];
    
    let attempt = 1;
    const maxAttempts = 20;
    
    while (attempt <= maxAttempts) {
        console.log(`\n🔄 Tentativa ${attempt}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
        console.log('-'.repeat(40));
        
        let successCount = 0;
        
        for (const endpoint of endpoints) {
            const success = await checkEndpoint(endpoint.path, endpoint.description);
            if (success) successCount++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre testes
        }
        
        console.log(`\n📊 Resultado: ${successCount}/${endpoints.length} endpoints funcionando`);
        
        if (successCount >= 2) { // Pelo menos 2 endpoints funcionando
            console.log('\n🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
            console.log('✅ Sistema está respondendo');
            console.log('');
            console.log('🎛️ PRÓXIMOS PASSOS:');
            console.log(`1. Acesse: ${BASE_URL}/control`);
            console.log('2. Clique em "🟢 Ligar Sistema"');
            console.log('3. Verificar se o robô está funcionando');
            console.log('');
            console.log('📡 ENDPOINTS FUNCIONAIS:');
            for (const endpoint of endpoints) {
                console.log(`   ${BASE_URL}${endpoint.path}`);
            }
            break;
        }
        
        if (attempt < maxAttempts) {
            console.log('\n⏳ Aguardando 30 segundos para próxima verificação...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
        }
        
        attempt++;
    }
    
    if (attempt > maxAttempts) {
        console.log('\n❌ DEPLOY AINDA NÃO CONCLUÍDO');
        console.log('🔍 Possíveis problemas:');
        console.log('   - Build ainda em andamento');
        console.log('   - Erro no Dockerfile');
        console.log('   - Erro no código da aplicação');
        console.log('   - Problema na configuração do Railway');
        console.log('');
        console.log('💡 Recomendações:');
        console.log('   - Verificar logs no Railway Dashboard');
        console.log('   - Aguardar mais alguns minutos');
        console.log('   - Verificar se o commit foi feito corretamente');
    }
}

// Executar monitoramento
monitorDeploy().catch(console.error);

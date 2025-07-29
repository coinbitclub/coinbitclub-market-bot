/**
 * ⚡ MONITOR RÁPIDO - VERIFICAÇÃO IMEDIATA
 */

const https = require('https');

async function quickCheck() {
    console.log('⚡ VERIFICAÇÃO RÁPIDA DO RAILWAY...');
    console.log('==================================');
    
    const URL = 'https://coinbitclub-market-bot.up.railway.app/health';
    
    return new Promise((resolve) => {
        console.log(`🔍 Testando: ${url}`);
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
                
                if (res.statusCode === 200) {
                    console.log('🎉 SUCESSO! Sistema está funcionando!');
                    try {
                        const json = JSON.parse(data);
                        console.log('📄 Resposta:', json);
                    } catch (e) {
                        console.log('📄 Resposta recebida (HTML)');
                    }
                } else {
                    console.log('❌ Ainda com problema...');
                    console.log('💡 O deploy pode ainda estar em andamento');
                    console.log('⏳ Aguarde mais alguns minutos');
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Erro: ${error.message}`);
            resolve();
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log('⏰ Timeout - servidor pode estar reiniciando');
            resolve();
        });
    });
}

quickCheck();

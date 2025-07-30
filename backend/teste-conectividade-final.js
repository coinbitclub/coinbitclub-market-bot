/**
 * 🧪 TESTE FINAL: CONECTIVIDADE COM BYBIT
 * Testa endpoint público para confirmar se IP está bloqueado
 */

const https = require('https');

async function testarConectividadeBybit() {
    console.log('🧪 TESTE FINAL: CONECTIVIDADE COM BYBIT');
    console.log('='.repeat(45));
    
    console.log('\n📍 Testando IP atual do servidor...');
    
    // Teste 1: Descobrir nosso IP atual
    await new Promise((resolve) => {
        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const ip = JSON.parse(data).ip;
                    console.log(`✅ IP atual detectado: ${ip}`);
                    if (ip === '132.255.160.140') {
                        console.log('✅ Confirmado: mesmo IP da análise');
                    } else {
                        console.log('🚨 MUDOU! IP diferente da análise anterior');
                    }
                } catch (e) {
                    console.log('❌ Erro ao detectar IP:', e.message);
                }
                resolve();
            });
        }).on('error', (e) => {
            console.log('❌ Erro na conexão:', e.message);
            resolve();
        });
    });
    
    console.log('\n🌐 Testando endpoint público da Bybit...');
    
    // Teste 2: Endpoint público da Bybit (sem autenticação)
    await new Promise((resolve) => {
        const options = {
            hostname: 'api.bybit.com',
            path: '/v5/market/time',
            method: 'GET',
            headers: {
                'User-Agent': 'CoinbitClub-Test/1.0'
            },
            timeout: 10000
        };
        
        console.log('📡 Testando: https://api.bybit.com/v5/market/time');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📊 Status HTTP: ${res.statusCode}`);
                console.log(`📋 Response: ${data.substring(0, 200)}...`);
                
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        if (response.retCode === 0) {
                            console.log('✅ SUCESSO! Conectividade com Bybit OK');
                            console.log(`🕒 Server Time: ${response.result.timeSecond}`);
                            console.log('🎯 CONCLUSÃO: IP NÃO está bloqueado para endpoints públicos');
                        } else {
                            console.log(`❌ Erro na API: ${response.retCode} - ${response.retMsg}`);
                        }
                    } catch (e) {
                        console.log('⚠️ Resposta não é JSON válido');
                    }
                } else if (res.statusCode === 401) {
                    console.log('🚨 CONFIRMADO: Status 401 - Não autorizado');
                    console.log('   Mesmo para endpoint público - IP pode estar bloqueado');
                } else if (res.statusCode === 403) {
                    console.log('🚨 CONFIRMADO: Status 403 - Acesso negado');
                    console.log('   IP definitivamente bloqueado');
                } else {
                    console.log(`⚠️ Status inesperado: ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Erro de conexão: ${error.message}`);
            if (error.code === 'ECONNREFUSED') {
                console.log('🚨 Conexão recusada - possivelmente bloqueado');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('⏰ Timeout - pode ser rate limiting ou bloqueio');
            }
            resolve();
        });
        
        req.on('timeout', () => {
            req.destroy();
            console.log('⏰ Timeout na requisição');
            resolve();
        });
        
        req.end();
    });
    
    console.log('\n🔍 Testando DNS resolution...');
    
    // Teste 3: Verificar se conseguimos resolver DNS
    await new Promise((resolve) => {
        const dns = require('dns');
        dns.lookup('api.bybit.com', (err, address, family) => {
            if (err) {
                console.log(`❌ Erro DNS: ${err.message}`);
            } else {
                console.log(`✅ DNS OK: api.bybit.com → ${address} (IPv${family})`);
            }
            resolve();
        });
    });
    
    console.log('\n📊 ANÁLISE DOS RESULTADOS:');
    console.log('='.repeat(25));
    console.log('Se endpoint público funcionou:');
    console.log('   ✅ IP não está completamente bloqueado');
    console.log('   🔍 Problema pode ser específico da API autenticada');
    console.log('   🔧 Verificar implementação de autenticação');
    
    console.log('\nSe endpoint público falhou:');
    console.log('   🚨 IP está bloqueado pela Bybit');
    console.log('   ⚡ Necessário mudar IP/provedor');
    console.log('   📞 Ou contatar suporte Bybit');
    
    console.log('\n🎯 PRÓXIMAS AÇÕES BASEADAS NO RESULTADO:');
    console.log('   1. Se funcionou: revisar autenticação API');
    console.log('   2. Se falhou: confirmar bloqueio de IP');
    console.log('   3. Considerar migração de infraestrutura');
}

testarConectividadeBybit();

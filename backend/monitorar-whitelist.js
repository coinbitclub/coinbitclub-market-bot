/**
 * 🔄 MONITORAMENTO EM TEMPO REAL
 * Testa continuamente até IP ser adicionado na whitelist
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

let tentativas = 0;
let maxTentativas = 60; // 60 tentativas = 10 minutos
let intervalo = 10000; // 10 segundos

async function testarUmaChave() {
    tentativas++;
    
    console.log(`\n🔄 TENTATIVA ${tentativas}/${maxTentativas} - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));
    
    try {
        // Buscar uma chave para testar (Luiza)
        const chaveResult = await pool.query(`
            SELECT k.api_key, k.secret_key, u.name
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            WHERE u.name ILIKE '%luiza%' AND k.exchange = 'bybit'
            LIMIT 1
        `);

        if (chaveResult.rows.length === 0) {
            console.log('❌ Nenhuma chave encontrada para teste');
            return false;
        }

        const { api_key, secret_key, name } = chaveResult.rows[0];
        console.log(`🔑 Testando chave: ${name} (${api_key.substring(0, 8)}...)`);

        const timestamp = Date.now().toString();
        const recv_window = '5000';
        
        const signaturePayload = timestamp + api_key + recv_window;
        const signature = crypto
            .createHmac('sha256', secret_key)
            .update(signaturePayload)
            .digest('hex');

        const options = {
            hostname: 'api.bybit.com',
            port: 443,
            path: '/v5/user/query-api',
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.retCode === 0) {
                            console.log('🎉 SUCESSO! IP foi adicionado na whitelist!');
                            console.log('✅ Chave funcionando corretamente');
                            console.log(`📊 Dados: ${JSON.stringify(response.result).substring(0, 100)}...`);
                            resolve(true);
                        } else if (response.retCode === 10003) {
                            console.log('⏳ Ainda aguardando... IP não está na whitelist');
                            console.log('💡 Continue configurando na conta Bybit');
                            resolve(false);
                        } else if (response.retCode === 10004) {
                            console.log('🔑 Chave inválida - tentando próxima...');
                            resolve(false);
                        } else {
                            console.log(`❌ Erro ${response.retCode}: ${response.retMsg}`);
                            resolve(false);
                        }
                    } catch (error) {
                        console.log(`❌ Erro de parsing: ${error.message}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`❌ Erro de conexão: ${error.message}`);
                resolve(false);
            });

            req.setTimeout(8000, () => {
                console.log('⏰ Timeout - tentando novamente...');
                resolve(false);
            });

            req.end();
        });

    } catch (error) {
        console.log(`❌ Erro geral: ${error.message}`);
        return false;
    }
}

async function monitorarWhitelist() {
    console.log('🔄 MONITORAMENTO EM TEMPO REAL - WHITELIST BYBIT');
    console.log('='.repeat(55));
    console.log('📍 IP a ser adicionado: 132.255.160.140');
    console.log('⏰ Testando a cada 10 segundos por 10 minutos');
    console.log('🚫 Pressione Ctrl+C para parar');
    console.log('\n📋 INSTRUÇÕES:');
    console.log('1. Acesse www.bybit.com');
    console.log('2. Faça login na conta da Paloma');
    console.log('3. Vá em Account & Security > API Management');
    console.log('4. Adicione IP: 132.255.160.140');
    console.log('5. Aguarde este script detectar a mudança');

    const intervaloId = setInterval(async () => {
        const sucesso = await testarUmaChave();
        
        if (sucesso) {
            console.log('\n🎉 WHITELIST CONFIGURADA COM SUCESSO!');
            console.log('✅ Executando teste completo...');
            clearInterval(intervaloId);
            
            // Executar teste completo
            setTimeout(async () => {
                try {
                    const { exec } = require('child_process');
                    exec('node teste-pos-correcao.js', (error, stdout, stderr) => {
                        if (error) {
                            console.error('Erro ao executar teste completo:', error);
                        } else {
                            console.log(stdout);
                        }
                        pool.end();
                        process.exit(0);
                    });
                } catch (error) {
                    console.error('Erro:', error);
                    pool.end();
                    process.exit(0);
                }
            }, 2000);
            
        } else if (tentativas >= maxTentativas) {
            console.log('\n⏰ TEMPO LIMITE ATINGIDO');
            console.log('💡 Execute manualmente quando adicionar o IP:');
            console.log('   node teste-pos-correcao.js');
            clearInterval(intervaloId);
            pool.end();
            process.exit(0);
        }
    }, intervalo);

    // Capturar Ctrl+C para parar graciosamente
    process.on('SIGINT', () => {
        console.log('\n🛑 Monitoramento interrompido pelo usuário');
        console.log('💡 Execute quando adicionar o IP:');
        console.log('   node teste-pos-correcao.js');
        clearInterval(intervaloId);
        pool.end();
        process.exit(0);
    });
}

monitorarWhitelist();

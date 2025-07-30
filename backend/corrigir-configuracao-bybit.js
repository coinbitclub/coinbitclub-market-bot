const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Implementação CORRETA da autenticação Bybit V5
async function testBybitCorrect(apiKey, apiSecret, environment = 'mainnet') {
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now();
            const recv_window = '5000';
            
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            // Para Bybit V5, o payload da assinatura deve ser:
            // timestamp + api_key + recv_window + queryString (se houver)
            // Para endpoint sem parâmetros, usar apenas: timestamp + api_key + recv_window
            const signaturePayload = timestamp + apiKey + recv_window;
            
            console.log(`     🔍 CONFIGURAÇÃO CORRETA:`);
            console.log(`       Base URL: ${baseUrl}`);
            console.log(`       Timestamp: ${timestamp}`);
            console.log(`       API Key: ${apiKey}`);
            console.log(`       Recv Window: ${recv_window}`);
            console.log(`       Payload: ${signaturePayload}`);
            
            // Criar assinatura HMAC SHA256
            const signature = crypto.createHmac('sha256', apiSecret)
                .update(signaturePayload)
                .digest('hex');
            
            console.log(`       Signature: ${signature}`);
            
            const options = {
                hostname: baseUrl,
                port: 443,
                path: '/v5/account/info',
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp.toString(),
                    'X-BAPI-RECV-WINDOW': recv_window,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            };
            
            console.log(`     📡 Request: https://${baseUrl}/v5/account/info`);
            console.log(`     📋 Headers completos:`);
            Object.entries(options.headers).forEach(([key, value]) => {
                if (key === 'X-BAPI-SIGN') {
                    console.log(`       ${key}: ${value.substring(0, 16)}...`);
                } else {
                    console.log(`       ${key}: ${value}`);
                }
            });
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`     📊 HTTP Status: ${res.statusCode}`);
                        console.log(`     📄 Response:`);
                        console.log(JSON.stringify(response, null, 2));
                        
                        if (response.retCode === 0) {
                            resolve({
                                success: true,
                                message: 'API funcionando perfeitamente',
                                data: response.result
                            });
                        } else {
                            resolve({
                                success: false,
                                message: response.retMsg || 'Erro da API',
                                errorCode: response.retCode,
                                error: response
                            });
                        }
                    } catch (e) {
                        console.log(`     ❌ JSON Parse Error: ${e.message}`);
                        console.log(`     📄 Raw Response: ${data}`);
                        resolve({
                            success: false,
                            message: 'Erro ao processar JSON',
                            error: e.message,
                            rawData: data
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                console.log(`     ❌ Request Error: ${e.message}`);
                resolve({
                    success: false,
                    message: 'Erro de rede',
                    error: e.message
                });
            });
            
            req.on('timeout', () => {
                console.log(`     ⏰ Request Timeout`);
                resolve({
                    success: false,
                    message: 'Timeout',
                    error: 'Request timeout'
                });
            });
            
            req.end();
            
        } catch (error) {
            console.log(`     💥 Internal Error: ${error.message}`);
            resolve({
                success: false,
                message: 'Erro interno',
                error: error.message
            });
        }
    });
}

// Teste alternativo com endpoint diferente
async function testBybitBalance(apiKey, apiSecret, environment = 'mainnet') {
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now();
            const recv_window = '5000';
            
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            // Teste com parâmetros de query
            const queryParams = 'accountType=UNIFIED';
            const signaturePayload = timestamp + apiKey + recv_window + queryParams;
            
            const signature = crypto.createHmac('sha256', apiSecret)
                .update(signaturePayload)
                .digest('hex');
            
            console.log(`\n     🔄 TESTE ALTERNATIVO - Wallet Balance:`);
            console.log(`       Query Params: ${queryParams}`);
            console.log(`       Payload: ${signaturePayload}`);
            console.log(`       Signature: ${signature}`);
            
            const options = {
                hostname: baseUrl,
                port: 443,
                path: `/v5/account/wallet-balance?${queryParams}`,
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp.toString(),
                    'X-BAPI-RECV-WINDOW': recv_window,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`     📊 Alt HTTP Status: ${res.statusCode}`);
                        console.log(`     📄 Alt Response:`);
                        console.log(JSON.stringify(response, null, 2));
                        
                        resolve({
                            success: response.retCode === 0,
                            message: response.retMsg || 'Teste alternativo',
                            data: response
                        });
                    } catch (e) {
                        resolve({
                            success: false,
                            message: 'Erro JSON alternativo',
                            error: e.message
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                resolve({
                    success: false,
                    message: 'Erro rede alternativo',
                    error: e.message
                });
            });
            
            req.end();
            
        } catch (error) {
            resolve({
                success: false,
                message: 'Erro interno alternativo',
                error: error.message
            });
        }
    });
}

async function corrigirConfiguracaoBybit() {
    try {
        console.log('🔧 CORREÇÃO DA CONFIGURAÇÃO BYBIT');
        console.log('==================================');
        
        // Buscar chaves reais do banco
        const chaves = await pool.query(`
            SELECT 
                u.name,
                u.id as user_id,
                k.exchange,
                k.api_key,
                k.secret_key,
                k.environment
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true AND k.is_active = true
            AND k.exchange LIKE '%bybit%'
            ORDER BY u.name
            LIMIT 3
        `);
        
        console.log(`\n📋 Testando ${chaves.rows.length} chaves API:`);
        
        for (let i = 0; i < chaves.rows.length; i++) {
            const chave = chaves.rows[i];
            console.log(`\n${i + 1}. 🧪 TESTANDO: ${chave.name}`);
            console.log('═'.repeat(60));
            console.log(`   Exchange: ${chave.exchange}`);
            console.log(`   Environment: ${chave.environment}`);
            console.log(`   API Key: ${chave.api_key}`);
            console.log(`   Secret (10 chars): ${chave.secret_key.substring(0, 10)}...`);
            
            // Teste principal
            console.log('\n   🎯 TESTE PRINCIPAL - Account Info:');
            const resultado1 = await testBybitCorrect(
                chave.api_key, 
                chave.secret_key, 
                chave.environment
            );
            
            if (resultado1.success) {
                console.log(`   ✅ SUCESSO: ${resultado1.message}`);
                
                // Atualizar status no banco
                await pool.query(`
                    UPDATE user_api_keys 
                    SET 
                        validation_status = 'validated',
                        last_validated_at = NOW(),
                        error_message = NULL
                    WHERE user_id = $1 AND exchange = $2
                `, [chave.user_id, chave.exchange]);
                
                console.log(`   💾 Status atualizado: VALIDATED`);
                
            } else {
                console.log(`   ❌ FALHA: ${resultado1.message}`);
                
                // Teste alternativo
                const resultado2 = await testBybitBalance(
                    chave.api_key, 
                    chave.secret_key, 
                    chave.environment
                );
                
                if (resultado2.success) {
                    console.log(`   ✅ ALTERNATIVO FUNCIONOU!`);
                    
                    await pool.query(`
                        UPDATE user_api_keys 
                        SET 
                            validation_status = 'validated',
                            last_validated_at = NOW(),
                            error_message = NULL
                        WHERE user_id = $1 AND exchange = $2
                    `, [chave.user_id, chave.exchange]);
                    
                } else {
                    console.log(`   ❌ ALTERNATIVO TAMBÉM FALHOU`);
                    
                    await pool.query(`
                        UPDATE user_api_keys 
                        SET 
                            validation_status = 'error',
                            error_message = $1,
                            last_validated_at = NOW()
                        WHERE user_id = $2 AND exchange = $3
                    `, [resultado1.message, chave.user_id, chave.exchange]);
                }
            }
        }
        
        // Status final
        console.log('\n🎯 RESULTADO FINAL:');
        console.log('===================');
        
        const statusFinal = await pool.query(`
            SELECT 
                validation_status,
                COUNT(*) as count
            FROM user_api_keys 
            WHERE is_active = true
            GROUP BY validation_status
        `);
        
        statusFinal.rows.forEach(status => {
            const emoji = status.validation_status === 'validated' ? '✅' : '❌';
            console.log(`${emoji} ${status.validation_status}: ${status.count} API(s)`);
        });
        
        const validadas = statusFinal.rows.find(s => s.validation_status === 'validated')?.count || 0;
        const total = statusFinal.rows.reduce((sum, s) => sum + parseInt(s.count), 0);
        
        if (validadas > 0) {
            console.log(`\n🚀 SISTEMA PRONTO! ${validadas}/${total} APIs funcionando`);
        } else {
            console.log(`\n⚠️  TODAS AS APIS FALHARAM - Verificar chaves`);
        }
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        pool.end();
    }
}

corrigirConfiguracaoBybit();

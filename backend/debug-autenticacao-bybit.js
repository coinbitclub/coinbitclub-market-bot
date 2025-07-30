const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Teste corrigido para Bybit API V5
async function testBybitAPICorrect(apiKey, apiSecret, environment = 'mainnet') {
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now();
            const recv_window = '5000';
            
            // Para Bybit V5, usar endpoint correto
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            // Criar string para assinatura (sem parâmetros de query para GET simples)
            const signaturePayload = timestamp + apiKey + recv_window;
            
            // Criar assinatura
            const signature = crypto.createHmac('sha256', apiSecret)
                .update(signaturePayload)
                .digest('hex');
            
            console.log(`     🔍 Debug da autenticação:`);
            console.log(`       Timestamp: ${timestamp}`);
            console.log(`       API Key: ${apiKey}`);
            console.log(`       Recv Window: ${recv_window}`);
            console.log(`       Payload: ${signaturePayload}`);
            console.log(`       Signature: ${signature.substring(0, 20)}...`);
            
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
            
            console.log(`     📡 Request para: https://${baseUrl}/v5/account/info`);
            console.log(`     📋 Headers:`);
            Object.keys(options.headers).forEach(header => {
                if (header === 'X-BAPI-SIGN') {
                    console.log(`       ${header}: ${options.headers[header].substring(0, 20)}...`);
                } else {
                    console.log(`       ${header}: ${options.headers[header]}`);
                }
            });
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`     📊 Status HTTP: ${res.statusCode}`);
                        console.log(`     📋 Response Headers:`, res.headers);
                        console.log(`     📄 Response Body: ${JSON.stringify(response, null, 2)}`);
                        
                        if (response.retCode === 0) {
                            resolve({
                                success: true,
                                message: 'API autenticada com sucesso',
                                accountInfo: response.result
                            });
                        } else {
                            resolve({
                                success: false,
                                message: `API retornou erro: ${response.retMsg}`,
                                error: response,
                                statusCode: res.statusCode,
                                debug: {
                                    timestamp,
                                    apiKey,
                                    signaturePayload,
                                    signature: signature.substring(0, 20) + '...'
                                }
                            });
                        }
                    } catch (e) {
                        console.log(`     ❌ Erro JSON: ${e.message}`);
                        console.log(`     📄 Raw Response: ${data}`);
                        resolve({
                            success: false,
                            message: 'Erro ao processar resposta da API',
                            error: e.message,
                            rawResponse: data,
                            statusCode: res.statusCode
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                console.log(`     ❌ Network Error: ${e.message}`);
                resolve({
                    success: false,
                    message: 'Erro de rede na autenticação',
                    error: e.message
                });
            });
            
            req.on('timeout', () => {
                console.log(`     ⏰ Request Timeout`);
                resolve({
                    success: false,
                    message: 'Timeout na autenticação API',
                    error: 'Request timed out'
                });
            });
            
            req.end();
            
        } catch (error) {
            console.log(`     💥 Internal Error: ${error.message}`);
            resolve({
                success: false,
                message: 'Erro interno no teste de API',
                error: error.message
            });
        }
    });
}

// Teste alternativo com diferentes endpoints
async function testBybitAlternative(apiKey, apiSecret, environment = 'mainnet') {
    console.log('\n     🔄 Testando endpoint alternativo...');
    
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now();
            const recv_window = '5000';
            
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            // Testar endpoint de wallet balance
            const queryString = `accountType=UNIFIED&coin=`;
            const signaturePayload = timestamp + apiKey + recv_window + queryString;
            
            const signature = crypto.createHmac('sha256', apiSecret)
                .update(signaturePayload)
                .digest('hex');
            
            const options = {
                hostname: baseUrl,
                port: 443,
                path: `/v5/account/wallet-balance?${queryString}`,
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
            
            console.log(`     📡 Alternative Request: https://${baseUrl}/v5/account/wallet-balance?${queryString}`);
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`     📊 Alt Status: ${res.statusCode}`);
                        console.log(`     📄 Alt Response: ${JSON.stringify(response, null, 2)}`);
                        
                        resolve({
                            success: response.retCode === 0,
                            message: response.retMsg || 'Alternative endpoint test',
                            data: response
                        });
                    } catch (e) {
                        resolve({
                            success: false,
                            message: 'Error in alternative endpoint',
                            error: e.message
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                resolve({
                    success: false,
                    message: 'Network error in alternative endpoint',
                    error: e.message
                });
            });
            
            req.end();
            
        } catch (error) {
            resolve({
                success: false,
                message: 'Internal error in alternative endpoint',
                error: error.message
            });
        }
    });
}

async function debugAutenticacaoBybit() {
    try {
        console.log('🔍 DEBUG DETALHADO DA AUTENTICAÇÃO BYBIT');
        console.log('=========================================');
        
        // Buscar uma chave para teste detalhado
        const chavesTeste = await pool.query(`
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
            LIMIT 2
        `);
        
        console.log(`\n📋 Encontradas ${chavesTeste.rows.length} chaves para debug`);
        
        for (let i = 0; i < chavesTeste.rows.length; i++) {
            const api = chavesTeste.rows[i];
            console.log(`\n${i + 1}. 🔬 DEBUG DETALHADO: ${api.name}`);
            console.log('═'.repeat(60));
            console.log(`   Exchange: ${api.exchange}`);
            console.log(`   Environment: ${api.environment}`);
            console.log(`   API Key: ${api.api_key}`);
            console.log(`   Secret (primeiros 10): ${api.secret_key.substring(0, 10)}...`);
            
            // Teste principal
            console.log('\n   🧪 TESTE PRINCIPAL:');
            const testeMain = await testBybitAPICorrect(
                api.api_key, 
                api.secret_key, 
                api.environment
            );
            
            if (testeMain.success) {
                console.log(`   ✅ ${testeMain.message}`);
                
                // Atualizar status no banco
                await pool.query(`
                    UPDATE user_api_keys 
                    SET 
                        validation_status = 'validated',
                        last_validated_at = NOW(),
                        error_message = NULL
                    WHERE user_id = $1 AND exchange = $2
                `, [api.user_id, api.exchange]);
                
            } else {
                console.log(`   ❌ ${testeMain.message}`);
                
                // Teste alternativo
                const testeAlt = await testBybitAlternative(
                    api.api_key, 
                    api.secret_key, 
                    api.environment
                );
                
                if (testeAlt.success) {
                    console.log(`   ✅ Endpoint alternativo funcionou!`);
                } else {
                    console.log(`   ❌ Endpoint alternativo também falhou`);
                }
                
                // Registrar erro detalhado
                await pool.query(`
                    UPDATE user_api_keys 
                    SET 
                        validation_status = 'error',
                        error_message = $1,
                        last_validated_at = NOW()
                    WHERE user_id = $2 AND exchange = $3
                `, [testeMain.message, api.user_id, api.exchange]);
            }
        }
        
        console.log('\n🎯 POSSÍVEIS SOLUÇÕES:');
        console.log('======================');
        console.log('1. 🔑 Verificar se as chaves API têm as permissões corretas');
        console.log('2. 🌐 Verificar se o IP está na whitelist da Bybit');
        console.log('3. ⏰ Verificar sincronização de horário do servidor');
        console.log('4. 📋 Verificar formato da assinatura (Bybit V5)');
        console.log('5. 🔧 Testar com diferentes endpoints');
        
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('===================');
        console.log('1. Verificar logs detalhados acima');
        console.log('2. Confirmar permissões na conta Bybit');
        console.log('3. Verificar whitelist de IPs');
        console.log('4. Testar chaves manualmente no Postman/curl');
        
    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
    } finally {
        pool.end();
    }
}

debugAutenticacaoBybit();

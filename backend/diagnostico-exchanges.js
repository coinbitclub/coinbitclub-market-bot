const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Teste simplificado para Bybit
async function testBybitSimple(apiKey, apiSecret, environment = 'mainnet') {
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now();
            const recv_window = '5000';
            
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            // Teste simples sem autenticação primeiro
            const options = {
                hostname: baseUrl,
                port: 443,
                path: '/v5/market/time',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            };
            
            console.log(`     🔍 Testando conectividade básica: https://${baseUrl}/v5/market/time`);
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`     📡 Status HTTP: ${res.statusCode}`);
                        console.log(`     📊 Resposta: ${JSON.stringify(response).substring(0, 100)}...`);
                        
                        if (response.retCode === 0) {
                            resolve({
                                success: true,
                                message: 'Conectividade básica OK',
                                serverTime: response.result?.timeSecond
                            });
                        } else {
                            resolve({
                                success: false,
                                message: 'Servidor respondeu com erro',
                                error: response
                            });
                        }
                    } catch (e) {
                        console.log(`     ❌ Erro ao processar JSON: ${e.message}`);
                        console.log(`     📄 Resposta bruta: ${data.substring(0, 200)}...`);
                        resolve({
                            success: false,
                            message: 'Erro ao processar resposta JSON',
                            error: e.message,
                            rawResponse: data.substring(0, 500)
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                console.log(`     ❌ Erro de conexão: ${e.message}`);
                resolve({
                    success: false,
                    message: 'Erro de conexão de rede',
                    error: e.message
                });
            });
            
            req.on('timeout', () => {
                console.log(`     ⏰ Timeout na conexão`);
                resolve({
                    success: false,
                    message: 'Timeout na conexão',
                    error: 'Request timed out after 10s'
                });
            });
            
            req.end();
            
        } catch (error) {
            console.log(`     💥 Erro interno: ${error.message}`);
            resolve({
                success: false,
                message: 'Erro interno no teste',
                error: error.message
            });
        }
    });
}

// Teste de chaves API reais
async function testBybitAPI(apiKey, apiSecret, environment = 'mainnet') {
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now();
            const recv_window = '5000';
            
            // Criar parâmetros para account info
            const params = {
                api_key: apiKey,
                timestamp: timestamp,
                recv_window: recv_window
            };
            
            // Criar query string
            const queryString = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');
                
            // Criar assinatura
            const signature = crypto.createHmac('sha256', apiSecret)
                .update(queryString)
                .digest('hex');
            
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            const options = {
                hostname: baseUrl,
                port: 443,
                path: `/v5/account/info?${queryString}&sign=${signature}`,
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
            
            console.log(`     🔐 Testando autenticação API...`);
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`     📡 Status HTTP: ${res.statusCode}`);
                        
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
                                statusCode: res.statusCode
                            });
                        }
                    } catch (e) {
                        resolve({
                            success: false,
                            message: 'Erro ao processar resposta da API',
                            error: e.message,
                            rawResponse: data.substring(0, 500),
                            statusCode: res.statusCode
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                resolve({
                    success: false,
                    message: 'Erro de rede na autenticação',
                    error: e.message
                });
            });
            
            req.on('timeout', () => {
                resolve({
                    success: false,
                    message: 'Timeout na autenticação API',
                    error: 'Request timed out'
                });
            });
            
            req.end();
            
        } catch (error) {
            resolve({
                success: false,
                message: 'Erro interno no teste de API',
                error: error.message
            });
        }
    });
}

async function diagnosticoDetalhadoExchanges() {
    try {
        console.log('🔬 DIAGNÓSTICO DETALHADO DAS EXCHANGES');
        console.log('======================================');
        
        // Buscar todas as chaves API ativas
        const chavesAPI = await pool.query(`
            SELECT 
                u.name,
                u.id as user_id,
                k.exchange,
                k.api_key,
                k.secret_key,
                k.environment,
                k.validation_status
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true AND k.is_active = true
            ORDER BY u.name
        `);
        
        console.log(`\n📋 Encontradas ${chavesAPI.rows.length} chaves API para testar`);
        
        for (let i = 0; i < chavesAPI.rows.length; i++) {
            const api = chavesAPI.rows[i];
            console.log(`\n${i + 1}. 👤 TESTANDO: ${api.name}`);
            console.log('═'.repeat(50));
            console.log(`   Exchange: ${api.exchange.toUpperCase()}`);
            console.log(`   Ambiente: ${api.environment}`);
            console.log(`   API Key: ${api.api_key}`);
            console.log(`   Status BD: ${api.validation_status}`);
            
            if (api.exchange.toLowerCase().includes('bybit')) {
                // Teste 1: Conectividade básica
                console.log('\n   🧪 TESTE 1: Conectividade básica');
                const testeBasico = await testBybitSimple(
                    api.api_key, 
                    api.secret_key, 
                    api.environment
                );
                
                if (testeBasico.success) {
                    console.log(`   ✅ ${testeBasico.message}`);
                    if (testeBasico.serverTime) {
                        console.log(`   ⏰ Tempo do servidor: ${new Date(testeBasico.serverTime * 1000).toISOString()}`);
                    }
                    
                    // Teste 2: Autenticação API
                    console.log('\n   🧪 TESTE 2: Autenticação da API');
                    const testeAPI = await testBybitAPI(
                        api.api_key, 
                        api.secret_key, 
                        api.environment
                    );
                    
                    if (testeAPI.success) {
                        console.log(`   ✅ ${testeAPI.message}`);
                        if (testeAPI.accountInfo) {
                            console.log(`   📊 Conta encontrada: ${JSON.stringify(testeAPI.accountInfo).substring(0, 100)}...`);
                        }
                        
                        // Atualizar status no banco
                        await pool.query(`
                            UPDATE user_api_keys 
                            SET 
                                validation_status = 'validated',
                                last_validated_at = NOW(),
                                error_message = NULL
                            WHERE user_id = $1 AND exchange = $2
                        `, [api.user_id, api.exchange]);
                        
                        console.log(`   💾 Status atualizado no banco: VALIDATED`);
                        
                    } else {
                        console.log(`   ❌ ${testeAPI.message}`);
                        if (testeAPI.error) {
                            console.log(`   🔍 Erro: ${JSON.stringify(testeAPI.error).substring(0, 200)}...`);
                        }
                        
                        // Atualizar erro no banco
                        await pool.query(`
                            UPDATE user_api_keys 
                            SET 
                                validation_status = 'error',
                                error_message = $1,
                                last_validated_at = NOW()
                            WHERE user_id = $2 AND exchange = $3
                        `, [testeAPI.message, api.user_id, api.exchange]);
                        
                        console.log(`   💾 Erro registrado no banco`);
                    }
                    
                } else {
                    console.log(`   ❌ ${testeBasico.message}`);
                    if (testeBasico.error) {
                        console.log(`   🔍 Erro: ${testeBasico.error}`);
                    }
                    if (testeBasico.rawResponse) {
                        console.log(`   📄 Resposta: ${testeBasico.rawResponse.substring(0, 100)}...`);
                    }
                }
                
            } else {
                console.log(`   ⚠️  Exchange ${api.exchange} não implementada para teste automático`);
            }
        }
        
        // Verificar status final
        console.log('\n📊 RESUMO FINAL DO DIAGNÓSTICO');
        console.log('==============================');
        
        const statusFinal = await pool.query(`
            SELECT 
                validation_status,
                COUNT(*) as count
            FROM user_api_keys
            WHERE is_active = true
            GROUP BY validation_status
            ORDER BY validation_status
        `);
        
        console.log('🏆 Status das validações:');
        statusFinal.rows.forEach(status => {
            const emoji = status.validation_status === 'validated' ? '✅' : 
                         status.validation_status === 'error' ? '❌' : '⚠️';
            console.log(`   ${emoji} ${status.validation_status}: ${status.count} API(s)`);
        });
        
        const validadas = statusFinal.rows.find(s => s.validation_status === 'validated')?.count || 0;
        const total = statusFinal.rows.reduce((sum, s) => sum + parseInt(s.count), 0);
        
        console.log(`\n🎯 RESULTADO GERAL:`);
        console.log(`   📈 Taxa de sucesso: ${((validadas / total) * 100).toFixed(1)}%`);
        console.log(`   ✅ APIs funcionando: ${validadas}/${total}`);
        
        if (validadas > 0) {
            console.log(`\n🚀 SISTEMA MULTIUSUÁRIO: OPERACIONAL`);
            console.log(`   ✅ ${validadas} usuário(s) podem operar`);
            console.log(`   ✅ Exchanges conectadas e validadas`);
            console.log(`   ✅ Pronto para receber sinais do TradingView`);
        } else {
            console.log(`\n⚠️  SISTEMA MULTIUSUÁRIO: REQUER ATENÇÃO`);
            console.log(`   🔧 Nenhuma API funcionando corretamente`);
            console.log(`   🔧 Verificar credenciais e permissões`);
            console.log(`   🔧 Contatar suporte das exchanges se necessário`);
        }
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
    } finally {
        pool.end();
    }
}

diagnosticoDetalhadoExchanges();

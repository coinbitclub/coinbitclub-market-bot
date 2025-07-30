const { Pool } = require('pg');
const crypto = require('crypto');
const axios = require('axios');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitV5Debug {
    constructor() {
        this.pool = pool;
        this.baseUrl = 'https://api.bybit.com';
    }

    // Gerar assinatura V5 corrigida
    generateSignature(timestamp, apiKey, recvWindow, queryString) {
        // Para V5: timestamp + apiKey + recvWindow + queryString
        const payload = timestamp + apiKey + recvWindow + queryString;
        console.log(`      🔐 Payload para assinatura: "${payload}"`);
        return crypto.createHmac('sha256', queryString.includes('secret') ? 'SECRET_DEBUG' : 'real_secret').update(payload).digest('hex');
    }

    // Debug completo de uma requisição
    async debugRequest(endpoint, apiKey, secret, params = {}) {
        console.log(`\n   🔍 DEBUG da requisição para ${endpoint}`);
        console.log(`      🗝️  API Key: ${apiKey.substring(0, 15)}...`);
        console.log(`      🔐 Secret: ${secret.substring(0, 15)}...`);
        
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            // Construir query string
            let queryString = '';
            if (Object.keys(params).length > 0) {
                queryString = Object.keys(params)
                    .sort()
                    .map(key => `${key}=${encodeURIComponent(params[key])}`)
                    .join('&');
            }
            
            console.log(`      📝 Query String: "${queryString}"`);
            console.log(`      ⏰ Timestamp: ${timestamp}`);
            console.log(`      ⏳ Recv Window: ${recvWindow}`);
            
            // Gerar assinatura real
            const payload = timestamp + apiKey + recvWindow + queryString;
            const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
            
            console.log(`      📋 Payload completo: "${payload}"`);
            console.log(`      ✍️  Assinatura: ${signature.substring(0, 16)}...`);
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            };
            
            const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
            console.log(`      🌐 URL: ${url}`);
            console.log(`      📤 Headers:`, JSON.stringify(headers, null, 6));
            
            const response = await axios.get(url, {
                headers: headers,
                timeout: 15000
            });
            
            console.log(`      ✅ Resposta: ${response.status}`);
            console.log(`      📊 Dados:`, JSON.stringify(response.data, null, 6).substring(0, 200) + '...');
            
            return {
                success: true,
                data: response.data,
                headers: response.headers
            };
            
        } catch (error) {
            console.log(`      ❌ Erro HTTP: ${error.response?.status}`);
            console.log(`      📋 Resposta de erro:`, JSON.stringify(error.response?.data, null, 6));
            console.log(`      🔍 Mensagem:`, error.message);
            
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status,
                headers: error.response?.headers
            };
        }
    }

    // Testar conectividade básica primeiro
    async testBasicConnectivity() {
        console.log('\n🌐 TESTE DE CONECTIVIDADE BÁSICA');
        console.log('================================');
        
        try {
            // Endpoint público (não precisa de autenticação)
            const response = await axios.get('https://api.bybit.com/v5/market/time', {
                timeout: 10000
            });
            
            console.log('✅ Conectividade básica: OK');
            console.log(`   🕐 Tempo do servidor: ${new Date(response.data.result.timeSecond * 1000).toISOString()}`);
            console.log(`   📊 Código de retorno: ${response.data.retCode}`);
            
            return true;
        } catch (error) {
            console.log('❌ Conectividade básica: FALHA');
            console.log(`   🔍 Erro: ${error.message}`);
            return false;
        }
    }

    // Testar diferentes formatos de assinatura
    async testSignatureMethods(apiKey, secret) {
        console.log('\n🔐 TESTE DE MÉTODOS DE ASSINATURA');
        console.log('=================================');
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Método 1: Assinatura V5 padrão
        console.log('\n   📝 Método 1 - V5 Padrão:');
        const payload1 = timestamp + apiKey + recvWindow;
        const signature1 = crypto.createHmac('sha256', secret).update(payload1).digest('hex');
        console.log(`      Payload: "${payload1}"`);
        console.log(`      Assinatura: ${signature1.substring(0, 20)}...`);
        
        // Método 2: Com query string vazia
        console.log('\n   📝 Método 2 - Com Query String Vazia:');
        const payload2 = timestamp + apiKey + recvWindow + '';
        const signature2 = crypto.createHmac('sha256', secret).update(payload2).digest('hex');
        console.log(`      Payload: "${payload2}"`);
        console.log(`      Assinatura: ${signature2.substring(0, 20)}...`);
        
        // Método 3: Formato alternativo
        console.log('\n   📝 Método 3 - Formato Alternativo:');
        const payload3 = `${timestamp}${apiKey}${recvWindow}`;
        const signature3 = crypto.createHmac('sha256', secret).update(payload3).digest('hex');
        console.log(`      Payload: "${payload3}"`);
        console.log(`      Assinatura: ${signature3.substring(0, 20)}...`);
        
        return {
            method1: signature1,
            method2: signature2,
            method3: signature3
        };
    }

    // Testar uma chave específica com debug completo
    async debugUserKeys(userId, userName, apiKey, secret) {
        console.log(`\n🧪 DEBUG COMPLETO - ${userName} (ID: ${userId})`);
        console.log('=' .repeat(60));
        
        // 1. Validar formato das chaves
        console.log('\n📋 VALIDAÇÃO DAS CHAVES:');
        console.log(`   🗝️  API Key: ${apiKey}`);
        console.log(`   🔐 Secret: ${secret}`);
        console.log(`   📏 Tamanho API Key: ${apiKey.length}`);
        console.log(`   📏 Tamanho Secret: ${secret.length}`);
        
        // Verificar se parece com chaves válidas da Bybit
        const apiKeyValid = /^[A-Za-z0-9]{20,}$/.test(apiKey);
        const secretValid = /^[A-Za-z0-9]{20,}$/.test(secret);
        
        console.log(`   ✅ API Key formato: ${apiKeyValid ? 'OK' : 'INVÁLIDO'}`);
        console.log(`   ✅ Secret formato: ${secretValid ? 'OK' : 'INVÁLIDO'}`);
        
        if (!apiKeyValid || !secretValid) {
            console.log('   ❌ Formato de chaves inválido - pulando testes');
            return { success: false, reason: 'invalid_format' };
        }
        
        // 2. Testar métodos de assinatura
        await this.testSignatureMethods(apiKey, secret);
        
        // 3. Testar endpoint mais simples
        console.log('\n🎯 TESTE DE ENDPOINT SIMPLES (/v5/account/info):');
        const accountResult = await this.debugRequest('/v5/account/info', apiKey, secret);
        
        if (accountResult.success) {
            console.log('   ✅ Account Info: SUCESSO');
            return { success: true, working: true };
        } else {
            console.log('   ❌ Account Info: FALHA');
            
            // 4. Se falhou, testar outros endpoints
            console.log('\n🎯 TESTE DE ENDPOINTS ALTERNATIVOS:');
            
            const endpoints = [
                '/v5/user/query-api',
                '/v5/account/wallet-balance',
                '/v5/market/instruments-info'
            ];
            
            for (const endpoint of endpoints) {
                console.log(`\n   🔄 Testando ${endpoint}:`);
                const result = await this.debugRequest(endpoint, apiKey, secret);
                
                if (result.success) {
                    console.log(`   ✅ ${endpoint}: SUCESSO`);
                    return { success: true, working: true, workingEndpoint: endpoint };
                } else {
                    console.log(`   ❌ ${endpoint}: FALHA`);
                }
            }
            
            return { success: false, working: false, lastError: accountResult.error };
        }
    }

    // Executar debug completo do sistema
    async runCompleteDebug() {
        try {
            console.log('🔍 DEBUG COMPLETO DO SISTEMA BYBIT V5');
            console.log('====================================');
            
            // 1. Teste de conectividade básica
            const connectivity = await this.testBasicConnectivity();
            if (!connectivity) {
                console.log('❌ Conectividade básica falhou - parando debug');
                return;
            }
            
            // 2. Buscar usuários e chaves
            const users = await this.pool.query(`
                SELECT u.id, u.name, u.email, ak.api_key, ak.secret_key
                FROM users u 
                JOIN user_api_keys ak ON u.id = ak.user_id 
                WHERE u.is_active = true AND ak.is_active = true
                AND ak.api_key NOT LIKE '%PENDING%'
                ORDER BY u.id
                LIMIT 3  -- Limitar para debug mais rápido
            `);
            
            console.log(`\n📋 Debugando ${users.rows.length} usuários\n`);
            
            const results = [];
            
            for (const user of users.rows) {
                const result = await this.debugUserKeys(
                    user.id,
                    user.name,
                    user.api_key,
                    user.secret_key
                );
                
                results.push({
                    userId: user.id,
                    userName: user.name,
                    ...result
                });
                
                // Pausa entre testes
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // 3. Resumo final
            console.log('\n📊 RESUMO DO DEBUG');
            console.log('==================');
            
            const working = results.filter(r => r.working);
            const notWorking = results.filter(r => !r.working);
            
            if (working.length > 0) {
                console.log('\n✅ CHAVES FUNCIONAIS:');
                working.forEach(r => {
                    console.log(`   👤 ${r.userName} - ${r.workingEndpoint || 'account/info'}`);
                });
            }
            
            if (notWorking.length > 0) {
                console.log('\n❌ CHAVES COM PROBLEMAS:');
                notWorking.forEach(r => {
                    console.log(`   👤 ${r.userName} - ${r.reason || 'auth_failed'}`);
                });
            }
            
            console.log(`\n🎯 Taxa de Sucesso: ${Math.round((working.length / results.length) * 100)}%`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Erro no debug:', error.message);
            console.error(error.stack);
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Executar debug
async function main() {
    const debug = new BybitV5Debug();
    
    try {
        await debug.runCompleteDebug();
        console.log('\n🎉 DEBUG CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await debug.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BybitV5Debug;

/**
 * 🔍 DIAGNÓSTICO DETALHADO COM ERROS COMPLETOS - BYBIT
 * 
 * Script para capturar erros completos das conexões,
 * incluindo chaves que parecem válidas mas podem ter problemas
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 DIAGNÓSTICO DETALHADO COM ERROS COMPLETOS - BYBIT');
console.log('===================================================');

async function diagnosticarErrosCompletos() {
    try {
        // 1. Buscar todas as chaves Bybit
        console.log('\n📊 1. BUSCANDO TODAS AS CHAVES BYBIT:');
        const chavesQuery = `
            SELECT 
                u.id as user_id,
                u.name,
                u.email,
                uak.id as key_id,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                uak.is_active,
                uak.validation_status,
                uak.created_at
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY u.name, uak.environment;
        `;
        
        const chavesResult = await pool.query(chavesQuery);
        console.log(`📋 Encontradas ${chavesResult.rows.length} chave(s) Bybit ativa(s)`);
        
        // 2. Testar cada endpoint individual para cada chave
        for (const [index, chave] of chavesResult.rows.entries()) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔍 TESTE DETALHADO ${index + 1}/${chavesResult.rows.length}: ${chave.name}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`👤 Usuário: ${chave.name} (${chave.email})`);
            console.log(`🔑 API Key: ${chave.api_key?.substring(0, 15)}...`);
            console.log(`🔐 Secret: ${chave.secret_key?.substring(0, 10)}...`);
            console.log(`🌍 Ambiente: ${chave.environment}`);
            console.log(`📊 Status atual: ${chave.validation_status || 'Não validado'}`);
            
            await testarTodosEndpoints(chave);
        }
        
        // 3. Teste de múltiplas tentativas
        console.log(`\n${'='.repeat(60)}`);
        console.log('🔄 TESTE DE MÚLTIPLAS TENTATIVAS');
        console.log(`${'='.repeat(60)}`);
        
        for (const chave of chavesResult.rows) {
            console.log(`\n🔄 Teste repetitivo: ${chave.name}`);
            for (let i = 1; i <= 3; i++) {
                console.log(`   Tentativa ${i}/3:`);
                const resultado = await testarConexaoDetalhada(chave, i);
                console.log(`   ${resultado.sucesso ? '✅' : '❌'} ${resultado.mensagem}`);
                
                if (!resultado.sucesso && resultado.errorDetails) {
                    console.log(`   📄 Detalhes do erro:`, JSON.stringify(resultado.errorDetails, null, 2));
                }
                
                // Pequeno delay entre tentativas
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico detalhado:', error);
        console.error('Stack trace completo:', error.stack);
    } finally {
        await pool.end();
    }
}

async function testarTodosEndpoints(chave) {
    const endpoints = [
        {
            nome: 'Market Time',
            path: '/v5/market/time',
            params: {},
            requiresAuth: false
        },
        {
            nome: 'Account Info',
            path: '/v5/account/info',
            params: {},
            requiresAuth: true
        },
        {
            nome: 'Wallet Balance',
            path: '/v5/account/wallet-balance',
            params: { accountType: 'UNIFIED' },
            requiresAuth: true
        },
        {
            nome: 'Position List',
            path: '/v5/position/list',
            params: { category: 'linear' },
            requiresAuth: true
        }
    ];
    
    const baseUrl = chave.environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    console.log(`📡 Base URL: ${baseUrl}`);
    
    for (const endpoint of endpoints) {
        console.log(`\n🧪 Testando: ${endpoint.nome}`);
        console.log(`   Endpoint: ${endpoint.path}`);
        console.log(`   Parâmetros: ${JSON.stringify(endpoint.params)}`);
        console.log(`   Requer auth: ${endpoint.requiresAuth ? 'Sim' : 'Não'}`);
        
        try {
            let url = `${baseUrl}${endpoint.path}`;
            let headers = { 'Content-Type': 'application/json' };
            
            if (endpoint.requiresAuth) {
                const timestamp = Date.now().toString();
                const recvWindow = '5000';
                
                // Criar query string
                const queryString = Object.keys(endpoint.params)
                    .sort()
                    .map(key => `${key}=${endpoint.params[key]}`)
                    .join('&');
                
                // Criar assinatura correta Bybit V5: timestamp + apiKey + recvWindow + queryString
                const signPayload = timestamp + chave.api_key + recvWindow + queryString;
                const signature = crypto.createHmac('sha256', chave.secret_key).update(signPayload).digest('hex');
                
                headers = {
                    ...headers,
                    'X-BAPI-API-KEY': chave.api_key,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-SIGN-TYPE': '2',
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow
                };
                
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                console.log(`   🔐 Timestamp: ${timestamp}`);
                console.log(`   🔐 Message: ${message.substring(0, 50)}...`);
                console.log(`   🔐 Signature: ${signature.substring(0, 20)}...`);
            }
            
            console.log(`   📤 Fazendo requisição para: ${url}`);
            console.log(`   📋 Headers:`, JSON.stringify(headers, null, 2));
            
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                timeout: 10000
            });
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            console.log(`   ⏱️ Latência: ${latency}ms`);
            console.log(`   📊 Status HTTP: ${response.status}`);
            console.log(`   📊 Status Text: ${response.statusText}`);
            
            // Ler resposta
            const responseText = await response.text();
            console.log(`   📄 Resposta Raw (primeiros 200 chars): ${responseText.substring(0, 200)}...`);
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
                console.log(`   📄 Resposta JSON:`, JSON.stringify(responseData, null, 2));
            } catch (parseError) {
                console.log(`   ❌ Erro ao parsear JSON: ${parseError.message}`);
                console.log(`   📄 Resposta completa: ${responseText}`);
                continue;
            }
            
            if (response.ok && responseData.retCode === 0) {
                console.log(`   ✅ SUCESSO: ${endpoint.nome}`);
            } else {
                console.log(`   ❌ FALHA: ${endpoint.nome}`);
                console.log(`   🚨 Código de erro: ${responseData.retCode}`);
                console.log(`   🚨 Mensagem: ${responseData.retMsg}`);
                
                // Mapear códigos de erro específicos
                const errorMappings = {
                    10001: 'Parâmetros inválidos',
                    10003: 'API key inválida',
                    10004: 'Erro de assinatura',
                    10005: 'Permissões insuficientes',
                    10006: 'IP não autorizado',
                    10007: 'API key expirada',
                    10008: 'Muitas requisições (rate limit)',
                    10009: 'Nonce inválido',
                    10016: 'Servidor interno ocupado',
                    10018: 'Parâmetros de timestamp inválidos'
                };
                
                const errorDescription = errorMappings[responseData.retCode] || 'Erro desconhecido';
                console.log(`   💡 Significado: ${errorDescription}`);
                
                if (responseData.retCode === 10006) {
                    console.log(`   🚨 PROBLEMA DE IP DETECTADO!`);
                    console.log(`   📍 IP atual: ${await verificarIPAtual()}`);
                    console.log(`   💡 Solução: Adicionar IP 132.255.160.140 na whitelist da conta Bybit`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ ERRO DE CONEXÃO: ${endpoint.nome}`);
            console.log(`   🚨 Tipo: ${error.name}`);
            console.log(`   🚨 Mensagem: ${error.message}`);
            console.log(`   🚨 Stack: ${error.stack}`);
            
            if (error.code) {
                console.log(`   🚨 Código: ${error.code}`);
            }
        }
        
        console.log(`   ${'-'.repeat(40)}`);
    }
}

async function testarConexaoDetalhada(chave, tentativa) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const message = timestamp + chave.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}/v5/market/time`, {
            method: 'GET',
            headers: headers,
            timeout: 5000
        });
        
        const data = await response.json();
        
        return {
            sucesso: response.ok && data.retCode === 0,
            mensagem: `${response.status} - ${data.retMsg || 'OK'}`,
            errorDetails: response.ok ? null : {
                httpStatus: response.status,
                retCode: data.retCode,
                retMsg: data.retMsg,
                headers: Object.fromEntries(response.headers.entries()),
                timestamp: new Date().toISOString()
            }
        };
        
    } catch (error) {
        return {
            sucesso: false,
            mensagem: `Erro de conexão: ${error.message}`,
            errorDetails: {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack,
                timestamp: new Date().toISOString()
            }
        };
    }
}

async function verificarIPAtual() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Não foi possível verificar';
    }
}

// Executar diagnóstico
diagnosticarErrosCompletos().catch(console.error);

/**
 * 🔬 COMPARAÇÃO DIRETA: ANTIGA vs OTIMIZADA
 * Teste lado a lado para identificar diferenças
 */

const crypto = require('crypto');
const https = require('https');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Implementação ANTIGA (baseada nos nossos arquivos atuais)
async function testeImplementacaoAntiga(apiKey, secretKey) {
    return new Promise((resolve) => {
        const timestamp = Date.now();
        const queryString = 'accountType=UNIFIED';
        
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(`${timestamp}${apiKey}5000${queryString}`)
            .digest('hex');

        const options = {
            hostname: 'api.bybit.com',
            path: `/v5/account/wallet-balance?${queryString}`,
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2', // Como estava nos nossos arquivos
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': '5000'
            }
        };

        console.log('🟡 IMPLEMENTAÇÃO ANTIGA:');
        console.log(`   Timestamp: ${timestamp}`);
        console.log(`   Payload: ${timestamp}${apiKey}5000${queryString}`);
        console.log(`   Signature: ${signature.substring(0, 10)}...`);
        console.log('   Headers: X-BAPI-SIGN-TYPE: "2" ✅');

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Response: ${data.substring(0, 100)}...`);
                
                try {
                    const response = data ? JSON.parse(data) : { retCode: 'EMPTY' };
                    resolve({ 
                        type: 'ANTIGA', 
                        status: res.statusCode, 
                        success: response.retCode === 0,
                        error: response.retCode,
                        message: response.retMsg,
                        rawData: data
                    });
                } catch (e) {
                    resolve({ 
                        type: 'ANTIGA', 
                        status: res.statusCode, 
                        success: false,
                        error: 'PARSE_ERROR',
                        message: e.message,
                        rawData: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ 
                type: 'ANTIGA', 
                success: false, 
                error: 'REQUEST_ERROR', 
                message: error.message 
            });
        });

        req.end();
    });
}

// Implementação OTIMIZADA (conforme documentação V5)
async function testeImplementacaoOtimizada(apiKey, secretKey) {
    return new Promise((resolve) => {
        const timestamp = Date.now();
        const queryString = 'accountType=UNIFIED';
        
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(`${timestamp}${apiKey}5000${queryString}`)
            .digest('hex');

        const options = {
            hostname: 'api.bybit.com',
            path: `/v5/account/wallet-balance?${queryString}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                // Removido X-BAPI-SIGN-TYPE conforme doc V5
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': '5000'
            }
        };

        console.log('\n🟢 IMPLEMENTAÇÃO OTIMIZADA:');
        console.log(`   Timestamp: ${timestamp}`);
        console.log(`   Payload: ${timestamp}${apiKey}5000${queryString}`);
        console.log(`   Signature: ${signature.substring(0, 10)}...`);
        console.log('   Headers: SEM X-BAPI-SIGN-TYPE ❌');

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Response: ${data.substring(0, 100)}...`);
                
                try {
                    const response = data ? JSON.parse(data) : { retCode: 'EMPTY' };
                    resolve({ 
                        type: 'OTIMIZADA', 
                        status: res.statusCode, 
                        success: response.retCode === 0,
                        error: response.retCode,
                        message: response.retMsg,
                        rawData: data
                    });
                } catch (e) {
                    resolve({ 
                        type: 'OTIMIZADA', 
                        status: res.statusCode, 
                        success: false,
                        error: 'PARSE_ERROR',
                        message: e.message,
                        rawData: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ 
                type: 'OTIMIZADA', 
                success: false, 
                error: 'REQUEST_ERROR', 
                message: error.message 
            });
        });

        req.end();
    });
}

async function compararImplementacoes() {
    console.log('🔬 COMPARAÇÃO DIRETA: ANTIGA vs OTIMIZADA');
    console.log('='.repeat(50));

    try {
        // Buscar chave de teste
        const chaves = await pool.query(`
            SELECT u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            AND uk.api_key NOT LIKE 'API_KEY_%'
            LIMIT 1
        `);

        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave API encontrada');
            return;
        }

        const { api_key, secret_key } = chaves.rows[0];

        console.log('🔑 Testando com a mesma chave API...');
        console.log(`   Key: ${api_key.substring(0, 8)}...`);

        // Teste 1: Implementação antiga
        const resultadoAntigo = await testeImplementacaoAntiga(api_key, secret_key);
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Teste 2: Implementação otimizada
        const resultadoOtimizado = await testeImplementacaoOtimizada(api_key, secret_key);

        console.log('\n📊 RESULTADOS DA COMPARAÇÃO:');
        console.log('='.repeat(35));
        
        console.log(`\n🟡 ANTIGA: Status ${resultadoAntigo.status} | Erro: ${resultadoAntigo.error}`);
        console.log(`🟢 OTIMIZADA: Status ${resultadoOtimizado.status} | Erro: ${resultadoOtimizado.error}`);

        if (resultadoAntigo.status === resultadoOtimizado.status) {
            console.log('\n✅ MESMO RESULTADO: Problema não é a implementação');
            if (resultadoAntigo.error === 10003) {
                console.log('🚨 AMBAS RETORNAM ERRO 10003: IP WHITELIST');
                console.log('   O problema é realmente o IP não estar na whitelist');
            } else {
                console.log(`❓ AMBAS RETORNAM ERRO ${resultadoAntigo.error}`);
                console.log('   Investigar causa específica');
            }
        } else {
            console.log('\n⚠️ RESULTADOS DIFERENTES:');
            console.log('   Uma implementação pode estar mais correta');
            
            if (resultadoOtimizado.success && !resultadoAntigo.success) {
                console.log('🎉 OTIMIZADA FUNCIONOU! Usar implementação V5');
            } else if (resultadoAntigo.success && !resultadoOtimizado.success) {
                console.log('🤔 ANTIGA FUNCIONOU MELHOR: Manter X-BAPI-SIGN-TYPE');
            }
        }

        console.log('\n🎯 ANÁLISE DETALHADA:');
        console.log('='.repeat(20));
        console.log('📋 Diferenças principais:');
        console.log('   • X-BAPI-SIGN-TYPE: ANTIGA tem "2", OTIMIZADA não tem');
        console.log('   • Content-Type: OTIMIZADA adiciona application/json');
        console.log('   • Timestamp: ANTIGA number, OTIMIZADA string');

        console.log('\n💡 DESCOBERTA:');
        if (resultadoAntigo.error === 10003 && resultadoOtimizado.error === 10003) {
            console.log('   Ambas implementações estão corretas tecnicamente');
            console.log('   O problema é 100% IP whitelist na conta Bybit');
            console.log('   Adicionar 132.255.160.140 resolverá para ambas');
        } else {
            console.log('   Há diferenças na resposta - implementação importa');
            console.log('   Usar a versão que retornar sucesso ou erro mais específico');
        }

    } catch (error) {
        console.error('❌ Erro na comparação:', error.message);
    } finally {
        pool.end();
    }
}

compararImplementacoes();

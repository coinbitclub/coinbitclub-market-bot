/**
 * 🔍 DIAGNÓSTICO DETALHADO - ERRO 401
 * 
 * Analisar detalhadamente os erros 401 para identificar a causa
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Gerar assinatura HMAC para Bybit
 */
function generateBybitSignature(queryString, secret, timestamp, apiKey, recvWindow) {
    const paramStr = timestamp + apiKey + recvWindow + queryString;
    return crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
}

/**
 * Diagnóstico detalhado
 */
async function diagnosticoDetalhado(usuario, apiKey, secretKey, environment) {
    try {
        console.log(`🔍 DIAGNÓSTICO DETALHADO: ${usuario}`);
        console.log(`   🔑 API Key: ${apiKey}`);
        console.log(`   🔐 Secret Key: ${secretKey.substring(0, 6)}***`);
        console.log(`   🌍 Environment: ${environment}`);
        
        // Determinar URL
        const baseUrl = environment === 'testnet' 
            ? 'https://api-testnet.bybit.com' 
            : 'https://api.bybit.com';
        
        console.log(`   🌐 Base URL: ${baseUrl}`);
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        console.log(`   ⏰ Timestamp: ${timestamp}`);
        console.log(`   📦 Recv Window: ${recvWindow}`);
        console.log(`   🔗 Query String: ${queryString}`);
        
        // Parâmetros para assinatura
        const paramStr = timestamp + apiKey + recvWindow + queryString;
        console.log(`   🔤 Param String: ${paramStr}`);
        
        const signature = crypto.createHmac('sha256', secretKey).update(paramStr).digest('hex');
        console.log(`   📝 Signature: ${signature}`);
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        console.log(`   📋 Headers:`);
        Object.keys(headers).forEach(key => {
            console.log(`      ${key}: ${headers[key]}`);
        });
        
        console.log('   🚀 Fazendo requisição...');
        
        const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
            headers,
            params: { accountType: 'UNIFIED' },
            timeout: 15000
        });
        
        console.log('   ✅ SUCESSO!');
        console.log('   📊 Response:', JSON.stringify(response.data, null, 2));
        
        return { sucesso: true, dados: response.data };
        
    } catch (error) {
        console.log('   ❌ ERRO CAPTURADO:');
        
        if (error.response) {
            console.log(`   📊 Status: ${error.response.status}`);
            console.log(`   📋 Headers:`, JSON.stringify(error.response.headers, null, 2));
            console.log(`   📄 Data:`, JSON.stringify(error.response.data, null, 2));
            
            // Análise específica do erro
            if (error.response.status === 401) {
                console.log('   🚨 ANÁLISE DO ERRO 401:');
                
                if (error.response.data.retCode === 10003) {
                    console.log('      • IP não autorizado (restrição ativa)');
                } else if (error.response.data.retCode === 10004) {
                    console.log('      • API key inválida');
                } else if (error.response.data.retCode === 10005) {
                    console.log('      • Timestamp inválido ou expirado');
                } else if (error.response.data.retCode === 20001) {
                    console.log('      • Assinatura inválida');
                } else {
                    console.log(`      • Código de erro: ${error.response.data.retCode}`);
                    console.log(`      • Mensagem: ${error.response.data.retMsg}`);
                }
            }
        } else {
            console.log(`   📄 Erro: ${error.message}`);
        }
        
        return { sucesso: false, erro: error.message };
    }
}

/**
 * Teste simples do servidor de tempo
 */
async function testarTempoServidor() {
    try {
        console.log('⏰ TESTANDO TEMPO DO SERVIDOR...');
        
        const response = await axios.get('https://api.bybit.com/v5/market/time');
        const serverTime = parseInt(response.data.result.timeSecond) * 1000;
        const localTime = Date.now();
        const diff = Math.abs(localTime - serverTime);
        
        console.log(`   🌐 Tempo do servidor: ${new Date(serverTime).toISOString()}`);
        console.log(`   🏠 Tempo local: ${new Date(localTime).toISOString()}`);
        console.log(`   ⏱️ Diferença: ${diff}ms`);
        
        if (diff > 5000) {
            console.log('   ⚠️ AVISO: Diferença de tempo > 5 segundos');
        } else {
            console.log('   ✅ Sincronização OK');
        }
        
    } catch (error) {
        console.log('   ❌ Erro ao verificar tempo:', error.message);
    }
}

/**
 * Buscar usuários específicos
 */
async function buscarUsuario(email) {
    try {
        const query = `
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.is_active = true
            AND u.email = $1;
        `;
        
        const result = await pool.query(query, [email]);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error.message);
        return null;
    }
}

/**
 * Executar diagnóstico
 */
async function executarDiagnostico() {
    try {
        console.log('🔍 DIAGNÓSTICO DETALHADO - ERRO 401');
        console.log('='.repeat(60));
        
        // Testar tempo do servidor
        await testarTempoServidor();
        console.log('');
        
        // Verificar IP
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        console.log(`📍 IP atual: ${ipResponse.data.ip}`);
        console.log('');
        
        // Testar com Érica (sem restrição IP)
        console.log('👤 TESTANDO ÉRICA (sem restrição IP):');
        const erica = await buscarUsuario('erica.andrade.santos@hotmail.com');
        if (erica) {
            await diagnosticoDetalhado(
                erica.name,
                erica.api_key,
                erica.secret_key,
                erica.environment
            );
        } else {
            console.log('❌ Usuário Érica não encontrado');
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Testar com Mauro (testnet)
        console.log('👤 TESTANDO MAURO (testnet):');
        const mauro = await buscarUsuario('mauroalves150391@gmail.com');
        if (mauro) {
            await diagnosticoDetalhado(
                mauro.name,
                mauro.api_key,
                mauro.secret_key,
                mauro.environment
            );
        } else {
            console.log('❌ Usuário Mauro não encontrado');
        }
        
    } catch (error) {
        console.error('❌ ERRO NO DIAGNÓSTICO:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar diagnóstico
executarDiagnostico();

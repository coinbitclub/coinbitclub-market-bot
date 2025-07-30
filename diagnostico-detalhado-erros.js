/**
 * 🔍 DIAGNÓSTICO DETALHADO - CÓDIGOS DE ERRO ESPECÍFICOS
 * 
 * Investigar exatamente qual erro está sendo retornado
 * para entender se é problema de IP, chave ou propagação
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 DIAGNÓSTICO DETALHADO - CÓDIGOS DE ERRO');
console.log('==========================================');

async function diagnosticoDetalhado() {
    try {
        console.log('\n⏰ Verificando tempo atual:');
        console.log(`🕐 ${new Date().toLocaleString('pt-BR')}`);
        console.log('💡 Mudanças de IP podem levar até 10 minutos para propagar');
        
        // Buscar usuários
        const usuarios = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment,
                CASE 
                    WHEN u.email IN ('erica.andrade.santos@hotmail.com', 'lmariadapinto@gmail.com') 
                    THEN 'IP_CONFIGURADO' 
                    ELSE 'IP_NAO_CONFIGURADO' 
                END as status_ip
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY status_ip, u.name
        `);
        
        console.log('\n🧪 TESTE DETALHADO POR USUÁRIO:');
        console.log('===============================');
        
        for (const usuario of usuarios.rows) {
            console.log(`\n👤 ${usuario.name}`);
            console.log(`📧 ${usuario.email}`);
            console.log(`🔑 ${usuario.api_key.substring(0, 12)}...`);
            console.log(`🌍 ${usuario.environment}`);
            console.log(`📊 Status: ${usuario.status_ip}`);
            
            const baseUrl = usuario.environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            // Teste detalhado
            await testarComDetalhes(usuario, baseUrl);
        }
        
        console.log('\n🎯 INTERPRETAÇÃO DOS CÓDIGOS:');
        console.log('=============================');
        console.log('📊 Código 0: ✅ Sucesso');
        console.log('📊 Código 10003: ❌ API key inválida OU IP não autorizado');
        console.log('📊 Código 10006: ❌ IP não autorizado (definitivo)');
        console.log('📊 Código 10001: ❌ Parâmetros inválidos');
        console.log('📊 Código 10004: ❌ Erro de assinatura');
        console.log('📊 Código 10007: ❌ API key expirada');
        
        console.log('\n💡 RECOMENDAÇÕES BASEADAS NO RESULTADO:');
        console.log('======================================');
        console.log('Se TODOS retornarem 10003:');
        console.log('   → IP ainda não propagou OU não foi configurado corretamente');
        console.log('');
        console.log('Se ALGUNS retornarem 0:');
        console.log('   → Configuração parcialmente correta');
        console.log('');
        console.log('Se retornarem 10006:');
        console.log('   → IP definitivamente não autorizado');
        console.log('');
        console.log('Se retornarem outros códigos:');
        console.log('   → Problema diferente de IP');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarComDetalhes(usuario, baseUrl) {
    // Teste 1: Endpoint público (controle)
    console.log('   📊 1. Endpoint Público (/v5/market/time):');
    try {
        const response = await fetch(`${baseUrl}/v5/market/time`);
        const data = await response.json();
        console.log(`      ✅ Código: ${data.retCode} - ${data.retMsg}`);
    } catch (error) {
        console.log(`      ❌ Erro: ${error.message}`);
    }
    
    // Teste 2: Account Info (endpoint privado básico)
    console.log('   📊 2. Account Info (/v5/account/info):');
    await testarEndpointPrivadoDetalhado(usuario, baseUrl, '/v5/account/info');
    
    // Teste 3: Wallet Balance (endpoint privado com parâmetros)
    console.log('   📊 3. Wallet Balance (/v5/account/wallet-balance):');
    await testarEndpointPrivadoDetalhado(usuario, baseUrl, '/v5/account/wallet-balance?accountType=UNIFIED');
    
    // Teste 4: Server Time com headers de autenticação (híbrido)
    console.log('   📊 4. Server Time com Headers Auth:');
    await testarEndpointPrivadoDetalhado(usuario, baseUrl, '/v5/market/time');
    
    console.log('');
}

async function testarEndpointPrivadoDetalhado(usuario, baseUrl, endpoint) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Extrair query string se houver
        const [path, queryString = ''] = endpoint.split('?');
        
        const message = timestamp + usuario.api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', usuario.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': usuario.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        // Debug: mostrar alguns parâmetros
        console.log(`      🔐 Timestamp: ${timestamp}`);
        console.log(`      🔑 API Key: ${usuario.api_key.substring(0, 8)}...`);
        console.log(`      📝 Message: ${message.substring(0, 50)}...`);
        console.log(`      🔏 Signature: ${signature.substring(0, 16)}...`);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log(`      ✅ Sucesso! Código: ${data.retCode} - ${data.retMsg}`);
        } else {
            console.log(`      ❌ Falha! Código: ${data.retCode} - ${data.retMsg}`);
            
            // Análise específica do erro
            if (data.retCode === 10003) {
                console.log(`      🔍 10003 pode significar:`);
                console.log(`          • IP não autorizado (mais provável)`);
                console.log(`          • API key inválida (menos provável)`);
            } else if (data.retCode === 10006) {
                console.log(`      🔍 10006 significa: IP definitivamente não autorizado`);
            } else if (data.retCode === 10004) {
                console.log(`      🔍 10004 significa: Erro na assinatura (problema técnico)`);
            }
        }
        
    } catch (error) {
        console.log(`      ❌ Erro de conexão: ${error.message}`);
    }
}

// Executar diagnóstico
diagnosticoDetalhado().catch(console.error);

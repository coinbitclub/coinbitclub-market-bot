/**
 * 🔍 DIAGNÓSTICO DEFINITIVO - PÚBLICO vs PRIVADO
 * 
 * Comparar endpoints públicos vs privados para confirmar
 * que o problema é de IP/autenticação nos endpoints críticos
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 DIAGNÓSTICO DEFINITIVO - PÚBLICO vs PRIVADO');
console.log('===============================================');

async function diagnosticoDefinitivo() {
    try {
        // Buscar uma chave para teste
        const chaves = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            LIMIT 1
        `);
        
        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave encontrada');
            return;
        }
        
        const chave = chaves.rows[0];
        console.log(`\n🔑 Testando com: ${chave.name} (${chave.environment})`);
        console.log(`📧 Email: ${chave.email}`);
        console.log(`🔗 Chave: ${chave.api_key.substring(0, 12)}...`);
        
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        console.log('\n🌍 TESTE 1: ENDPOINTS PÚBLICOS (sem autenticação)');
        console.log('=================================================');
        
        await testarEndpointPublico(baseUrl, '/v5/market/time', 'Server Time');
        await testarEndpointPublico(baseUrl, '/v5/market/instruments-info?category=linear&symbol=BTCUSDT', 'Instrument Info');
        await testarEndpointPublico(baseUrl, '/v5/market/orderbook?category=linear&symbol=BTCUSDT&limit=5', 'Order Book');
        
        console.log('\n🔐 TESTE 2: ENDPOINTS PRIVADOS (com autenticação)');
        console.log('==================================================');
        
        await testarEndpointPrivado(chave, baseUrl, '/v5/account/info', 'Account Info');
        await testarEndpointPrivado(chave, baseUrl, '/v5/account/wallet-balance?accountType=UNIFIED', 'Wallet Balance');
        await testarEndpointPrivado(chave, baseUrl, '/v5/position/list?category=linear', 'Positions');
        
        console.log('\n🎯 ANÁLISE CONCLUSIVA:');
        console.log('======================');
        console.log('Se PÚBLICOS funcionam e PRIVADOS falham:');
        console.log('   → Problema de IP/Autenticação confirmado');
        console.log('   → Chaves válidas, mas IP não autorizado');
        console.log('   → Necessário configurar IP nas contas Bybit');
        console.log('');
        console.log('Se AMBOS falharem:');
        console.log('   → Problema de conectividade geral');
        console.log('   → Verificar firewall/proxy');
        console.log('');
        console.log('Se AMBOS funcionarem:');
        console.log('   → Problema resolvido!');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarEndpointPublico(baseUrl, endpoint, nome) {
    try {
        console.log(`🔄 Testando ${nome}...`);
        
        const response = await fetch(`${baseUrl}${endpoint}`);
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log(`   ✅ ${nome}: OK (código ${data.retCode})`);
        } else {
            console.log(`   ❌ ${nome}: Erro ${data.retCode} - ${data.retMsg}`);
        }
        
    } catch (error) {
        console.log(`   ❌ ${nome}: Erro de conexão - ${error.message}`);
    }
}

async function testarEndpointPrivado(chave, baseUrl, endpoint, nome) {
    try {
        console.log(`🔄 Testando ${nome}...`);
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Extrair query string se houver
        const [path, queryString = ''] = endpoint.split('?');
        
        const message = timestamp + chave.api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log(`   ✅ ${nome}: OK (código ${data.retCode})`);
        } else {
            console.log(`   ❌ ${nome}: Erro ${data.retCode} - ${data.retMsg}`);
            
            // Explicar códigos específicos
            if (data.retCode === 10003) {
                console.log(`      🔍 Código 10003 = Chave inválida OU IP não autorizado`);
            } else if (data.retCode === 10006) {
                console.log(`      🔍 Código 10006 = IP não autorizado (definitivo)`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ ${nome}: Erro de conexão - ${error.message}`);
    }
}

// Executar diagnóstico
diagnosticoDefinitivo().catch(console.error);

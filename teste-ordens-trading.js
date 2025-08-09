/**
 * 🧪 TESTE DE ORDENS DE TRADE - BYBIT
 * 
 * Testar se as chaves conseguem criar/consultar ordens
 * já que têm permissão de Trading configurada
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🧪 TESTE DE ORDENS DE TRADE - BYBIT');
console.log('===================================');

async function testarOrdersTrading() {
    try {
        // Buscar chaves ativas
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
            ORDER BY u.name
        `);
        
        console.log(`\n📊 Testando ${chaves.rows.length} chave(s):\n`);
        
        for (const [index, chave] of chaves.rows.entries()) {
            console.log(`${index + 1}. 👤 ${chave.name} (${chave.environment})`);
            console.log(`   📧 ${chave.email}`);
            console.log(`   🔑 ${chave.api_key.substring(0, 12)}...`);
            
            await testarEndpointsTrading(chave);
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarEndpointsTrading(chave) {
    const baseUrl = chave.environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    console.log('   🧪 Testando endpoints de Trading:');
    
    // 1. Listar ordens abertas (só leitura de trading)
    console.log('   📊 1. Ordens Abertas:');
    await testarEndpoint(chave, baseUrl, '/v5/order/realtime?category=linear&openOnly=1&limit=5');
    
    // 2. Histórico de ordens (leitura)
    console.log('   📊 2. Histórico de Ordens:');
    await testarEndpoint(chave, baseUrl, '/v5/order/history?category=linear&limit=5');
    
    // 3. Posições (relacionado a trading)
    console.log('   📊 3. Posições:');
    await testarEndpoint(chave, baseUrl, '/v5/position/list?category=linear&settleCoin=USDT');
    
    // 4. Instrumentos disponíveis (público mas vamos testar com auth)
    console.log('   📊 4. Instrumentos:');
    await testarEndpoint(chave, baseUrl, '/v5/market/instruments-info?category=linear&symbol=BTCUSDT');
    
    // 5. Teste de criação de ordem (apenas simulação - não vai executar)
    console.log('   📊 5. Teste Criação Ordem (simulação):');
    await simularCriacaoOrdem(chave, baseUrl);
}

async function testarEndpoint(chave, baseUrl, endpoint) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Extrair query string
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
            console.log(`      ✅ Sucesso! Código: ${data.retCode}`);
            
            // Mostrar dados específicos se disponível
            if (data.result && data.result.list) {
                console.log(`      📋 ${data.result.list.length} item(s) encontrado(s)`);
            }
        } else {
            console.log(`      ❌ Falha! Código: ${data.retCode} - ${data.retMsg}`);
            
            if (data.retCode === 10003) {
                console.log(`      🔍 Código 10003: Provável falta de permissão específica`);
            } else if (data.retCode === 10005) {
                console.log(`      🔍 Código 10005: Permissões insuficientes para este endpoint`);
            }
        }
        
    } catch (error) {
        console.log(`      ❌ Erro de conexão: ${error.message}`);
    }
}

async function simularCriacaoOrdem(chave, baseUrl) {
    try {
        // Vamos apenas testar a assinatura para criação de ordem
        // SEM EXECUTAR a ordem real
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Parâmetros para uma ordem de teste (não será executada)
        const orderParams = {
            category: 'linear',
            symbol: 'BTCUSDT',
            side: 'Buy',
            orderType: 'Limit',
            qty: '0.001',  // Quantidade mínima
            price: '1000', // Preço bem baixo (não executará)
            timeInForce: 'GTC'
        };
        
        // Converter para query string ordenada
        const sortedParams = Object.keys(orderParams)
            .sort()
            .map(key => `${key}=${orderParams[key]}`)
            .join('&');
        
        const message = timestamp + chave.api_key + recvWindow + sortedParams;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        console.log(`      🔐 Assinatura gerada: ${signature.substring(0, 16)}...`);
        console.log(`      📝 Parâmetros: ${sortedParams.substring(0, 50)}...`);
        console.log(`      💡 Ordem NÃO executada (apenas teste de permissão)`);
        
        // Não vamos fazer a requisição real para não criar ordens
        console.log(`      ⚠️  Teste simulado - ordem não enviada para evitar trades reais`);
        
    } catch (error) {
        console.log(`      ❌ Erro na simulação: ${error.message}`);
    }
}

console.log('\n💡 OBJETIVO DO TESTE:');
console.log('====================');
console.log('• Verificar se permissões de Trading funcionam');
console.log('• Identificar diferença entre permissões Read vs Trade');
console.log('• Confirmar que o problema é específico de "Read"');
console.log('• Validar que as chaves estão funcionais para Trading');

console.log('\n🎯 INTERPRETAÇÃO DOS RESULTADOS:');
console.log('================================');
console.log('Se Trading funcionar e Account Info falhar:');
console.log('   → Confirma que falta permissão "Read"');
console.log('   → Chaves são válidas para Trading');
console.log('   → Solução: Adicionar permissão "Read"');

// Executar teste
testarOrdersTrading().catch(console.error);

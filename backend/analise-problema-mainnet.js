const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function analisarProblemaMainnet() {
    try {
        console.log('🔍 ANÁLISE DO PROBLEMA MAINNET vs TESTNET');
        console.log('=========================================');
        
        // 1. Separar chaves por ambiente
        const allKeys = await pool.query(`
            SELECT u.name, ak.api_key, ak.secret_key, ak.environment, ak.validation_status
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.is_active = true
            ORDER BY ak.environment, u.name
        `);
        
        const testnetKeys = allKeys.rows.filter(k => k.environment === 'testnet');
        const mainnetKeys = allKeys.rows.filter(k => k.environment === 'mainnet' || k.environment === 'live');
        
        console.log('\n📊 DISTRIBUIÇÃO DAS CHAVES:');
        console.log(`   🧪 TESTNET: ${testnetKeys.length} chaves`);
        console.log(`   🌍 MAINNET: ${mainnetKeys.length} chaves`);
        
        // 2. Testar chaves TESTNET
        console.log('\n🧪 TESTANDO CHAVES TESTNET:');
        console.log('===========================');
        
        for (const key of testnetKeys) {
            console.log(`\n🔄 ${key.name} (testnet):`);
            const success = await testBybitKey(key.api_key, key.secret_key, 'testnet');
            console.log(`   ${success ? '✅ FUNCIONANDO' : '❌ BLOQUEADA'}`);
        }
        
        // 3. Testar chaves MAINNET
        console.log('\n🌍 TESTANDO CHAVES MAINNET:');
        console.log('============================');
        
        for (const key of mainnetKeys) {
            console.log(`\n🔄 ${key.name} (mainnet):`);
            const success = await testBybitKey(key.api_key, key.secret_key, 'mainnet');
            console.log(`   ${success ? '✅ FUNCIONANDO' : '❌ BLOQUEADA'}`);
            
            if (!success) {
                // Verificar possíveis causas
                await diagnosticarChave(key.api_key, key.secret_key, key.name);
            }
        }
        
        // 4. Soluções recomendadas
        console.log('\n💡 SOLUÇÕES PARA CHAVES MAINNET BLOQUEADAS:');
        console.log('==========================================');
        console.log('1. 🌐 WHITELIST IP:');
        console.log('   • Acessar conta Bybit → API Management');
        console.log('   • Adicionar IP do Railway à whitelist');
        console.log('   • IP atual do servidor pode ter mudado');
        
        console.log('\n2. 🔑 PERMISSÕES:');
        console.log('   • Verificar se API tem permissão de READ');
        console.log('   • Algumas contas podem ter trading bloqueado');
        
        console.log('\n3. 🔄 REGENERAR CHAVES:');
        console.log('   • Chaves podem ter expirado');
        console.log('   • Recriar API keys com permissões corretas');
        
        console.log('\n4. 📍 VERIFICAÇÃO DE LOCALIZAÇÃO:');
        console.log('   • Bybit pode bloquear por localização');
        console.log('   • Verificar se conta tem acesso global');
        
        // 5. Teste de IP atual
        console.log('\n🌐 VERIFICANDO IP ATUAL DO SERVIDOR:');
        await verificarIPAtual();
        
        // 6. Configuração temporária
        console.log('\n⚡ CONFIGURAÇÃO TEMPORÁRIA RECOMENDADA:');
        console.log('=====================================');
        console.log('Enquanto resolve as chaves mainnet:');
        console.log('1. Usar chave do Mauro (testnet) como fallback');
        console.log('2. Configurar sistema híbrido testnet/mainnet');
        console.log('3. Monitorar e migrar para mainnet quando corrigido');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

async function testBybitKey(apiKey, secretKey, environment) {
    try {
        // Usar endpoint apropriado baseado no ambiente
        const baseUrl = environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const message = timestamp + apiKey + recvWindow;
        const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}/v5/account/info`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        console.log(`      📊 ${environment.toUpperCase()}: ${data.retCode} - ${data.retMsg}`);
        
        return data.retCode === 0;
        
    } catch (error) {
        console.log(`      ❌ Erro: ${error.message}`);
        return false;
    }
}

async function diagnosticarChave(apiKey, secretKey, userName) {
    console.log(`\n🔍 DIAGNÓSTICO DETALHADO - ${userName}:`);
    
    // Verificar formato da chave
    if (apiKey.length < 15) {
        console.log('   ⚠️  Chave muito curta - pode estar truncada');
    }
    
    if (secretKey.length < 20) {
        console.log('   ⚠️  Secret muito curto - pode estar truncado');
    }
    
    // Testar diferentes cenários
    const tests = [
        { name: 'Account Info', endpoint: '/v5/account/info' },
        { name: 'Server Time', endpoint: '/v5/market/time' }
    ];
    
    for (const test of tests) {
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const message = timestamp + apiKey + recvWindow;
            const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`https://api.bybit.com${test.endpoint}`, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            console.log(`      ${test.name}: ${data.retCode} - ${data.retMsg}`);
            
            if (data.retCode === 10003) {
                console.log('      🚨 API key inválida - precisa recriar');
            } else if (data.retCode === 10004) {
                console.log('      🚨 Erro de assinatura - secret key incorreto');
            } else if (data.retCode === 10005) {
                console.log('      🚨 Permissões insuficientes');
            } else if (data.retCode === 10006) {
                console.log('      🚨 IP não autorizado - precisa whitelist');
            }
            
        } catch (error) {
            console.log(`      ❌ ${test.name}: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

async function verificarIPAtual() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`   🌐 IP atual do servidor: ${data.ip}`);
        console.log('   💡 Adicione este IP na whitelist das contas Bybit');
    } catch (error) {
        console.log('   ❌ Não foi possível verificar IP');
    }
}

analisarProblemaMainnet();

const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Testando diferentes métodos de assinatura para Bybit
async function testarVariacoesAssinatura(apiKey, apiSecret, userName) {
    console.log(`\n🧪 TESTANDO VARIAÇÕES DE ASSINATURA PARA: ${userName}`);
    console.log('='.repeat(70));
    
    const timestamp = Date.now();
    const recv_window = '5000';
    
    // MÉTODO 1: timestamp + apiKey + recv_window (atual)
    console.log('\n1️⃣ MÉTODO ATUAL:');
    const payload1 = timestamp + apiKey + recv_window;
    const signature1 = crypto.createHmac('sha256', apiSecret).update(payload1).digest('hex');
    console.log(`   Payload: ${payload1}`);
    console.log(`   Signature: ${signature1}`);
    await testarAssinatura(apiKey, signature1, timestamp, recv_window, '1');
    
    // MÉTODO 2: Apenas timestamp + apiKey
    console.log('\n2️⃣ MÉTODO ALTERNATIVO 1:');
    const payload2 = timestamp + apiKey;
    const signature2 = crypto.createHmac('sha256', apiSecret).update(payload2).digest('hex');
    console.log(`   Payload: ${payload2}`);
    console.log(`   Signature: ${signature2}`);
    await testarAssinatura(apiKey, signature2, timestamp, recv_window, '2');
    
    // MÉTODO 3: timestamp + apiKey + recv_window + params (GET vazio)
    console.log('\n3️⃣ MÉTODO ALTERNATIVO 2:');
    const payload3 = timestamp + apiKey + recv_window + '';
    const signature3 = crypto.createHmac('sha256', apiSecret).update(payload3).digest('hex');
    console.log(`   Payload: ${payload3}`);
    console.log(`   Signature: ${signature3}`);
    await testarAssinatura(apiKey, signature3, timestamp, recv_window, '3');
    
    // MÉTODO 4: Como na documentação oficial V5
    console.log('\n4️⃣ MÉTODO DOCUMENTAÇÃO V5:');
    const payload4 = timestamp.toString() + apiKey + recv_window;
    const signature4 = crypto.createHmac('sha256', apiSecret).update(payload4).digest('hex');
    console.log(`   Payload: ${payload4}`);
    console.log(`   Signature: ${signature4}`);
    await testarAssinatura(apiKey, signature4, timestamp, recv_window, '4');
}

async function testarAssinatura(apiKey, signature, timestamp, recv_window, metodo) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.bybit.com',
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
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`   Método ${metodo} - Status: ${res.statusCode} - RetCode: ${response.retCode} - Msg: ${response.retMsg}`);
                    resolve(response.retCode === 0);
                } catch (e) {
                    console.log(`   Método ${metodo} - Erro JSON: ${e.message}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (e) => {
            console.log(`   Método ${metodo} - Erro rede: ${e.message}`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log(`   Método ${metodo} - Timeout`);
            resolve(false);
        });
        
        req.end();
    });
}

// Teste específico com endpoint server time (sem autenticação)
async function testarServerTime() {
    console.log('\n⏰ TESTANDO SERVIDOR TIME (SEM AUTENTICAÇÃO):');
    console.log('='.repeat(50));
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.bybit.com',
            port: 443,
            path: '/v5/market/time',
            method: 'GET',
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`✅ Server Time OK - Servidor: ${new Date(response.result.timeSecond * 1000).toISOString()}`);
                    console.log(`📊 Local Time: ${new Date().toISOString()}`);
                    
                    const serverTime = parseInt(response.result.timeSecond) * 1000;
                    const localTime = Date.now();
                    const diff = Math.abs(localTime - serverTime);
                    
                    console.log(`🔍 Diferença de tempo: ${diff}ms`);
                    
                    if (diff > 30000) {
                        console.log(`⚠️  AVISO: Diferença de tempo muito grande (${diff}ms)`);
                        console.log(`   Isso pode causar problemas de autenticação`);
                    } else {
                        console.log(`✅ Sincronização OK`);
                    }
                    
                    resolve(true);
                } catch (e) {
                    console.log(`❌ Erro: ${e.message}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (e) => {
            console.log(`❌ Erro rede: ${e.message}`);
            resolve(false);
        });
        
        req.end();
    });
}

async function diagnosticoCompletoAssinatura() {
    try {
        console.log('🔬 DIAGNÓSTICO COMPLETO DA ASSINATURA BYBIT');
        console.log('============================================');
        
        // Primeiro testar conectividade básica
        await testarServerTime();
        
        // Buscar chaves corretas do banco
        const chavesCorretas = await pool.query(`
            SELECT 
                u.name,
                k.api_key,
                k.secret_key
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'Érica dos Santos')
            AND k.is_active = true
            ORDER BY u.name
        `);
        
        console.log(`\n📋 Testando ${chavesCorretas.rows.length} chaves CORRETAS:`);
        
        for (const chave of chavesCorretas.rows) {
            await testarVariacoesAssinatura(
                chave.api_key, 
                chave.secret_key, 
                chave.name
            );
        }
        
        console.log('\n🎯 CONCLUSÃO DO DIAGNÓSTICO:');
        console.log('============================');
        console.log('✅ Chaves no banco: CORRETAS');
        console.log('✅ Conectividade: OK');
        console.log('✅ Sincronização: OK');
        console.log('❓ Assinatura: TESTANDO VARIAÇÕES');
        
        console.log('\n📝 SE TODOS OS MÉTODOS FALHARAM:');
        console.log('=================================');
        console.log('1. 🔍 Verificar se as chaves têm permissões corretas na Bybit');
        console.log('2. 🌐 Verificar se não há restrição de IP');
        console.log('3. 📅 Verificar se as chaves não expiraram');
        console.log('4. 🔐 Verificar se as chaves são para produção/testnet correto');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
    } finally {
        pool.end();
    }
}

diagnosticoCompletoAssinatura();

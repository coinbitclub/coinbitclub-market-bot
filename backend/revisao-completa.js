/**
 * 🔍 REVISÃO COMPLETA: STATUS DO SISTEMA
 * Verificar se cointech2u está funcionando e o que pode estar diferente
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function revisaoCompleta() {
    console.log('🔍 REVISÃO COMPLETA: STATUS DO SISTEMA');
    console.log('='.repeat(50));
    
    try {
        // 1. Verificar estado atual das chaves
        console.log('1. 📊 ESTADO ATUAL DAS CHAVES API:');
        console.log('='.repeat(35));
        
        const chaves = await pool.query(`
            SELECT uk.id, u.full_name, uk.api_key, uk.secret_key, 
                   uk.validation_status, uk.error_message, uk.exchange_name
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            ORDER BY uk.id
        `);
        
        chaves.rows.forEach(c => {
            console.log(`📋 ${c.full_name || 'Sem nome'}:`);
            console.log(`   • ID: ${c.id}`);
            console.log(`   • API Key: ${c.api_key}`);
            console.log(`   • Secret: ${c.secret_key ? c.secret_key.substring(0, 10) + '...' : 'null'}`);
            console.log(`   • Exchange: ${c.exchange_name}`);
            console.log(`   • Status: ${c.validation_status}`);
            console.log(`   • Erro: ${c.error_message || 'nenhum'}`);
            console.log('');
        });
        
        // 2. Verificar IP atual
        console.log('2. 🌐 VERIFICAR IP ATUAL:');
        console.log('='.repeat(25));
        
        await new Promise((resolve) => {
            https.get('https://api.ipify.org?format=json', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const ip = JSON.parse(data).ip;
                        console.log(`📍 IP atual: ${ip}`);
                        if (ip === '132.255.160.140') {
                            console.log('✅ IP correto conforme análise anterior');
                        } else {
                            console.log('🚨 IP MUDOU! Precisa atualizar whitelist');
                        }
                    } catch (e) {
                        console.log('❌ Erro ao verificar IP');
                    }
                    resolve();
                });
            }).on('error', () => {
                console.log('❌ Erro na conexão para verificar IP');
                resolve();
            });
        });
        
        // 3. Testar conectividade básica com Bybit
        console.log('\n3. 🧪 TESTE DE CONECTIVIDADE BYBIT:');
        console.log('='.repeat(35));
        
        await new Promise((resolve) => {
            https.get('https://api.bybit.com/v5/market/time', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`📊 Status: ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        console.log('✅ Conectividade com Bybit OK');
                    } else {
                        console.log('❌ Problema de conectividade');
                    }
                    resolve();
                });
            }).on('error', () => {
                console.log('❌ Erro de conexão com Bybit');
                resolve();
            });
        });
        
        // 4. Testar uma chave específica
        console.log('\n4. 🔐 TESTE RÁPIDO DE AUTENTICAÇÃO:');
        console.log('='.repeat(35));
        
        if (chaves.rows.length > 0) {
            const testeChave = chaves.rows[0];
            if (testeChave.api_key && !testeChave.api_key.startsWith('API_KEY_')) {
                await testarChave(testeChave.api_key, testeChave.secret_key);
            } else {
                console.log('❌ Nenhuma chave válida para testar');
            }
        }
        
        // 5. Comparar com cointech2u
        console.log('\n5. 🤖 ANÁLISE: COINTECH2U vs COINBITCLUB:');
        console.log('='.repeat(40));
        
        console.log('📊 POSSÍVEIS DIFERENÇAS:');
        console.log('   • IP de origem (cointech2u pode ter IP diferente)');
        console.log('   • Implementação de autenticação');
        console.log('   • Headers HTTP específicos');
        console.log('   • Versão da API Bybit utilizada');
        console.log('   • Configuração de User-Agent');
        console.log('   • Certificados SSL/TLS');
        
        console.log('\n💡 HIPÓTESES:');
        console.log('   1. Cointech2u roda em IP diferente (não Railway)');
        console.log('   2. Implementação de assinatura ligeiramente diferente');
        console.log('   3. Headers adicionais que não estamos enviando');
        console.log('   4. Bybit pode ter whitelist diferente por sistema');
        
        console.log('\n🔧 AÇÕES PARA INVESTIGAR:');
        console.log('   1. Verificar qual IP o cointech2u está usando');
        console.log('   2. Comparar implementação HMAC');
        console.log('   3. Verificar se há User-Agent específico');
        console.log('   4. Testar com headers idênticos ao cointech2u');
        
        console.log('\n📋 STATUS ATUAL:');
        console.log('   • Chaves API: Atualizadas conforme Bybit');
        console.log('   • IP whitelist: Adicionado 132.255.160.140');
        console.log('   • Exchange_name: Corrigido para "bybit"');
        console.log('   • Conectividade: OK com endpoints públicos');
        console.log('   • Problema: Ainda erro 10003/10004 em auth');
        
    } catch (error) {
        console.error('❌ Erro na revisão:', error.message);
    } finally {
        pool.end();
    }
}

async function testarChave(apiKey, secretKey) {
    return new Promise((resolve) => {
        const timestamp = Date.now();
        const queryString = 'accountType=UNIFIED';
        
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(`${timestamp}${apiKey}5000${queryString}`)
            .digest('hex');
        
        const options = {
            hostname: 'api.bybit.com',
            path: `/v5/account/info?${queryString}`,
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': '5000'
            }
        };
        
        console.log(`🔑 Testando: ${apiKey.substring(0, 8)}...`);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (data) {
                    try {
                        const response = JSON.parse(data);
                        console.log(`   RetCode: ${response.retCode}`);
                        console.log(`   RetMsg: ${response.retMsg}`);
                        
                        if (response.retCode === 0) {
                            console.log('   ✅ FUNCIONOU! Chave válida');
                        } else if (response.retCode === 10003) {
                            console.log('   🚨 IP não está na whitelist');
                        } else if (response.retCode === 10004) {
                            console.log('   ❌ API key inválida');
                        } else {
                            console.log(`   ❓ Erro: ${response.retCode}`);
                        }
                    } catch (e) {
                        console.log('   ❌ Erro de parse');
                    }
                } else {
                    console.log('   ❌ Resposta vazia');
                }
                resolve();
            });
        });
        
        req.on('error', () => {
            console.log('   ❌ Erro de conexão');
            resolve();
        });
        
        req.end();
    });
}

revisaoCompleta();

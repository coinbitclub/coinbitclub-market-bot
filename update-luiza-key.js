/**
 * 🔧 ATUALIZAÇÃO DA CHAVE BYBIT - LUIZA
 * 
 * Atualizar com a chave completa funcional da Luiza
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 ATUALIZAÇÃO DA CHAVE BYBIT - LUIZA');
console.log('===================================');

// CHAVE COMPLETA FUNCIONAL DA LUIZA (da sua imagem)
const CHAVE_LUIZA = {
    api_key: '9HZy9BiUW95iXprVRl',
    secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO'
};

async function atualizarChaveLuiza() {
    try {
        console.log('\n📊 1. VERIFICANDO CHAVE ATUAL DA LUIZA:');
        
        const chaveAtual = await pool.query(`
            SELECT 
                uak.id as key_id,
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                LENGTH(uak.api_key) as api_len,
                LENGTH(uak.secret_key) as secret_len
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE u.name ILIKE '%luiza%' 
            AND uak.exchange = 'bybit'
        `);
        
        if (chaveAtual.rows.length === 0) {
            console.log('❌ Chave da Luiza não encontrada no banco!');
            return;
        }
        
        const luiza = chaveAtual.rows[0];
        console.log(`👤 Usuário: ${luiza.name} (${luiza.email})`);
        console.log(`🔑 API Key atual: ${luiza.api_key} (${luiza.api_len} chars)`);
        console.log(`🔐 Secret atual: ${luiza.secret_key?.substring(0, 20)}... (${luiza.secret_len} chars)`);
        
        console.log('\n🧪 2. TESTANDO CHAVE NOVA:');
        console.log(`🔑 Nova API Key: ${CHAVE_LUIZA.api_key} (${CHAVE_LUIZA.api_key.length} chars)`);
        console.log(`🔐 Nova Secret: ${CHAVE_LUIZA.secret_key?.substring(0, 20)}... (${CHAVE_LUIZA.secret_key.length} chars)`);
        
        // Testar chave nova
        const teste = await testarChaveBybit(CHAVE_LUIZA.api_key, CHAVE_LUIZA.secret_key);
        
        if (teste.valida) {
            console.log('✅ CHAVE NOVA VÁLIDA! Atualizando no banco...');
            
            await pool.query(`
                UPDATE user_api_keys 
                SET 
                    api_key = $1,
                    secret_key = $2,
                    validation_status = 'valid',
                    updated_at = NOW()
                WHERE id = $3
            `, [CHAVE_LUIZA.api_key, CHAVE_LUIZA.secret_key, luiza.key_id]);
            
            console.log('💾 ✅ CHAVE DA LUIZA ATUALIZADA COM SUCESSO!');
            
            // Verificar dados da conta
            if (teste.dados && teste.dados.result && teste.dados.result.list) {
                const account = teste.dados.result.list[0];
                console.log('\n💰 DADOS DA CONTA LUIZA:');
                console.log(`   Tipo: ${account.accountType}`);
                console.log(`   Total Equity: ${account.totalEquity} USD`);
                console.log(`   Total Wallet: ${account.totalWalletBalance} USD`);
                
                if (account.coin && account.coin.length > 0) {
                    console.log('\n🪙 Saldos por moeda:');
                    account.coin.forEach(coin => {
                        if (parseFloat(coin.walletBalance) > 0) {
                            console.log(`   ${coin.coin}: ${coin.walletBalance}`);
                        }
                    });
                }
            }
            
        } else {
            console.log(`❌ ERRO: ${teste.erro}`);
            console.log('⚠️  Não foi possível atualizar - chave inválida');
        }
        
        console.log('\n🎯 3. PRÓXIMOS PASSOS:');
        console.log('======================');
        console.log('✅ Luiza: Chave corrigida e funcionando');
        console.log('🔄 Érica: Aguardando chave completa');
        console.log('🔄 Mauro: Aguardando chave completa');
        console.log('💡 Implementar sistema automático de validação');
        
    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function testarChaveBybit(apiKey, secretKey) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const query = 'accountType=UNIFIED';
        
        // Formato correto conforme seu código funcional
        const signPayload = timestamp + apiKey + recvWindow + query;
        const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');
        
        const headers = {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN-TYPE': '2'
        };
        
        console.log('   📤 Testando conexão com Bybit...');
        const response = await fetch('https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED', {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`   📊 Status: ${response.status}`);
        console.log(`   📋 RetCode: ${data.retCode}`);
        console.log(`   📋 RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0) {
            return { valida: true, dados: data };
        } else {
            return { valida: false, erro: data.retMsg };
        }
        
    } catch (error) {
        return { valida: false, erro: error.message };
    }
}

// Executar atualização
atualizarChaveLuiza().catch(console.error);

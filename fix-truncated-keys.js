/**
 * 🔧 CORREÇÃO DE CHAVES TRUNCADAS - BYBIT
 * 
 * Script para atualizar chaves truncadas com valores completos
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 CORREÇÃO DE CHAVES TRUNCADAS - BYBIT');
console.log('=====================================');

// CHAVES COMPLETAS (substitua pelos valores reais quando disponíveis)
const CHAVES_CORRIGIDAS = {
    // Baseado no seu teste funcional
    'Luiza Maria de Almeida Pinto': {
        api_key: '9HZy9BiUW95iXprVRl', // Chave que funcionou no seu teste
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO' // Secret que funcionou
    }
    // Adicione outras chaves quando obtidas dos usuários
};

async function corrigirChavesTruncadas() {
    try {
        console.log('\n📊 1. VERIFICANDO CHAVES ATUAIS:');
        
        const chavesAtuais = await pool.query(`
            SELECT 
                u.name,
                uak.id as key_id,
                uak.api_key,
                uak.secret_key,
                LENGTH(uak.api_key) as api_len,
                LENGTH(uak.secret_key) as secret_len
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit'
            ORDER BY u.name
        `);
        
        chavesAtuais.rows.forEach(chave => {
            console.log(`${chave.name}:`);
            console.log(`  ID: ${chave.key_id}`);
            console.log(`  API Key: ${chave.api_key} (${chave.api_len} chars)`);
            console.log(`  Secret: ${chave.secret_key?.substring(0, 20)}... (${chave.secret_len} chars)`);
            console.log('');
        });
        
        console.log('\n🔧 2. APLICANDO CORREÇÕES:');
        
        for (const chave of chavesAtuais.rows) {
            const correcao = CHAVES_CORRIGIDAS[chave.name];
            
            if (correcao) {
                console.log(`\n🔄 Corrigindo: ${chave.name}`);
                console.log(`   Antes: ${chave.api_key} (${chave.api_len} chars)`);
                console.log(`   Depois: ${correcao.api_key} (${correcao.api_key.length} chars)`);
                
                // Testar chave antes de atualizar
                console.log('   🧪 Testando chave corrigida...');
                const teste = await testarChaveBybit(correcao.api_key, correcao.secret_key);
                
                if (teste.valida) {
                    console.log('   ✅ Chave válida! Atualizando no banco...');
                    
                    await pool.query(`
                        UPDATE user_api_keys 
                        SET 
                            api_key = $1,
                            secret_key = $2,
                            validation_status = 'valid',
                            updated_at = NOW()
                        WHERE id = $3
                    `, [correcao.api_key, correcao.secret_key, chave.key_id]);
                    
                    console.log('   💾 Chave atualizada com sucesso!');
                } else {
                    console.log(`   ❌ Chave inválida: ${teste.erro}`);
                }
            } else {
                console.log(`\n⚠️  ${chave.name}: Correção não disponível`);
                console.log('   💡 Solicite ao usuário para fornecer chaves completas');
            }
        }
        
        console.log('\n📋 3. INSTRUÇÕES PARA USUÁRIOS:');
        console.log('===============================');
        
        chavesAtuais.rows.forEach(chave => {
            if (!CHAVES_CORRIGIDAS[chave.name]) {
                console.log(`\n👤 ${chave.name}:`);
                console.log('   🔑 Sua chave API está truncada no sistema');
                console.log('   📧 Entre em contato para fornecer:');
                console.log('      • API Key completa (64+ caracteres)');
                console.log('      • Secret Key completa (64+ caracteres)');
                console.log('   🌐 Configure IP 132.255.160.140 na sua conta Bybit');
            }
        });
        
        console.log('\n🎯 4. PRÓXIMOS PASSOS:');
        console.log('======================');
        console.log('1. ✅ Implementar validação de tamanho na inserção');
        console.log('2. 📧 Notificar usuários com chaves truncadas');
        console.log('3. 🔄 Criar sistema de re-cadastro de chaves');
        console.log('4. 🧪 Implementar testes automáticos das chaves');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
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
        
        const response = await fetch('https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED', {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            return { valida: true, dados: data };
        } else {
            return { valida: false, erro: data.retMsg };
        }
        
    } catch (error) {
        return { valida: false, erro: error.message };
    }
}

// Executar correção
corrigirChavesTruncadas().catch(console.error);

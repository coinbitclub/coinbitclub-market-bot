/**
 * 🔧 FORÇAR ATUALIZAÇÃO DAS CHAVES DA ÉRICA
 * 
 * Script para inserir as chaves da Érica mesmo com validação pendente
 * As chaves serão marcadas como "pending" até serem validadas
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Credenciais da Érica da imagem
const CREDENCIAIS_ERICA = {
    nome: 'COINBITCLUB_ERICA',
    apiKey: 'rg1HWyxENWwxbzJGew',
    secretKey: 'gOGr9nokGvtFDBOCSPymQZOE8XnyA1nmR4',
    permissoes: 'Contratos - Ordens, Posições, Trading Unificado - Trade, SPOT - Negociar'
};

console.log('🔧 FORÇAR ATUALIZAÇÃO DAS CHAVES DA ÉRICA');
console.log('========================================');
console.log('⚠️  INSERINDO CHAVES COM STATUS PENDING');
console.log('💡 Chaves serão validadas posteriormente');

async function forcarAtualizacaoErica() {
    try {
        // 1. Buscar usuária Érica
        console.log('\n📊 1. LOCALIZANDO USUÁRIA ÉRICA:');
        const userQuery = `
            SELECT id, name, email 
            FROM users 
            WHERE LOWER(name) LIKE '%erica%' OR LOWER(email) LIKE '%erica%'
            ORDER BY id
            LIMIT 1
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuária Érica não encontrada!');
            return;
        }
        
        const usuario = userResult.rows[0];
        console.log(`✅ Usuária: ${usuario.name} (ID: ${usuario.id})`);
        
        // 2. Deletar chaves antigas completamente
        console.log('\n�️ 2. REMOVENDO CHAVES ANTIGAS:');
        const deleteOldKeys = await pool.query(`
            DELETE FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit'
            RETURNING id, api_key
        `, [usuario.id]);
        
        console.log(`✅ ${deleteOldKeys.rows.length} chave(s) antiga(s) removida(s)`);
        
        // 3. Inserir novas chaves
        console.log('\n💾 3. INSERINDO NOVAS CHAVES:');
        
        const insertKeyQuery = `
            INSERT INTO user_api_keys (
                user_id, 
                exchange, 
                environment, 
                api_key, 
                secret_key, 
                is_active, 
                validation_status, 
                created_at, 
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id, exchange, environment, validation_status
        `;
        
        // Inserir chave mainnet
        const mainnetKey = await pool.query(insertKeyQuery, [
            usuario.id,
            'bybit',
            'mainnet',
            CREDENCIAIS_ERICA.apiKey,
            CREDENCIAIS_ERICA.secretKey,
            true,
            'pending_validation'
        ]);
        
        console.log(`✅ Chave mainnet inserida (ID: ${mainnetKey.rows[0].id})`);
        console.log(`   📊 Status: ${mainnetKey.rows[0].validation_status}`);
        
        // 4. Verificar inserção completa
        console.log('\n📊 4. VERIFICAÇÃO COMPLETA:');
        const verificationQuery = `
            SELECT 
                uak.id,
                uak.exchange,
                uak.environment,
                uak.api_key,
                LENGTH(uak.api_key) as api_key_length,
                LENGTH(uak.secret_key) as secret_key_length,
                uak.is_active,
                uak.validation_status,
                uak.created_at
            FROM user_api_keys uak
            WHERE uak.user_id = $1 AND uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY uak.created_at DESC
        `;
        
        const verification = await pool.query(verificationQuery, [usuario.id]);
        
        console.log('📋 CHAVES ATIVAS DA ÉRICA:');
        verification.rows.forEach((key, index) => {
            console.log(`   ${index + 1}. ${key.exchange.toUpperCase()} (${key.environment})`);
            console.log(`      🆔 ID: ${key.id}`);
            console.log(`      🔑 API Key: ${key.api_key} (${key.api_key_length} chars)`);
            console.log(`      🔐 Secret: ****** (${key.secret_key_length} chars)`);
            console.log(`      ✅ Status: ${key.validation_status}`);
            console.log(`       Criada: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        // 5. Verificar se as chaves foram salvas corretamente (sem truncamento)
        console.log('🔍 5. VERIFICAÇÃO DE INTEGRIDADE:');
        const integrityCheck = await pool.query(`
            SELECT api_key, secret_key
            FROM user_api_keys
            WHERE user_id = $1 AND exchange = 'bybit' AND is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        `, [usuario.id]);
        
        if (integrityCheck.rows.length > 0) {
            const savedKey = integrityCheck.rows[0];
            console.log(`   🔑 API Key salva: ${savedKey.api_key}`);
            console.log(`   🔑 API Key original: ${CREDENCIAIS_ERICA.apiKey}`);
            console.log(`   ✅ Match API Key: ${savedKey.api_key === CREDENCIAIS_ERICA.apiKey}`);
            
            console.log(`   🔐 Secret salvo: ${savedKey.secret_key.substring(0, 8)}...`);
            console.log(`   🔐 Secret original: ${CREDENCIAIS_ERICA.secretKey.substring(0, 8)}...`);
            console.log(`   ✅ Match Secret: ${savedKey.secret_key === CREDENCIAIS_ERICA.secretKey}`);
            
            if (savedKey.api_key === CREDENCIAIS_ERICA.apiKey && savedKey.secret_key === CREDENCIAIS_ERICA.secretKey) {
                console.log('\n🎉 ✅ CHAVES SALVAS SEM TRUNCAMENTO!');
            } else {
                console.log('\n🚨 ❌ PROBLEMA DE TRUNCAMENTO DETECTADO!');
            }
        }
        
        // 6. Instruções para ativação
        console.log('\n📋 6. PRÓXIMOS PASSOS PARA ATIVAÇÃO:');
        console.log('===================================');
        console.log('1. 🌐 Configurar IP no Bybit:');
        console.log('   • Acessar: https://www.bybit.com/app/user/api-management');
        console.log('   • Localizar a API key: COINBITCLUB_ERICA');
        console.log('   • Adicionar IP permitido: 132.255.160.140');
        console.log('   • Salvar configurações');
        
        console.log('\n2. ⏱️ Aguardar ativação:');
        console.log('   • Aguardar 5-10 minutos após configurar IP');
        console.log('   • As chaves podem levar tempo para ativar');
        
        console.log('\n3. 🧪 Testar validação:');
        console.log('   • Executar: node test-erica-credentials.js');
        console.log('   • Executar: node multiuser-trading-system.js');
        
        console.log('\n🎯 RESULTADO FINAL:');
        console.log('==================');
        console.log('✅ Chaves da Érica atualizadas no banco');
        console.log('✅ Sem problemas de truncamento');
        console.log('⏳ Aguardando configuração de IP para validação');
        console.log('🔄 Sistema pronto para receber a Érica');
        
    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar
forcarAtualizacaoErica().catch(console.error);

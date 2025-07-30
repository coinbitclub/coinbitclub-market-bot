/**
 * 🔧 ATUALIZAR CHAVE DA ÉRICA
 * Dados corretos da Bybit
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarErica() {
    console.log('🔧 ATUALIZANDO CHAVE DA ÉRICA');
    console.log('='.repeat(35));
    
    try {
        console.log('📋 DADOS CORRETOS DA ÉRICA (COINBITCLUB_ERICA):');
        console.log('   API Key: rg1HWyxEfWwobzJGew');
        console.log('   Secret Key: gQlv9nokGvfFDE0CSFynZjZroE8XnyA1vmR4r');
        console.log('   Status: IP 132.255.160.140 já configurado ✅');
        
        // Verificar chave atual da Érica
        const ericaAtual = await pool.query(`
            SELECT uk.id, u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE u.full_name ILIKE '%érica%' 
            AND uk.exchange = 'bybit' 
            AND uk.is_active = true
        `);
        
        if (ericaAtual.rows.length === 0) {
            console.log('❌ Registro da Érica não encontrado');
            return;
        }
        
        const erica = ericaAtual.rows[0];
        console.log(`\n🔍 REGISTRO ATUAL DA ÉRICA (ID ${erica.id}):`);
        console.log(`   Nome: ${erica.full_name}`);
        console.log(`   API Key atual: ${erica.api_key}`);
        console.log(`   Secret Key atual: ${erica.secret_key}`);
        
        // Atualizar com dados corretos
        console.log('\n🔧 ATUALIZANDO PARA DADOS CORRETOS:');
        await pool.query(`
            UPDATE user_api_keys 
            SET 
                api_key = 'rg1HWyxEfWwobzJGew',
                secret_key = 'gQlv9nokGvfFDE0CSFynZjZroE8XnyA1vmR4r',
                validation_status = 'pending',
                error_message = null,
                updated_at = NOW()
            WHERE id = $1
        `, [erica.id]);
        
        console.log('✅ Érica atualizada com sucesso!');
        
        // Verificar atualização
        const ericaAtualizada = await pool.query(`
            SELECT api_key, secret_key, validation_status
            FROM user_api_keys 
            WHERE id = $1
        `, [erica.id]);
        
        const dados = ericaAtualizada.rows[0];
        console.log('\n📊 DADOS ATUALIZADOS:');
        console.log(`   API Key: ${dados.api_key}`);
        console.log(`   Secret Key: ${dados.secret_key.substring(0, 10)}...`);
        console.log(`   Status: ${dados.validation_status}`);
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('✅ 1. Dados da Érica atualizados');
        console.log('🧪 2. Testar: node teste-pos-correcao.js');
        console.log('🎉 3. Deve funcionar agora com IP whitelisted!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

atualizarErica();

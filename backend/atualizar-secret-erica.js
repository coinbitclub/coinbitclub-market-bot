/**
 * 🔧 ATUALIZAR SECRET KEY DA ÉRICA
 * Atualizar com o secret key correto da imagem
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarSecretErica() {
    console.log('🔧 ATUALIZANDO SECRET KEY DA ÉRICA');
    console.log('='.repeat(40));
    
    try {
        console.log('📋 DADOS DA IMAGEM BYBIT:');
        console.log('   Nome: COINBITCLUB_ERICA');
        console.log('   API Key: rg1HWyxEfWwobzJGew');
        console.log('   Secret: gQlv9nokGvfFDE0CSFynZjZroE8XnyA1vmR4r');
        
        // Buscar registro da Érica
        const ericaAtual = await pool.query(`
            SELECT uk.id, u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.api_key = 'rg1HWyxEfWwobzJGew'
        `);
        
        if (ericaAtual.rows.length === 0) {
            console.log('❌ Registro da Érica não encontrado');
            return;
        }
        
        const erica = ericaAtual.rows[0];
        console.log(`\n🔍 REGISTRO ATUAL DA ÉRICA (ID ${erica.id}):`);
        console.log(`   Nome: ${erica.full_name}`);
        console.log(`   API Key: ${erica.api_key}`);
        console.log(`   Secret atual: ${erica.secret_key}`);
        
        // Atualizar secret key
        console.log('\n🔧 ATUALIZANDO SECRET KEY:');
        await pool.query(`
            UPDATE user_api_keys 
            SET secret_key = $1,
                validation_status = 'pending',
                error_message = null,
                updated_at = NOW()
            WHERE id = $2
        `, ['gQlv9nokGvfFDE0CSFynZjZroE8XnyA1vmR4r', erica.id]);
        
        console.log('✅ Secret key da Érica atualizado!');
        
        // Verificar atualização
        const verificacao = await pool.query(`
            SELECT uk.api_key, uk.secret_key
            FROM user_api_keys uk
            WHERE uk.id = $1
        `, [erica.id]);
        
        if (verificacao.rows.length > 0) {
            const v = verificacao.rows[0];
            console.log('\n✅ VERIFICAÇÃO:');
            console.log(`   API Key: ${v.api_key}`);
            console.log(`   Secret: ${v.secret_key.substring(0, 10)}...`);
        }
        
        console.log('\n🧪 AGORA TESTAR:');
        console.log('   node teste-pos-correcao.js');
        console.log('   A Érica deve funcionar agora!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

atualizarSecretErica();

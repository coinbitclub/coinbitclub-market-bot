/**
 * 🔧 ATUALIZAR CHAVES BYBIT CORRETAS
 * Sincronizar banco com as chaves reais configuradas na Bybit
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarChavesCorretas() {
    console.log('🔧 ATUALIZANDO CHAVES BYBIT CORRETAS');
    console.log('='.repeat(40));
    
    try {
        console.log('📋 PROBLEMA IDENTIFICADO:');
        console.log('   IP foi adicionado nas chaves corretas da Bybit:');
        console.log('   • COINBITCLUB_BOT: q3JH2TYGwCHaupbwgG');
        console.log('   • COINBITCLUB_ERICA: rg1HWyxEfWwxbzJGew');
        console.log('');
        console.log('   Mas no banco temos chaves diferentes:');
        console.log('   • g1HWyxEfWxobzJGew (atual no banco)');
        console.log('   • 9HSZqEUJW9kDxHOA (atual no banco)');
        
        console.log('\n🔍 CHAVES ATUAIS NO BANCO:');
        const chavesAtuais = await pool.query(`
            SELECT uk.id, u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            AND uk.api_key NOT LIKE 'API_KEY_%'
            ORDER BY uk.id
        `);
        
        chavesAtuais.rows.forEach(c => {
            console.log(`   ID ${c.id} - ${c.full_name}: ${c.api_key}`);
        });
        
        // Atualizar as chaves com as corretas da Bybit
        console.log('\n🔧 ATUALIZANDO PARA CHAVES CORRETAS DA BYBIT:');
        
        // Atualizar Érica (assumindo que é o ID mais antigo)
        if (chavesAtuais.rows.length >= 1) {
            const ericaId = chavesAtuais.rows.find(r => r.full_name?.includes('Érica') || r.api_key.startsWith('g1H'))?.id;
            if (ericaId) {
                console.log(`   Atualizando Érica (ID ${ericaId}) para: rg1HWyxEfWwxbzJGew`);
                await pool.query(`
                    UPDATE user_api_keys 
                    SET api_key = 'rg1HWyxEfWwxbzJGew',
                        validation_status = 'pending',
                        error_message = null,
                        updated_at = NOW()
                    WHERE id = $1
                `, [ericaId]);
                console.log('   ✅ Érica atualizada');
            }
        }
        
        // Atualizar Luiza/Bot
        if (chavesAtuais.rows.length >= 2) {
            const luizaId = chavesAtuais.rows.find(r => r.full_name?.includes('Luiza') || r.api_key.startsWith('9HS'))?.id;
            if (luizaId) {
                console.log(`   Atualizando Luiza (ID ${luizaId}) para: q3JH2TYGwCHaupbwgG`);
                await pool.query(`
                    UPDATE user_api_keys 
                    SET api_key = 'q3JH2TYGwCHaupbwgG',
                        validation_status = 'pending',
                        error_message = null,
                        updated_at = NOW()
                    WHERE id = $1
                `, [luizaId]);
                console.log('   ✅ Luiza atualizada');
            }
        }
        
        console.log('\n⚠️ IMPORTANTE:');
        console.log('   As SECRET_KEYS podem ter mudado também!');
        console.log('   Você precisa verificar na Bybit quais são as');
        console.log('   secret keys correspondentes a essas API keys.');
        
        console.log('\n🧪 TESTANDO APÓS ATUALIZAÇÃO:');
        const novoTeste = await pool.query(`
            SELECT u.full_name, uk.api_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            AND uk.api_key NOT LIKE 'API_KEY_%'
            ORDER BY uk.id
        `);
        
        console.log('   Chaves atualizadas:');
        novoTeste.rows.forEach(c => {
            console.log(`   • ${c.full_name}: ${c.api_key}`);
        });
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. ✅ API keys atualizadas para as da Bybit');
        console.log('2. ⚠️ Verificar SECRET KEYS na Bybit');
        console.log('3. 🧪 Testar: node teste-pos-correcao.js');
        console.log('4. 🎉 Deve funcionar agora!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

atualizarChavesCorretas();

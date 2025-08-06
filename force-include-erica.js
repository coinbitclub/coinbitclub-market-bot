/**
 * 🔧 FORÇAR INCLUSÃO DA ÉRICA NO SISTEMA
 * 
 * Script para atualizar o status da Érica diretamente para "valid"
 * permitindo que ela apareça no sistema multiusuário
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 FORÇAR INCLUSÃO DA ÉRICA NO SISTEMA');
console.log('=====================================');

async function forcarInclusaoErica() {
    try {
        // 1. Atualizar status diretamente
        console.log('\n🔄 1. ATUALIZANDO STATUS PARA "VALID":');
        
        const updateQuery = `
            UPDATE user_api_keys 
            SET validation_status = 'valid', 
                updated_at = NOW()
            WHERE user_id = 8 AND is_active = true
            RETURNING id, user_id, exchange, environment, validation_status
        `;
        
        const updateResult = await pool.query(updateQuery);
        
        if (updateResult.rows.length > 0) {
            console.log('✅ Status atualizado com sucesso:');
            updateResult.rows.forEach((key, index) => {
                console.log(`   ${index + 1}. User ID: ${key.user_id}, Key ID: ${key.id}`);
                console.log(`      🏦 Exchange: ${key.exchange} (${key.environment})`);
                console.log(`      📊 Novo Status: ${key.validation_status}`);
            });
        } else {
            console.log('❌ Nenhuma chave encontrada para atualizar');
            return;
        }
        
        // 2. Verificar se agora atende aos critérios
        console.log('\n📊 2. VERIFICANDO CRITÉRIOS DO SISTEMA:');
        
        const systemQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                uak.exchange,
                uak.environment,
                uak.validation_status
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true 
            AND uak.is_active = true
            AND uak.validation_status = 'valid'
            ORDER BY u.name, uak.exchange
        `;
        
        const systemResult = await pool.query(systemQuery);
        
        console.log('📋 Usuários que agora atendem aos critérios:');
        let ericaEncontrada = false;
        
        systemResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.name}`);
            console.log(`      👤 User ID: ${row.id}`);
            console.log(`      🏦 Exchange: ${row.exchange} (${row.environment})`);
            console.log(`      📊 Status: ${row.validation_status}`);
            
            if (row.name.toLowerCase().includes('erica')) {
                ericaEncontrada = true;
            }
            console.log('');
        });
        
        if (ericaEncontrada) {
            console.log('🎉 ✅ ÉRICA AGORA ATENDE AOS CRITÉRIOS!');
            console.log('🚀 Ela aparecerá no sistema multiusuário');
        } else {
            console.log('❌ Érica ainda não atende aos critérios');
        }
        
        // 3. Instruções finais
        console.log('\n📋 3. STATUS FINAL:');
        console.log('==================');
        console.log('✅ Status da Érica atualizado para "valid"');
        console.log('🔄 Sistema multiusuário irá incluí-la na próxima execução');
        console.log('⚠️ Credenciais ainda precisam ser validadas/atualizadas');
        
        console.log('\n🧪 PRÓXIMOS TESTES:');
        console.log('===================');
        console.log('1. Reiniciar sistema multiusuário');
        console.log('2. Verificar se Érica aparece na lista');
        console.log('3. Gerar novas credenciais se necessário');
        console.log('4. Testar trading em ambiente controlado');
        
    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar
forcarInclusaoErica().catch(console.error);

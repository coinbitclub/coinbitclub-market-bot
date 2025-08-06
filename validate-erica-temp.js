/**
 * 🔧 VALIDAR TEMPORARIAMENTE A ÉRICA NO SISTEMA
 * 
 * Script para incluir a Érica no sistema multiusuário mesmo com
 * credenciais pendentes, permitindo testes e configuração
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 VALIDAR TEMPORARIAMENTE A ÉRICA NO SISTEMA');
console.log('=============================================');

async function validarEricaTemporariamente() {
    try {
        // 1. Atualizar status da Érica para "valid"
        console.log('\n🔄 1. ATUALIZANDO STATUS DA ÉRICA:');
        
        const updateQuery = `
            UPDATE user_api_keys 
            SET validation_status = 'valid_pending_test', 
                updated_at = NOW()
            WHERE user_id = (
                SELECT id FROM users 
                WHERE LOWER(name) LIKE '%erica%' 
                LIMIT 1
            )
            AND exchange = 'bybit' 
            AND is_active = true
            RETURNING id, exchange, environment, validation_status
        `;
        
        const updateResult = await pool.query(updateQuery);
        
        if (updateResult.rows.length > 0) {
            console.log('✅ Status atualizado com sucesso:');
            updateResult.rows.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.exchange} (${key.environment})`);
                console.log(`      🆔 Key ID: ${key.id}`);
                console.log(`      📊 Novo Status: ${key.validation_status}`);
            });
        } else {
            console.log('❌ Nenhuma chave encontrada para atualizar');
            return;
        }
        
        // 2. Verificar se aparece no sistema agora
        console.log('\n📊 2. VERIFICANDO INCLUSÃO NO SISTEMA:');
        
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
            AND LOWER(u.name) LIKE '%erica%'
            ORDER BY u.name, uak.exchange
        `;
        
        const systemResult = await pool.query(systemQuery);
        
        if (systemResult.rows.length > 0) {
            console.log('✅ Érica INCLUÍDA no sistema:');
            systemResult.rows.forEach((row, index) => {
                console.log(`   ${index + 1}. ${row.name}`);
                console.log(`      👤 User ID: ${row.id}`);
                console.log(`      📧 Email: ${row.email}`);
                console.log(`      🏦 Exchange: ${row.exchange} (${row.environment})`);
                console.log(`      📊 Status: ${row.validation_status}`);
                console.log('');
            });
        } else {
            console.log('❌ Érica ainda não aparece no sistema');
        }
        
        // 3. Instruções para próximos passos
        console.log('📋 3. PRÓXIMOS PASSOS:');
        console.log('======================');
        console.log('✅ Érica agora aparecerá no sistema multiusuário');
        console.log('⚠️ Status: "valid_pending_test" = funcionando mas pendente de validação final');
        console.log('');
        console.log('🔄 Para validar completamente:');
        console.log('   1. Verificar se as credenciais estão corretas no Bybit');
        console.log('   2. Regenerar API keys se necessário');
        console.log('   3. Testar novamente em alguns minutos');
        console.log('   4. Atualizar status para "valid" quando confirmar funcionamento');
        
        console.log('\n🧪 Comandos para testar:');
        console.log('   • node multiuser-trading-system.js');
        console.log('   • node test-erica-credentials.js');
        
    } catch (error) {
        console.error('❌ Erro na validação:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar validação
validarEricaTemporariamente().catch(console.error);

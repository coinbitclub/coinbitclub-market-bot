/**
 * 🔧 VALIDAR CHAVE TESTNET DO MAURO
 * 
 * Script para atualizar o status da chave testnet do Mauro para valid
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 VALIDAR CHAVE TESTNET DO MAURO');
console.log('=================================');

async function validarChaveTestnetMauro() {
    try {
        // Atualizar status para valid
        const updateQuery = `
            UPDATE user_api_keys 
            SET validation_status = 'valid', updated_at = NOW()
            WHERE user_id = (SELECT id FROM users WHERE UPPER(name) LIKE '%MAURO%' LIMIT 1)
            AND environment = 'testnet'
            AND is_active = true
            RETURNING id, exchange, environment, validation_status
        `;
        
        const result = await pool.query(updateQuery);
        
        if (result.rows.length > 0) {
            console.log('✅ Status atualizado com sucesso:');
            result.rows.forEach(key => {
                console.log(`   🆔 Key ID: ${key.id}`);
                console.log(`   🏦 Exchange: ${key.exchange} (${key.environment})`);
                console.log(`   📊 Status: ${key.validation_status}`);
            });
        } else {
            console.log('❌ Nenhuma chave encontrada para atualizar');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

validarChaveTestnetMauro().catch(console.error);

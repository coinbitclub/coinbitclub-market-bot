/**
 * 🔧 CONFIGURAÇÃO RÁPIDA SISTEMA PALOMA
 * Setup rápido sem erros de schema
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function setupRapidoPaloma() {
    try {
        console.log('⚡ SETUP RÁPIDO SISTEMA PALOMA');
        console.log('='.repeat(40));
        
        // 1. Verificar Paloma
        const userQuery = `SELECT id, name, email FROM users WHERE email = 'pamaral15@hotmail.com';`;
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Paloma não encontrada');
            return;
        }
        
        const palomaId = userResult.rows[0].id;
        console.log(`✅ Paloma ID: ${palomaId}`);
        
        // 2. Inserir operação ativa para teste
        const insertOpQuery = `
            INSERT INTO user_operations (
                user_id, symbol, operation_type, amount, entry_price, 
                current_price, leverage, status, created_at, updated_at
            ) VALUES (
                $1, 'BTCUSDT', 'LONG', 0.001, 95000, 95200, 5, 'open', NOW(), NOW()
            )
            ON CONFLICT DO NOTHING;
        `;
        
        await pool.query(insertOpQuery, [palomaId]);
        console.log('✅ Operação de teste inserida');
        
        // 3. Verificar operações
        const opsQuery = `
            SELECT COUNT(*) as total, 
                   COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas
            FROM user_operations 
            WHERE user_id = $1;
        `;
        
        const opsResult = await pool.query(opsQuery, [palomaId]);
        const ops = opsResult.rows[0];
        
        console.log(`📊 Operações: ${ops.total} total, ${ops.abertas} abertas`);
        
        console.log('\n✅ SETUP CONCLUÍDO!');
        console.log('🚀 Sistema pronto para iniciar IA Supervisor');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

setupRapidoPaloma();

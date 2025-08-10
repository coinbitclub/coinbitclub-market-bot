/**
 * 🔍 VERIFICAR ESTRUTURA USER_API_KEYS - RAPIDO
 */

const { Pool } = require('pg');

async function verificar() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            ORDER BY ordinal_position
        `);

        console.log('📋 COLUNAS USER_API_KEYS:');
        columns.rows.forEach(col => console.log(`• ${col.column_name}`));

    } catch (error) {
        console.log('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificar();

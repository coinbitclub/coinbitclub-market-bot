const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkUserNotifications() {
    try {
        // Verificar estrutura
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_notifications' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estrutura da tabela user_notifications:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
        });
        
        // Verificar dados existentes
        const count = await pool.query('SELECT COUNT(*) as count FROM user_notifications');
        console.log(`\n📊 Total de notificações: ${count.rows[0].count}`);
        
        // Se não tem a coluna notification_type, adicionar
        const hasNotificationType = columns.rows.some(col => col.column_name === 'notification_type');
        
        if (!hasNotificationType) {
            console.log('\n🔧 Adicionando coluna notification_type...');
            await pool.query(`
                ALTER TABLE user_notifications 
                ADD COLUMN notification_type VARCHAR(50) DEFAULT 'GENERAL'
            `);
            console.log('✅ Coluna notification_type adicionada');
        }
        
        // Se não tem a coluna radar_id, adicionar
        const hasRadarId = columns.rows.some(col => col.column_name === 'radar_id');
        
        if (!hasRadarId) {
            console.log('\n🔧 Adicionando coluna radar_id...');
            await pool.query(`
                ALTER TABLE user_notifications 
                ADD COLUMN radar_id INTEGER
            `);
            console.log('✅ Coluna radar_id adicionada');
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await pool.end();
    }
}

checkUserNotifications();

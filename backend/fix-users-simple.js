const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('🔧 Corrigindo schema da tabela users...');
        
        // Adicionar colunas se não existirem
        const colunas = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER'", 
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT NOW()",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_status BOOLEAN DEFAULT false"
        ];
        
        for (const sql of colunas) {
            try {
                await pool.query(sql);
                console.log('✅ Coluna adicionada/verificada');
            } catch (err) {
                console.log('⚠️ Coluna já existe ou erro:', err.message);
            }
        }
        
        // Criar gestores
        const gestores = [
            ['signals_manager', 'signals@coinbitclub.com', 'admin', 'SIGNALS_MANAGER'],
            ['operations_manager', 'operations@coinbitclub.com', 'admin', 'OPERATIONS_MANAGER'],
            ['fear_greed_manager', 'feargreed@coinbitclub.com', 'admin', 'FEAR_GREED_MANAGER'],
            ['financial_supervisor', 'financial@coinbitclub.com', 'admin', 'FINANCIAL_SUPERVISOR'],
            ['trade_supervisor', 'trade@coinbitclub.com', 'admin', 'TRADE_SUPERVISOR'],
            ['users_manager', 'users@coinbitclub.com', 'admin', 'USERS_MANAGER'],
            ['risk_manager', 'risk@coinbitclub.com', 'admin', 'RISK_MANAGER'],
            ['analytics_manager', 'analytics@coinbitclub.com', 'admin', 'ANALYTICS_MANAGER']
        ];
        
        console.log('👨‍💼 Criando gestores...');
        
        for (const [name, email, user_type, role] of gestores) {
            try {
                const existe = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
                
                if (existe.rows.length === 0) {
                    await pool.query(`
                        INSERT INTO users (name, email, password, user_type, role, status, vip_status, last_login, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, 'active', true, NOW(), NOW(), NOW())
                    `, [name, email, `gestor_${name}_2025`, user_type, role]);
                    
                    console.log(`✅ ${name}: Criado`);
                } else {
                    await pool.query(`
                        UPDATE users SET user_type = $1, role = $2, status = 'active', updated_at = NOW()
                        WHERE name = $3
                    `, [user_type, role, name]);
                    
                    console.log(`🔄 ${name}: Atualizado`);
                }
            } catch (err) {
                console.log(`❌ ${name}: ${err.message}`);
            }
        }
        
        // Verificar resultado
        const result = await pool.query(`
            SELECT name, user_type, role, status 
            FROM users 
            WHERE user_type = 'admin' 
            ORDER BY name
        `);
        
        console.log(`\n📊 Gestores criados: ${result.rows.length}`);
        result.rows.forEach(g => {
            console.log(`   👨‍💼 ${g.name}: ${g.role} (${g.status})`);
        });
        
        console.log('\n✅ Schema corrigido com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

main();

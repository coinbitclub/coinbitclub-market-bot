const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function criarGestores() {
    console.log('🚀 Criando Gestores CoinBitClub (sem user_type)...');
    
    const gestores = [
        ['signals_manager', 'signals@coinbitclub.com'],
        ['operations_manager', 'operations@coinbitclub.com'],
        ['fear_greed_manager', 'feargreed@coinbitclub.com'],
        ['financial_supervisor', 'financial@coinbitclub.com'],
        ['trade_supervisor', 'trade@coinbitclub.com'],
        ['users_manager', 'users@coinbitclub.com'],
        ['risk_manager', 'risk@coinbitclub.com'],
        ['analytics_manager', 'analytics@coinbitclub.com']
    ];
    
    for (const [name, email] of gestores) {
        try {
            const existe = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
            
            if (existe.rows.length === 0) {
                await pool.query(`
                    INSERT INTO users (name, email, password, status, created_at, updated_at)
                    VALUES ($1, $2, $3, 'active', NOW(), NOW())
                `, [name, email, `gestor_${name}_2025`]);
                
                console.log(`✅ ${name}: Criado`);
            } else {
                console.log(`✅ ${name}: Já existe`);
            }
        } catch (err) {
            console.log(`⚠️ ${name}: ${err.message}`);
        }
    }
    
    const result = await pool.query(`
        SELECT name, email, status 
        FROM users 
        WHERE name IN (
            'signals_manager', 'operations_manager', 'fear_greed_manager',
            'financial_supervisor', 'trade_supervisor', 'users_manager',
            'risk_manager', 'analytics_manager'
        )
        ORDER BY name
    `);
    
    console.log(`\n📊 Gestores encontrados: ${result.rows.length}/8`);
    result.rows.forEach(g => {
        console.log(`   👨‍💼 ${g.name}: ${g.status}`);
    });
    
    await pool.end();
}

criarGestores().catch(console.error);

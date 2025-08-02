console.log('🚀 Teste rápido de correção...');

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT name, email, status 
    FROM users 
    WHERE name IN (
        'signals_manager', 'operations_manager', 'fear_greed_manager',
        'financial_supervisor', 'trade_supervisor', 'users_manager',
        'risk_manager', 'analytics_manager'
    )
    ORDER BY name
`).then(result => {
    console.log(`📊 Gestores encontrados: ${result.rows.length}`);
    result.rows.forEach(g => {
        console.log(`   👨‍💼 ${g.name}: ${g.status || 'N/A'}`);
    });
    
    if (result.rows.length === 0) {
        console.log('⚠️ Nenhum gestor encontrado. Criando...');
        
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
        
        const promises = gestores.map(([name, email]) => {
            return pool.query(`
                INSERT INTO users (name, email, password, status, created_at, updated_at)
                VALUES ($1, $2, $3, 'active', NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            `, [name, email, `gestor_${name}_2025`]).then(() => {
                console.log(`✅ ${name}: Processado`);
            }).catch(err => {
                // Tentar sem ON CONFLICT
                return pool.query(`
                    INSERT INTO users (name, email, password, status, created_at, updated_at)
                    VALUES ($1, $2, $3, 'active', NOW(), NOW())
                `, [name, email, `gestor_${name}_2025`]).then(() => {
                    console.log(`✅ ${name}: Criado`);
                }).catch(err2 => {
                    console.log(`⚠️ ${name}: ${err2.message}`);
                });
            });
        });
        
        Promise.all(promises).then(() => {
            console.log('🎉 Processo concluído!');
            pool.end();
        });
    } else {
        console.log('✅ Query funcionando! Gestores encontrados!');
        pool.end();
    }
}).catch(error => {
    console.error('❌ Erro:', error.message);
    pool.end();
});

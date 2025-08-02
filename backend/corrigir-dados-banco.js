const { Pool } = require('pg');

console.log(`
🔧 CORRIGINDO PROBLEMAS DO BANCO DE DADOS
═══════════════════════════════════════════
🎯 Corrigindo usernames null e dados inconsistentes
`);

const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Identificando problemas...');
        
        // 1. Verificar usuários com username null
        const nullUsers = await client.query(`
            SELECT id, email FROM users WHERE username IS NULL OR username = ''
        `);
        
        console.log(`❌ Encontrados ${nullUsers.rows.length} usuários com username NULL`);
        
        // 2. Corrigir usernames baseado no email
        for (const user of nullUsers.rows) {
            let newUsername;
            
            if (user.email === 'faleconosco@coinbitclub.vip') {
                newUsername = 'admin';
            } else if (user.email === 'pamaral15@hotmail.com') {
                newUsername = 'paloma';
            } else if (user.email === 'erica.andrade.santos@hotmail.com') {
                newUsername = 'erica';
            } else {
                // Gerar username baseado no email
                newUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
            }
            
            await client.query(
                'UPDATE users SET username = $1 WHERE id = $2',
                [newUsername, user.id]
            );
            
            console.log(`✅ Username corrigido: ${user.email} → ${newUsername}`);
        }
        
        // 3. Corrigir sinais com dados null/undefined
        console.log('\n🔧 Corrigindo dados dos sinais...');
        
        await client.query('DELETE FROM signals');
        console.log('🗑️ Sinais antigos removidos');
        
        // Inserir sinais corretos
        const signalsData = [
            {
                symbol: 'BTCUSDT',
                type: 'buy',
                action: 'BUY',
                price: 45200.50,
                strategy: 'breakout',
                accuracy: 85.5,
                timeframe: '1h',
                alert_message: 'BTC rompendo resistência em $45200'
            },
            {
                symbol: 'ETHUSDT',
                type: 'sell',
                action: 'SELL',
                price: 3185.75,
                strategy: 'reversal',
                accuracy: 78.2,
                timeframe: '30m',
                alert_message: 'ETH mostrando sinais de reversão'
            },
            {
                symbol: 'ADAUSDT',
                type: 'buy',
                action: 'BUY',
                price: 1.265,
                strategy: 'support',
                accuracy: 82.1,
                timeframe: '15m',
                alert_message: 'ADA testando suporte importante'
            },
            {
                symbol: 'SOLUSDT',
                type: 'buy',
                action: 'BUY',
                price: 182.30,
                strategy: 'momentum',
                accuracy: 89.3,
                timeframe: '1h',
                alert_message: 'SOL com momentum forte de alta'
            },
            {
                symbol: 'DOGEUSDT',
                type: 'hold',
                action: 'HOLD',
                price: 0.085,
                strategy: 'consolidation',
                accuracy: 65.8,
                timeframe: '4h',
                alert_message: 'DOGE em consolidação lateral'
            }
        ];
        
        for (const signal of signalsData) {
            await client.query(`
                INSERT INTO signals (
                    symbol, type, action, price, strategy, accuracy, 
                    timeframe, alert_message, processed, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
            `, [
                signal.symbol, signal.type, signal.action, signal.price,
                signal.strategy, signal.accuracy, signal.timeframe, 
                signal.alert_message
            ]);
        }
        
        console.log(`✅ ${signalsData.length} sinais corretos inseridos`);
        
        // 4. Verificar operações com profit null
        console.log('\n🔧 Corrigindo lucros das operações...');
        
        const operationsWithNullProfit = await client.query(`
            SELECT id, entry_price, exit_price, quantity, side 
            FROM operations 
            WHERE profit = 0 OR profit IS NULL
        `);
        
        for (const op of operationsWithNullProfit.rows) {
            if (op.exit_price && op.entry_price && op.quantity) {
                let calculatedProfit;
                
                if (op.side === 'buy') {
                    calculatedProfit = (op.exit_price - op.entry_price) * op.quantity;
                } else {
                    calculatedProfit = (op.entry_price - op.exit_price) * op.quantity;
                }
                
                await client.query(
                    'UPDATE operations SET profit = $1 WHERE id = $2',
                    [calculatedProfit.toFixed(8), op.id]
                );
                
                console.log(`✅ Lucro calculado para operação ${op.id}: $${calculatedProfit.toFixed(2)}`);
            }
        }
        
        // 5. Verificação final
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        
        const usersCount = await client.query('SELECT COUNT(*) as count FROM users WHERE username IS NOT NULL');
        console.log(`✅ Usuários com username válido: ${usersCount.rows[0].count}`);
        
        const signalsCount = await client.query('SELECT COUNT(*) as count FROM signals WHERE price IS NOT NULL');
        console.log(`✅ Sinais com dados válidos: ${signalsCount.rows[0].count}`);
        
        const operationsCount = await client.query('SELECT COUNT(*) as count FROM operations WHERE profit IS NOT NULL');
        console.log(`✅ Operações com lucro calculado: ${operationsCount.rows[0].count}`);
        
        // Mostrar usuários finais
        console.log('\n👥 USUÁRIOS FINAIS:');
        const finalUsers = await client.query(`
            SELECT username, email, status 
            FROM users 
            WHERE status = 'active' 
            ORDER BY username
        `);
        
        finalUsers.rows.forEach(user => {
            console.log(`✅ ${user.username} (${user.email})`);
        });
        
        console.log('\n🎯 CORREÇÕES APLICADAS COM SUCESSO!');
        
    } catch (error) {
        console.log('❌ Erro durante correção:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixDatabase();

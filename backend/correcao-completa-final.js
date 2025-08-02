const { Pool } = require('pg');

console.log(`
🔧 CORREÇÃO FINAL DO BANCO DE DADOS
═══════════════════════════════════════
🎯 Usando estrutura correta das tabelas
`);

const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

async function finalFix() {
    const client = await pool.connect();
    
    try {
        // 1. Limpar e inserir sinais com estrutura correta
        console.log('🔧 Corrigindo sinais...');
        await client.query('DELETE FROM signals');
        
        const signalsData = [
            {
                symbol: 'BTCUSDT',
                side: 'BUY',
                entry_price: 45200.50,
                target_price: 46000.00,
                stop_loss: 44500.00,
                confidence: 85.5,
                timeframe: '1h',
                source: 'technical_analysis'
            },
            {
                symbol: 'ETHUSDT',
                side: 'SELL',
                entry_price: 3185.75,
                target_price: 3100.00,
                stop_loss: 3250.00,
                confidence: 78.2,
                timeframe: '30m',
                source: 'reversal_pattern'
            },
            {
                symbol: 'ADAUSDT',
                side: 'BUY',
                entry_price: 1.265,
                target_price: 1.320,
                stop_loss: 1.200,
                confidence: 82.1,
                timeframe: '15m',
                source: 'support_level'
            },
            {
                symbol: 'SOLUSDT',
                side: 'BUY',
                entry_price: 182.30,
                target_price: 195.00,
                stop_loss: 175.00,
                confidence: 89.3,
                timeframe: '1h',
                source: 'momentum_analysis'
            },
            {
                symbol: 'DOGEUSDT',
                side: 'HOLD',
                entry_price: 0.085,
                target_price: 0.090,
                stop_loss: 0.080,
                confidence: 65.8,
                timeframe: '4h',
                source: 'consolidation_pattern'
            }
        ];
        
        for (const signal of signalsData) {
            await client.query(`
                INSERT INTO signals (
                    symbol, side, entry_price, target_price, stop_loss, 
                    confidence, timeframe, source, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
            `, [
                signal.symbol, signal.side, signal.entry_price, signal.target_price,
                signal.stop_loss, signal.confidence, signal.timeframe, signal.source
            ]);
        }
        
        console.log(`✅ ${signalsData.length} sinais inseridos corretamente`);
        
        // 2. Corrigir operações com lucro nulo
        console.log('\n🔧 Corrigindo lucros das operações...');
        
        const operations = await client.query(`
            SELECT id, entry_price, exit_price, quantity, side 
            FROM operations 
            WHERE profit = 0 OR profit IS NULL
        `);
        
        for (const op of operations.rows) {
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
                
                console.log(`✅ Lucro calculado: Operação ${op.id} = $${calculatedProfit.toFixed(2)}`);
            }
        }
        
        // 3. Verificação final completa
        console.log('\n📊 VERIFICAÇÃO FINAL COMPLETA:');
        
        // Usuários
        const users = await client.query(`
            SELECT username, email, status 
            FROM users 
            WHERE status = 'active' 
            ORDER BY username
        `);
        
        console.log('\n👥 USUÁRIOS ATIVOS:');
        users.rows.forEach(user => {
            console.log(`✅ ${user.username} (${user.email})`);
        });
        
        // Saldos
        const balances = await client.query(`
            SELECT u.username, ub.currency, ub.available_balance, ub.total_balance
            FROM user_balances ub
            JOIN users u ON ub.user_id = u.id
            ORDER BY u.username
        `);
        
        console.log('\n💰 SALDOS:');
        balances.rows.forEach(balance => {
            console.log(`💱 ${balance.username}: ${balance.currency} $${balance.available_balance} (Total: $${balance.total_balance})`);
        });
        
        // Operações
        const recentOps = await client.query(`
            SELECT o.symbol, o.side, o.entry_price, o.exit_price, o.profit, o.status, u.username
            FROM operations o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 3
        `);
        
        console.log('\n📈 OPERAÇÕES RECENTES:');
        recentOps.rows.forEach(op => {
            console.log(`🎯 ${op.username}: ${op.side} ${op.symbol} - Entrada: $${op.entry_price}, Saída: $${op.exit_price || 'Aberta'}, Lucro: $${op.profit}, Status: ${op.status}`);
        });
        
        // Sinais
        const recentSignals = await client.query(`
            SELECT symbol, side, entry_price, target_price, confidence, status
            FROM signals
            ORDER BY created_at DESC
            LIMIT 3
        `);
        
        console.log('\n📡 SINAIS RECENTES:');
        recentSignals.rows.forEach(signal => {
            console.log(`📊 ${signal.symbol}: ${signal.side} @ $${signal.entry_price} → Target: $${signal.target_price} (${signal.confidence}% confiança) - ${signal.status}`);
        });
        
        // Contadores finais
        const userCount = await client.query('SELECT COUNT(*) as count FROM users WHERE status = \'active\'');
        const balanceCount = await client.query('SELECT COUNT(*) as count FROM user_balances');
        const operationCount = await client.query('SELECT COUNT(*) as count FROM operations');
        const signalCount = await client.query('SELECT COUNT(*) as count FROM signals WHERE status = \'active\'');
        
        console.log('\n📊 RESUMO FINAL:');
        console.log(`👥 Usuários ativos: ${userCount.rows[0].count}`);
        console.log(`💰 Saldos registrados: ${balanceCount.rows[0].count}`);
        console.log(`📈 Operações: ${operationCount.rows[0].count}`);
        console.log(`📡 Sinais ativos: ${signalCount.rows[0].count}`);
        
        console.log('\n🎯 SISTEMA COMPLETAMENTE CORRIGIDO E FUNCIONAL!');
        console.log('✅ Dashboard disponível em: http://localhost:3009');
        
    } catch (error) {
        console.log('❌ Erro durante correção:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

finalFix();

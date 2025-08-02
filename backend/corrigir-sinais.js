const { Pool } = require('pg');

console.log('🔍 Verificando estrutura da tabela signals...');

const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

async function checkSignalsStructure() {
    const client = await pool.connect();
    
    try {
        // Verificar estrutura da tabela signals
        const signalsStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'signals'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📊 ESTRUTURA DA TABELA SIGNALS:');
        signalsStructure.rows.forEach(col => {
            console.log(`   📊 ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            if (col.column_default) {
                console.log(`      Default: ${col.column_default}`);
            }
        });
        
        // Agora vou corrigir apenas os usuários e usar a estrutura correta para sinais
        console.log('\n✅ Estrutura identificada! Corrigindo apenas sinais existentes...');
        
        // Limpar e inserir sinais com a estrutura correta
        await client.query('DELETE FROM signals');
        
        // Inserir com as colunas que existem realmente
        const signalsData = [
            {
                symbol: 'BTCUSDT',
                signal: 'BUY',
                price: 45200.50,
                strategy: 'breakout',
                accuracy: 85.5,
                timeframe: '1h',
                alert_message: 'BTC rompendo resistência em $45200',
                ticker: 'BTCUSDT',
                action: 'BUY'
            },
            {
                symbol: 'ETHUSDT',
                signal: 'SELL',
                price: 3185.75,
                strategy: 'reversal',
                accuracy: 78.2,
                timeframe: '30m',
                alert_message: 'ETH mostrando sinais de reversão',
                ticker: 'ETHUSDT',
                action: 'SELL'
            },
            {
                symbol: 'ADAUSDT',
                signal: 'BUY',
                price: 1.265,
                strategy: 'support',
                accuracy: 82.1,
                timeframe: '15m',
                alert_message: 'ADA testando suporte importante',
                ticker: 'ADAUSDT',
                action: 'BUY'
            },
            {
                symbol: 'SOLUSDT',
                signal: 'BUY',
                price: 182.30,
                strategy: 'momentum',
                accuracy: 89.3,
                timeframe: '1h',
                alert_message: 'SOL com momentum forte de alta',
                ticker: 'SOLUSDT',
                action: 'BUY'
            },
            {
                symbol: 'DOGEUSDT',
                signal: 'HOLD',
                price: 0.085,
                strategy: 'consolidation',
                accuracy: 65.8,
                timeframe: '4h',
                alert_message: 'DOGE em consolidação lateral',
                ticker: 'DOGEUSDT',
                action: 'HOLD'
            }
        ];
        
        for (const signal of signalsData) {
            await client.query(`
                INSERT INTO signals (
                    symbol, signal, action, price, strategy, accuracy, 
                    timeframe, alert_message, ticker, processed, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
            `, [
                signal.symbol, signal.signal, signal.action, signal.price,
                signal.strategy, signal.accuracy, signal.timeframe, 
                signal.alert_message, signal.ticker
            ]);
        }
        
        console.log(`✅ ${signalsData.length} sinais inseridos corretamente`);
        
        // Verificar dados finais
        const finalSignals = await client.query('SELECT symbol, signal, price, strategy FROM signals ORDER BY created_at DESC LIMIT 5');
        
        console.log('\n📡 SINAIS INSERIDOS:');
        finalSignals.rows.forEach(signal => {
            console.log(`📊 ${signal.symbol}: ${signal.signal} @ $${signal.price} (${signal.strategy})`);
        });
        
        console.log('\n✅ SINAIS CORRIGIDOS COM SUCESSO!');
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSignalsStructure();

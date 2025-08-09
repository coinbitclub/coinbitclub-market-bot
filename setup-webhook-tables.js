#!/usr/bin/env node
/**
 * 🔧 SETUP DAS TABELAS PARA WEBHOOKS TRADINGVIEW
 * 
 * Script para criar as tabelas necessárias para receber sinais
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 SETUP DAS TABELAS PARA WEBHOOKS TRADINGVIEW');
console.log('===============================================');

async function setupTables() {
    try {
        console.log('📊 1. Verificando tabelas existentes...');
        
        // Verificar se a tabela signals existe
        const signalsExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'signals'
            );
        `);
        
        if (!signalsExists.rows[0].exists) {
            console.log('📝 Criando tabela signals...');
            await pool.query(`
                CREATE TABLE signals (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(50) NOT NULL,
                    action VARCHAR(20) NOT NULL,
                    price DECIMAL(20, 8),
                    quantity DECIMAL(20, 8),
                    strategy VARCHAR(100),
                    timeframe VARCHAR(10),
                    alert_message TEXT,
                    processed BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('✅ Tabela signals criada');
        } else {
            console.log('✅ Tabela signals já existe');
        }

        // Verificar se a tabela raw_webhook existe
        const rawWebhookExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'raw_webhook'
            );
        `);
        
        if (!rawWebhookExists.rows[0].exists) {
            console.log('📝 Criando tabela raw_webhook...');
            await pool.query(`
                CREATE TABLE raw_webhook (
                    id SERIAL PRIMARY KEY,
                    source VARCHAR(50) NOT NULL,
                    payload JSONB NOT NULL,
                    processed BOOLEAN DEFAULT false,
                    received_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('✅ Tabela raw_webhook criada');
        } else {
            console.log('✅ Tabela raw_webhook já existe');
        }

        // Verificar colunas da tabela signals
        console.log('📋 2. Verificando estrutura da tabela signals...');
        const signalsColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'signals' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('Colunas da tabela signals:');
        signalsColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        // Adicionar índices para performance
        console.log('📈 3. Criando índices para performance...');
        
        try {
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_signals_processed ON signals(processed);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_raw_webhook_received_at ON raw_webhook(received_at);`);
            console.log('✅ Índices criados com sucesso');
        } catch (error) {
            console.log('⚠️ Alguns índices já existiam:', error.message);
        }

        // Teste de inserção
        console.log('🧪 4. Testando inserção de sinal...');
        const testResult = await pool.query(`
            INSERT INTO signals (symbol, action, price, strategy, alert_message)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `, ['BTCUSDT', 'BUY', 45000.50, 'test-setup', 'Teste de setup das tabelas']);
        
        console.log(`✅ Sinal de teste inserido com ID: ${testResult.rows[0].id}`);
        console.log(`📅 Timestamp: ${testResult.rows[0].created_at}`);

        // Limpar teste
        await pool.query('DELETE FROM signals WHERE strategy = $1', ['test-setup']);
        console.log('🧹 Sinal de teste removido');

        console.log('\n🎉 SETUP CONCLUÍDO COM SUCESSO!');
        console.log('===============================');
        console.log('✅ Tabelas criadas e configuradas');
        console.log('✅ Índices de performance aplicados');
        console.log('✅ Sistema pronto para receber webhooks TradingView');
        
        console.log('\n📋 ENDPOINTS DISPONÍVEIS:');
        console.log('• POST /api/webhooks/signal - Webhook principal');
        console.log('• POST /api/webhooks/tradingview - Webhook alternativo');
        
        console.log('\n🔗 EXEMPLO DE CURL PARA TESTE:');
        console.log('curl -X POST https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"symbol":"BTCUSDT","action":"BUY","price":45000}\'');

    } catch (error) {
        console.error('❌ Erro no setup:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar setup
setupTables().catch(console.error);

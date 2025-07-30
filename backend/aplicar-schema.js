const { Client } = require('pg');

async function aplicarSchema() {
    console.log('🔧 APLICANDO SCHEMA NO BANCO REAL...');
    
    const client = new Client({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('✅ CONECTADO AO BANCO REAL');
        
        // Verificar estado atual
        try {
            const currentCols = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'trading_signals' 
                ORDER BY ordinal_position
            `);
            console.log('📋 Colunas atuais:', currentCols.rows.map(r => r.column_name));
        } catch (e) {
            console.log('⚠️ Tabela trading_signals não existe');
        }
        
        // Criar tabela base
        console.log('🔧 Criando tabela base...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS trading_signals (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                action VARCHAR(10) NOT NULL,
                price DECIMAL(20,8),
                signal_data JSONB DEFAULT '{}',
                source VARCHAR(50) DEFAULT 'tradingview',
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Tabela base criada');
        
        // Adicionar colunas uma por uma
        console.log('🔧 Adicionando colunas...');
        
        const colunas = [
            { nome: 'received_at', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS received_at TIMESTAMP DEFAULT NOW()' },
            { nome: 'processed', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false' },
            { nome: 'processed_at', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP' },
            { nome: 'processing_status', sql: "ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending'" },
            { nome: 'user_id', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS user_id INTEGER' },
            { nome: 'fear_greed_value', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS fear_greed_value INTEGER' },
            { nome: 'direction_allowed', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS direction_allowed VARCHAR(10)' },
            { nome: 'signal_direction', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS signal_direction VARCHAR(10)' },
            { nome: 'validation_passed', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS validation_passed BOOLEAN DEFAULT false' },
            { nome: 'rejection_reason', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS rejection_reason TEXT' },
            { nome: 'updated_at', sql: 'ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()' }
        ];
        
        for (const coluna of colunas) {
            try {
                await client.query(coluna.sql);
                console.log(`✅ Coluna ${coluna.nome} adicionada`);
            } catch (e) {
                console.log(`⚠️ Erro na coluna ${coluna.nome}: ${e.message}`);
            }
        }
        
        // Verificar resultado final
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        const finalCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals' 
            ORDER BY ordinal_position
        `);
        console.log('📋 COLUNAS FINAIS:', finalCols.rows.map(r => r.column_name));
        
        // Testar processing_status
        try {
            await client.query('SELECT processing_status FROM trading_signals LIMIT 1');
            console.log('✅ COLUNA processing_status FUNCIONA!');
        } catch (e) {
            console.log('❌ processing_status erro:', e.message);
        }
        
        console.log('\n🎯 SCHEMA APLICADO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ ERRO:', error.message);
    } finally {
        await client.end();
    }
}

aplicarSchema();

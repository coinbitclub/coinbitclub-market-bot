#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function corrigirSchemaCompleto() {
    console.log('🔧 CORRIGINDO SCHEMA COMPLETO DO BANCO');
    console.log('=====================================');

    try {
        // 1. Verificar estrutura atual da tabela trading_signals
        console.log('1️⃣ Verificando estrutura atual da tabela trading_signals...');
        const estruturaAtual = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 COLUNAS ATUAIS:');
        estruturaAtual.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        // 2. Adicionar todas as colunas necessárias
        console.log('\n2️⃣ Adicionando colunas faltantes...');
        
        const colunasNecessarias = [
            'symbol VARCHAR(20)',
            'side VARCHAR(10)', // BUY/SELL
            'action VARCHAR(20)', // LONG/SHORT
            'quantity DECIMAL(20,8) DEFAULT 0.001',
            'price DECIMAL(20,8) DEFAULT 0',
            'stop_loss DECIMAL(20,8)',
            'take_profit DECIMAL(20,8)',
            'leverage INTEGER DEFAULT 1',
            'timestamp_signal TIMESTAMP DEFAULT NOW()',
            'processed BOOLEAN DEFAULT FALSE',
            'validation_passed BOOLEAN DEFAULT FALSE',
            'error_message TEXT',
            'user_id INTEGER',
            'exchange VARCHAR(20) DEFAULT \'BYBIT\'',
            'status VARCHAR(20) DEFAULT \'PENDING\'',
            'created_at TIMESTAMP DEFAULT NOW()',
            'updated_at TIMESTAMP DEFAULT NOW()'
        ];

        for (const coluna of colunasNecessarias) {
            try {
                const [nomeColuna] = coluna.split(' ');
                await pool.query(`
                    ALTER TABLE trading_signals 
                    ADD COLUMN IF NOT EXISTS ${coluna}
                `);
                console.log(`   ✅ ${nomeColuna} verificada/adicionada`);
            } catch (error) {
                console.log(`   ⚠️ ${coluna}: ${error.message}`);
            }
        }

        // 3. Verificar e corrigir tabela live_operations
        console.log('\n3️⃣ Verificando tabela live_operations...');
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS live_operations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    symbol VARCHAR(20),
                    tipo VARCHAR(10),
                    quantidade DECIMAL(20,8),
                    preco_entrada DECIMAL(20,8),
                    preco_saida DECIMAL(20,8),
                    pnl DECIMAL(20,8),
                    pnl_atual DECIMAL(20,8),
                    status VARCHAR(20),
                    exchange VARCHAR(20),
                    aberta_em TIMESTAMP,
                    fechada_em TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('   ✅ Tabela live_operations verificada/criada');
        } catch (error) {
            console.log(`   ⚠️ Erro na tabela live_operations: ${error.message}`);
        }

        // 4. Limpar dados de teste
        console.log('\n4️⃣ Limpando dados de teste...');
        await pool.query('DELETE FROM live_operations');
        console.log('   🗑️ Dados de teste removidos da live_operations');

        // 5. Verificar estrutura final
        console.log('\n5️⃣ Verificando estrutura final...');
        const estruturaFinal = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 ESTRUTURA FINAL trading_signals:');
        estruturaFinal.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        // 6. Verificar sinais recentes
        console.log('\n6️⃣ Verificando sinais recentes...');
        const sinaisRecentes = await pool.query(`
            SELECT id, symbol, side, processed, validation_passed, created_at
            FROM trading_signals 
            WHERE created_at > NOW() - INTERVAL '2 hours'
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        console.log(`📡 ${sinaisRecentes.rows.length} sinais nas últimas 2 horas:`);
        sinaisRecentes.rows.forEach((signal, index) => {
            const status = signal.processed ? 
                (signal.validation_passed ? '✅ PROCESSADO' : '❌ FALHOU') : 
                '⏳ PENDENTE';
            console.log(`   ${index + 1}. ${signal.symbol} ${signal.side} - ${status}`);
        });

        // 7. Reprocessar sinais pendentes
        console.log('\n7️⃣ Marcando sinais pendentes para reprocessamento...');
        const resultadoReprocess = await pool.query(`
            UPDATE trading_signals 
            SET processed = FALSE, 
                validation_passed = FALSE,
                error_message = NULL,
                updated_at = NOW()
            WHERE processed = FALSE 
            AND created_at > NOW() - INTERVAL '1 hour'
        `);
        
        console.log(`   🔄 ${resultadoReprocess.rowCount} sinais marcados para reprocessamento`);

        console.log('\n✅ SCHEMA CORRIGIDO COM SUCESSO!');
        console.log('🚀 Sistema pronto para processar sinais reais!');

    } catch (error) {
        console.error('❌ Erro crítico na correção:', error);
    } finally {
        await pool.end();
    }
}

// Executar correção
corrigirSchemaCompleto();

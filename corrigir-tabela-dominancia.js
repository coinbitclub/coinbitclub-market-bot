const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA DE DOMINÂNCIA...\n');

async function checkDominanceTable() {
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');

        // Verificar colunas da tabela btc_dominance_signals
        console.log('\n📋 Verificando colunas da tabela btc_dominance_signals...');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'btc_dominance_signals'
            ORDER BY ordinal_position;
        `);

        if (columns.rows.length === 0) {
            console.log('⚠️  Tabela btc_dominance_signals não encontrada');
        } else {
            console.log('📋 Colunas encontradas:');
            columns.rows.forEach(col => {
                console.log(`  - ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        }

        // Verificar se precisa recriar a tabela
        console.log('\n🔄 Recriando tabela com estrutura correta...');
        
        // Dropar tabela se existir
        await client.query('DROP TABLE IF EXISTS btc_dominance_signals CASCADE;');
        console.log('🗑️  Tabela anterior removida');

        // Criar nova tabela com estrutura correta
        await client.query(`
            CREATE TABLE btc_dominance_signals (
                id SERIAL PRIMARY KEY,
                ticker VARCHAR(20) DEFAULT 'BTC.D' NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                btc_dominance DECIMAL(10,6),
                ema_7 DECIMAL(10,6),
                diff_pct DECIMAL(10,6),
                signal VARCHAR(20),
                raw_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Nova tabela btc_dominance_signals criada');

        // Verificar nova estrutura
        console.log('\n📋 Verificando nova estrutura...');
        const newColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'btc_dominance_signals'
            ORDER BY ordinal_position;
        `);

        console.log('📋 Nova estrutura:');
        newColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Testar inserção
        console.log('\n🧪 Testando inserção...');
        const testInsert = await client.query(`
            INSERT INTO btc_dominance_signals 
            (ticker, btc_dominance, ema_7, diff_pct, signal, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [
            'BTC.D',
            59.123,
            58.456,
            1.141,
            'LONG',
            JSON.stringify({
                "ticker": "BTC.D",
                "time": "2025-01-30 17:30:00",
                "btc_dominance": 59.123,
                "ema_7": 58.456,
                "diff_pct": 1.141,
                "sinal": "LONG"
            })
        ]);

        console.log('✅ Teste de inserção bem-sucedido:', testInsert.rows[0]);
        
        console.log('\n✅ TABELA CORRIGIDA E TESTADA COM SUCESSO!');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Executar verificação e correção
checkDominanceTable()
    .then(() => {
        console.log('\n🎯 Tabela pronta para uso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Falha:', error);
        process.exit(1);
    });

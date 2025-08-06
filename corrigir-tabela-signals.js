const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('🔍 VERIFICANDO E CORRIGINDO TABELA SIGNALS...\n');

async function fixSignalsTable() {
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');

        // Verificar estrutura atual da tabela signals
        console.log('\n📋 Verificando colunas da tabela signals...');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'signals'
            ORDER BY ordinal_position;
        `);

        console.log('📋 Colunas atuais da tabela signals:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Verificar se a coluna ticker existe
        const hasTickerColumn = columns.rows.some(col => col.column_name === 'ticker');
        
        if (!hasTickerColumn) {
            console.log('\n⚠️  Coluna ticker não existe, adicionando...');
            await client.query(`
                ALTER TABLE signals 
                ADD COLUMN ticker VARCHAR(20);
            `);
            console.log('✅ Coluna ticker adicionada à tabela signals');
        } else {
            console.log('\n✅ Coluna ticker já existe na tabela signals');
        }

        // Verificar estrutura final
        console.log('\n📋 Verificando estrutura final...');
        const finalColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'signals'
            ORDER BY ordinal_position;
        `);

        console.log('📋 Estrutura final da tabela signals:');
        finalColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Testar inserção na tabela signals
        console.log('\n🧪 Testando inserção na tabela signals...');
        const testInsert = await client.query(`
            INSERT INTO signals 
            (ticker, signal, source, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `, [
            'BTC.D',
            'LONG',
            'dominance_webhook',
            JSON.stringify({
                btc_dominance: 59.123,
                ema_7: 58.456,
                diff_pct: 1.141,
                webhook_type: 'btc_dominance'
            }),
            new Date()
        ]);

        console.log('✅ Teste de inserção bem-sucedido, ID:', testInsert.rows[0].id);
        
        console.log('\n✅ TABELA SIGNALS CORRIGIDA E TESTADA!');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Executar correção
fixSignalsTable()
    .then(() => {
        console.log('\n🎯 Tabela signals pronta para usar com ticker!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Falha na correção:', error);
        process.exit(1);
    });

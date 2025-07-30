const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('🔍 ADICIONANDO COLUNAS NECESSÁRIAS NA TABELA SIGNALS...\n');

async function addMissingColumns() {
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');

        // Adicionar colunas que estão faltando
        console.log('\n➕ Adicionando coluna signal...');
        try {
            await client.query(`ALTER TABLE signals ADD COLUMN signal VARCHAR(20);`);
            console.log('✅ Coluna signal adicionada');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('✅ Coluna signal já existe');
            } else {
                throw e;
            }
        }

        console.log('\n➕ Adicionando coluna source...');
        try {
            await client.query(`ALTER TABLE signals ADD COLUMN source VARCHAR(50);`);
            console.log('✅ Coluna source adicionada');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('✅ Coluna source já existe');
            } else {
                throw e;
            }
        }

        console.log('\n➕ Adicionando coluna metadata...');
        try {
            await client.query(`ALTER TABLE signals ADD COLUMN metadata JSONB;`);
            console.log('✅ Coluna metadata adicionada');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('✅ Coluna metadata já existe');
            } else {
                throw e;
            }
        }

        // Verificar estrutura final
        console.log('\n📋 Verificando estrutura final...');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'signals'
            ORDER BY ordinal_position;
        `);

        console.log('📋 Colunas da tabela signals:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Testar inserção
        console.log('\n🧪 Testando inserção...');
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

        console.log('✅ Teste bem-sucedido, ID:', testInsert.rows[0].id);
        
        console.log('\n✅ TABELA SIGNALS PRONTA!');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Executar
addMissingColumns()
    .then(() => {
        console.log('\n🎯 Tabela signals configurada corretamente!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Falha:', error);
        process.exit(1);
    });

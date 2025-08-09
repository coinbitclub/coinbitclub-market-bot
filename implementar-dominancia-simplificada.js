const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('🔍 INICIANDO IMPLEMENTAÇÃO DA DOMINÂNCIA SIMPLIFICADA...\n');

async function implementDominanceSimplified() {
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');

        // 1. Verificar se a tabela de dominância existe
        console.log('\n📋 1. Verificando tabela btc_dominance_signals...');
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'btc_dominance_signals'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('⚠️  Tabela não existe, criando...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS btc_dominance_signals (
                    id SERIAL PRIMARY KEY,
                    ticker VARCHAR(20) DEFAULT 'BTC.D',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    dominance DECIMAL(10,6),
                    ema_7 DECIMAL(10,6),
                    diff_pct DECIMAL(10,6),
                    signal VARCHAR(20),
                    raw_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabela btc_dominance_signals criada');
        } else {
            console.log('✅ Tabela btc_dominance_signals já existe');
        }

        // 2. Testar inserção simplificada
        console.log('\n🧪 2. Testando inserção direta na tabela...');
        const testInsert = await client.query(`
            INSERT INTO btc_dominance_signals 
            (ticker, dominance, ema_7, diff_pct, signal, raw_data)
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

        // 3. Também inserir na tabela principal de sinais
        console.log('\n📈 3. Inserindo na tabela principal de sinais...');
        const signalInsert = await client.query(`
            INSERT INTO signals 
            (ticker, signal, source, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `, [
            'BTC.D',
            'LONG',
            'dominance_webhook',
            JSON.stringify({
                dominance: 59.123,
                ema_7: 58.456,
                diff_pct: 1.141,
                webhook_type: 'btc_dominance'
            }),
            new Date()
        ]);

        console.log('✅ Sinal inserido na tabela principal, ID:', signalInsert.rows[0].id);

        // 4. Verificar contadores
        console.log('\n📊 4. Verificando dados nas tabelas...');
        
        const dominanceCount = await client.query('SELECT COUNT(*) FROM btc_dominance_signals');
        console.log(`📋 Total de sinais de dominância: ${dominanceCount.rows[0].count}`);
        
        const signalsCount = await client.query('SELECT COUNT(*) FROM signals WHERE source = \'dominance_webhook\'');
        console.log(`📈 Total de sinais de dominância na tabela principal: ${signalsCount.rows[0].count}`);

        console.log('\n✅ IMPLEMENTAÇÃO SIMPLIFICADA CONCLUÍDA COM SUCESSO!');
        console.log('📝 O endpoint agora pode usar INSERT direto sem funções PostgreSQL');

    } catch (error) {
        console.error('❌ Erro na implementação:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Executar implementação
implementDominanceSimplified()
    .then(() => {
        console.log('\n🎯 Pronto para atualizar o endpoint!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Falha na implementação:', error);
        process.exit(1);
    });

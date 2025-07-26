const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const checkTableStructure = async () => {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco PostgreSQL');

    // Verificar estrutura da tabela trading_signals
    console.log('📋 Estrutura da tabela trading_signals:');
    const tradingSignalsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'trading_signals' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas da trading_signals:');
    tradingSignalsColumns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar estrutura da tabela raw_webhook
    console.log('\n📋 Estrutura da tabela raw_webhook:');
    const rawWebhookColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'raw_webhook' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas da raw_webhook:');
    rawWebhookColumns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar estrutura da tabela dominance_data
    console.log('\n📋 Estrutura da tabela dominance_data:');
    const dominanceDataColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'dominance_data' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas da dominance_data:');
    dominanceDataColumns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura das tabelas:', error);
  } finally {
    await client.end();
  }
};

checkTableStructure();

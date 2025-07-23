import config from './knexfile.js';
import knex from 'knex';

const db = knex(config.development);

try {
  console.log('Conectando ao banco PostgreSQL...');
  
  // Listar todas as tabelas
  const tables = await db.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('\n=== TABELAS DISPONÍVEIS ===');
  tables.rows.forEach(t => console.log('-', t.tablename));
  
  // Verificar tabela credentials
  const hasCredentials = tables.rows.find(t => t.tablename === 'credentials');
  if (hasCredentials) {
    console.log('\n=== ESTRUTURA DA TABELA CREDENTIALS ===');
    const credentialsStructure = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'credentials' 
      ORDER BY ordinal_position
    `);
    credentialsStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
  }
  
  // Verificar tabela signals
  const hasSignals = tables.rows.find(t => t.tablename === 'signals');
  if (hasSignals) {
    console.log('\n=== ESTRUTURA DA TABELA SIGNALS ===');
    const signalsStructure = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'signals' 
      ORDER BY ordinal_position
    `);
    signalsStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
  }
  
  console.log('\n=== BACKEND ALINHAMENTO CONCLUÍDO ===');
  
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  await db.destroy();
}

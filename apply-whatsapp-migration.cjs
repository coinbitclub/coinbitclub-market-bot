/**
 * 🚀 SCRIPT DE APLICAÇÃO: Migração WhatsApp System
 * Aplica a migração no banco de dados PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  console.log('🚀 APLICANDO MIGRAÇÃO WhatsApp SYSTEM');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  
  try {
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', 'whatsapp_simple.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado');
    console.log(`📊 Tamanho: ${migrationSQL.length} caracteres`);
    
    // Conectar ao banco
    const client = await pool.connect();
    console.log('✅ Conectado ao banco PostgreSQL');
    
    try {
      // Aplicar migração
      console.log('⚡ Executando migração...');
      await client.query(migrationSQL);
      
      console.log('✅ Migração aplicada com sucesso!');
      
      // Verificar se as funções foram criadas
      const functionsCheck = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%whatsapp%'
        ORDER BY routine_name
      `);
      
      console.log('\n📋 FUNÇÕES CRIADAS:');
      functionsCheck.rows.forEach(row => {
        console.log(`   ✅ ${row.routine_name}`);
      });
      
      // Verificar se as tabelas foram criadas
      const tablesCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%whatsapp%'
        ORDER BY table_name
      `);
      
      console.log('\n📊 TABELAS CRIADAS:');
      tablesCheck.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
      
      // Verificar se as colunas foram adicionadas na tabela users
      const columnsCheck = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name LIKE '%whatsapp%'
        ORDER BY column_name
      `);
      
      console.log('\n📋 COLUNAS ADICIONADAS NA TABELA USERS:');
      columnsCheck.rows.forEach(row => {
        console.log(`   ✅ ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
      });
      
      console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('🚀 Sistema WhatsApp pronto para uso!');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
    
    if (error.code) {
      console.error(`   Código do erro: ${error.code}`);
    }
    
    if (error.position) {
      console.error(`   Posição: ${error.position}`);
    }
    
    if (error.hint) {
      console.error(`   Dica: ${error.hint}`);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log('\n✅ Processo de migração finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Falha crítica na migração:', error);
      process.exit(1);
    });
}

module.exports = applyMigration;

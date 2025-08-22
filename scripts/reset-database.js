// ========================================
// MARKETBOT - SCRIPT DE RESET DO BANCO
// Executa limpeza completa e reinicialização
// ========================================

const { Pool } = require('pg');
const fs = require('fs/promises');
const path = require('path');

// Carrega variáveis de ambiente
require('dotenv').config();

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🗑️  INICIANDO RESET COMPLETO DO BANCO DE DADOS...');
    console.log('⚠️  ATENÇÃO: Todos os dados serão perdidos!');
    
    // Lê o script de reset
    const resetScript = await fs.readFile(
      path.join(__dirname, '../migrations/000_reset_database.sql'), 
      'utf-8'
    );

    console.log('🔄 Executando limpeza...');
    
    // Executa o reset
    const result = await pool.query(resetScript);
    
    console.log('✅ Reset executado com sucesso!');
    
    // Mostra o que restou no banco
    if (result && result.length > 0) {
      const lastResult = result[result.length - 1];
      if (lastResult.rows && lastResult.rows.length > 0) {
        console.log('📋 Objetos restantes no banco:');
        lastResult.rows.forEach(row => {
          console.log(`   • ${row.type}: ${row.name}`);
        });
      } else {
        console.log('✨ Banco de dados completamente limpo!');
      }
    }

    // Verifica a limpeza
    const checkResult = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'schema_migrations'
    `);

    const tableCount = parseInt(checkResult.rows[0].table_count);
    
    if (tableCount === 0) {
      console.log('🎉 RESET CONCLUÍDO COM SUCESSO!');
      console.log('📦 Banco de dados está limpo e pronto para novas migrações');
    } else {
      console.log(`⚠️  Ainda restam ${tableCount} tabelas no banco`);
    }

  } catch (error) {
    console.error('❌ Erro durante o reset:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Reset finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Reset falhou:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };

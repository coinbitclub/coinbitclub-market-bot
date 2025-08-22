// ========================================
// MARKETBOT - RESET AGRESSIVO DO BANCO
// Remove TUDO do esquema public
// ========================================

const { Pool } = require('pg');
require('dotenv').config();

async function aggressiveReset() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('💥 INICIANDO RESET AGRESSIVO...');
    console.log('⚠️  REMOVENDO TUDO DO ESQUEMA PUBLIC!');
    
    // Drop tudo no esquema public
    await pool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log('✅ Esquema public recriado do zero!');

    // Recriar extensões básicas
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    console.log('✅ Extensões básicas recriadas!');

    // Verificar se está limpo
    const checkResult = await pool.query(`
      SELECT COUNT(*) as object_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const objectCount = parseInt(checkResult.rows[0].object_count);
    
    if (objectCount === 0) {
      console.log('🎉 RESET AGRESSIVO CONCLUÍDO!');
      console.log('✨ Banco de dados completamente limpo!');
      console.log('📦 Pronto para novas migrações');
    } else {
      console.log(`⚠️  Ainda restam ${objectCount} objetos`);
    }

  } catch (error) {
    console.error('❌ Erro durante reset agressivo:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  aggressiveReset()
    .then(() => {
      console.log('✅ Reset agressivo finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Reset agressivo falhou:', error);
      process.exit(1);
    });
}

module.exports = { aggressiveReset };

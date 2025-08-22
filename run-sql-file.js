// ========================================
// EXECUTAR ARQUIVO SQL
// ========================================

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function runSQLFile(filePath) {
  try {
    console.log(`🗄️  Executando arquivo SQL: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Executar o SQL completo
    await pool.query(sqlContent);
    
    console.log('✅ Arquivo SQL executado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Pegar arquivo da linha de comando
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('❌ Uso: node run-sql-file.js <arquivo.sql>');
  process.exit(1);
}

runSQLFile(sqlFile);

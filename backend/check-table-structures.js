// VERIFICAÇÃO DA ESTRUTURA DAS TABELAS EXISTENTES
// ===============================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkTableStructures() {
  console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS...');
  console.log('======================================');
  
  const tables = ['market_data', 'fear_greed_index', 'btc_dominance'];
  
  for (const tableName of tables) {
    try {
      console.log(`\n📊 TABELA: ${tableName}`);
      console.log('========================');
      
      // Verificar se a tabela existe
      const existsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `;
      
      const existsResult = await pool.query(existsQuery, [tableName]);
      
      if (existsResult.rows[0].exists) {
        console.log('✅ Tabela existe');
        
        // Buscar colunas da tabela
        const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `;
        
        const columnsResult = await pool.query(columnsQuery, [tableName]);
        
        console.log('📋 Colunas encontradas:');
        columnsResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Verificar dados existentes
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const countResult = await pool.query(countQuery);
        console.log(`📊 Total de registros: ${countResult.rows[0].count}`);
        
        // Mostrar últimos 3 registros se existirem
        if (parseInt(countResult.rows[0].count) > 0) {
          const sampleQuery = `
            SELECT * FROM ${tableName} 
            ORDER BY id DESC 
            LIMIT 3
          `;
          const sampleResult = await pool.query(sampleQuery);
          
          console.log('📋 Últimos registros:');
          sampleResult.rows.forEach((row, i) => {
            console.log(`  ${i+1}. ${JSON.stringify(row)}`);
          });
        }
        
      } else {
        console.log('❌ Tabela não existe');
      }
      
    } catch (error) {
      console.log(`❌ Erro ao verificar ${tableName}: ${error.message}`);
    }
  }
  
  await pool.end();
}

if (require.main === module) {
  checkTableStructures();
}

module.exports = { checkTableStructures };

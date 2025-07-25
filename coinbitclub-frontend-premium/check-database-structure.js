const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...\n');

    // 1. Verificar todas as tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas existentes:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // 2. Verificar estrutura da tabela plans
    console.log('\n🔍 Verificando se tabela plans existe...');
    const plansExists = tablesResult.rows.find(row => row.table_name === 'plans');
    if (plansExists) {
      const plansStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'plans'
        ORDER BY ordinal_position;
      `);
      console.log('✅ Estrutura da tabela plans:');
      plansStructure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Verificar se há registros na tabela plans
      const plansCount = await pool.query('SELECT COUNT(*) FROM plans');
      console.log(`📊 Registros na tabela plans: ${plansCount.rows[0].count}`);
    } else {
      console.log('❌ Tabela plans NÃO existe!');
    }

    // 3. Verificar estrutura da tabela affiliates
    console.log('\n🔍 Verificando estrutura da tabela affiliates...');
    const affiliatesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'affiliates'
      ORDER BY ordinal_position;
    `);
    console.log('📋 Estrutura da tabela affiliates:');
    affiliatesStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 4. Verificar foreign keys
    console.log('\n🔍 Verificando foreign keys...');
    const foreignKeys = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `);
    
    console.log('🔗 Foreign keys existentes:');
    foreignKeys.rows.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();

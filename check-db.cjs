const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkEnums() {
  try {
    // Verificar enums disponíveis
    const enums = await pool.query(`
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%status%'
      ORDER BY t.typname, e.enumsortorder
    `);
    
    console.log('📋 Enums de status disponíveis:');
    const enumGroups = {};
    enums.rows.forEach(row => {
      if (!enumGroups[row.typname]) enumGroups[row.typname] = [];
      enumGroups[row.typname].push(row.enumlabel);
    });
    
    Object.keys(enumGroups).forEach(enumName => {
      console.log(`- ${enumName}: ${enumGroups[enumName].join(', ')}`);
    });

    // Ver um usuário affiliate para entender o formato
    const sampleUser = await pool.query("SELECT id, name, email, role, status FROM users WHERE role = 'affiliate' LIMIT 1");
    console.log('\\n� Usuário affiliate de exemplo:');
    console.log(sampleUser.rows[0]);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

checkEnums();

const { Pool } = require('pg');
const fs = require('fs');

// Esta função será chamada com a URL do novo banco
async function applyCompleteBackup(newDatabaseUrl, backupFileName) {
  console.log('🚀 APLICANDO BACKUP COMPLETO NO NOVO BANCO');
  console.log('==========================================');
  console.log(`🗄️ Arquivo: ${backupFileName}`);
  console.log(`🌐 Banco: ${newDatabaseUrl.substring(0, 50)}...`);
  
  const pool = new Pool({
    connectionString: newDatabaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao novo banco PostgreSQL');
    
    // Verificar se o arquivo de backup existe
    if (!fs.existsSync(backupFileName)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupFileName}`);
    }
    
    // Ler o arquivo de backup
    console.log('📖 Lendo arquivo de backup...');
    const backupContent = fs.readFileSync(backupFileName, 'utf8');
    
    console.log(`📊 Tamanho do backup: ${(backupContent.length / 1024).toFixed(2)} KB`);
    
    // Contar comandos no backup
    const createTableCount = (backupContent.match(/CREATE TABLE/g) || []).length;
    const insertCount = (backupContent.match(/INSERT INTO/g) || []).length;
    const alterCount = (backupContent.match(/ALTER TABLE/g) || []).length;
    const indexCount = (backupContent.match(/CREATE INDEX/g) || []).length;
    
    console.log('📋 Comandos no backup:');
    console.log(`   🏗️ CREATE TABLE: ${createTableCount}`);
    console.log(`   📥 INSERT INTO: ${insertCount}`);
    console.log(`   🔧 ALTER TABLE: ${alterCount}`);
    console.log(`   🗂️ CREATE INDEX: ${indexCount}`);
    
    // Dividir em comandos individuais
    console.log('⚙️ Processando comandos SQL...');
    
    // Remover comentários e dividir por comandos
    const cleanSQL = backupContent
      .split('\\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\\n');
    
    // Executar o backup completo de uma vez
    console.log('🔄 Aplicando backup completo...');
    await client.query(cleanSQL);
    
    console.log('✅ Backup aplicado com sucesso!');
    
    // Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas criadas no novo banco:');
    const tables = tablesResult.rows.map(row => row.table_name);
    tables.forEach(table => {
      console.log(`   ✅ ${table}`);
    });
    
    // Verificar dados migrados
    console.log('\\n📊 Dados migrados:');
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        totalRecords += count;
        
        if (count > 0) {
          console.log(`   📊 ${table}: ${count} registros`);
        } else {
          console.log(`   📊 ${table}: 0 registros`);
        }
      } catch (error) {
        console.log(`   ⚠️ ${table}: erro ao contar registros`);
      }
    }
    
    console.log(`\\n📈 TOTAL DE REGISTROS MIGRADOS: ${totalRecords}`);
    
    // Verificar se há configurações do sistema
    try {
      const configResult = await client.query('SELECT config_key, config_value FROM system_config ORDER BY config_key');
      if (configResult.rows.length > 0) {
        console.log('\\n⚙️ Configurações do sistema migradas:');
        configResult.rows.forEach(row => {
          console.log(`   🔧 ${row.config_key}: ${row.config_value}`);
        });
      }
    } catch (error) {
      console.log('⚠️ Tabela system_config não encontrada ou erro ao ler');
    }
    
    // Verificar usuários migrados
    try {
      const usersResult = await client.query('SELECT email, name, role, status FROM users');
      if (usersResult.rows.length > 0) {
        console.log('\\n👥 Usuários migrados:');
        usersResult.rows.forEach(row => {
          console.log(`   👤 ${row.email} (${row.name}) - ${row.role} [${row.status}]`);
        });
      }
    } catch (error) {
      console.log('⚠️ Tabela users não encontrada ou erro ao ler');
    }
    
    client.release();
    console.log('\\n🎉 MIGRAÇÃO COMPLETA FINALIZADA COM SUCESSO!');
    
    return {
      success: true,
      tablesCreated: tables.length,
      recordsMigrated: totalRecords,
      tables: tables
    };
    
  } catch (error) {
    console.error('❌ ERRO NA APLICAÇÃO DO BACKUP:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await pool.end();
  }
}

// Se chamado diretamente via linha de comando
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Uso: node apply-complete-backup.js <DATABASE_URL> <BACKUP_FILE>');
    process.exit(1);
  }
  
  const [databaseUrl, backupFile] = args;
  applyCompleteBackup(databaseUrl, backupFile)
    .then(result => {
      if (result.success) {
        console.log('✅ Backup aplicado com sucesso!');
        process.exit(0);
      } else {
        console.log('❌ Falha na aplicação do backup:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    });
}

module.exports = { applyCompleteBackup };

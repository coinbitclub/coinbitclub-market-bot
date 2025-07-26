const { Pool } = require('pg');

// URLs dos bancos de dados
const SOURCE_DB = 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway';
const TARGET_DB = 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';

async function analyzeFailedMigrations() {
  const sourcePool = new Pool({
    connectionString: SOURCE_DB,
    ssl: { rejectUnauthorized: false }
  });

  const targetPool = new Pool({
    connectionString: TARGET_DB,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 ANÁLISE DETALHADA DE MIGRAÇÃO');
    console.log('=================================');

    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();

    // Obter todas as tabelas do banco de origem
    const sourceTablesResult = await sourceClient.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Obter todas as tabelas do banco de destino
    const targetTablesResult = await targetClient.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const sourceTables = sourceTablesResult.rows.map(r => ({ name: r.table_name, type: r.table_type }));
    const targetTables = targetTablesResult.rows.map(r => r.table_name);

    console.log(`📊 ORIGEM: ${sourceTables.length} tabelas`);
    console.log(`📥 DESTINO: ${targetTables.length} tabelas`);
    console.log('');

    // Separar por tipo
    const baseTables = sourceTables.filter(t => t.type === 'BASE TABLE');
    const views = sourceTables.filter(t => t.type === 'VIEW');

    console.log(`📋 Tabelas base: ${baseTables.length}`);
    console.log(`👁️ Views: ${views.length}`);
    console.log('');

    // Analisar tabelas não migradas
    const notMigrated = sourceTables.filter(table => !targetTables.includes(table.name));
    const migrated = sourceTables.filter(table => targetTables.includes(table.name));

    console.log('✅ TABELAS MIGRADAS COM SUCESSO:');
    console.log('================================');
    migrated.forEach(table => {
      console.log(`  ✅ ${table.name} (${table.type})`);
    });

    console.log('\n❌ TABELAS NÃO MIGRADAS:');
    console.log('========================');
    
    for (const table of notMigrated) {
      console.log(`\n❌ ${table.name} (${table.type})`);
      
      // Tentar identificar o motivo do erro
      try {
        if (table.type === 'BASE TABLE') {
          // Verificar se há problemas com sequências
          const seqCheck = await sourceClient.query(`
            SELECT column_name, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 
            AND column_default LIKE '%nextval%'
          `, [table.name]);

          if (seqCheck.rows.length > 0) {
            console.log(`    🔢 Problemas com sequências:`);
            seqCheck.rows.forEach(col => {
              console.log(`      - ${col.column_name}: ${col.column_default}`);
            });
          }

          // Verificar se há colunas problemáticas
          const colCheck = await sourceClient.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = $1 
            AND (data_type = 'USER-DEFINED' OR data_type LIKE '%[]%')
          `, [table.name]);

          if (colCheck.rows.length > 0) {
            console.log(`    🏷️ Tipos de dados problemáticos:`);
            colCheck.rows.forEach(col => {
              console.log(`      - ${col.column_name}: ${col.data_type}`);
            });
          }

          // Verificar palavras reservadas
          const reservedWords = ['user', 'order', 'group', 'index', 'key', 'table'];
          const hasReserved = await sourceClient.query(`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = $1 
            AND LOWER(column_name) = ANY($2)
          `, [table.name, reservedWords]);

          if (hasReserved.rows.length > 0) {
            console.log(`    🚫 Palavras reservadas encontradas:`);
            hasReserved.rows.forEach(col => {
              console.log(`      - ${col.column_name}`);
            });
          }

        } else if (table.type === 'VIEW') {
          console.log(`    👁️ View não migrada (views precisam ser recriadas)`);
        }

      } catch (checkError) {
        console.log(`    ❓ Erro ao analisar: ${checkError.message}`);
      }
    }

    console.log('\n📊 RESUMO DE PROBLEMAS IDENTIFICADOS:');
    console.log('====================================');
    
    const sequenceErrors = notMigrated.filter(t => t.name.includes('_seq') || t.name.includes('sequence'));
    const userRelated = notMigrated.filter(t => t.name.toLowerCase().includes('user'));
    const viewsNotMigrated = notMigrated.filter(t => t.type === 'VIEW');
    const baseTablesNotMigrated = notMigrated.filter(t => t.type === 'BASE TABLE');

    console.log(`🔢 Problemas com sequências: ${sequenceErrors.length}`);
    console.log(`👤 Tabelas com "user": ${userRelated.length}`);
    console.log(`👁️ Views não migradas: ${viewsNotMigrated.length}`);
    console.log(`📋 Tabelas base não migradas: ${baseTablesNotMigrated.length}`);

    // Verificar se Views são o problema principal
    if (viewsNotMigrated.length > 20) {
      console.log('\n💡 PRINCIPAL CAUSA: VIEWS NÃO SÃO MIGRADAS AUTOMATICAMENTE');
      console.log('Views são consultas salvas que dependem de outras tabelas.');
      console.log('Elas precisam ser recriadas após a migração das tabelas base.');
    }

    sourceClient.release();
    targetClient.release();

  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

analyzeFailedMigrations();

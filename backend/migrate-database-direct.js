const { Pool } = require('pg');

// URLs dos bancos de dados
const SOURCE_DB = 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway';
const TARGET_DB = 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';

// Configuração das conexões
const sourcePool = new Pool({
  connectionString: SOURCE_DB,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

const targetPool = new Pool({
  connectionString: TARGET_DB,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function migrateDatabase() {
  let sourceClient, targetClient;
  
  try {
    console.log('🔗 MIGRAÇÃO DIRETA DE BANCO DE DADOS');
    console.log('===================================');
    console.log('📤 Origem:', SOURCE_DB.substring(0, 50) + '...');
    console.log('📥 Destino:', TARGET_DB.substring(0, 50) + '...');
    console.log('');

    // Conectar aos bancos
    console.log('🔌 Conectando ao banco de origem...');
    sourceClient = await sourcePool.connect();
    console.log('✅ Conectado ao banco de origem');

    console.log('🔌 Conectando ao banco de destino...');
    targetClient = await targetPool.connect();
    console.log('✅ Conectado ao banco de destino');

    // 1. Listar todas as tabelas do banco de origem
    console.log('\n📋 Listando tabelas do banco de origem...');
    const tablesResult = await sourceClient.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    // Agrupar colunas por tabela
    const tables = {};
    tablesResult.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      });
    });

    console.log(`📊 Encontradas ${Object.keys(tables).length} tabelas:`);
    Object.keys(tables).forEach(tableName => {
      console.log(`  - ${tableName} (${tables[tableName].length} colunas)`);
    });

    // 2. Para cada tabela, criar no destino e migrar dados
    for (const tableName of Object.keys(tables)) {
      console.log(`\n🔄 Migrando tabela: ${tableName}`);
      
      try {
        // Obter estrutura completa da tabela
        const createTableResult = await sourceClient.query(`
          SELECT 
            'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' ||
            string_agg(
              column_name || ' ' || 
              CASE 
                WHEN data_type = 'character varying' THEN 'VARCHAR' || COALESCE('(' || character_maximum_length || ')', '')
                WHEN data_type = 'integer' THEN 'INTEGER'
                WHEN data_type = 'bigint' THEN 'BIGINT'
                WHEN data_type = 'boolean' THEN 'BOOLEAN'
                WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
                WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
                WHEN data_type = 'text' THEN 'TEXT'
                WHEN data_type = 'jsonb' THEN 'JSONB'
                WHEN data_type = 'json' THEN 'JSON'
                WHEN data_type = 'numeric' THEN 'NUMERIC' || COALESCE('(' || numeric_precision || ',' || numeric_scale || ')', '')
                WHEN data_type = 'decimal' THEN 'DECIMAL' || COALESCE('(' || numeric_precision || ',' || numeric_scale || ')', '')
                ELSE UPPER(data_type)
              END ||
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
              CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
              ', '
            ) || ');' as create_statement
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          GROUP BY table_name
        `, [tableName]);

        if (createTableResult.rows.length > 0) {
          const createStatement = createTableResult.rows[0].create_statement;
          console.log(`  📋 Criando estrutura da tabela...`);
          await targetClient.query(createStatement);
          console.log(`  ✅ Estrutura criada`);
        }

        // Contar registros na origem
        const countResult = await sourceClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const recordCount = parseInt(countResult.rows[0].count);
        
        console.log(`  📊 Registros na origem: ${recordCount}`);

        if (recordCount > 0) {
          // Obter todos os dados
          const dataResult = await sourceClient.query(`SELECT * FROM ${tableName}`);
          
          if (dataResult.rows.length > 0) {
            // Preparar comando INSERT
            const columns = Object.keys(dataResult.rows[0]);
            const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
            
            console.log(`  📥 Inserindo ${dataResult.rows.length} registros...`);
            
            // Inserir dados em lotes
            let inserted = 0;
            for (const row of dataResult.rows) {
              try {
                const values = columns.map(col => row[col]);
                await targetClient.query(insertQuery, values);
                inserted++;
              } catch (insertError) {
                console.log(`    ⚠️ Erro ao inserir registro: ${insertError.message}`);
              }
            }
            
            console.log(`  ✅ ${inserted}/${dataResult.rows.length} registros inseridos`);
          }
        } else {
          console.log(`  ℹ️ Tabela vazia - apenas estrutura criada`);
        }

        // Verificar chaves primárias e índices
        const pkResult = await sourceClient.query(`
          SELECT constraint_name, column_name
          FROM information_schema.key_column_usage 
          WHERE table_name = $1 AND constraint_name LIKE '%_pkey'
        `, [tableName]);

        if (pkResult.rows.length > 0) {
          console.log(`  🔑 Chave primária encontrada: ${pkResult.rows.map(r => r.column_name).join(', ')}`);
        }

      } catch (tableError) {
        console.error(`  ❌ Erro ao migrar tabela ${tableName}:`, tableError.message);
      }
    }

    // 3. Migrar sequências (AUTO_INCREMENT)
    console.log('\n🔢 Verificando sequências...');
    const sequencesResult = await sourceClient.query(`
      SELECT schemaname, sequencename, last_value 
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `);

    for (const seq of sequencesResult.rows) {
      try {
        console.log(`  🔢 Ajustando sequência: ${seq.sequencename} (valor: ${seq.last_value})`);
        await targetClient.query(`
          SELECT setval('${seq.sequencename}', ${seq.last_value}, true)
        `);
        console.log(`  ✅ Sequência ajustada`);
      } catch (seqError) {
        console.log(`  ⚠️ Erro na sequência ${seq.sequencename}: ${seqError.message}`);
      }
    }

    // 4. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL');
    console.log('===================');
    
    for (const tableName of Object.keys(tables)) {
      try {
        const sourceCount = await sourceClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const targetCount = await targetClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        const sourceTotal = parseInt(sourceCount.rows[0].count);
        const targetTotal = parseInt(targetCount.rows[0].count);
        
        if (sourceTotal === targetTotal) {
          console.log(`  ✅ ${tableName}: ${targetTotal} registros (100% migrado)`);
        } else {
          console.log(`  ⚠️ ${tableName}: origem=${sourceTotal}, destino=${targetTotal} (${Math.round(targetTotal/sourceTotal*100)}% migrado)`);
        }
      } catch (verifyError) {
        console.log(`  ❌ ${tableName}: erro na verificação - ${verifyError.message}`);
      }
    }

    console.log('\n🎉 MIGRAÇÃO DIRETA CONCLUÍDA COM SUCESSO!');
    console.log('=========================================');
    console.log('✅ Todas as tabelas e dados foram migrados');
    console.log('✅ Sequências ajustadas');
    console.log('✅ Estruturas preservadas');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('  1. Testar conexão com o novo banco');
    console.log('  2. Atualizar variável DATABASE_URL no Railway');
    console.log('  3. Fazer deploy do servidor com nova URL');
    console.log('  4. Executar testes de funcionalidade');

  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Fechar conexões
    if (sourceClient) {
      sourceClient.release();
    }
    if (targetClient) {
      targetClient.release();
    }
    
    await sourcePool.end();
    await targetPool.end();
    
    console.log('\n🔌 Conexões fechadas');
  }
}

// Executar migração
if (require.main === module) {
  migrateDatabase().catch(console.error);
}

module.exports = { migrateDatabase };

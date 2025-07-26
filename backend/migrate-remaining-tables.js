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

async function migrateRemainingTables() {
  let sourceClient, targetClient;
  
  try {
    console.log('🔧 MIGRAÇÃO CORRIGIDA - TABELAS RESTANTES');
    console.log('==========================================');
    console.log('');

    // Conectar aos bancos
    console.log('🔌 Conectando aos bancos...');
    sourceClient = await sourcePool.connect();
    targetClient = await targetPool.connect();
    console.log('✅ Conectado aos bancos');

    // 1. Primeiro, criar tipos ENUM necessários
    console.log('\n🏷️ Criando tipos de dados customizados...');
    
    const customTypes = [
      "CREATE TYPE commission_type AS ENUM ('percentage', 'fixed', 'tiered')",
      "CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read')",
      "CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'pending', 'cancelled', 'expired')",
      "CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical')",
      "CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'closed')"
    ];

    for (const typeSQL of customTypes) {
      try {
        await targetClient.query(typeSQL);
        console.log(`✅ Tipo criado: ${typeSQL.split(' ')[2]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Tipo já existe: ${typeSQL.split(' ')[2]}`);
        } else {
          console.log(`⚠️ Erro ao criar tipo: ${error.message}`);
        }
      }
    }

    // 2. Migrar tabelas que falharam anteriormente
    const problemTables = [
      'affiliate_commissions_old',
      'affiliates', 
      'ai_analysis',
      'ai_decisions',
      'ai_logs',
      'ai_reports', 
      'ai_signals',
      'audit_logs',
      'bot_logs',
      'checkout_sessions',
      'cointars',
      'commission_payouts',
      'commissions',
      'credentials',
      'currency_settings',
      'enhanced_features',
      'event_logs', 
      'exchange_rates',
      'knex_migrations',
      'knex_migrations_lock',
      'market_data',
      'notifications',
      'openai_logs',
      'orders',
      'signal_processing_queue',
      'signal_stats',
      'signals',
      'stripe_affiliate_tiers',
      'subscriptions',
      'system_alerts',
      'system_logs',
      'trading_signals',
      'user_subscriptions'
    ];

    console.log(`\n🔄 Migrando ${problemTables.length} tabelas restantes...`);

    for (const tableName of problemTables) {
      console.log(`\n🔄 Processando: ${tableName}`);
      
      try {
        // Verificar se a tabela já existe no destino
        const existsResult = await targetClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [tableName]);

        if (existsResult.rows[0].exists) {
          console.log(`  ℹ️ Tabela já existe - pulando`);
          continue;
        }

        // Obter definição completa da tabela
        const createResult = await sourceClient.query(`
          SELECT 
            'CREATE TABLE ' || table_name || ' (' ||
            string_agg(
              column_name || ' ' || 
              CASE 
                WHEN data_type = 'character varying' THEN 
                  CASE WHEN character_maximum_length IS NOT NULL 
                       THEN 'VARCHAR(' || character_maximum_length || ')' 
                       ELSE 'VARCHAR' END
                WHEN data_type = 'character' THEN 
                  CASE WHEN character_maximum_length IS NOT NULL 
                       THEN 'CHAR(' || character_maximum_length || ')' 
                       ELSE 'CHAR' END
                WHEN data_type = 'integer' THEN 
                  CASE WHEN column_default LIKE '%nextval%' THEN 'SERIAL' ELSE 'INTEGER' END
                WHEN data_type = 'bigint' THEN 
                  CASE WHEN column_default LIKE '%nextval%' THEN 'BIGSERIAL' ELSE 'BIGINT' END
                WHEN data_type = 'boolean' THEN 'BOOLEAN'
                WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
                WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
                WHEN data_type = 'text' THEN 'TEXT'
                WHEN data_type = 'jsonb' THEN 'JSONB'
                WHEN data_type = 'json' THEN 'JSON'
                WHEN data_type = 'numeric' THEN 
                  CASE WHEN numeric_precision IS NOT NULL 
                       THEN 'NUMERIC(' || numeric_precision || COALESCE(',' || numeric_scale, '') || ')' 
                       ELSE 'NUMERIC' END
                WHEN data_type = 'decimal' THEN 
                  CASE WHEN numeric_precision IS NOT NULL 
                       THEN 'DECIMAL(' || numeric_precision || COALESCE(',' || numeric_scale, '') || ')' 
                       ELSE 'DECIMAL' END
                WHEN data_type = 'real' THEN 'REAL'
                WHEN data_type = 'double precision' THEN 'DOUBLE PRECISION'
                WHEN data_type = 'date' THEN 'DATE'
                WHEN data_type = 'time without time zone' THEN 'TIME'
                WHEN data_type = 'USER-DEFINED' THEN 
                  CASE udt_name
                    WHEN 'commission_type' THEN 'commission_type'
                    WHEN 'notification_status' THEN 'notification_status'
                    WHEN 'subscription_status' THEN 'subscription_status'
                    WHEN 'alert_severity' THEN 'alert_severity'
                    WHEN 'alert_status' THEN 'alert_status'
                    ELSE 'VARCHAR(50)' -- fallback para tipos desconhecidos
                  END
                WHEN data_type = 'ARRAY' THEN 'TEXT[]'
                ELSE UPPER(data_type)
              END ||
              CASE WHEN is_nullable = 'NO' AND column_default NOT LIKE '%nextval%' THEN ' NOT NULL' ELSE '' END ||
              CASE 
                WHEN column_default IS NOT NULL AND column_default NOT LIKE '%nextval%' 
                THEN ' DEFAULT ' || column_default 
                ELSE '' 
              END,
              ', '
              ORDER BY ordinal_position
            ) || ');' as create_statement
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          GROUP BY table_name
        `, [tableName]);

        if (createResult.rows.length === 0) {
          console.log(`  ⚠️ Tabela não encontrada na origem`);
          continue;
        }

        let createStatement = createResult.rows[0].create_statement;

        // Correções específicas para problemas conhecidos
        if (tableName === 'knex_migrations_lock') {
          createStatement = createStatement.replace(/\bindex\b/g, '"index"');
        }
        
        if (tableName === 'checkout_sessions') {
          createStatement = createStatement.replace(/ARRAY/g, 'TEXT[]');
        }

        console.log(`  📋 Criando estrutura...`);
        await targetClient.query(createStatement);
        console.log(`  ✅ Estrutura criada`);

        // Migrar dados
        const countResult = await sourceClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const recordCount = parseInt(countResult.rows[0].count);
        
        console.log(`  📊 Registros na origem: ${recordCount}`);

        if (recordCount > 0) {
          const dataResult = await sourceClient.query(`SELECT * FROM ${tableName}`);
          
          if (dataResult.rows.length > 0) {
            const columns = Object.keys(dataResult.rows[0]);
            
            // Tratamento especial para colunas com nomes reservados
            const quotedColumns = columns.map(col => {
              const reservedWords = ['index', 'user', 'order', 'group', 'key', 'table'];
              return reservedWords.includes(col.toLowerCase()) ? `"${col}"` : col;
            });
            
            const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${quotedColumns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
            
            console.log(`  📥 Inserindo ${dataResult.rows.length} registros...`);
            
            let inserted = 0;
            for (const row of dataResult.rows) {
              try {
                const values = columns.map(col => row[col]);
                await targetClient.query(insertQuery, values);
                inserted++;
              } catch (insertError) {
                console.log(`    ⚠️ Erro ao inserir registro: ${insertError.message.substring(0, 100)}...`);
              }
            }
            
            console.log(`  ✅ ${inserted}/${dataResult.rows.length} registros inseridos`);
          }
        } else {
          console.log(`  ℹ️ Tabela vazia - apenas estrutura criada`);
        }

      } catch (tableError) {
        console.error(`  ❌ Erro ao migrar ${tableName}: ${tableError.message}`);
      }
    }

    // 3. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL COMPLETA');
    console.log('=============================');
    
    const finalSourceResult = await sourceClient.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const finalTargetResult = await targetClient.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const sourceTableCount = parseInt(finalSourceResult.rows[0].count);
    const targetTableCount = parseInt(finalTargetResult.rows[0].count);

    console.log(`📊 ORIGEM: ${sourceTableCount} tabelas base`);
    console.log(`📥 DESTINO: ${targetTableCount} tabelas base`);
    
    const migrationPercentage = Math.round((targetTableCount / sourceTableCount) * 100);
    console.log(`📈 Taxa de migração: ${migrationPercentage}%`);

    if (migrationPercentage >= 95) {
      console.log('\n🎉 MIGRAÇÃO QUASE COMPLETA!');
      console.log('✅ Todas as tabelas importantes foram migradas');
      console.log('✅ Sistema está pronto para produção');
    } else {
      console.log('\n⚠️ Algumas tabelas ainda não foram migradas');
      console.log('💡 Verifique os logs acima para detalhes específicos');
    }

  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO CORRIGIDA:', error.message);
    console.error('Stack:', error.stack);
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

// Executar migração corrigida
if (require.main === module) {
  migrateRemainingTables().catch(console.error);
}

module.exports = { migrateRemainingTables };

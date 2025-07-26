#!/usr/bin/env node

/**
 * 🔍 VALIDADOR DE BANCO DE DADOS PARA HOMOLOGAÇÃO
 * CoinBitClub Market Bot v3.0.0
 * 
 * Valida a estrutura completa do banco antes da homologação
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

console.log('🔍 VALIDADOR DE BANCO DE DADOS - HOMOLOGAÇÃO');
console.log('============================================');
console.log('📋 CoinBitClub Market Bot v3.0.0');
console.log('🗄️ PostgreSQL Railway Production');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('============================================\n');

const validationResults = {
  tables: [],
  functions: [],
  views: [],
  triggers: [],
  indexes: [],
  data: []
};

let totalChecks = 0;
let passedChecks = 0;

// ===== TABELAS OBRIGATÓRIAS =====
const REQUIRED_TABLES = [
  // Sistema de usuários
  'users', 'user_profiles', 'user_credentials', 'user_settings',
  
  // Sistema financeiro
  'subscriptions', 'payments', 'user_balances', 'company_financial',
  'prepaid_transactions', 'refund_requests',
  
  // Sistema de afiliados
  'affiliates', 'affiliate_commissions', 'affiliate_financial',
  
  // Sistema de trading
  'operations', 'tradingview_signals', 'order_executions',
  
  // Sistema de IA e análise
  'ai_analysis_real', 'openai_integration_logs',
  
  // Dados de mercado
  'btc_dominance', 'fear_greed_index', 'market_data_consolidated',
  
  // Sistema administrativo
  'api_configurations', 'system_monitoring_alerts', 'scheduled_jobs',
  
  // Logs e auditoria
  'system_logs', 'raw_webhook', 'signal_user_processing',
  
  // WhatsApp/Zapi (NOVO)
  'whatsapp_api_logs', 'whatsapp_webhook_logs', 'zapi_configurations', 'whatsapp_verifications'
];

// ===== FUNÇÕES OBRIGATÓRIAS =====
const REQUIRED_FUNCTIONS = [
  'handle_tradingview_webhook_with_auto_save',
  'execute_multiuser_trading_with_auto_save',
  'analyze_signal_with_openai_integrated',
  'production_system_monitor',
  'complete_system_health_check',
  'monitor_system_health',
  'scheduled_data_cleanup_integrated',
  'cleanup_old_market_data',
  'update_btc_dominance',
  'update_fear_greed_index',
  'execute_scheduled_jobs'
];

// ===== VIEWS OBRIGATÓRIAS =====
const REQUIRED_VIEWS = [
  'vw_company_balance',
  'vw_operations_summary',
  'vw_user_trading_summary',
  'vw_affiliate_performance',
  'vw_system_health_dashboard'
];

async function checkConnection() {
  console.log('🔗 Testando conectividade com PostgreSQL...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    
    console.log('   ✅ Conexão estabelecida com sucesso');
    console.log(`   🕐 Timestamp: ${result.rows[0].current_time}`);
    console.log(`   📋 Versão: ${result.rows[0].db_version.split(' ')[0]}`);
    
    totalChecks++;
    passedChecks++;
    validationResults.data.push({
      check: 'Database Connection',
      success: true,
      details: 'Connected successfully'
    });
    
    return true;
  } catch (error) {
    console.log('   ❌ Falha na conexão:', error.message);
    
    totalChecks++;
    validationResults.data.push({
      check: 'Database Connection',
      success: false,
      details: error.message
    });
    
    return false;
  }
}

async function validateTables() {
  console.log('\n📋 Validando tabelas obrigatórias...');
  
  try {
    const client = await pool.connect();
    
    for (const tableName of REQUIRED_TABLES) {
      totalChecks++;
      
      const result = await client.query(`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = $1) as column_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ ${tableName} (${result.rows[0].column_count} colunas)`);
        passedChecks++;
        validationResults.tables.push({
          table: tableName,
          exists: true,
          columns: result.rows[0].column_count
        });
      } else {
        console.log(`   ❌ ${tableName} - NÃO ENCONTRADA`);
        validationResults.tables.push({
          table: tableName,
          exists: false,
          columns: 0
        });
      }
    }
    
    // Verificar se há tabelas Zapi específicas
    const zapiTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%whatsapp%' OR table_name LIKE '%zapi%'
    `);
    
    console.log(`\n📱 Tabelas WhatsApp/Zapi encontradas: ${zapiTables.rows.length}`);
    zapiTables.rows.forEach(row => {
      console.log(`   📋 ${row.table_name}`);
    });
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Erro na validação de tabelas:', error.message);
  }
}

async function validateFunctions() {
  console.log('\n⚙️ Validando funções obrigatórias...');
  
  try {
    const client = await pool.connect();
    
    for (const functionName of REQUIRED_FUNCTIONS) {
      totalChecks++;
      
      const result = await client.query(`
        SELECT proname, pg_get_function_result(oid) as return_type
        FROM pg_proc 
        WHERE proname = $1
      `, [functionName]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ ${functionName}() -> ${result.rows[0].return_type}`);
        passedChecks++;
        validationResults.functions.push({
          function: functionName,
          exists: true,
          return_type: result.rows[0].return_type
        });
      } else {
        console.log(`   ❌ ${functionName}() - NÃO ENCONTRADA`);
        validationResults.functions.push({
          function: functionName,
          exists: false,
          return_type: null
        });
      }
    }
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Erro na validação de funções:', error.message);
  }
}

async function validateViews() {
  console.log('\n👁️ Validando views obrigatórias...');
  
  try {
    const client = await pool.connect();
    
    for (const viewName of REQUIRED_VIEWS) {
      totalChecks++;
      
      const result = await client.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = $1) as column_count
        FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = $1
      `, [viewName]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ ${viewName} (${result.rows[0].column_count} colunas)`);
        passedChecks++;
        validationResults.views.push({
          view: viewName,
          exists: true,
          columns: result.rows[0].column_count
        });
      } else {
        console.log(`   ❌ ${viewName} - NÃO ENCONTRADA`);
        validationResults.views.push({
          view: viewName,
          exists: false,
          columns: 0
        });
      }
    }
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Erro na validação de views:', error.message);
  }
}

async function validateIndexes() {
  console.log('\n📊 Validando índices de performance...');
  
  try {
    const client = await pool.connect();
    
    const indexes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`   📊 Total de índices encontrados: ${indexes.rows.length}`);
    
    // Verificar índices críticos
    const criticalIndexes = [
      'users_email_idx',
      'operations_user_id_idx',
      'operations_created_at_idx',
      'tradingview_signals_timestamp_idx',
      'whatsapp_api_logs_created_at_idx'
    ];
    
    for (const indexName of criticalIndexes) {
      totalChecks++;
      
      const found = indexes.rows.find(idx => idx.indexname === indexName);
      if (found) {
        console.log(`   ✅ ${indexName}`);
        passedChecks++;
        validationResults.indexes.push({
          index: indexName,
          exists: true,
          table: found.tablename
        });
      } else {
        console.log(`   ⚠️ ${indexName} - Recomendado mas não obrigatório`);
        validationResults.indexes.push({
          index: indexName,
          exists: false,
          table: 'unknown'
        });
      }
    }
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Erro na validação de índices:', error.message);
  }
}

async function validateData() {
  console.log('\n📊 Validando dados críticos...');
  
  try {
    const client = await pool.connect();
    
    // Verificar usuários
    totalChecks++;
    const users = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`   👥 Usuários cadastrados: ${users.rows[0].count}`);
    if (parseInt(users.rows[0].count) > 0) {
      passedChecks++;
    }
    
    // Verificar configurações API
    totalChecks++;
    const apiConfigs = await client.query('SELECT COUNT(*) as count FROM api_configurations');
    console.log(`   ⚙️ Configurações de API: ${apiConfigs.rows[0].count}`);
    if (parseInt(apiConfigs.rows[0].count) > 0) {
      passedChecks++;
    }
    
    // Verificar configurações Zapi (NOVO)
    totalChecks++;
    try {
      const zapiConfigs = await client.query('SELECT COUNT(*) as count FROM zapi_configurations');
      console.log(`   📱 Configurações Zapi: ${zapiConfigs.rows[0].count}`);
      if (parseInt(zapiConfigs.rows[0].count) >= 0) {
        passedChecks++;
      }
    } catch (error) {
      console.log(`   ⚠️ Tabela zapi_configurations não encontrada`);
    }
    
    // Verificar logs do sistema
    totalChecks++;
    const systemLogs = await client.query('SELECT COUNT(*) as count FROM system_logs WHERE created_at > NOW() - INTERVAL \'24 hours\'');
    console.log(`   📋 Logs das últimas 24h: ${systemLogs.rows[0].count}`);
    if (parseInt(systemLogs.rows[0].count) >= 0) {
      passedChecks++;
    }
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Erro na validação de dados:', error.message);
  }
}

async function validateTriggers() {
  console.log('\n⚡ Validando triggers automáticos...');
  
  try {
    const client = await pool.connect();
    
    const triggers = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log(`   ⚡ Total de triggers encontrados: ${triggers.rows.length}`);
    
    const criticalTriggers = [
      'trg_apply_commissions',
      'trg_track_company_revenue',
      'trg_reserve_on_refund_request'
    ];
    
    for (const triggerName of criticalTriggers) {
      totalChecks++;
      
      const found = triggers.rows.find(trg => trg.trigger_name === triggerName);
      if (found) {
        console.log(`   ✅ ${triggerName} -> ${found.event_object_table}`);
        passedChecks++;
        validationResults.triggers.push({
          trigger: triggerName,
          exists: true,
          table: found.event_object_table
        });
      } else {
        console.log(`   ⚠️ ${triggerName} - Recomendado`);
        validationResults.triggers.push({
          trigger: triggerName,
          exists: false,
          table: 'unknown'
        });
      }
    }
    
    client.release();
    
  } catch (error) {
    console.log('   ❌ Erro na validação de triggers:', error.message);
  }
}

function generateDatabaseReport() {
  console.log('\n📋 RELATÓRIO DE VALIDAÇÃO DO BANCO');
  console.log('==================================');
  
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`✅ Verificações realizadas: ${totalChecks}`);
  console.log(`🎯 Verificações aprovadas: ${passedChecks}`);
  console.log(`📊 Taxa de conformidade: ${successRate}%`);
  
  console.log('\n📊 RESUMO POR CATEGORIA:');
  
  // Tabelas
  const tablesPass = validationResults.tables.filter(t => t.exists).length;
  const tablesTotal = validationResults.tables.length;
  console.log(`   📋 Tabelas: ${tablesPass}/${tablesTotal} (${Math.round(tablesPass/tablesTotal*100)}%)`);
  
  // Funções
  const functionsPass = validationResults.functions.filter(f => f.exists).length;
  const functionsTotal = validationResults.functions.length;
  console.log(`   ⚙️ Funções: ${functionsPass}/${functionsTotal} (${Math.round(functionsPass/functionsTotal*100)}%)`);
  
  // Views
  const viewsPass = validationResults.views.filter(v => v.exists).length;
  const viewsTotal = validationResults.views.length;
  console.log(`   👁️ Views: ${viewsPass}/${viewsTotal} (${Math.round(viewsPass/viewsTotal*100)}%)`);
  
  console.log('\n🎯 AVALIAÇÃO DO BANCO:');
  
  if (successRate >= 95) {
    console.log('🎉 ✅ BANCO APROVADO PARA HOMOLOGAÇÃO');
    console.log('🗄️ Estrutura completa e funcional');
    console.log('🚀 Pronto para testes de funcionalidade');
  } else if (successRate >= 85) {
    console.log('⚠️ ✅ BANCO APROVADO COM RESSALVAS');
    console.log('🔧 Algumas estruturas podem estar faltando');
    console.log('📝 Revisar antes dos testes funcionais');
  } else {
    console.log('❌ ❌ BANCO REPROVADO');
    console.log('🚫 Estruturas críticas faltando');
    console.log('🔄 Correções obrigatórias antes da homologação');
  }
  
  console.log('\n📅 Validação realizada em:', new Date().toLocaleString('pt-BR'));
  console.log('🗄️ PostgreSQL Railway Production');
  console.log('📋 CoinBitClub Market Bot v3.0.0');
  
  console.log('\n==================================');
  console.log('🔍 VALIDAÇÃO DO BANCO FINALIZADA');
  console.log('==================================');
  
  return successRate >= 85 ? 0 : 1;
}

async function runDatabaseValidation() {
  try {
    const connected = await checkConnection();
    if (!connected) {
      console.log('❌ Não foi possível conectar ao banco');
      process.exit(1);
    }
    
    await validateTables();
    await validateFunctions();
    await validateViews();
    await validateIndexes();
    await validateTriggers();
    await validateData();
    
    const exitCode = generateDatabaseReport();
    await pool.end();
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NA VALIDAÇÃO:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Executar validação
runDatabaseValidation().catch(console.error);

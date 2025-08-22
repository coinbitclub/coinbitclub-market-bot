// ========================================
// MARKETBOT - VALIDAÇÃO SIMPLES E DIRETA
// ========================================

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

async function validacaoSimples() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🎯 VALIDAÇÃO SIMPLES E DIRETA');
    console.log('============================');

    // SPRINT 4
    console.log('\n📊 SPRINT 4 - VERIFICAÇÃO REAL');
    let sprint4 = 0;

    // Verificar system_metrics com dados corretos
    try {
      const metrics = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE metric_type IS NOT NULL) as with_type,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent
        FROM system_metrics
      `);
      console.log(`Métricas: ${metrics.rows[0].total} total, ${metrics.rows[0].with_type} com tipo, ${metrics.rows[0].recent} recentes`);
      if (metrics.rows[0].with_type > 0) sprint4 += 25;
    } catch (e) {
      console.log('❌ Erro nas métricas:', e.message);
    }

    // Verificar system_alerts com status
    try {
      const alerts = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active
        FROM system_alerts
      `);
      console.log(`Alertas: ${alerts.rows[0].total} total, ${alerts.rows[0].active} ativos`);
      if (alerts.rows[0].active > 0) sprint4 += 30;
    } catch (e) {
      console.log('❌ Erro nos alertas:', e.message);
    }

    // Verificar arquivos
    if (fs.existsSync('./src/services/dashboard.service.ts')) {
      console.log('✅ DashboardService existe');
      sprint4 += 15;
    }
    if (fs.existsSync('./src/routes/dashboard.routes.ts')) {
      console.log('✅ Dashboard routes existe');
      sprint4 += 15;
    }
    if (fs.existsSync('./src/services/websocket.service.ts')) {
      console.log('✅ WebSocket service existe');
      sprint4 += 15;
    }

    console.log(`SPRINT 4 REAL: ${sprint4}/100`);

    // SPRINT 5
    console.log('\n⚙️ SPRINT 5 - VERIFICAÇÃO REAL');
    let sprint5 = 0;

    // Verificar trading_configurations
    try {
      const configs = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          global_max_leverage,
          array_length(supported_exchanges, 1) as exchanges
        FROM trading_configurations
        WHERE is_active = true
        LIMIT 1
      `);
      
      if (configs.rows.length > 0) {
        const c = configs.rows[0];
        console.log(`Configs: ${c.total} total, leverage ${c.global_max_leverage}x, ${c.exchanges} exchanges`);
        sprint5 += 20;
      }
    } catch (e) {
      console.log('❌ Erro nas configs:', e.message);
    }

    // Verificar trading_queue
    try {
      const queue = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'QUEUED') as queued,
          COUNT(*) FILTER (WHERE environment = 'MAINNET') as mainnet
        FROM trading_queue
      `);
      
      console.log(`Queue: ${queue.rows[0].total} total, ${queue.rows[0].queued} na fila, ${queue.rows[0].mainnet} mainnet`);
      if (queue.rows[0].total > 0) sprint5 += 20;
    } catch (e) {
      console.log('❌ Erro na queue:', e.message);
    }

    // Verificar tabelas adicionais
    try {
      const limits = await client.query('SELECT COUNT(*) as count FROM user_trading_limits');
      console.log(`Trading limits: ${limits.rows[0].count}`);
      if (limits.rows[0].count > 0) sprint5 += 10;
    } catch (e) {
      console.log('❌ Trading limits não existe');
    }

    try {
      const audit = await client.query('SELECT COUNT(*) as count FROM trading_config_audit');
      console.log(`Config audit: ${audit.rows[0].count}`);
      if (audit.rows[0].count > 0) sprint5 += 10;
    } catch (e) {
      console.log('❌ Config audit não existe');
    }

    try {
      const positions = await client.query('SELECT COUNT(*) as count FROM trading_positions');
      console.log(`Trading positions: ${positions.rows[0].count}`);
      if (positions.rows[0].count >= 0) sprint5 += 10;
    } catch (e) {
      console.log('❌ Trading positions não existe');
    }

    // Verificar serviços
    if (fs.existsSync('./src/services/trading-configuration.service.ts')) {
      console.log('✅ TradingConfigurationService existe');
      sprint5 += 15;
    }
    if (fs.existsSync('./src/services/trading-queue-simple.service.ts')) {
      console.log('✅ TradingQueueService existe');
      sprint5 += 15;
    }

    console.log(`SPRINT 5 REAL: ${sprint5}/100`);

    console.log('\n🎯 RESULTADO FINAL REAL');
    console.log('=======================');
    console.log(`Sprint 4: ${sprint4}/100`);
    console.log(`Sprint 5: ${sprint5}/100`);
    console.log(`Total: ${sprint4 + sprint5}/200 (${Math.round((sprint4 + sprint5)/2)}%)`);

    if (sprint4 >= 90 && sprint5 >= 90) {
      console.log('🎉 AMBOS OS SPRINTS ATINGIRAM 90%+!');
    } else {
      console.log('⚠️ Ainda precisam de melhorias para 90%+');
      
      if (sprint4 < 90) {
        console.log(`Sprint 4 precisa de mais ${90 - sprint4} pontos`);
      }
      if (sprint5 < 90) {
        console.log(`Sprint 5 precisa de mais ${90 - sprint5} pontos`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await client.end();
  }
}

validacaoSimples().catch(console.error);

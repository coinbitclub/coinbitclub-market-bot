// ========================================
// MARKETBOT - VALIDAÇÃO RÁPIDA SPRINTS 4 E 5
// ========================================

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

async function validarSprints4e5() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🎯 VALIDAÇÃO RÁPIDA SPRINTS 4 E 5');
    console.log('=================================');

    // ============================================
    // SPRINT 4 VALIDATION
    // ============================================
    console.log('\n📊 SPRINT 4 - DASHBOARD E MONITORAMENTO');
    let sprint4Score = 0;

    // 4.1 System metrics (40 pontos)
    try {
      const metricsCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'system_metrics'
        )
      `);
      
      if (metricsCheck.rows[0].exists) {
        const metricsStats = await client.query(`
          SELECT 
            COUNT(*) as total_metrics,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent_metrics,
            COUNT(DISTINCT metric_type) as metric_types,
            AVG(response_time) as avg_response_time
          FROM system_metrics
        `);
        
        const stats = metricsStats.rows[0];
        sprint4Score += 25;
        console.log(`✅ System metrics: ${stats.total_metrics} total, ${stats.recent_metrics} recentes, ${stats.metric_types} tipos`);
        
        // Verificar DashboardService
        if (fs.existsSync(path.join(process.cwd(), 'src/services/dashboard.service.ts'))) {
          sprint4Score += 15;
          console.log('✅ DashboardService implementado');
        }
      }
    } catch (error) {
      console.log('❌ Erro validando métricas:', error.message);
    }

    // 4.2 System alerts (30 pontos)
    try {
      const alertsCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'system_alerts'
        )
      `);
      
      if (alertsCheck.rows[0].exists) {
        const alertsStats = await client.query(`
          SELECT 
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_alerts,
            COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_alerts
          FROM system_alerts
        `);
        
        const stats = alertsStats.rows[0];
        sprint4Score += 30;
        console.log(`✅ System alerts: ${stats.total_alerts} total, ${stats.active_alerts} ativos, ${stats.critical_alerts} críticos`);
      }
    } catch (error) {
      console.log('❌ Erro validando alertas:', error.message);
    }

    // 4.3 Dashboard API (30 pontos)
    let dashboardFiles = 0;
    if (fs.existsSync(path.join(process.cwd(), 'src/routes/dashboard.routes.ts'))) {
      dashboardFiles++;
      console.log('✅ Dashboard routes implementadas');
    }
    if (fs.existsSync(path.join(process.cwd(), 'src/services/websocket.service.ts'))) {
      dashboardFiles++;
      console.log('✅ WebSocket service implementado');
    }
    
    sprint4Score += Math.round((dashboardFiles / 2) * 30);

    console.log(`📊 SPRINT 4 SCORE: ${sprint4Score}/100`);

    // ============================================
    // SPRINT 5 VALIDATION
    // ============================================
    console.log('\n⚙️ SPRINT 5 - TRADING ENGINE ENTERPRISE');
    let sprint5Score = 0;

    // 5.1 Trading configurations (35 pontos)
    try {
      const configCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'trading_configurations'
        )
      `);
      
      if (configCheck.rows[0].exists) {
        const configStats = await client.query(`
          SELECT 
            COUNT(*) as total_configs,
            global_max_leverage,
            global_max_position_size_percent,
            rate_limit_per_minute,
            array_length(supported_exchanges, 1) as exchanges_count,
            array_length(allowed_symbols, 1) as symbols_count
          FROM trading_configurations 
          WHERE is_active = true
          LIMIT 1
        `);
        
        if (configStats.rows.length > 0) {
          const stats = configStats.rows[0];
          sprint5Score += 20;
          console.log(`✅ Trading configs ativos: leverage ${stats.global_max_leverage}x, ${stats.exchanges_count} exchanges, ${stats.symbols_count} símbolos`);
        }
        
        // Verificar TradingConfigurationService
        if (fs.existsSync(path.join(process.cwd(), 'src/services/trading-configuration.service.ts'))) {
          sprint5Score += 15;
          console.log('✅ TradingConfigurationService implementado');
        }
      }
    } catch (error) {
      console.log('❌ Erro validando configs:', error.message);
    }

    // 5.2 Trading queue (35 pontos)
    try {
      const queueCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'trading_queue'
        )
      `);
      
      if (queueCheck.rows[0].exists) {
        const queueStats = await client.query(`
          SELECT 
            COUNT(*) as total_trades,
            COUNT(*) FILTER (WHERE status = 'QUEUED') as queued,
            COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
            COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
            COUNT(*) FILTER (WHERE environment = 'MAINNET') as mainnet_trades
          FROM trading_queue
        `);
        
        const stats = queueStats.rows[0];
        sprint5Score += 20;
        console.log(`✅ Trading queue: ${stats.total_trades} total, ${stats.queued} fila, ${stats.processing} processando, ${stats.completed} completos`);
        
        // Verificar TradingQueueService
        if (fs.existsSync(path.join(process.cwd(), 'src/services/trading-queue-simple.service.ts'))) {
          sprint5Score += 15;
          console.log('✅ TradingQueueService implementado');
        }
      }
    } catch (error) {
      console.log('❌ Erro validando queue:', error.message);
    }

    // 5.3 Trading tables and API (30 pontos)
    const tradingTables = ['trading_positions', 'user_trading_limits', 'trading_config_audit'];
    let tradingFound = 0;
    
    for (const table of tradingTables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
          tradingFound++;
          console.log(`✅ ${table}: ${count.rows[0].count} registros`);
        }
      } catch (error) {
        console.log(`❌ ${table}: erro`);
      }
    }
    
    // Verificar trading routes
    if (fs.existsSync(path.join(process.cwd(), 'src/routes/trading.routes.ts'))) {
      tradingFound++;
      console.log('✅ Trading routes implementadas');
    }
    
    sprint5Score += Math.round((tradingFound / 4) * 30);

    console.log(`📊 SPRINT 5 SCORE: ${sprint5Score}/100`);

    // ============================================
    // RESULTADO FINAL
    // ============================================
    console.log('\n🎯 RESULTADO FINAL');
    console.log('==================');
    console.log(`Sprint 4: ${sprint4Score}/100 ${sprint4Score >= 90 ? '🏆' : sprint4Score >= 70 ? '✅' : '⚠️'}`);
    console.log(`Sprint 5: ${sprint5Score}/100 ${sprint5Score >= 90 ? '🏆' : sprint5Score >= 70 ? '✅' : '⚠️'}`);
    
    const total45 = sprint4Score + sprint5Score;
    console.log(`Total Sprints 4+5: ${total45}/200 (${Math.round(total45/2)}%)`);
    
    if (sprint4Score >= 90 && sprint5Score >= 90) {
      console.log('🎉 SUCESSO! Ambos os sprints atingiram 90%+');
    } else if (sprint4Score >= 70 && sprint5Score >= 70) {
      console.log('✅ BOM! Ambos os sprints estão acima de 70%');
    } else {
      console.log('⚠️ Ainda precisam de melhorias');
    }

  } catch (error) {
    console.error('❌ Erro na validação:', error.message);
  } finally {
    await client.end();
  }
}

validarSprints4e5().catch(console.error);

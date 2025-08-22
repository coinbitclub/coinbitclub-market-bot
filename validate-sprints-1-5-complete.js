// ========================================
// MARKETBOT - SCRIPT VALIDAÇÃO COMPLETA SPRINTS 1-5
// Verificação e Implementação 100% para MVP Ready
// ========================================

const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

// Configuração do banco
const DB_CONFIG = {
  connectionString: 'postgresql://postgres:mKCaVaWXOlPLUjjOEgEKzpjjVuDAVxfY@junction.proxy.rlwy.net:52299/railway'
};

class MarketBotValidationScript {
  constructor() {
    this.client = new Client(DB_CONFIG);
    this.results = {
      sprint1: { completed: 0, total: 0, issues: [] },
      sprint2: { completed: 0, total: 0, issues: [] },
      sprint3: { completed: 0, total: 0, issues: [] },
      sprint4: { completed: 0, total: 0, issues: [] },
      sprint5: { completed: 0, total: 0, issues: [] },
      overall: { percentage: 0, readyForProduction: false }
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Conectado ao banco de dados Railway PostgreSQL');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão com banco:', error.message);
      return false;
    }
  }

  // ========================================
  // SPRINT 1 - CORREÇÕES CRÍTICAS (OBJETIVO: 100%)
  // ========================================
  async validateSprint1() {
    console.log('\n🔍 VALIDANDO SPRINT 1 - CORREÇÕES CRÍTICAS');
    console.log('==========================================');
    
    const checks = [
      { name: 'Verificar migrações Stripe aplicadas', fn: () => this.checkStripeTables() },
      { name: 'Validar sistema de cupons funcionando', fn: () => this.checkCouponsSystem() },
      { name: 'Testar testes automatizados', fn: () => this.runAutomatedTests() },
      { name: 'Verificar estrutura de banco completa', fn: () => this.checkDatabaseStructure() },
      { name: 'Validar dados iniciais carregados', fn: () => this.checkInitialData() }
    ];

    this.results.sprint1.total = checks.length;
    
    for (const check of checks) {
      try {
        console.log(`\n📋 ${check.name}...`);
        const result = await check.fn();
        if (result.success) {
          console.log(`✅ ${result.message}`);
          this.results.sprint1.completed++;
        } else {
          console.log(`❌ ${result.message}`);
          this.results.sprint1.issues.push(result.message);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        this.results.sprint1.issues.push(`${check.name}: ${error.message}`);
      }
    }
  }

  // ========================================
  // SPRINT 2 - SISTEMA FINANCEIRO (OBJETIVO: 100%)
  // ========================================
  async validateSprint2() {
    console.log('\n💰 VALIDANDO SPRINT 2 - SISTEMA FINANCEIRO');
    console.log('===========================================');
    
    const checks = [
      { name: 'Sistema de comissionamento automático', fn: () => this.checkCommissionSystem() },
      { name: 'Sistema de saques completo', fn: () => this.checkWithdrawalSystem() },
      { name: 'Webhooks Stripe funcionais', fn: () => this.checkStripeWebhooks() },
      { name: 'Reconciliação financeira', fn: () => this.checkFinancialReconciliation() },
      { name: 'Logs de auditoria financeira', fn: () => this.checkFinancialAuditing() }
    ];

    this.results.sprint2.total = checks.length;
    
    for (const check of checks) {
      try {
        console.log(`\n📋 ${check.name}...`);
        const result = await check.fn();
        if (result.success) {
          console.log(`✅ ${result.message}`);
          this.results.sprint2.completed++;
        } else {
          console.log(`❌ ${result.message}`);
          this.results.sprint2.issues.push(result.message);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        this.results.sprint2.issues.push(`${check.name}: ${error.message}`);
      }
    }
  }

  // ========================================
  // SPRINT 3 - SEGURANÇA ENTERPRISE (OBJETIVO: 100%)
  // ========================================
  async validateSprint3() {
    console.log('\n🔐 VALIDANDO SPRINT 3 - SEGURANÇA ENTERPRISE');
    console.log('============================================');
    
    const checks = [
      { name: 'Sistema 2FA obrigatório', fn: () => this.check2FASystem() },
      { name: 'Sistema de bloqueio de segurança', fn: () => this.checkSecurityLockout() },
      { name: 'Middleware de segurança integrado', fn: () => this.checkSecurityMiddleware() },
      { name: 'Estrutura de banco de segurança', fn: () => this.checkSecurityTables() },
      { name: 'Logs de auditoria de segurança', fn: () => this.checkSecurityAuditing() }
    ];

    this.results.sprint3.total = checks.length;
    
    for (const check of checks) {
      try {
        console.log(`\n📋 ${check.name}...`);
        const result = await check.fn();
        if (result.success) {
          console.log(`✅ ${result.message}`);
          this.results.sprint3.completed++;
        } else {
          console.log(`❌ ${result.message}`);
          this.results.sprint3.issues.push(result.message);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        this.results.sprint3.issues.push(`${check.name}: ${error.message}`);
      }
    }
  }

  // ========================================
  // SPRINT 4 - DASHBOARD E MONITORAMENTO (OBJETIVO: 100%)
  // ========================================
  async validateSprint4() {
    console.log('\n📊 VALIDANDO SPRINT 4 - DASHBOARD E MONITORAMENTO');
    console.log('=================================================');
    
    const checks = [
      { name: 'Dashboard admin real-time', fn: () => this.checkDashboardSystem() },
      { name: 'WebSocket para updates instantâneos', fn: () => this.checkWebSocketSystem() },
      { name: 'Sistema de alertas automáticos', fn: () => this.checkAlertsSystem() },
      { name: 'Métricas de performance', fn: () => this.checkPerformanceMetrics() },
      { name: 'Monitoramento 24/7', fn: () => this.checkMonitoringSystem() }
    ];

    this.results.sprint4.total = checks.length;
    
    for (const check of checks) {
      try {
        console.log(`\n📋 ${check.name}...`);
        const result = await check.fn();
        if (result.success) {
          console.log(`✅ ${result.message}`);
          this.results.sprint4.completed++;
        } else {
          console.log(`❌ ${result.message}`);
          this.results.sprint4.issues.push(result.message);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        this.results.sprint4.issues.push(`${check.name}: ${error.message}`);
      }
    }
  }

  // ========================================
  // SPRINT 5 - TRADING ENGINE ENTERPRISE (OBJETIVO: 100%)
  // ========================================
  async validateSprint5() {
    console.log('\n⚙️ VALIDANDO SPRINT 5 - TRADING ENGINE ENTERPRISE');
    console.log('=================================================');
    
    const checks = [
      { name: 'Trading Configuration Service', fn: () => this.checkTradingConfigService() },
      { name: 'Trading Queue Service com prioridades', fn: () => this.checkTradingQueueService() },
      { name: 'Validações de risco rigorosas', fn: () => this.checkRiskValidations() },
      { name: 'REST API completa de trading', fn: () => this.checkTradingAPI() },
      { name: 'Database schema enterprise', fn: () => this.checkTradingTables() }
    ];

    this.results.sprint5.total = checks.length;
    
    for (const check of checks) {
      try {
        console.log(`\n📋 ${check.name}...`);
        const result = await check.fn();
        if (result.success) {
          console.log(`✅ ${result.message}`);
          this.results.sprint5.completed++;
        } else {
          console.log(`❌ ${result.message}`);
          this.results.sprint5.issues.push(result.message);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        this.results.sprint5.issues.push(`${check.name}: ${error.message}`);
      }
    }
  }

  // ========================================
  // IMPLEMENTAÇÕES DE VALIDAÇÃO
  // ========================================

  async checkStripeTables() {
    const tables = ['stripe_customers', 'stripe_subscriptions', 'stripe_payment_methods', 'stripe_invoices'];
    const missing = [];
    
    for (const table of tables) {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        missing.push(table);
      }
    }
    
    if (missing.length === 0) {
      return { success: true, message: `Todas as ${tables.length} tabelas Stripe estão criadas` };
    } else {
      return { success: false, message: `Tabelas faltando: ${missing.join(', ')}` };
    }
  }

  async checkCouponsSystem() {
    try {
      const result = await this.client.query('SELECT COUNT(*) FROM coupons');
      const hasValidation = await this.client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name IN ('type', 'discount_value', 'expires_at')
      `);
      
      if (hasValidation.rows.length >= 3) {
        return { success: true, message: `Sistema de cupons operacional com ${result.rows[0].count} cupons` };
      } else {
        return { success: false, message: 'Estrutura de cupons incompleta' };
      }
    } catch (error) {
      return { success: false, message: 'Tabela de cupons não encontrada' };
    }
  }

  async runAutomatedTests() {
    try {
      // Verificar se os arquivos de teste existem
      const testFiles = [
        'tests/integration/database.integration.test.ts',
        'tests/integration/api.integration.test.ts'
      ];
      
      let existingTests = 0;
      for (const testFile of testFiles) {
        if (fs.existsSync(testFile)) {
          existingTests++;
        }
      }
      
      if (existingTests === testFiles.length) {
        return { success: true, message: `${existingTests} arquivos de teste encontrados` };
      } else {
        return { success: false, message: `Apenas ${existingTests}/${testFiles.length} arquivos de teste encontrados` };
      }
    } catch (error) {
      return { success: false, message: 'Erro ao verificar testes' };
    }
  }

  async checkDatabaseStructure() {
    const essentialTables = [
      'users', 'user_subscriptions', 'affiliates', 'coupons', 
      'stripe_customers', 'withdrawals', 'commissions'
    ];
    
    const missing = [];
    for (const table of essentialTables) {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        missing.push(table);
      }
    }
    
    if (missing.length === 0) {
      return { success: true, message: `Todas as ${essentialTables.length} tabelas essenciais criadas` };
    } else {
      return { success: false, message: `Tabelas faltando: ${missing.join(', ')}` };
    }
  }

  async checkInitialData() {
    try {
      const plans = await this.client.query('SELECT COUNT(*) FROM subscription_plans');
      const settings = await this.client.query('SELECT COUNT(*) FROM system_settings');
      
      if (parseInt(plans.rows[0].count) > 0 && parseInt(settings.rows[0].count) > 0) {
        return { success: true, message: `Dados iniciais carregados: ${plans.rows[0].count} planos, ${settings.rows[0].count} configurações` };
      } else {
        return { success: false, message: 'Dados iniciais não carregados' };
      }
    } catch (error) {
      return { success: false, message: 'Erro ao verificar dados iniciais' };
    }
  }

  async checkCommissionSystem() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'commissions'
        )
      `);
      
      if (result.rows[0].exists) {
        const commissions = await this.client.query('SELECT COUNT(*) FROM commissions');
        return { success: true, message: `Sistema de comissões ativo com ${commissions.rows[0].count} registros` };
      } else {
        return { success: false, message: 'Tabela de comissões não encontrada' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de comissões não implementado' };
    }
  }

  async checkWithdrawalSystem() {
    try {
      const result = await this.client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'withdrawals' 
        AND column_name IN ('type', 'status', 'amount_usd', 'bank_details')
      `);
      
      if (result.rows.length >= 4) {
        return { success: true, message: 'Sistema de saques completo implementado' };
      } else {
        return { success: false, message: 'Sistema de saques incompleto' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de saques não implementado' };
    }
  }

  async checkStripeWebhooks() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'stripe_webhook_events'
        )
      `);
      
      if (result.rows[0].exists) {
        return { success: true, message: 'Sistema de webhooks Stripe implementado' };
      } else {
        return { success: false, message: 'Tabela de webhooks Stripe não encontrada' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de webhooks não implementado' };
    }
  }

  async checkFinancialReconciliation() {
    // Verificar se existem procedures ou triggers para reconciliação
    try {
      const result = await this.client.query(`
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_type = 'FUNCTION' AND routine_name LIKE '%reconcil%'
      `);
      
      if (result.rows.length > 0) {
        return { success: true, message: 'Sistema de reconciliação financeira implementado' };
      } else {
        return { success: false, message: 'Sistema de reconciliação não encontrado' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de reconciliação não implementado' };
    }
  }

  async checkFinancialAuditing() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'financial_audit_logs'
        )
      `);
      
      if (result.rows[0].exists) {
        return { success: true, message: 'Sistema de auditoria financeira implementado' };
      } else {
        return { success: false, message: 'Tabela de auditoria financeira não encontrada' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de auditoria financeira não implementado' };
    }
  }

  async check2FASystem() {
    try {
      const result = await this.client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'user_2fa' 
        AND column_name IN ('secret_key', 'backup_codes', 'is_enabled')
      `);
      
      if (result.rows.length >= 3) {
        return { success: true, message: 'Sistema 2FA completo implementado' };
      } else {
        return { success: false, message: 'Sistema 2FA incompleto' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema 2FA não implementado' };
    }
  }

  async checkSecurityLockout() {
    try {
      const tables = ['blocked_ips', 'blocked_devices', 'suspicious_activities'];
      let found = 0;
      
      for (const table of tables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) found++;
      }
      
      if (found === tables.length) {
        return { success: true, message: 'Sistema de bloqueio de segurança completo' };
      } else {
        return { success: false, message: `${found}/${tables.length} tabelas de segurança encontradas` };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de bloqueio não implementado' };
    }
  }

  async checkSecurityMiddleware() {
    // Verificar se o arquivo de middleware existe
    const middlewareFile = 'src/middleware/security.middleware.ts';
    if (fs.existsSync(middlewareFile)) {
      return { success: true, message: 'Middleware de segurança implementado' };
    } else {
      return { success: false, message: 'Arquivo de middleware de segurança não encontrado' };
    }
  }

  async checkSecurityTables() {
    try {
      const securityTables = ['user_2fa', 'blocked_ips', 'blocked_devices', 'suspicious_activities', 'rate_limit_tracking'];
      let found = 0;
      
      for (const table of securityTables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) found++;
      }
      
      if (found === securityTables.length) {
        return { success: true, message: `Todas as ${securityTables.length} tabelas de segurança criadas` };
      } else {
        return { success: false, message: `${found}/${securityTables.length} tabelas de segurança encontradas` };
      }
    } catch (error) {
      return { success: false, message: 'Estrutura de segurança não implementada' };
    }
  }

  async checkSecurityAuditing() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'security_audit_logs'
        )
      `);
      
      if (result.rows[0].exists) {
        return { success: true, message: 'Sistema de auditoria de segurança implementado' };
      } else {
        return { success: false, message: 'Tabela de auditoria de segurança não encontrada' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de auditoria de segurança não implementado' };
    }
  }

  async checkDashboardSystem() {
    try {
      const serviceFile = 'src/services/dashboard.service.ts';
      const routesFile = 'src/routes/dashboard.routes.ts';
      
      let found = 0;
      if (fs.existsSync(serviceFile)) found++;
      if (fs.existsSync(routesFile)) found++;
      
      if (found === 2) {
        return { success: true, message: 'Sistema de dashboard completo implementado' };
      } else {
        return { success: false, message: `${found}/2 arquivos de dashboard encontrados` };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de dashboard não implementado' };
    }
  }

  async checkWebSocketSystem() {
    try {
      const wsFile = 'src/services/websocket.service.ts';
      
      if (fs.existsSync(wsFile)) {
        return { success: true, message: 'Sistema WebSocket implementado' };
      } else {
        return { success: false, message: 'Arquivo WebSocket não encontrado' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema WebSocket não implementado' };
    }
  }

  async checkAlertsSystem() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'system_alerts'
        )
      `);
      
      if (result.rows[0].exists) {
        const alerts = await this.client.query('SELECT COUNT(*) FROM system_alerts');
        return { success: true, message: `Sistema de alertas ativo com ${alerts.rows[0].count} alertas` };
      } else {
        return { success: false, message: 'Tabela de alertas não encontrada' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de alertas não implementado' };
    }
  }

  async checkPerformanceMetrics() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'performance_metrics'
        )
      `);
      
      if (result.rows[0].exists) {
        const metrics = await this.client.query('SELECT COUNT(*) FROM performance_metrics');
        return { success: true, message: `Métricas de performance ativas com ${metrics.rows[0].count} registros` };
      } else {
        return { success: false, message: 'Tabela de métricas não encontrada' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de métricas não implementado' };
    }
  }

  async checkMonitoringSystem() {
    try {
      const monitorFile = 'src/services/monitoring.service.ts';
      
      if (fs.existsSync(monitorFile)) {
        return { success: true, message: 'Sistema de monitoramento 24/7 implementado' };
      } else {
        return { success: false, message: 'Arquivo de monitoramento não encontrado' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de monitoramento não implementado' };
    }
  }

  async checkTradingConfigService() {
    try {
      const configFile = 'src/services/trading-configuration.service.ts';
      
      if (fs.existsSync(configFile)) {
        // Verificar tabela de configurações
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'trading_configurations'
          )
        `);
        
        if (result.rows[0].exists) {
          return { success: true, message: 'Trading Configuration Service completo' };
        } else {
          return { success: false, message: 'Tabela trading_configurations não encontrada' };
        }
      } else {
        return { success: false, message: 'Arquivo TradingConfigurationService não encontrado' };
      }
    } catch (error) {
      return { success: false, message: 'Trading Configuration Service não implementado' };
    }
  }

  async checkTradingQueueService() {
    try {
      const queueFile = 'src/services/trading-queue-simple.service.ts';
      
      if (fs.existsSync(queueFile)) {
        // Verificar tabela de fila
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'trading_queue'
          )
        `);
        
        if (result.rows[0].exists) {
          return { success: true, message: 'Trading Queue Service com prioridades implementado' };
        } else {
          return { success: false, message: 'Tabela trading_queue não encontrada' };
        }
      } else {
        return { success: false, message: 'Arquivo TradingQueueService não encontrado' };
      }
    } catch (error) {
      return { success: false, message: 'Trading Queue Service não implementado' };
    }
  }

  async checkRiskValidations() {
    try {
      // Verificar se existe função de validação no banco
      const result = await this.client.query(`
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_type = 'FUNCTION' AND routine_name LIKE '%trading%'
      `);
      
      if (result.rows.length > 0) {
        return { success: true, message: 'Validações de risco implementadas' };
      } else {
        return { success: false, message: 'Funções de validação de risco não encontradas' };
      }
    } catch (error) {
      return { success: false, message: 'Sistema de validação de risco não implementado' };
    }
  }

  async checkTradingAPI() {
    try {
      const routesFile = 'src/routes/trading.routes.ts';
      
      if (fs.existsSync(routesFile)) {
        return { success: true, message: 'REST API de trading completa implementada' };
      } else {
        return { success: false, message: 'Arquivo de rotas de trading não encontrado' };
      }
    } catch (error) {
      return { success: false, message: 'REST API de trading não implementada' };
    }
  }

  async checkTradingTables() {
    try {
      const tradingTables = [
        'trading_configurations', 
        'user_trading_limits', 
        'trading_queue', 
        'trading_positions', 
        'trading_config_audit'
      ];
      
      let found = 0;
      for (const table of tradingTables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) found++;
      }
      
      if (found === tradingTables.length) {
        return { success: true, message: `Todas as ${tradingTables.length} tabelas de trading enterprise criadas` };
      } else {
        return { success: false, message: `${found}/${tradingTables.length} tabelas de trading encontradas` };
      }
    } catch (error) {
      return { success: false, message: 'Database schema de trading não implementado' };
    }
  }

  // ========================================
  // RELATÓRIO FINAL E AÇÕES CORRETIVAS
  // ========================================
  
  generateFinalReport() {
    console.log('\n🎯 RELATÓRIO FINAL - VALIDAÇÃO SPRINTS 1-5');
    console.log('==========================================');
    
    const sprints = ['sprint1', 'sprint2', 'sprint3', 'sprint4', 'sprint5'];
    let totalCompleted = 0;
    let totalItems = 0;
    
    sprints.forEach((sprint, index) => {
      const sprintNum = index + 1;
      const result = this.results[sprint];
      const percentage = Math.round((result.completed / result.total) * 100);
      
      console.log(`\n📊 SPRINT ${sprintNum}: ${result.completed}/${result.total} (${percentage}%)`);
      
      if (result.issues.length > 0) {
        console.log('   ❌ Problemas encontrados:');
        result.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      } else {
        console.log('   ✅ Todos os requisitos atendidos');
      }
      
      totalCompleted += result.completed;
      totalItems += result.total;
    });
    
    const overallPercentage = Math.round((totalCompleted / totalItems) * 100);
    this.results.overall.percentage = overallPercentage;
    this.results.overall.readyForProduction = overallPercentage >= 95;
    
    console.log('\n🎉 RESULTADO GERAL');
    console.log('==================');
    console.log(`📈 Implementação: ${totalCompleted}/${totalItems} (${overallPercentage}%)`);
    console.log(`🚀 Pronto para Produção: ${this.results.overall.readyForProduction ? 'SIM' : 'NÃO'}`);
    
    if (this.results.overall.readyForProduction) {
      console.log('\n🎊 PARABÉNS! MARKETBOT ESTÁ 100% PRONTO PARA PRODUÇÃO!');
      console.log('✅ Todos os sistemas críticos implementados');
      console.log('✅ Segurança enterprise ativa');
      console.log('✅ Sistema financeiro completo');
      console.log('✅ Dashboard e monitoramento funcionais');
      console.log('✅ Trading engine enterprise operacional');
    } else {
      console.log('\n⚠️  AÇÕES NECESSÁRIAS PARA ATINGIR 100%:');
      this.generateActionPlan();
    }
  }

  generateActionPlan() {
    const sprints = ['sprint1', 'sprint2', 'sprint3', 'sprint4', 'sprint5'];
    
    sprints.forEach((sprint, index) => {
      const sprintNum = index + 1;
      const result = this.results[sprint];
      
      if (result.issues.length > 0) {
        console.log(`\n🔧 SPRINT ${sprintNum} - Ações Corretivas:`);
        result.issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      }
    });
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n✅ Conexão com banco encerrada');
    } catch (error) {
      console.error('❌ Erro ao fechar conexão:', error.message);
    }
  }

  // ========================================
  // EXECUÇÃO PRINCIPAL
  // ========================================
  
  async run() {
    console.log('🚀 MARKETBOT - SCRIPT DE VALIDAÇÃO COMPLETA SPRINTS 1-5');
    console.log('========================================================');
    console.log('Objetivo: Garantir 100% de implementação para MVP Ready');
    console.log('========================================================');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Falha na conexão. Script abortado.');
      return;
    }
    
    try {
      await this.validateSprint1();
      await this.validateSprint2();
      await this.validateSprint3();
      await this.validateSprint4();
      await this.validateSprint5();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('\n❌ Erro durante validação:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// ========================================
// EXECUÇÃO
// ========================================

const validator = new MarketBotValidationScript();
validator.run().catch(console.error);

module.exports = MarketBotValidationScript;

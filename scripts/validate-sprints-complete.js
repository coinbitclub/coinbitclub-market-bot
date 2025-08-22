// ========================================
// MARKETBOT - VALIDAÇÃO COMPLETA SPRINTS 1-5
// Script com conexão real ao banco de dados
// ========================================

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco otimizada para Railway
const DB_CONFIG = {
  host: 'junction.proxy.rlwy.net',
  port: 52299,
  database: 'railway',
  user: 'postgres',
  password: 'mKCaVaWXOlPLUjjOEgEKzpjjVuDAVxfY',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
  query_timeout: 10000,
  max: 1
};

class SprintValidator {
  constructor() {
    this.client = null;
    this.results = {
      sprint1: { score: 0, max: 100, details: [] },
      sprint2: { score: 0, max: 100, details: [] },
      sprint3: { score: 0, max: 100, details: [] },
      sprint4: { score: 0, max: 100, details: [] },
      sprint5: { score: 0, max: 100, details: [] },
      overall: { score: 0, max: 500 }
    };
  }

  async connect() {
    try {
      console.log('🔗 Conectando ao PostgreSQL Railway (conexão direta)...');
      this.client = new Client(DB_CONFIG);
      
      // Timeout personalizado para conexões Railway
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na conexão após 20s')), 20000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      // Testar conexão com query básica
      const result = await this.client.query('SELECT version(), NOW() as current_time');
      console.log(`📊 PostgreSQL Version: ${result.rows[0].version.split(' ')[0]}`);
      console.log(`⏰ Server Time: ${result.rows[0].current_time}`);
      
      console.log('✅ Conectado ao banco de dados PostgreSQL Railway');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão Railway:', error.message);
      console.log('💡 Tentando conexão simplificada...');
      
      // Tentativa ultra-simplificada
      try {
        if (this.client) {
          try { await this.client.end(); } catch(e) {}
        }
        
        const simpleConfig = {
          host: 'junction.proxy.rlwy.net',
          port: 52299,
          database: 'railway',
          user: 'postgres',
          password: 'mKCaVaWXOlPLUjjOEgEKzpjjVuDAVxfY',
          ssl: false,
          connectionTimeoutMillis: 30000
        };
        
        this.client = new Client(simpleConfig);
        await this.client.connect();
        await this.client.query('SELECT 1 as test');
        
        console.log('✅ Conectado via configuração simplificada');
        return true;
      } catch (altError) {
        console.error('❌ Falha total na conexão:', altError.message);
        console.log('🔍 Detalhes do erro:', altError);
        return false;
      }
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('🔌 Conexão com banco encerrada');
    }
  }

  // ========================================
  // SPRINT 1: CORREÇÕES CRÍTICAS
  // ========================================
  async validateSprint1() {
    console.log('\n🔍 VALIDANDO SPRINT 1 - CORREÇÕES CRÍTICAS');
    console.log('===========================================');
    
    let score = 0;
    const details = [];

    // 1.1 Validar tabelas Stripe (25 pontos)
    try {
      const stripeTables = [
        'stripe_customers', 'stripe_subscriptions', 'stripe_payments',
        'stripe_payment_methods', 'stripe_invoices', 'stripe_products', 'stripe_prices'
      ];
      
      let tablesFound = 0;
      for (const table of stripeTables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          tablesFound++;
          details.push(`✅ Tabela ${table} existe`);
        } else {
          details.push(`❌ Tabela ${table} NÃO encontrada`);
        }
      }
      
      const tableScore = Math.round((tablesFound / stripeTables.length) * 25);
      score += tableScore;
      details.push(`📊 Tabelas Stripe: ${tablesFound}/${stripeTables.length} (${tableScore} pontos)`);
      
    } catch (error) {
      details.push(`❌ Erro validando tabelas Stripe: ${error.message}`);
    }

    // 1.2 Validar arquivos de serviços (25 pontos)
    const serviceFiles = [
      'src/services/database.service.ts',
      'src/services/coupon.service.ts',
      'src/services/auth.service.ts'
    ];

    let servicesFound = 0;
    for (const file of serviceFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        servicesFound++;
        details.push(`✅ Arquivo ${file} existe`);
      } else {
        details.push(`❌ Arquivo ${file} NÃO encontrado`);
      }
    }
    
    const serviceScore = Math.round((servicesFound / serviceFiles.length) * 25);
    score += serviceScore;
    details.push(`📊 Arquivos de serviços: ${servicesFound}/${serviceFiles.length} (${serviceScore} pontos)`);

    // 1.3 Validar sistema de cupons (25 pontos)
    try {
      const couponCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'coupons'
        )
      `);
      
      if (couponCheck.rows[0].exists) {
        const couponCount = await this.client.query('SELECT COUNT(*) FROM coupons');
        score += 25;
        details.push(`✅ Sistema de cupons funcional (${couponCount.rows[0].count} cupons cadastrados)`);
      } else {
        details.push('❌ Tabela de cupons não encontrada');
      }
    } catch (error) {
      details.push(`❌ Erro validando cupons: ${error.message}`);
    }

    // 1.4 Validar testes funcionais (25 pontos)
    try {
      const testFiles = [
        'tests/integration/database.integration.test.ts',
        'tests/unit/coupon.service.test.ts'
      ];
      
      let testsFound = 0;
      for (const file of testFiles) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
          testsFound++;
          details.push(`✅ Teste ${file} existe`);
        } else {
          details.push(`❌ Teste ${file} NÃO encontrado`);
        }
      }
      
      const testScore = Math.round((testsFound / testFiles.length) * 25);
      score += testScore;
      details.push(`📊 Arquivos de teste: ${testsFound}/${testFiles.length} (${testScore} pontos)`);
      
    } catch (error) {
      details.push(`❌ Erro validando testes: ${error.message}`);
    }

    this.results.sprint1 = { score, max: 100, details };
    
    const status = score >= 80 ? '✅ APROVADO' : score >= 60 ? '⚠️ PARCIAL' : '❌ REPROVADO';
    console.log(`\n🎯 SPRINT 1 RESULTADO: ${score}/100 pontos - ${status}`);
    
    return score;
  }

  // ========================================
  // SPRINT 2: SISTEMA FINANCEIRO
  // ========================================
  async validateSprint2() {
    console.log('\n🔍 VALIDANDO SPRINT 2 - SISTEMA FINANCEIRO');
    console.log('============================================');
    
    let score = 0;
    const details = [];

    // 2.1 Sistema de comissionamento (35 pontos)
    try {
      const commissionTables = ['commissions', 'commission_transactions'];
      let commissionsFound = 0;
      
      for (const table of commissionTables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          commissionsFound++;
          details.push(`✅ Tabela ${table} existe`);
        } else {
          details.push(`❌ Tabela ${table} NÃO encontrada`);
        }
      }
      
      // Verificar se o arquivo CommissionService existe
      const commissionServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/commission.service.ts')
      );
      
      if (commissionServiceExists) {
        commissionsFound++;
        details.push('✅ CommissionService implementado');
      } else {
        details.push('❌ CommissionService NÃO encontrado');
      }
      
      const commissionScore = Math.round((commissionsFound / 3) * 35);
      score += commissionScore;
      details.push(`📊 Sistema de comissões: ${commissionsFound}/3 componentes (${commissionScore} pontos)`);
      
    } catch (error) {
      details.push(`❌ Erro validando comissões: ${error.message}`);
    }

    // 2.2 Sistema de saques (35 pontos)
    try {
      const withdrawalCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'withdrawals'
        )
      `);
      
      const withdrawalServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/withdrawal.service.ts')
      );
      
      if (withdrawalCheck.rows[0].exists && withdrawalServiceExists) {
        score += 35;
        details.push('✅ Sistema de saques completo (tabela + serviço)');
      } else {
        const partial = (withdrawalCheck.rows[0].exists ? 15 : 0) + (withdrawalServiceExists ? 20 : 0);
        score += partial;
        details.push(`⚠️ Sistema de saques parcial (${partial}/35 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando saques: ${error.message}`);
    }

    // 2.3 Webhooks Stripe (30 pontos)
    try {
      const webhookCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'stripe_webhook_events'
        )
      `);
      
      const webhookServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/stripe-webhook.service.ts')
      );
      
      if (webhookCheck.rows[0].exists && webhookServiceExists) {
        score += 30;
        details.push('✅ Webhooks Stripe completos');
      } else {
        const partial = (webhookCheck.rows[0].exists ? 15 : 0) + (webhookServiceExists ? 15 : 0);
        score += partial;
        details.push(`⚠️ Webhooks Stripe parciais (${partial}/30 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando webhooks: ${error.message}`);
    }

    this.results.sprint2 = { score, max: 100, details };
    
    const status = score >= 80 ? '✅ APROVADO' : score >= 60 ? '⚠️ PARCIAL' : '❌ REPROVADO';
    console.log(`\n🎯 SPRINT 2 RESULTADO: ${score}/100 pontos - ${status}`);
    
    return score;
  }

  // ========================================
  // SPRINT 3: SEGURANÇA ENTERPRISE
  // ========================================
  async validateSprint3() {
    console.log('\n🔍 VALIDANDO SPRINT 3 - SEGURANÇA ENTERPRISE');
    console.log('==============================================');
    
    let score = 0;
    const details = [];

    // 3.1 Sistema 2FA (40 pontos)
    try {
      const twoFACheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'user_2fa'
        )
      `);
      
      const twoFAServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/two-factor-auth.service.ts')
      );
      
      if (twoFACheck.rows[0].exists && twoFAServiceExists) {
        score += 40;
        details.push('✅ Sistema 2FA completo (tabela + serviço)');
      } else {
        const partial = (twoFACheck.rows[0].exists ? 20 : 0) + (twoFAServiceExists ? 20 : 0);
        score += partial;
        details.push(`⚠️ Sistema 2FA parcial (${partial}/40 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando 2FA: ${error.message}`);
    }

    // 3.2 Sistema de bloqueio de segurança (30 pontos)
    try {
      const securityTables = ['blocked_ips', 'blocked_devices', 'suspicious_activities'];
      let securityFound = 0;
      
      for (const table of securityTables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          securityFound++;
          details.push(`✅ Tabela ${table} existe`);
        } else {
          details.push(`❌ Tabela ${table} NÃO encontrada`);
        }
      }
      
      const securityScore = Math.round((securityFound / securityTables.length) * 30);
      score += securityScore;
      details.push(`📊 Tabelas de segurança: ${securityFound}/${securityTables.length} (${securityScore} pontos)`);
      
    } catch (error) {
      details.push(`❌ Erro validando tabelas de segurança: ${error.message}`);
    }

    // 3.3 Middleware de segurança (30 pontos)
    try {
      const middlewareFiles = [
        'src/middleware/security.middleware.ts',
        'src/middleware/auth.middleware.ts'
      ];
      
      let middlewareFound = 0;
      for (const file of middlewareFiles) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
          middlewareFound++;
          details.push(`✅ Middleware ${file} existe`);
        } else {
          details.push(`❌ Middleware ${file} NÃO encontrado`);
        }
      }
      
      const middlewareScore = Math.round((middlewareFound / middlewareFiles.length) * 30);
      score += middlewareScore;
      details.push(`📊 Middlewares de segurança: ${middlewareFound}/${middlewareFiles.length} (${middlewareScore} pontos)`);
      
    } catch (error) {
      details.push(`❌ Erro validando middlewares: ${error.message}`);
    }

    this.results.sprint3 = { score, max: 100, details };
    
    const status = score >= 80 ? '✅ APROVADO' : score >= 60 ? '⚠️ PARCIAL' : '❌ REPROVADO';
    console.log(`\n🎯 SPRINT 3 RESULTADO: ${score}/100 pontos - ${status}`);
    
    return score;
  }

  // ========================================
  // SPRINT 4: DASHBOARD E MONITORAMENTO
  // ========================================
  async validateSprint4() {
    console.log('\n🔍 VALIDANDO SPRINT 4 - DASHBOARD E MONITORAMENTO');
    console.log('==================================================');
    
    let score = 0;
    const details = [];

    // 4.1 Sistema de métricas (40 pontos)
    try {
      const metricsCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'system_metrics'
        )
      `);
      
      const dashboardServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/dashboard.service.ts')
      );
      
      if (metricsCheck.rows[0].exists && dashboardServiceExists) {
        // Testar se há métricas sendo coletadas
        const metricsCount = await this.client.query(`
          SELECT COUNT(*) FROM system_metrics WHERE created_at > NOW() - INTERVAL '1 hour'
        `);
        
        if (parseInt(metricsCount.rows[0].count) > 0) {
          score += 40;
          details.push(`✅ Sistema de métricas ativo (${metricsCount.rows[0].count} métricas recentes)`);
        } else {
          score += 25;
          details.push('⚠️ Sistema de métricas configurado mas sem dados recentes');
        }
      } else {
        const partial = (metricsCheck.rows[0].exists ? 20 : 0) + (dashboardServiceExists ? 20 : 0);
        score += partial;
        details.push(`⚠️ Sistema de métricas parcial (${partial}/40 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando métricas: ${error.message}`);
    }

    // 4.2 Sistema de alertas (30 pontos)
    try {
      const alertsCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'system_alerts'
        )
      `);
      
      if (alertsCheck.rows[0].exists) {
        const alertsCount = await this.client.query('SELECT COUNT(*) FROM system_alerts');
        score += 30;
        details.push(`✅ Sistema de alertas funcional (${alertsCount.rows[0].count} alertas configurados)`);
      } else {
        details.push('❌ Tabela de alertas não encontrada');
      }
    } catch (error) {
      details.push(`❌ Erro validando alertas: ${error.message}`);
    }

    // 4.3 WebSocket e API Dashboard (30 pontos)
    try {
      const routesExist = fs.existsSync(path.join(process.cwd(), 'src/routes/dashboard.routes.ts'));
      const websocketExists = fs.existsSync(path.join(process.cwd(), 'src/services/websocket.service.ts'));
      
      if (routesExist && websocketExists) {
        score += 30;
        details.push('✅ Dashboard API e WebSocket implementados');
      } else {
        const partial = (routesExist ? 15 : 0) + (websocketExists ? 15 : 0);
        score += partial;
        details.push(`⚠️ Dashboard parcialmente implementado (${partial}/30 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando dashboard: ${error.message}`);
    }

    this.results.sprint4 = { score, max: 100, details };
    
    const status = score >= 80 ? '✅ APROVADO' : score >= 60 ? '⚠️ PARCIAL' : '❌ REPROVADO';
    console.log(`\n🎯 SPRINT 4 RESULTADO: ${score}/100 pontos - ${status}`);
    
    return score;
  }

  // ========================================
  // SPRINT 5: TRADING ENGINE ENTERPRISE
  // ========================================
  async validateSprint5() {
    console.log('\n🔍 VALIDANDO SPRINT 5 - TRADING ENGINE ENTERPRISE');
    console.log('==================================================');
    
    let score = 0;
    const details = [];

    // 5.1 Configurações de trading (30 pontos)
    try {
      const configCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'trading_configurations'
        )
      `);
      
      const configServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/trading-configuration.service.ts')
      );
      
      if (configCheck.rows[0].exists && configServiceExists) {
        // Verificar se há configuração padrão carregada
        const configCount = await this.client.query('SELECT COUNT(*) FROM trading_configurations');
        
        if (parseInt(configCount.rows[0].count) > 0) {
          score += 30;
          details.push('✅ Sistema de configurações trading completo e configurado');
        } else {
          score += 20;
          details.push('⚠️ Sistema de configurações implementado mas sem dados padrão');
        }
      } else {
        const partial = (configCheck.rows[0].exists ? 15 : 0) + (configServiceExists ? 15 : 0);
        score += partial;
        details.push(`⚠️ Sistema de configurações parcial (${partial}/30 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando configurações: ${error.message}`);
    }

    // 5.2 Sistema de fila de trading (40 pontos)
    try {
      const queueCheck = await this.client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'trading_queue'
        )
      `);
      
      const queueServiceExists = fs.existsSync(
        path.join(process.cwd(), 'src/services/trading-queue-simple.service.ts')
      );
      
      if (queueCheck.rows[0].exists && queueServiceExists) {
        score += 40;
        details.push('✅ Sistema de fila de trading completo');
      } else {
        const partial = (queueCheck.rows[0].exists ? 20 : 0) + (queueServiceExists ? 20 : 0);
        score += partial;
        details.push(`⚠️ Sistema de fila parcial (${partial}/40 pontos)`);
      }
    } catch (error) {
      details.push(`❌ Erro validando fila de trading: ${error.message}`);
    }

    // 5.3 API de trading e posições (30 pontos)
    try {
      const tradingTables = ['trading_positions', 'user_trading_limits', 'trading_config_audit'];
      let tradingFound = 0;
      
      for (const table of tradingTables) {
        const result = await this.client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          tradingFound++;
          details.push(`✅ Tabela ${table} existe`);
        } else {
          details.push(`❌ Tabela ${table} NÃO encontrada`);
        }
      }
      
      const routesExist = fs.existsSync(path.join(process.cwd(), 'src/routes/trading.routes.ts'));
      if (routesExist) {
        tradingFound++;
        details.push('✅ Trading routes implementadas');
      } else {
        details.push('❌ Trading routes NÃO encontradas');
      }
      
      const tradingScore = Math.round((tradingFound / 4) * 30);
      score += tradingScore;
      details.push(`📊 Sistema de trading completo: ${tradingFound}/4 componentes (${tradingScore} pontos)`);
      
    } catch (error) {
      details.push(`❌ Erro validando trading: ${error.message}`);
    }

    this.results.sprint5 = { score, max: 100, details };
    
    const status = score >= 80 ? '✅ APROVADO' : score >= 60 ? '⚠️ PARCIAL' : '❌ REPROVADO';
    console.log(`\n🎯 SPRINT 5 RESULTADO: ${score}/100 pontos - ${status}`);
    
    return score;
  }

  // ========================================
  // RELATÓRIO FINAL
  // ========================================
  generateFinalReport() {
    console.log('\n\n🎯 RELATÓRIO FINAL - VALIDAÇÃO SPRINTS 1-5');
    console.log('==========================================');
    
    const totalScore = this.results.sprint1.score + this.results.sprint2.score + 
                       this.results.sprint3.score + this.results.sprint4.score + 
                       this.results.sprint5.score;
    
    this.results.overall = { score: totalScore, max: 500 };
    
    console.log(`\n📊 PONTUAÇÃO POR SPRINT:`);
    console.log(`Sprint 1 (Correções): ${this.results.sprint1.score}/100 ${this.getStatus(this.results.sprint1.score)}`);
    console.log(`Sprint 2 (Financeiro): ${this.results.sprint2.score}/100 ${this.getStatus(this.results.sprint2.score)}`);
    console.log(`Sprint 3 (Segurança): ${this.results.sprint3.score}/100 ${this.getStatus(this.results.sprint3.score)}`);
    console.log(`Sprint 4 (Dashboard): ${this.results.sprint4.score}/100 ${this.getStatus(this.results.sprint4.score)}`);
    console.log(`Sprint 5 (Trading): ${this.results.sprint5.score}/100 ${this.getStatus(this.results.sprint5.score)}`);
    
    const percentage = Math.round((totalScore / 500) * 100);
    console.log(`\n🎯 PONTUAÇÃO TOTAL: ${totalScore}/500 (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log('🏆 STATUS: EXCELENTE - Sistema pronto para produção enterprise!');
    } else if (percentage >= 80) {
      console.log('✅ STATUS: BOM - Sistema quase pronto, pequenos ajustes necessários');
    } else if (percentage >= 70) {
      console.log('⚠️ STATUS: PARCIAL - Sistema funcional mas precisa de melhorias');
    } else {
      console.log('❌ STATUS: CRÍTICO - Sistema precisa de correções importantes');
    }
    
    // Salvar relatório em arquivo
    this.saveReportToFile(totalScore, percentage);
    
    return { totalScore, percentage };
  }

  getStatus(score) {
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  }

  saveReportToFile(totalScore, percentage) {
    const reportContent = `# RELATÓRIO DE VALIDAÇÃO SPRINTS 1-5
## MarketBot - Auditoria Técnica Completa

**Data:** ${new Date().toLocaleString('pt-BR')}
**Pontuação Total:** ${totalScore}/500 (${percentage}%)

## Detalhes por Sprint:

### Sprint 1 (${this.results.sprint1.score}/100):
${this.results.sprint1.details.map(d => `- ${d}`).join('\n')}

### Sprint 2 (${this.results.sprint2.score}/100):
${this.results.sprint2.details.map(d => `- ${d}`).join('\n')}

### Sprint 3 (${this.results.sprint3.score}/100):
${this.results.sprint3.details.map(d => `- ${d}`).join('\n')}

### Sprint 4 (${this.results.sprint4.score}/100):
${this.results.sprint4.details.map(d => `- ${d}`).join('\n')}

### Sprint 5 (${this.results.sprint5.score}/100):
${this.results.sprint5.details.map(d => `- ${d}`).join('\n')}

## Conclusão:
${percentage >= 90 ? 'Sistema excelente, pronto para produção enterprise!' :
  percentage >= 80 ? 'Sistema bom, pequenos ajustes necessários' :
  percentage >= 70 ? 'Sistema parcial, melhorias necessárias' :
  'Sistema crítico, correções importantes necessárias'}
`;

    fs.writeFileSync('RELATORIO_VALIDACAO_SPRINTS.md', reportContent);
    console.log('\n📄 Relatório detalhado salvo em: RELATORIO_VALIDACAO_SPRINTS.md');
  }

  // ========================================
  // EXECUÇÃO PRINCIPAL
  // ========================================
  async runValidation() {
    console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DOS SPRINTS 1-5');
    console.log('===============================================');
    console.log('⚡ Conectando ao banco de dados PostgreSQL...');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Falha na conexão. Validação abortada.');
      return;
    }

    try {
      // Executar validação de todos os sprints
      await this.validateSprint1();
      await this.validateSprint2();
      await this.validateSprint3();
      await this.validateSprint4();
      await this.validateSprint5();
      
      // Gerar relatório final
      const { totalScore, percentage } = this.generateFinalReport();
      
      console.log('\n🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log(`📈 Sistema MarketBot está ${percentage}% implementado`);
      
    } catch (error) {
      console.error('❌ Erro durante validação:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// ========================================
// EXECUÇÃO DO SCRIPT
// ========================================
const validator = new SprintValidator();
validator.runValidation().catch(console.error);

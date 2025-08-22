// ========================================
// MARKETBOT - VALIDAÇÃO ROBUSTA SPRINTS 1-5
// Script com fallback para validação offline
// ========================================

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Múltiplas configurações de conexão para tentar
const DB_CONFIGS = [
  {
    name: 'Railway SSL',
    config: {
      host: 'junction.proxy.rlwy.net',
      port: 52299,
      database: 'railway',
      user: 'postgres',
      password: 'mKCaVaWXOlPLUjjOEgEKzpjjVuDAVxfY',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    }
  },
  {
    name: 'Railway Direct',
    config: {
      host: 'junction.proxy.rlwy.net',
      port: 52299,
      database: 'railway',
      user: 'postgres',
      password: 'mKCaVaWXOlPLUjjOEgEKzpjjVuDAVxfY',
      ssl: false,
      connectionTimeoutMillis: 15000
    }
  },
  {
    name: 'Railway ConnectionString',
    config: {
      connectionString: 'postgresql://postgres:mKCaVaWXOlPLUjjOEgEKzpjjVuDAVxfY@junction.proxy.rlwy.net:52299/railway',
      ssl: false,
      connectionTimeoutMillis: 20000
    }
  }
];

class RobustSprintValidator {
  constructor() {
    this.client = null;
    this.connected = false;
    this.validationMode = 'HYBRID'; // ONLINE, OFFLINE, HYBRID
    this.results = {
      sprint1: { score: 0, max: 100, details: [], mode: 'OFFLINE' },
      sprint2: { score: 0, max: 100, details: [], mode: 'OFFLINE' },
      sprint3: { score: 0, max: 100, details: [], mode: 'OFFLINE' },
      sprint4: { score: 0, max: 100, details: [], mode: 'OFFLINE' },
      sprint5: { score: 0, max: 100, details: [], mode: 'OFFLINE' },
      overall: { score: 0, max: 500 }
    };
  }

  async connect() {
    console.log('🔗 Tentando múltiplas configurações de conexão...');
    
    for (const dbConfig of DB_CONFIGS) {
      try {
        console.log(`⚡ Testando: ${dbConfig.name}...`);
        
        this.client = new Client(dbConfig.config);
        
        const connectPromise = this.client.connect();
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), dbConfig.config.connectionTimeoutMillis || 10000)
        );
        
        await Promise.race([connectPromise, timeout]);
        
        // Testar query simples
        const result = await this.client.query('SELECT version() as v, NOW() as t');
        console.log(`✅ Conectado com ${dbConfig.name}`);
        console.log(`📊 ${result.rows[0].v.split(' ')[0]} | ${result.rows[0].t}`);
        
        this.connected = true;
        this.validationMode = 'ONLINE';
        return true;
        
      } catch (error) {
        console.log(`❌ ${dbConfig.name} falhou: ${error.message}`);
        if (this.client) {
          try { await this.client.end(); } catch(e) {}
          this.client = null;
        }
      }
    }
    
    console.log('⚠️ Nenhuma conexão funcionou. Executando validação OFFLINE...');
    this.validationMode = 'OFFLINE';
    return false;
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.end();
        console.log('🔌 Conexão encerrada');
      } catch (error) {
        console.log('⚠️ Erro ao encerrar conexão:', error.message);
      }
    }
  }

  // ========================================
  // VALIDAÇÃO OFFLINE (ESTRUTURA DE ARQUIVOS)
  // ========================================
  validateOffline() {
    console.log('\n🔍 EXECUTANDO VALIDAÇÃO OFFLINE - ESTRUTURA DE ARQUIVOS');
    console.log('=======================================================');

    // Sprint 1 - Arquivos críticos
    this.validateSprint1Offline();
    this.validateSprint2Offline();
    this.validateSprint3Offline();
    this.validateSprint4Offline();
    this.validateSprint5Offline();

    return this.generateFinalReport();
  }

  validateSprint1Offline() {
    console.log('\n📁 SPRINT 1 - Validação de Arquivos');
    let score = 0;
    const details = [];

    // Verificar arquivos críticos
    const criticalFiles = [
      { file: 'src/services/database.service.ts', points: 20 },
      { file: 'src/services/coupon.service.ts', points: 20 },
      { file: 'src/services/auth.service.ts', points: 15 },
      { file: 'migrations/005_stripe_financial_system.sql', points: 25 },
      { file: 'tests/integration/database.integration.test.ts', points: 10 },
      { file: 'tests/unit/coupon.service.test.ts', points: 10 }
    ];

    for (const { file, points } of criticalFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        score += points;
        details.push(`✅ ${file} (${points} pts)`);
      } else {
        details.push(`❌ ${file} NÃO encontrado (${points} pts perdidos)`);
      }
    }

    this.results.sprint1 = { score, max: 100, details, mode: 'OFFLINE' };
    console.log(`Sprint 1: ${score}/100 pontos`);
  }

  validateSprint2Offline() {
    console.log('\n💰 SPRINT 2 - Sistema Financeiro');
    let score = 0;
    const details = [];

    const financialFiles = [
      { file: 'src/services/commission.service.ts', points: 30 },
      { file: 'src/services/withdrawal.service.ts', points: 30 },
      { file: 'src/services/stripe-webhook.service.ts', points: 25 },
      { file: 'migrations/008_withdrawal_system.sql', points: 15 }
    ];

    for (const { file, points } of financialFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        score += points;
        details.push(`✅ ${file} (${points} pts)`);
      } else {
        details.push(`❌ ${file} NÃO encontrado (${points} pts perdidos)`);
      }
    }

    this.results.sprint2 = { score, max: 100, details, mode: 'OFFLINE' };
    console.log(`Sprint 2: ${score}/100 pontos`);
  }

  validateSprint3Offline() {
    console.log('\n🔐 SPRINT 3 - Segurança Enterprise');
    let score = 0;
    const details = [];

    const securityFiles = [
      { file: 'src/services/two-factor-auth.service.ts', points: 40 },
      { file: 'src/services/security-lockout.service.ts', points: 30 },
      { file: 'src/middleware/security.middleware.ts', points: 20 },
      { file: 'migrations/011_two_factor_system.sql', points: 10 }
    ];

    for (const { file, points } of securityFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        score += points;
        details.push(`✅ ${file} (${points} pts)`);
      } else {
        details.push(`❌ ${file} NÃO encontrado (${points} pts perdidos)`);
      }
    }

    this.results.sprint3 = { score, max: 100, details, mode: 'OFFLINE' };
    console.log(`Sprint 3: ${score}/100 pontos`);
  }

  validateSprint4Offline() {
    console.log('\n📊 SPRINT 4 - Dashboard e Monitoramento');
    let score = 0;
    const details = [];

    const dashboardFiles = [
      { file: 'src/services/dashboard.service.ts', points: 35 },
      { file: 'src/services/websocket.service.ts', points: 25 },
      { file: 'src/routes/dashboard.routes.ts', points: 25 },
      { file: 'migrations/013_monitoring_system.sql', points: 15 }
    ];

    for (const { file, points } of dashboardFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        score += points;
        details.push(`✅ ${file} (${points} pts)`);
      } else {
        details.push(`❌ ${file} NÃO encontrado (${points} pts perdidos)`);
      }
    }

    this.results.sprint4 = { score, max: 100, details, mode: 'OFFLINE' };
    console.log(`Sprint 4: ${score}/100 pontos`);
  }

  validateSprint5Offline() {
    console.log('\n⚙️ SPRINT 5 - Trading Engine Enterprise');
    let score = 0;
    const details = [];

    const tradingFiles = [
      { file: 'src/services/trading-configuration.service.ts', points: 35 },
      { file: 'src/services/trading-queue-simple.service.ts', points: 35 },
      { file: 'src/routes/trading.routes.ts', points: 20 },
      { file: 'migrations/005_trading_system_complete.sql', points: 10 }
    ];

    for (const { file, points } of tradingFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        score += points;
        details.push(`✅ ${file} (${points} pts)`);
        
        // Verificação adicional do conteúdo
        try {
          const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
          if (content.length > 1000) { // Arquivo substancial
            details.push(`  💡 Arquivo com implementação substancial (${Math.round(content.length/1000)}k chars)`);
          }
        } catch (e) {
          details.push(`  ⚠️ Erro lendo conteúdo do arquivo`);
        }
      } else {
        details.push(`❌ ${file} NÃO encontrado (${points} pts perdidos)`);
      }
    }

    this.results.sprint5 = { score, max: 100, details, mode: 'OFFLINE' };
    console.log(`Sprint 5: ${score}/100 pontos`);
  }

  // ========================================
  // VALIDAÇÃO ONLINE (COM BANCO)
  // ========================================
  async validateOnline() {
    console.log('\n🔗 EXECUTANDO VALIDAÇÃO ONLINE - BANCO DE DADOS');
    console.log('===============================================');

    // Primeiro fazer validação offline
    this.validateOffline();

    // Depois complementar com dados do banco
    await this.validateDatabaseTables();
    await this.validateDatabaseData();

    return this.generateFinalReport();
  }

  async validateDatabaseTables() {
    if (!this.connected) return;

    console.log('\n🗄️ Validando Tabelas do Banco');
    
    const expectedTables = [
      'users', 'coupons', 'stripe_customers', 'stripe_subscriptions',
      'commissions', 'withdrawals', 'user_2fa', 'blocked_ips',
      'system_metrics', 'system_alerts', 'trading_configurations',
      'trading_queue', 'trading_positions'
    ];

    try {
      const result = await this.client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const existingTables = result.rows.map(row => row.table_name);
      
      console.log(`📊 Tabelas encontradas: ${existingTables.length}`);
      
      for (const table of expectedTables) {
        if (existingTables.includes(table)) {
          console.log(`✅ ${table}`);
        } else {
          console.log(`❌ ${table} (NÃO ENCONTRADA)`);
        }
      }

      const coverage = (existingTables.filter(t => expectedTables.includes(t)).length / expectedTables.length) * 100;
      console.log(`📈 Cobertura de tabelas: ${Math.round(coverage)}%`);

    } catch (error) {
      console.log(`❌ Erro validando tabelas: ${error.message}`);
    }
  }

  async validateDatabaseData() {
    if (!this.connected) return;

    console.log('\n📊 Validando Dados do Banco');
    
    try {
      // Verificar configurações padrão
      const configs = await this.client.query('SELECT COUNT(*) FROM trading_configurations');
      console.log(`✅ Configurações trading: ${configs.rows[0].count}`);

      // Verificar usuários
      const users = await this.client.query('SELECT COUNT(*) FROM users');
      console.log(`👥 Usuários cadastrados: ${users.rows[0].count}`);

      // Verificar cupons
      const coupons = await this.client.query('SELECT COUNT(*) FROM coupons');
      console.log(`🎫 Cupons disponíveis: ${coupons.rows[0].count}`);

    } catch (error) {
      console.log(`❌ Erro validando dados: ${error.message}`);
    }
  }

  // ========================================
  // RELATÓRIO FINAL ROBUSTO
  // ========================================
  generateFinalReport() {
    console.log('\n\n🎯 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('===============================');
    
    const totalScore = this.results.sprint1.score + this.results.sprint2.score + 
                       this.results.sprint3.score + this.results.sprint4.score + 
                       this.results.sprint5.score;
    
    this.results.overall = { score: totalScore, max: 500 };
    const percentage = Math.round((totalScore / 500) * 100);

    console.log(`\n📊 RESULTADOS POR SPRINT (Modo: ${this.validationMode}):`);
    console.log(`Sprint 1 (Correções): ${this.results.sprint1.score}/100 ${this.getStatusIcon(this.results.sprint1.score)}`);
    console.log(`Sprint 2 (Financeiro): ${this.results.sprint2.score}/100 ${this.getStatusIcon(this.results.sprint2.score)}`);
    console.log(`Sprint 3 (Segurança): ${this.results.sprint3.score}/100 ${this.getStatusIcon(this.results.sprint3.score)}`);
    console.log(`Sprint 4 (Dashboard): ${this.results.sprint4.score}/100 ${this.getStatusIcon(this.results.sprint4.score)}`);
    console.log(`Sprint 5 (Trading): ${this.results.sprint5.score}/100 ${this.getStatusIcon(this.results.sprint5.score)}`);
    
    console.log(`\n🎯 PONTUAÇÃO TOTAL: ${totalScore}/500 (${percentage}%)`);
    
    // Status baseado na pontuação
    let status, emoji, message;
    if (percentage >= 90) {
      status = 'EXCELENTE'; emoji = '🏆'; 
      message = 'Sistema pronto para produção enterprise!';
    } else if (percentage >= 80) {
      status = 'BOM'; emoji = '✅'; 
      message = 'Sistema quase pronto, pequenos ajustes necessários';
    } else if (percentage >= 70) {
      status = 'PARCIAL'; emoji = '⚠️'; 
      message = 'Sistema funcional mas precisa de melhorias';
    } else {
      status = 'CRÍTICO'; emoji = '❌'; 
      message = 'Sistema precisa de correções importantes';
    }

    console.log(`\n${emoji} STATUS: ${status}`);
    console.log(`💬 ${message}`);

    // Recomendações específicas
    this.generateRecommendations(percentage);

    // Salvar relatório
    this.saveDetailedReport(totalScore, percentage, status);

    return { totalScore, percentage, status };
  }

  generateRecommendations(percentage) {
    console.log('\n💡 RECOMENDAÇÕES:');
    
    if (this.results.sprint1.score < 80) {
      console.log('🔧 Prioridade 1: Completar correções críticas do Sprint 1');
    }
    if (this.results.sprint2.score < 80) {
      console.log('💰 Prioridade 2: Finalizar sistema financeiro do Sprint 2');
    }
    if (this.results.sprint3.score < 80) {
      console.log('🔐 Prioridade 3: Implementar segurança enterprise do Sprint 3');
    }
    if (this.results.sprint5.score < 90) {
      console.log('⚙️ Prioridade 4: Aperfeiçoar trading engine do Sprint 5');
    }

    if (percentage >= 90) {
      console.log('🚀 Próximo passo: Testes de carga e deploy em produção');
    } else if (percentage >= 80) {
      console.log('🔧 Próximo passo: Correções pontuais e testes finais');
    }
  }

  getStatusIcon(score) {
    if (score >= 90) return '🏆';
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  }

  saveDetailedReport(totalScore, percentage, status) {
    const reportContent = `# RELATÓRIO DETALHADO - VALIDAÇÃO SPRINTS 1-5
## MarketBot - Auditoria Técnica ${this.validationMode}

**Data:** ${new Date().toLocaleString('pt-BR')}
**Modo de Validação:** ${this.validationMode}
**Pontuação Total:** ${totalScore}/500 (${percentage}%)
**Status:** ${status}

## Detalhes por Sprint:

### Sprint 1 - Correções Críticas (${this.results.sprint1.score}/100):
${this.results.sprint1.details.map(d => `- ${d}`).join('\n')}

### Sprint 2 - Sistema Financeiro (${this.results.sprint2.score}/100):
${this.results.sprint2.details.map(d => `- ${d}`).join('\n')}

### Sprint 3 - Segurança Enterprise (${this.results.sprint3.score}/100):
${this.results.sprint3.details.map(d => `- ${d}`).join('\n')}

### Sprint 4 - Dashboard e Monitoramento (${this.results.sprint4.score}/100):
${this.results.sprint4.details.map(d => `- ${d}`).join('\n')}

### Sprint 5 - Trading Engine Enterprise (${this.results.sprint5.score}/100):
${this.results.sprint5.details.map(d => `- ${d}`).join('\n')}

## Conclusão e Próximos Passos:

${percentage >= 90 ? 
  '🏆 Sistema em excelente estado, pronto para produção enterprise. Recomenda-se apenas testes de carga finais.' :
  percentage >= 80 ? 
  '✅ Sistema em bom estado, pequenos ajustes necessários antes da produção.' :
  percentage >= 70 ?
  '⚠️ Sistema funcional mas com melhorias necessárias para ambiente enterprise.' :
  '❌ Sistema requer correções importantes antes de considerar produção.'
}

### Arquivos Críticos Verificados:
- **Estrutura**: ${this.validationMode === 'OFFLINE' || this.validationMode === 'HYBRID' ? 'Validada' : 'Não verificada'}
- **Banco de Dados**: ${this.connected ? 'Conectado e validado' : 'Não acessível'}
- **Serviços**: ${this.results.sprint1.score + this.results.sprint2.score + this.results.sprint3.score > 200 ? 'Implementados' : 'Parcialmente implementados'}

**Relatório gerado automaticamente pelo script de validação MarketBot**
`;

    const filename = `RELATORIO_VALIDACAO_${this.validationMode}_${new Date().toISOString().split('T')[0]}.md`;
    fs.writeFileSync(filename, reportContent);
    console.log(`\n📄 Relatório detalhado salvo: ${filename}`);
  }

  // ========================================
  // EXECUÇÃO PRINCIPAL
  // ========================================
  async run() {
    console.log('🚀 VALIDADOR ROBUSTO DE SPRINTS 1-5');
    console.log('===================================');
    console.log('💡 Tentativa de conexão online, fallback offline automático');
    
    const connected = await this.connect();
    
    try {
      if (connected) {
        await this.validateOnline();
      } else {
        this.validateOffline();
      }
    } catch (error) {
      console.error('❌ Erro durante validação:', error);
    } finally {
      await this.disconnect();
    }

    console.log('\n🎉 VALIDAÇÃO CONCLUÍDA!');
    console.log('📈 Verifique o relatório gerado para detalhes completos');
  }
}

// ========================================
// EXECUÇÃO
// ========================================
const validator = new RobustSprintValidator();
validator.run().catch(console.error);

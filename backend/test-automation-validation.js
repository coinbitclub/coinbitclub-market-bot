/**
 * TESTE SIMPLIFICADO DE AUTOMAÇÃO DO SISTEMA
 * Valida a estrutura e configuração dos processos automatizados
 */

const fs = require('fs');
const path = require('path');

class SimplifiedAutomationTest {
  constructor() {
    this.baseDir = process.cwd();
    this.results = {
      files: { status: 'pending', details: [] },
      structure: { status: 'pending', details: [] },
      automation: { status: 'pending', details: [] },
      integration: { status: 'pending', details: [] }
    };
  }

  /**
   * Executar teste completo
   */
  async runTest() {
    console.log('🚀 TESTE DE VALIDAÇÃO DE AUTOMAÇÃO');
    console.log('==================================');

    try {
      await this.testFileStructure();
      await this.testAutomationComponents();
      await this.testIntegrationReadiness();
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Erro durante teste:', error.message);
    }
  }

  /**
   * Testar estrutura de arquivos
   */
  async testFileStructure() {
    console.log('\n📁 VALIDANDO ESTRUTURA DE ARQUIVOS...');
    
    const requiredFiles = [
      'MAPEAMENTO-PROCESSOS-AUTOMATICOS.md',
      'api-gateway/src/services/allCronJobs.js',
      'api-gateway/src/services/webSocketService.js',
      'api-gateway/src/services/withdrawalService.js',
      'api-gateway/src/services/scheduler.js'
    ];

    let foundFiles = 0;

    for (const file of requiredFiles) {
      const filePath = path.join(this.baseDir, file);
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        foundFiles++;
        console.log(`  ✅ ${file}`);
        this.results.files.details.push({ file, status: 'found' });
      } else {
        console.log(`  ❌ ${file} - NÃO ENCONTRADO`);
        this.results.files.details.push({ file, status: 'missing' });
      }
    }

    this.results.files.status = foundFiles === requiredFiles.length ? 'pass' : 'partial';
    console.log(`  📊 Arquivos: ${foundFiles}/${requiredFiles.length} encontrados`);
  }

  /**
   * Testar componentes de automação
   */
  async testAutomationComponents() {
    console.log('\n⚙️ VALIDANDO COMPONENTES DE AUTOMAÇÃO...');
    
    const components = [
      {
        name: 'AllCronJobs',
        file: 'api-gateway/src/services/allCronJobs.js',
        keywords: ['financialCrons', 'marketCrons', 'aiCrons', 'notificationCrons', 'maintenanceCrons']
      },
      {
        name: 'WebSocketService', 
        file: 'api-gateway/src/services/webSocketService.js',
        keywords: ['WebSocket', 'broadcast', 'authentication', 'notification']
      },
      {
        name: 'WithdrawalService',
        file: 'api-gateway/src/services/withdrawalService.js', 
        keywords: ['processWithdrawalAutomatically', 'executeWithdrawalPayment', 'business hours']
      }
    ];

    let validComponents = 0;

    for (const component of components) {
      try {
        const filePath = path.join(this.baseDir, component.file);
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const foundKeywords = component.keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
          );

          if (foundKeywords.length >= component.keywords.length * 0.8) {
            validComponents++;
            console.log(`  ✅ ${component.name} - Implementado corretamente`);
            this.results.automation.details.push({
              component: component.name,
              status: 'valid',
              foundKeywords: foundKeywords.length,
              totalKeywords: component.keywords.length
            });
          } else {
            console.log(`  ⚠️ ${component.name} - Implementação parcial`);
            this.results.automation.details.push({
              component: component.name,
              status: 'partial',
              foundKeywords: foundKeywords.length,
              totalKeywords: component.keywords.length
            });
          }
        } else {
          console.log(`  ❌ ${component.name} - Arquivo não encontrado`);
          this.results.automation.details.push({
            component: component.name,
            status: 'missing'
          });
        }

      } catch (error) {
        console.log(`  ❌ ${component.name} - Erro: ${error.message}`);
      }
    }

    this.results.automation.status = validComponents === components.length ? 'pass' : 'partial';
    console.log(`  📊 Componentes: ${validComponents}/${components.length} validados`);
  }

  /**
   * Testar prontidão para integração
   */
  async testIntegrationReadiness() {
    console.log('\n🔗 VALIDANDO PRONTIDÃO PARA INTEGRAÇÃO...');
    
    const integrationChecks = [
      {
        name: 'Scheduler Integration',
        check: () => this.checkSchedulerIntegration()
      },
      {
        name: 'Database Connections', 
        check: () => this.checkDatabaseStructure()
      },
      {
        name: 'Environment Variables',
        check: () => this.checkEnvironmentConfig()
      },
      {
        name: 'Service Dependencies',
        check: () => this.checkServiceDependencies()
      }
    ];

    let readyIntegrations = 0;

    for (const integration of integrationChecks) {
      try {
        const result = await integration.check();
        if (result.ready) {
          readyIntegrations++;
          console.log(`  ✅ ${integration.name}`);
          this.results.integration.details.push({
            integration: integration.name,
            status: 'ready',
            details: result.details
          });
        } else {
          console.log(`  ⚠️ ${integration.name} - ${result.message}`);
          this.results.integration.details.push({
            integration: integration.name,
            status: 'not_ready',
            message: result.message
          });
        }
      } catch (error) {
        console.log(`  ❌ ${integration.name} - Erro: ${error.message}`);
      }
    }

    this.results.integration.status = readyIntegrations === integrationChecks.length ? 'pass' : 'partial';
    console.log(`  📊 Integrações: ${readyIntegrations}/${integrationChecks.length} prontas`);
  }

  /**
   * Verificações específicas
   */
  checkSchedulerIntegration() {
    const schedulerPath = path.join(this.baseDir, 'api-gateway/src/services/scheduler.js');
    
    if (fs.existsSync(schedulerPath)) {
      const content = fs.readFileSync(schedulerPath, 'utf8');
      const hasAllCronJobs = content.includes('AllCronJobs') || content.includes('allCronJobs');
      
      return {
        ready: hasAllCronJobs,
        details: hasAllCronJobs ? 'AllCronJobs integrado no scheduler' : 'AllCronJobs não encontrado',
        message: hasAllCronJobs ? null : 'Scheduler precisa integrar AllCronJobs'
      };
    }
    
    return { ready: false, message: 'Arquivo scheduler.js não encontrado' };
  }

  checkDatabaseStructure() {
    const schemaPath = path.join(this.baseDir, '_schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const requiredTables = ['users', 'user_prepaid_balance', 'withdrawal_requests', 'signals', 'notifications'];
      const foundTables = requiredTables.filter(table => content.includes(table));
      
      return {
        ready: foundTables.length >= requiredTables.length * 0.8,
        details: `${foundTables.length}/${requiredTables.length} tabelas encontradas`,
        message: foundTables.length < requiredTables.length ? 'Algumas tabelas podem estar faltando' : null
      };
    }
    
    return { ready: false, message: 'Schema do banco não encontrado' };
  }

  checkEnvironmentConfig() {
    const envFiles = ['.env', '.env.example', 'env-railway-backup.txt'];
    const foundEnvFiles = envFiles.filter(file => 
      fs.existsSync(path.join(this.baseDir, file))
    );
    
    return {
      ready: foundEnvFiles.length > 0,
      details: `Arquivos de ambiente: ${foundEnvFiles.join(', ')}`,
      message: foundEnvFiles.length === 0 ? 'Nenhum arquivo de configuração encontrado' : null
    };
  }

  checkServiceDependencies() {
    const packagePath = path.join(this.baseDir, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const requiredDeps = ['express', 'ws', 'knex'];
      const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
      const foundDeps = requiredDeps.filter(dep => dependencies[dep]);
      
      return {
        ready: foundDeps.length >= requiredDeps.length * 0.6,
        details: `${foundDeps.length}/${requiredDeps.length} dependências principais encontradas`,
        message: foundDeps.length < requiredDeps.length ? 'Algumas dependências podem estar faltando' : null
      };
    }
    
    return { ready: false, message: 'package.json não encontrado' };
  }

  /**
   * Gerar relatório final
   */
  generateFinalReport() {
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');

    const categories = Object.keys(this.results);
    let passCount = 0;

    categories.forEach(category => {
      const result = this.results[category];
      const icon = result.status === 'pass' ? '✅' : 
                   result.status === 'partial' ? '⚠️' : '❌';
      
      console.log(`${icon} ${category.toUpperCase()}: ${result.status}`);
      
      if (result.status === 'pass') passCount++;
    });

    const automationScore = Math.round((passCount / categories.length) * 100);
    
    console.log('\n🎯 RESUMO EXECUTIVO:');
    console.log(`   Score de Automação: ${automationScore}%`);
    console.log(`   Categorias OK: ${passCount}/${categories.length}`);
    
    let statusEmoji, statusText;
    if (automationScore >= 90) {
      statusEmoji = '🟢';
      statusText = 'SISTEMA PRONTO PARA PRODUÇÃO';
    } else if (automationScore >= 70) {
      statusEmoji = '🟡';
      statusText = 'SISTEMA BOM - PEQUENOS AJUSTES NECESSÁRIOS';
    } else {
      statusEmoji = '🔴';
      statusText = 'SISTEMA REQUER ATENÇÃO - AJUSTES IMPORTANTES NECESSÁRIOS';
    }
    
    console.log(`   Status: ${statusEmoji} ${statusText}`);
    
    // Recomendações
    this.generateRecommendations();
    
    // Salvar relatório
    this.saveReport(automationScore);
  }

  generateRecommendations() {
    console.log('\n💡 RECOMENDAÇÕES:');
    
    if (this.results.files.status !== 'pass') {
      console.log('   • Verificar arquivos ausentes na estrutura do projeto');
    }
    
    if (this.results.automation.status !== 'pass') {
      console.log('   • Completar implementação dos componentes de automação');
    }
    
    if (this.results.integration.status !== 'pass') {
      console.log('   • Verificar configurações de integração e dependências');
    }
    
    console.log('   • Executar testes em ambiente de produção');
    console.log('   • Monitorar performance após ativação');
  }

  saveReport(score) {
    const report = {
      timestamp: new Date().toISOString(),
      automation_score: score,
      results: this.results,
      recommendations: this.generateRecommendationsList()
    };

    try {
      fs.writeFileSync(
        'RELATORIO-VALIDACAO-AUTOMACAO.json',
        JSON.stringify(report, null, 2)
      );
      console.log('\n💾 Relatório salvo: RELATORIO-VALIDACAO-AUTOMACAO.json');
    } catch (error) {
      console.error('   ❌ Erro ao salvar relatório:', error.message);
    }
  }

  generateRecommendationsList() {
    const recommendations = [];
    
    Object.keys(this.results).forEach(category => {
      if (this.results[category].status !== 'pass') {
        recommendations.push({
          category,
          priority: this.results[category].status === 'partial' ? 'medium' : 'high',
          action: `Revisar e completar ${category}`
        });
      }
    });
    
    return recommendations;
  }
}

// Executar teste
const test = new SimplifiedAutomationTest();
test.runTest().catch(console.error);

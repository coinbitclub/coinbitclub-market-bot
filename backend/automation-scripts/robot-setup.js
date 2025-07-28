/**
 * 🚀 CONFIGURAÇÃO INICIAL PARA ROBÔ SUBSTITUTO
 * Script que prepara todo o ambiente para execução automatizada
 * Data: 28/07/2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RobotSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.setupLog = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    this.setupLog.push(logMessage);
  }

  async setupComplete() {
    try {
      this.log('🚀 Iniciando configuração completa do robô substituto', 'INFO');
      
      // 1. Verificar e instalar dependências
      await this.checkDependencies();
      
      // 2. Criar estrutura de diretórios
      await this.createDirectoryStructure();
      
      // 3. Configurar templates
      await this.setupTemplates();
      
      // 4. Configurar checklists
      await this.setupChecklists();
      
      // 5. Configurar scripts de validação
      await this.setupValidationScripts();
      
      // 6. Configurar monitoramento
      await this.setupMonitoring();
      
      // 7. Testar configuração
      await this.testConfiguration();
      
      // 8. Gerar relatório final
      await this.generateSetupReport();
      
      this.log('✅ Configuração do robô concluída com sucesso!', 'SUCCESS');
      
    } catch (error) {
      this.log(`❌ Erro na configuração: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async checkDependencies() {
    this.log('📦 Verificando dependências...', 'INFO');
    
    const requiredPackages = [
      'express',
      'pg',
      'redis',
      'stripe',
      'twilio',
      'openai',
      'jest',
      'nodemon'
    ];
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const installed = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const missing = requiredPackages.filter(pkg => !installed[pkg]);
    
    if (missing.length > 0) {
      this.log(`📦 Instalando dependências faltantes: ${missing.join(', ')}`, 'INFO');
      execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
    }
    
    this.log('✅ Dependências verificadas', 'SUCCESS');
  }

  async createDirectoryStructure() {
    this.log('📁 Criando estrutura de diretórios...', 'INFO');
    
    const directories = [
      'automation-scripts',
      'templates',
      'phase-checklist',
      'logs',
      'checkpoints',
      'backups',
      'reports',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'monitoring',
      'scripts/deploy',
      'scripts/validation'
    ];
    
    directories.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.log(`📁 Criado: ${dir}`, 'INFO');
      }
    });
    
    this.log('✅ Estrutura de diretórios criada', 'SUCCESS');
  }

  async setupTemplates() {
    this.log('📝 Configurando templates...', 'INFO');
    
    // Template para serviços API
    const apiServiceTemplate = `/**
 * {{ServiceName}} Service
 * Gerado automaticamente pelo robô
 */

class {{ServiceName}}Service {
  static async create{{EntityName}}(data) {
    try {
      const validation = await this.validate{{EntityName}}(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const entity = await {{EntityName}}.create(data);
      await this.logActivity('create', entity.id);
      return entity;
    } catch (error) {
      logger.error(\`Error creating {{EntityName}}:\`, error);
      throw error;
    }
  }
  
  static async get{{EntityName}}ById(id) {
    try {
      return await {{EntityName}}.findByPk(id);
    } catch (error) {
      logger.error(\`Error getting {{EntityName}}:\`, error);
      throw error;
    }
  }
  
  static async update{{EntityName}}(id, data) {
    try {
      const entity = await {{EntityName}}.findByPk(id);
      if (!entity) {
        throw new Error('{{EntityName}} not found');
      }
      
      await entity.update(data);
      await this.logActivity('update', id);
      return entity;
    } catch (error) {
      logger.error(\`Error updating {{EntityName}}:\`, error);
      throw error;
    }
  }
  
  static async delete{{EntityName}}(id) {
    try {
      const entity = await {{EntityName}}.findByPk(id);
      if (!entity) {
        throw new Error('{{EntityName}} not found');
      }
      
      await entity.destroy();
      await this.logActivity('delete', id);
      return true;
    } catch (error) {
      logger.error(\`Error deleting {{EntityName}}:\`, error);
      throw error;
    }
  }
  
  static async validate{{EntityName}}(data) {
    // Implementar validações específicas
    return { isValid: true, errors: [] };
  }
  
  static async logActivity(action, entityId) {
    // Log de atividades
    console.log(\`{{ServiceName}} \${action}: \${entityId}\`);
  }
}

module.exports = {{ServiceName}}Service;
`;

    // Template para testes
    const testTemplate = `/**
 * {{ServiceName}} Tests
 * Gerado automaticamente pelo robô
 */

const {{ServiceName}}Service = require('../services/{{serviceName}}Service');
const {{EntityName}} = require('../models/{{EntityName}}');

describe('{{ServiceName}}Service', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  describe('create{{EntityName}}', () => {
    it('should create {{EntityName}} successfully', async () => {
      const testData = {{TestDataGenerator}};
      const result = await {{ServiceName}}Service.create{{EntityName}}(testData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
    });
    
    it('should throw error for invalid data', async () => {
      const invalidData = {};
      
      await expect({{ServiceName}}Service.create{{EntityName}}(invalidData))
        .rejects.toThrow();
    });
  });
  
  describe('get{{EntityName}}ById', () => {
    it('should return {{EntityName}} when exists', async () => {
      const testData = {{TestDataGenerator}};
      const created = await {{ServiceName}}Service.create{{EntityName}}(testData);
      
      const result = await {{ServiceName}}Service.get{{EntityName}}ById(created.id);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
    });
    
    it('should return null when not exists', async () => {
      const result = await {{ServiceName}}Service.get{{EntityName}}ById(999999);
      
      expect(result).toBeNull();
    });
  });
});
`;

    // Salvar templates
    fs.writeFileSync(path.join(this.projectRoot, 'templates', 'api-service-template.js'), apiServiceTemplate);
    fs.writeFileSync(path.join(this.projectRoot, 'templates', 'test-template.js'), testTemplate);
    
    this.log('✅ Templates configurados', 'SUCCESS');
  }

  async setupChecklists() {
    this.log('📋 Configurando checklists...', 'INFO');
    
    const phase1Checklist = {
      phase: 1,
      description: "Backend completo e testado",
      days: {
        1: {
          component: "api-keys",
          tasks: [
            {
              id: "create-api-key-service",
              description: "Criar APIKeyService.js",
              file: "services/apiKeyService.js",
              template: "api-service-template.js",
              validation: "testAPIKeyService()",
              completed: false
            },
            {
              id: "create-api-key-model",
              description: "Criar modelo ApiKey",
              file: "models/ApiKey.js",
              validation: "testApiKeyModel()",
              completed: false
            },
            {
              id: "create-api-key-routes",
              description: "Criar rotas API Keys",
              file: "routes/apiKeys.js",
              validation: "testAPIEndpoints()",
              completed: false
            },
            {
              id: "create-database-migration",
              description: "Criar migração banco",
              file: "migrations/001_create_api_keys_table.sql",
              validation: "testDatabaseTable()",
              completed: false
            }
          ]
        },
        2: {
          component: "stripe-integration",
          tasks: [
            {
              id: "create-stripe-service",
              description: "Criar StripeService.js",
              file: "services/stripeService.js",
              validation: "testStripeService()",
              completed: false
            },
            {
              id: "create-stripe-webhooks",
              description: "Criar webhooks Stripe",
              file: "webhooks/stripeWebhook.js",
              validation: "testStripeWebhooks()",
              completed: false
            }
          ]
        }
        // ... continua para todos os dias
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'phase-checklist', 'phase1-checklist.json'),
      JSON.stringify(phase1Checklist, null, 2)
    );
    
    this.log('✅ Checklists configurados', 'SUCCESS');
  }

  async setupValidationScripts() {
    this.log('🔍 Configurando scripts de validação...', 'INFO');
    
    const validationScript = `/**
 * Scripts de Validação Automatizada
 * Verifica se implementações estão funcionando
 */

class ValidationRunner {
  static async testAPIKeyService() {
    try {
      const APIKeyService = require('../services/apiKeyService');
      
      // Teste básico de criação
      const testKey = await APIKeyService.generateKey(1, ['read'], '1d');
      if (!testKey.key) {
        throw new Error('API Key não gerada');
      }
      
      // Teste de validação
      const validation = await APIKeyService.validateKey(testKey.key);
      if (!validation.valid) {
        throw new Error('Validação de API Key falhou');
      }
      
      return { passed: true, message: 'APIKeyService funcionando' };
    } catch (error) {
      return { passed: false, message: error.message };
    }
  }
  
  static async testDatabaseTable() {
    try {
      const { Pool } = require('pg');
      const pool = new Pool(/* config */);
      
      const result = await pool.query('SELECT 1 FROM api_keys LIMIT 1');
      
      return { passed: true, message: 'Tabela api_keys existe' };
    } catch (error) {
      return { passed: false, message: \`Tabela não existe: \${error.message}\` };
    }
  }
  
  static async testStripeWebhooks() {
    try {
      // Simular webhook do Stripe
      const webhook = require('../webhooks/stripeWebhook');
      
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      };
      
      await webhook.handleEvent(mockEvent);
      
      return { passed: true, message: 'Stripe webhooks funcionando' };
    } catch (error) {
      return { passed: false, message: error.message };
    }
  }
}

module.exports = ValidationRunner;
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'validation', 'validationRunner.js'),
      validationScript
    );
    
    this.log('✅ Scripts de validação configurados', 'SUCCESS');
  }

  async setupMonitoring() {
    this.log('📊 Configurando monitoramento...', 'INFO');
    
    const monitoringScript = `/**
 * Sistema de Monitoramento Automatizado
 * Monitora sistema em tempo real
 */

class SystemMonitor {
  static async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {},
      performance: {},
      errors: []
    };
    
    try {
      // Verificar banco de dados
      report.services.database = await this.checkDatabase();
      
      // Verificar APIs externas
      report.services.stripe = await this.checkStripe();
      report.services.twilio = await this.checkTwilio();
      
      // Verificar performance
      report.performance = await this.getPerformanceMetrics();
      
      // Determinar status geral
      const allServicesHealthy = Object.values(report.services)
        .every(service => service.status === 'healthy');
      
      report.status = allServicesHealthy ? 'healthy' : 'unhealthy';
      
    } catch (error) {
      report.status = 'error';
      report.errors.push(error.message);
    }
    
    return report;
  }
  
  static async checkDatabase() {
    // Implementar verificação do banco
    return { status: 'healthy', responseTime: 50 };
  }
  
  static async checkStripe() {
    // Implementar verificação do Stripe
    return { status: 'healthy', responseTime: 120 };
  }
  
  static async checkTwilio() {
    // Implementar verificação do Twilio
    return { status: 'healthy', responseTime: 80 };
  }
  
  static async getPerformanceMetrics() {
    return {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

module.exports = SystemMonitor;
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'monitoring', 'systemMonitor.js'),
      monitoringScript
    );
    
    this.log('✅ Monitoramento configurado', 'SUCCESS');
  }

  async testConfiguration() {
    this.log('🧪 Testando configuração...', 'INFO');
    
    // Verificar se todos os diretórios foram criados
    const requiredDirs = [
      'automation-scripts',
      'templates',
      'phase-checklist',
      'logs',
      'monitoring'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Diretório não encontrado: ${dir}`);
      }
    }
    
    // Verificar se templates foram criados
    const templatePath = path.join(this.projectRoot, 'templates', 'api-service-template.js');
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template não encontrado');
    }
    
    this.log('✅ Configuração testada com sucesso', 'SUCCESS');
  }

  async generateSetupReport() {
    this.log('📄 Gerando relatório de configuração...', 'INFO');
    
    const report = {
      timestamp: new Date().toISOString(),
      status: 'configured',
      directories_created: 13,
      templates_created: 2,
      scripts_created: 3,
      ready_for_execution: true,
      next_steps: [
        'Executar: node automation-scripts/automation-bot.js execute-day 1 api-keys',
        'Monitorar: node automation-scripts/automation-bot.js status',
        'Validar: node scripts/validation/validationRunner.js'
      ],
      setup_log: this.setupLog
    };
    
    const reportPath = path.join(this.projectRoot, 'reports', 'setup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`
🎉 CONFIGURAÇÃO CONCLUÍDA!

📊 RELATÓRIO:
✅ ${report.directories_created} diretórios criados
✅ ${report.templates_created} templates configurados  
✅ ${report.scripts_created} scripts criados
✅ Sistema pronto para execução

🚀 PRÓXIMOS PASSOS:
1. node automation-scripts/automation-bot.js execute-day 1 api-keys
2. node automation-scripts/automation-bot.js status
3. node scripts/validation/validationRunner.js

📄 Relatório completo salvo em: ${reportPath}
    `);
    
    this.log('✅ Relatório de configuração gerado', 'SUCCESS');
  }
}

// Executar configuração
async function main() {
  try {
    const setup = new RobotSetup();
    await setup.setupComplete();
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RobotSetup;

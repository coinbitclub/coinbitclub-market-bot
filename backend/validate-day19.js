#!/usr/bin/env node

/**
 * 🧠 DIA 19 - IA MONITORING CORE VALIDATION
 * Validação completa do sistema IA de Monitoramento
 * Conforme especificação completa das seções 1-6
 */

const { logger } = require('./src/utils/logger');

class Day19Validator {
    constructor() {
        this.results = {
            total_tests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        
        logger.info('🧠 Dia 19 - Iniciando validação IA Monitoring Core');
    }
    
    // 🧪 Executar todos os testes
    async runAllTests() {
        console.log('🧠 DIA 19 - IA MONITORING CORE VALIDATION');
        console.log('==========================================');
        
        try {
            // Teste 1: Módulos principais
            await this.testCoreModules();
            
            // Teste 2: Estrutura de arquivos
            await this.testFileStructure();
            
            // Teste 3: Dependências
            await this.testDependencies();
            
            // Teste 4: Configuração
            await this.testConfiguration();
            
            // Teste 5: Scripts de automação
            await this.testAutomationScripts();
            
            // Teste 6: Banco de dados
            await this.testDatabase();
            
            // Teste 7: Segurança
            await this.testSecurity();
            
            // Teste 8: Integração
            await this.testIntegration();
            
            // Gerar relatório final
            this.generateReport();
            
        } catch (error) {
            logger.error('❌ Erro fatal na validação', error);
            this.addResult('FATAL', 'Erro fatal na validação', false, error.message);
        }
    }
    
    // 📦 Teste 1: Módulos principais
    async testCoreModules() {
        logger.info('📦 Teste 1: Módulos principais');
        
        try {
            // AI Monitoring Service
            const AIMonitoringService = require('./src/services/aiMonitoringService');
            this.addResult('CORE_MODULE', 'AI Monitoring Service', true, 'Carregado com sucesso');
            
            // Security Module
            const SecurityModule = require('./src/security/SecurityModule');
            this.addResult('CORE_MODULE', 'Security Module', true, 'Carregado com sucesso');
            
            // Exchange Manager
            const ExchangeManager = require('./src/services/exchangeManager');
            this.addResult('CORE_MODULE', 'Exchange Manager', true, 'Carregado com sucesso');
            
            // Logger
            const { logger: testLogger } = require('./src/utils/logger');
            this.addResult('CORE_MODULE', 'Logger Utils', true, 'Sistema de logs operacional');
            
        } catch (error) {
            this.addResult('CORE_MODULE', 'Carregamento de módulos', false, error.message);
        }
    }
    
    // 📁 Teste 2: Estrutura de arquivos
    async testFileStructure() {
        logger.info('📁 Teste 2: Estrutura de arquivos');
        
        const requiredFiles = [
            'src/services/aiMonitoringService.js',
            'src/security/SecurityModule.js',
            'src/services/exchangeManager.js',
            'src/utils/logger.js',
            'scripts/closeAllOrders.js',
            'scripts/pauseNewOrders.js',
            'scripts/retriggerWebhook.js',
            'database/migrations/005_create_ai_monitoring_tables.sql'
        ];
        
        const fs = require('fs');
        const path = require('path');
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            const exists = fs.existsSync(filePath);
            
            this.addResult('FILE_STRUCTURE', file, exists, 
                exists ? 'Arquivo existe' : 'Arquivo não encontrado');
        }
    }
    
    // 📚 Teste 3: Dependências
    async testDependencies() {
        logger.info('📚 Teste 3: Dependências npm');
        
        const requiredDeps = ['openai', 'redis', 'axios', 'ws'];
        
        for (const dep of requiredDeps) {
            try {
                require(dep);
                this.addResult('DEPENDENCY', dep, true, 'Dependência instalada');
            } catch (error) {
                this.addResult('DEPENDENCY', dep, false, 'Dependência não encontrada');
            }
        }
    }
    
    // ⚙️ Teste 4: Configuração
    async testConfiguration() {
        logger.info('⚙️ Teste 4: Configuração');
        
        const requiredEnvVars = [
            'OPENAI_API_KEY',
            'REDIS_URL', 
            'DATABASE_URL',
            'ADMIN_IPS'
        ];
        
        let configuredVars = 0;
        
        for (const envVar of requiredEnvVars) {
            const isConfigured = !!process.env[envVar];
            
            if (isConfigured) {
                configuredVars++;
                this.addResult('CONFIG', envVar, true, 'Variável configurada');
            } else {
                this.addResult('CONFIG', envVar, false, 'Variável não configurada', true); // warning
            }
        }
        
        if (configuredVars === 0) {
            this.addResult('CONFIG', 'Configuração geral', false, 
                'Nenhuma variável configurada - usando modo de demonstração');
        }
    }
    
    // 🔧 Teste 5: Scripts de automação
    async testAutomationScripts() {
        logger.info('🔧 Teste 5: Scripts de automação');
        
        const scripts = [
            'scripts/closeAllOrders.js',
            'scripts/pauseNewOrders.js', 
            'scripts/retriggerWebhook.js'
        ];
        
        for (const script of scripts) {
            try {
                require(`./${script}`);
                this.addResult('AUTOMATION', script, true, 'Script carregado');
            } catch (error) {
                this.addResult('AUTOMATION', script, false, error.message);
            }
        }
    }
    
    // 🗄️ Teste 6: Banco de dados
    async testDatabase() {
        logger.info('🗄️ Teste 6: Banco de dados');
        
        const fs = require('fs');
        const migrationFile = './database/migrations/005_create_ai_monitoring_tables.sql';
        
        if (fs.existsSync(migrationFile)) {
            const sqlContent = fs.readFileSync(migrationFile, 'utf8');
            
            // Validar estrutura SQL
            const hasSystemEvents = sqlContent.includes('system_events');
            const hasAIDecisions = sqlContent.includes('ai_decisions');
            const hasCacheResponses = sqlContent.includes('cache_responses');
            const hasIndexes = sqlContent.includes('CREATE INDEX');
            
            this.addResult('DATABASE', 'Migração SQL', hasSystemEvents && hasAIDecisions, 
                `Tabelas principais: ${hasSystemEvents && hasAIDecisions ? 'OK' : 'Faltando'}`);
            
            this.addResult('DATABASE', 'Índices de performance', hasIndexes,
                hasIndexes ? 'Índices criados' : 'Índices não encontrados');
            
        } else {
            this.addResult('DATABASE', 'Migração SQL', false, 'Arquivo de migração não encontrado');
        }
    }
    
    // 🛡️ Teste 7: Segurança
    async testSecurity() {
        logger.info('🛡️ Teste 7: Segurança');
        
        try {
            const SecurityModule = require('./src/security/SecurityModule');
            const security = new SecurityModule();
            
            // Teste básico do módulo de segurança
            const hasValidateIP = typeof security.validateSourceIP === 'function';
            const hasRateLimit = typeof security.checkRateLimit === 'function';
            const hasFileIntegrity = typeof security.checkFileIntegrity === 'function';
            
            this.addResult('SECURITY', 'Validação de IP', hasValidateIP,
                hasValidateIP ? 'Função disponível' : 'Função não encontrada');
            
            this.addResult('SECURITY', 'Rate Limiting', hasRateLimit,
                hasRateLimit ? 'Função disponível' : 'Função não encontrada');
            
            this.addResult('SECURITY', 'Integridade de arquivos', hasFileIntegrity,
                hasFileIntegrity ? 'Função disponível' : 'Função não encontrada');
            
        } catch (error) {
            this.addResult('SECURITY', 'Módulo de segurança', false, error.message);
        }
    }
    
    // 🔗 Teste 8: Integração
    async testIntegration() {
        logger.info('🔗 Teste 8: Integração');
        
        try {
            // Teste de instanciação da IA
            const AIMonitoringService = require('./src/services/aiMonitoringService');
            const aiService = new AIMonitoringService();
            
            const hasMonitorWebhooks = typeof aiService.monitorWebhooks === 'function';
            const hasMonitorMicroservices = typeof aiService.monitorMicroservices === 'function';
            const hasMonitorTrading = typeof aiService.monitorTradingOperations === 'function';
            
            this.addResult('INTEGRATION', 'Monitor Webhooks', hasMonitorWebhooks,
                hasMonitorWebhooks ? 'Funcionalidade disponível' : 'Função não encontrada');
            
            this.addResult('INTEGRATION', 'Monitor Microserviços', hasMonitorMicroservices,
                hasMonitorMicroservices ? 'Funcionalidade disponível' : 'Função não encontrada');
            
            this.addResult('INTEGRATION', 'Monitor Trading', hasMonitorTrading,
                hasMonitorTrading ? 'Funcionalidade disponível' : 'Função não encontrada');
            
        } catch (error) {
            this.addResult('INTEGRATION', 'Teste de integração', false, error.message);
        }
    }
    
    // 📊 Adicionar resultado de teste
    addResult(category, test, passed, details, isWarning = false) {
        this.results.total_tests++;
        
        if (passed) {
            this.results.passed++;
            console.log(`✅ [${category}] ${test}: ${details}`);
        } else if (isWarning) {
            this.results.warnings++;
            console.log(`⚠️ [${category}] ${test}: ${details}`);
        } else {
            this.results.failed++;
            console.log(`❌ [${category}] ${test}: ${details}`);
        }
        
        this.results.details.push({
            category,
            test,
            passed,
            isWarning,
            details,
            timestamp: new Date().toISOString()
        });
    }
    
    // 📋 Gerar relatório final
    generateReport() {
        console.log('\n📊 RELATÓRIO FINAL - DIA 19');
        console.log('============================');
        
        const successRate = Math.round((this.results.passed / this.results.total_tests) * 100);
        
        console.log(`📊 Testes executados: ${this.results.total_tests}`);
        console.log(`✅ Sucessos: ${this.results.passed}`);
        console.log(`❌ Falhas: ${this.results.failed}`);
        console.log(`⚠️ Avisos: ${this.results.warnings}`);
        console.log(`📈 Taxa de sucesso: ${successRate}%`);
        
        // Status geral
        if (successRate >= 90) {
            console.log('\n🎉 DIA 19 - CONCLUÍDO COM SUCESSO!');
            console.log('✅ IA Monitoring Core implementado conforme especificação');
            console.log('🚀 Sistema pronto para Dia 20: Detecção de Volatilidade');
        } else if (successRate >= 70) {
            console.log('\n⚠️ DIA 19 - CONCLUÍDO COM ADVERTÊNCIAS');
            console.log('📋 Algumas funcionalidades precisam de configuração');
            console.log('🔧 Revise as configurações antes de prosseguir');
        } else {
            console.log('\n❌ DIA 19 - NECESSITA CORREÇÕES');
            console.log('🛠️ Corrija os problemas antes de prosseguir');
        }
        
        // Próximos passos
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Configure variáveis de ambiente (.env)');
        console.log('2. Execute migração do banco: node scripts/run-migration.js');
        console.log('3. Configure Redis server');
        console.log('4. Prossiga para Dia 20: Sistema Detecção Volatilidade');
        
        // Salvar relatório
        const reportData = {
            day: 19,
            phase: 'IA_MONITORING_CORE',
            timestamp: new Date().toISOString(),
            results: this.results,
            success_rate: successRate,
            status: successRate >= 90 ? 'SUCCESS' : successRate >= 70 ? 'WARNING' : 'FAILED',
            next_steps: [
                'Configure variáveis de ambiente',
                'Execute migração do banco',
                'Configure Redis server',
                'Prossiga para Dia 20'
            ]
        };
        
        logger.info('📊 Relatório Dia 19 gerado', reportData);
        
        // Salvar em arquivo
        const fs = require('fs');
        const path = require('path');
        
        try {
            const reportsDir = path.join(__dirname, 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            const reportFile = path.join(reportsDir, `day19-report-${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
            
            console.log(`\n📄 Relatório salvo: ${reportFile}`);
            
        } catch (error) {
            logger.error('Erro ao salvar relatório', error);
        }
        
        return reportData;
    }
}

// 🚀 Execução principal
async function main() {
    const validator = new Day19Validator();
    await validator.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erro não tratado:', error);
        process.exit(1);
    });
}

module.exports = Day19Validator;

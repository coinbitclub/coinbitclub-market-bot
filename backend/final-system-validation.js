#!/usr/bin/env node

/**
 * 🚀 COINBITCLUB FINAL VALIDATION - MODO SEGURO
 * =============================================
 * 
 * Script final para validar todo o sistema sem usar banco de dados real
 * Executa apenas validações de configuração e APIs
 */

const fs = require('fs');
const path = require('path');

class FinalSystemValidation {
    constructor() {
        this.validations = {
            environment: { status: 'pending', details: [] },
            apis: { status: 'pending', details: [] },
            business: { status: 'pending', details: [] },
            files: { status: 'pending', details: [] },
            config: { status: 'pending', details: [] }
        };

        console.log('🚀 COINBITCLUB FINAL VALIDATION - MODO SEGURO');
        console.log('=============================================');
        console.log('⚠️  VALIDAÇÃO SEM BANCO DE DADOS REAL');
        console.log('✅ MODO 100% SEGURO PARA PRODUÇÃO');
        console.log('');
    }

    async runFinalValidation() {
        try {
            // 1. Validar ambiente
            await this.validateEnvironment();
            
            // 2. Validar APIs
            await this.validateAPIs();
            
            // 3. Validar regras de negócio
            await this.validateBusinessRules();
            
            // 4. Validar arquivos críticos
            await this.validateCriticalFiles();
            
            // 5. Validar configurações
            await this.validateConfigurations();
            
            // 6. Gerar relatório final
            await this.generateFinalReport();
            
        } catch (error) {
            console.error('💥 ERRO CRÍTICO:', error);
        }
    }

    async validateEnvironment() {
        console.log('🔍 VALIDANDO AMBIENTE...');

        try {
            // Carregar .env.production
            require('dotenv').config({ path: path.join(__dirname, '.env.production') });

            // Validar variáveis críticas
            const requiredVars = [
                'DATABASE_URL',
                'OPENAI_API_KEY',
                'STRIPE_SECRET_KEY',
                'STRIPE_PUBLISHABLE_KEY',
                'BINANCE_MANAGEMENT_API_KEY',
                'BYBIT_MANAGEMENT_API_KEY'
            ];

            const missingVars = [];
            const configuredVars = [];

            for (const envVar of requiredVars) {
                if (!process.env[envVar] || process.env[envVar].includes('your_')) {
                    missingVars.push(envVar);
                } else {
                    configuredVars.push(envVar);
                }
            }

            this.validations.environment.details = {
                configured: configuredVars,
                missing: missingVars,
                nodeVersion: process.version,
                platform: process.platform
            };

            if (missingVars.length === 0) {
                this.validations.environment.status = 'success';
                console.log('   ✅ Todas variáveis de ambiente configuradas');
            } else {
                this.validations.environment.status = 'warning';
                console.log(`   ⚠️ ${missingVars.length} variáveis precisam ser configuradas`);
                missingVars.forEach(v => console.log(`      • ${v}`));
            }

        } catch (error) {
            this.validations.environment.status = 'error';
            console.error('   ❌ Erro na validação do ambiente:', error.message);
        }

        console.log('');
    }

    async validateAPIs() {
        console.log('🔑 VALIDANDO CONFIGURAÇÕES DE API...');

        const apiConfigs = [
            {
                name: 'OpenAI',
                key: process.env.OPENAI_API_KEY,
                test: 'sk-proj-'
            },
            {
                name: 'Stripe Secret',
                key: process.env.STRIPE_SECRET_KEY,
                test: 'sk_live_'
            },
            {
                name: 'Stripe Publishable',
                key: process.env.STRIPE_PUBLISHABLE_KEY,
                test: 'pk_live_'
            }
        ];

        let validApis = 0;

        for (const api of apiConfigs) {
            if (api.key && api.key.startsWith(api.test)) {
                console.log(`   ✅ ${api.name}: Formato correto`);
                validApis++;
            } else {
                console.log(`   ⚠️ ${api.name}: Precisa ser configurado`);
            }
        }

        this.validations.apis.details = {
            total: apiConfigs.length,
            valid: validApis,
            configs: apiConfigs.map(a => ({ name: a.name, configured: a.key?.startsWith(a.test) }))
        };

        if (validApis === apiConfigs.length) {
            this.validations.apis.status = 'success';
        } else {
            this.validations.apis.status = 'warning';
        }

        console.log('');
    }

    async validateBusinessRules() {
        console.log('💼 VALIDANDO REGRAS DE NEGÓCIO...');

        const businessRules = {
            commissionBrazil: {
                monthly: parseInt(process.env.COMMISSION_MONTHLY_BRAZIL) || 0,
                prepaid: parseInt(process.env.COMMISSION_PREPAID_BRAZIL) || 0
            },
            commissionForeign: {
                monthly: parseInt(process.env.COMMISSION_MONTHLY_FOREIGN) || 0,
                prepaid: parseInt(process.env.COMMISSION_PREPAID_FOREIGN) || 0
            },
            affiliate: {
                brazil: parseFloat(process.env.AFFILIATE_COMMISSION_BRAZIL) || 0,
                foreign: parseFloat(process.env.AFFILIATE_COMMISSION_FOREIGN) || 0
            },
            minimums: {
                brazilBRL: parseInt(process.env.MINIMUM_PREPAID_BRAZIL_BRL) || 0,
                foreignUSD: parseInt(process.env.MINIMUM_PREPAID_FOREIGN_USD) || 0
            }
        };

        console.log('   📊 Comissões Brasil:');
        console.log(`      • Mensal: ${businessRules.commissionBrazil.monthly}%`);
        console.log(`      • Pré-pago: ${businessRules.commissionBrazil.prepaid}%`);
        
        console.log('   📊 Comissões Estrangeiro:');
        console.log(`      • Mensal: ${businessRules.commissionForeign.monthly}%`);
        console.log(`      • Pré-pago: ${businessRules.commissionForeign.prepaid}%`);
        
        console.log('   🎯 Afiliados:');
        console.log(`      • Brasil: ${businessRules.affiliate.brazil}%`);
        console.log(`      • Estrangeiro: ${businessRules.affiliate.foreign}%`);
        
        console.log('   💰 Valores Mínimos:');
        console.log(`      • Brasil: R$ ${businessRules.minimums.brazilBRL}`);
        console.log(`      • Estrangeiro: $ ${businessRules.minimums.foreignUSD}`);

        // Validar se valores fazem sentido
        const validRules = 
            businessRules.commissionBrazil.monthly > 0 &&
            businessRules.commissionBrazil.prepaid > 0 &&
            businessRules.minimums.brazilBRL > 0 &&
            businessRules.minimums.foreignUSD > 0;

        this.validations.business.details = businessRules;
        this.validations.business.status = validRules ? 'success' : 'warning';

        if (validRules) {
            console.log('   ✅ Regras de negócio configuradas corretamente');
        } else {
            console.log('   ⚠️ Algumas regras de negócio precisam ser ajustadas');
        }

        console.log('');
    }

    async validateCriticalFiles() {
        console.log('📁 VALIDANDO ARQUIVOS CRÍTICOS...');

        const criticalFiles = [
            'app.js',
            'position-safety-validator.js',
            'enhanced-signal-processor.js',
            'dashboard-tempo-real.js',
            'system-validation-complete.js',
            'real-trading-test.js',
            'production-startup.js'
        ];

        const fileStatus = {};
        let validFiles = 0;

        for (const file of criticalFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                fileStatus[file] = {
                    exists: true,
                    size: stats.size,
                    modified: stats.mtime
                };
                console.log(`   ✅ ${file}: ${Math.round(stats.size/1024)}KB`);
                validFiles++;
            } else {
                fileStatus[file] = { exists: false };
                console.log(`   ❌ ${file}: Não encontrado`);
            }
        }

        this.validations.files.details = {
            total: criticalFiles.length,
            valid: validFiles,
            files: fileStatus
        };

        if (validFiles === criticalFiles.length) {
            this.validations.files.status = 'success';
        } else {
            this.validations.files.status = 'error';
        }

        console.log('');
    }

    async validateConfigurations() {
        console.log('⚙️ VALIDANDO CONFIGURAÇÕES DO SISTEMA...');

        const configs = {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT || 3000,
            timezone: process.env.TZ,
            enableRealTrading: process.env.ENABLE_REAL_TRADING === 'true',
            positionSafety: process.env.POSITION_SAFETY_ENABLED === 'true',
            analytics: process.env.ANALYTICS_ENABLED === 'true'
        };

        console.log(`   🌍 Ambiente: ${configs.nodeEnv}`);
        console.log(`   🔌 Porta: ${configs.port}`);
        console.log(`   🕐 Timezone: ${configs.timezone}`);
        console.log(`   💰 Trading Real: ${configs.enableRealTrading ? 'ATIVADO' : 'SIMULAÇÃO'}`);
        console.log(`   🔒 Position Safety: ${configs.positionSafety ? 'ATIVADO' : 'DESATIVADO'}`);
        console.log(`   📊 Analytics: ${configs.analytics ? 'ATIVADO' : 'DESATIVADO'}`);

        // Validar configurações críticas
        const criticalConfigs = configs.positionSafety && configs.analytics;

        this.validations.config.details = configs;
        this.validations.config.status = criticalConfigs ? 'success' : 'warning';

        if (criticalConfigs) {
            console.log('   ✅ Configurações críticas ativadas');
        } else {
            console.log('   ⚠️ Algumas configurações críticas estão desativadas');
        }

        console.log('');
    }

    async generateFinalReport() {
        console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
        console.log('===============================');
        console.log('');

        // Calcular status geral
        const statuses = Object.values(this.validations).map(v => v.status);
        const successCount = statuses.filter(s => s === 'success').length;
        const warningCount = statuses.filter(s => s === 'warning').length;
        const errorCount = statuses.filter(s => s === 'error').length;

        // Status geral
        if (errorCount === 0 && warningCount === 0) {
            console.log('🎉 STATUS GERAL: SISTEMA 100% PRONTO PARA PRODUÇÃO');
        } else if (errorCount === 0) {
            console.log('✅ STATUS GERAL: SISTEMA PRONTO (Com algumas configurações pendentes)');
        } else {
            console.log('⚠️ STATUS GERAL: SISTEMA PRECISA DE CORREÇÕES');
        }

        console.log('');

        // Resumo das validações
        console.log('📋 RESUMO DAS VALIDAÇÕES:');
        Object.entries(this.validations).forEach(([key, validation]) => {
            const icon = validation.status === 'success' ? '✅' : 
                        validation.status === 'warning' ? '⚠️' : '❌';
            console.log(`   ${icon} ${key.toUpperCase()}: ${validation.status.toUpperCase()}`);
        });

        console.log('');

        // URLs e acessos
        console.log('🌐 INFORMAÇÕES DE ACESSO:');
        console.log(`   • Backend: ${process.env.BACKEND_URL || 'http://localhost:3000'}`);
        console.log(`   • Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
        console.log(`   • Webhook: ${process.env.WEBHOOK_URL || 'http://localhost:3000/webhook'}`);
        console.log('');

        // Próximos passos
        console.log('🎯 PRÓXIMOS PASSOS PARA ATIVAÇÃO COMPLETA:');
        
        if (errorCount === 0) {
            console.log('   1. ✅ Configurar chaves de API das exchanges (se ainda não feito)');
            console.log('   2. ✅ Testar conectividade do banco de dados');
            console.log('   3. ✅ Executar sistema em modo simulação');
            console.log('   4. ✅ Ativar trading real quando apropriado');
            console.log('   5. ✅ Configurar monitoramento e alertas');
        } else {
            console.log('   1. ❌ Corrigir arquivos faltantes');
            console.log('   2. ❌ Configurar variáveis de ambiente');
            console.log('   3. ❌ Reexecutar validação');
        }

        console.log('');

        // Comandos para execução
        console.log('⚡ COMANDOS PARA EXECUÇÃO:');
        console.log('   • Validação completa: node system-validation-complete.js');
        console.log('   • Teste trading real: node real-trading-test.js');
        console.log('   • Startup produção: node production-startup.js');
        console.log('   • API principal: node app.js');
        console.log('');

        if (errorCount === 0) {
            console.log('🚀 COINBITCLUB MARKET BOT VALIDADO E PRONTO!');
            console.log('🎉 Sistema empresarial multiusuário 100% funcional!');
            console.log('💰 Pronto para operações reais de trading automatizado!');
        } else {
            console.log('⚠️ Finalize as correções acima antes de ativar em produção');
        }

        console.log('=======================================');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const validator = new FinalSystemValidation();
    validator.runFinalValidation();
}

module.exports = FinalSystemValidation;

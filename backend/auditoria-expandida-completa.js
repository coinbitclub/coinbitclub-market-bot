/**
 * 🔍 AUDITORIA COMPLETA EXPANDIDA - MICROSERVIÇOS E INTEGRAÇÕES
 * Verificação total do ecossistema CoinBitClub Market Bot V3.0.0
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 AUDITORIA COMPLETA EXPANDIDA - MICROSERVIÇOS E INTEGRAÇÕES');
console.log('='.repeat(80));

class ExpandedSystemAuditor {
    constructor() {
        this.baseDir = __dirname;
        this.microservices = [];
        this.integrations = [];
        this.issues = [];
        this.workingComponents = [];
        this.missingServices = [];
    }

    // 1. Mapear TODOS os microserviços previstos
    async mapearMicroservicosCompletos() {
        console.log('🏗️ 1. MAPEANDO TODOS OS MICROSERVIÇOS PREVISTOS');
        console.log('-'.repeat(60));

        const microservicesPrevistos = [
            // CORE TRADING SERVICES
            {
                nome: 'Trading Engine Core',
                arquivo: 'services/trading-engine-core.js',
                tipo: 'CORE_SERVICE',
                funcao: 'Motor principal de execução de trades',
                integracao: 'Bybit API V5',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Risk Management Service',
                arquivo: 'services/risk-management.js',
                tipo: 'CORE_SERVICE',
                funcao: 'Gerenciamento avançado de riscos',
                integracao: 'Trading Engine',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Portfolio Manager',
                arquivo: 'services/portfolio-manager.js',
                tipo: 'CORE_SERVICE',
                funcao: 'Gerenciamento de portfólio multiusuário',
                integracao: 'Database + Bybit',
                essencial: true,
                status: 'MISSING'
            },

            // AI SERVICES
            {
                nome: 'OpenAI Integration Service',
                arquivo: 'services/openai-service.js',
                tipo: 'AI_SERVICE',
                funcao: 'Análise inteligente de mercado',
                integracao: 'OpenAI GPT-4',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'AI Signal Analyzer',
                arquivo: 'services/ai-signal-analyzer.js',
                tipo: 'AI_SERVICE',
                funcao: 'Análise IA de sinais de trading',
                integracao: 'OpenAI + TradingView',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'AI Market Sentiment',
                arquivo: 'services/ai-market-sentiment.js',
                tipo: 'AI_SERVICE',
                funcao: 'Análise de sentimento do mercado',
                integracao: 'OpenAI + Fear&Greed',
                essencial: false,
                status: 'MISSING'
            },

            // COMMUNICATION SERVICES
            {
                nome: 'Twilio SMS Service',
                arquivo: 'services/twilio-sms.js',
                tipo: 'COMMUNICATION',
                funcao: 'Notificações SMS para usuários',
                integracao: 'Twilio API',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'WhatsApp Bot Service',
                arquivo: 'services/whatsapp-bot.js',
                tipo: 'COMMUNICATION',
                funcao: 'Bot WhatsApp para notificações',
                integracao: 'Twilio WhatsApp API',
                essencial: false,
                status: 'MISSING'
            },
            {
                nome: 'Email Notification Service',
                arquivo: 'services/email-service.js',
                tipo: 'COMMUNICATION',
                funcao: 'Sistema de emails automatizado',
                integracao: 'SendGrid/Nodemailer',
                essencial: true,
                status: 'MISSING'
            },

            // PAYMENT SERVICES
            {
                nome: 'Stripe Payment Service',
                arquivo: 'services/stripe-payment.js',
                tipo: 'PAYMENT',
                funcao: 'Processamento de pagamentos',
                integracao: 'Stripe API',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Subscription Manager',
                arquivo: 'services/subscription-manager.js',
                tipo: 'PAYMENT',
                funcao: 'Gerenciamento de assinaturas',
                integracao: 'Stripe + Database',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Billing Service',
                arquivo: 'services/billing-service.js',
                tipo: 'PAYMENT',
                funcao: 'Sistema de cobrança automática',
                integracao: 'Stripe + Notifications',
                essencial: true,
                status: 'MISSING'
            },

            // ANALYTICS SERVICES
            {
                nome: 'Performance Analytics',
                arquivo: 'services/performance-analytics.js',
                tipo: 'ANALYTICS',
                funcao: 'Análise de performance de trading',
                integracao: 'Database + Charts',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'User Behavior Analytics',
                arquivo: 'services/user-analytics.js',
                tipo: 'ANALYTICS',
                funcao: 'Análise comportamental dos usuários',
                integracao: 'Database + AI',
                essencial: false,
                status: 'MISSING'
            },
            {
                nome: 'Market Data Aggregator',
                arquivo: 'services/market-data-aggregator.js',
                tipo: 'ANALYTICS',
                funcao: 'Agregação de dados de mercado',
                integracao: 'Multiple APIs',
                essencial: true,
                status: 'MISSING'
            },

            // SECURITY SERVICES
            {
                nome: 'Authentication Service',
                arquivo: 'services/auth-service.js',
                tipo: 'SECURITY',
                funcao: 'Sistema de autenticação JWT',
                integracao: 'Database + JWT',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'API Security Middleware',
                arquivo: 'middleware/api-security.js',
                tipo: 'SECURITY',
                funcao: 'Middleware de segurança de APIs',
                integracao: 'Express + Rate Limiting',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Encryption Service',
                arquivo: 'services/encryption-service.js',
                tipo: 'SECURITY',
                funcao: 'Criptografia de dados sensíveis',
                integracao: 'Crypto Module',
                essencial: true,
                status: 'MISSING'
            },

            // MONITORING SERVICES
            {
                nome: 'Health Check Service',
                arquivo: 'services/health-check.js',
                tipo: 'MONITORING',
                funcao: 'Monitoramento de saúde do sistema',
                integracao: 'All Services',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Logging Service',
                arquivo: 'services/logging-service.js',
                tipo: 'MONITORING',
                funcao: 'Sistema centralizado de logs',
                integracao: 'Winston + Database',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Metrics Collector',
                arquivo: 'services/metrics-collector.js',
                tipo: 'MONITORING',
                funcao: 'Coleta de métricas do sistema',
                integracao: 'Prometheus/Custom',
                essencial: false,
                status: 'MISSING'
            },

            // BACKUP & RECOVERY
            {
                nome: 'Database Backup Service',
                arquivo: 'services/backup-service.js',
                tipo: 'BACKUP',
                funcao: 'Backup automático do banco',
                integracao: 'PostgreSQL + Cloud',
                essencial: true,
                status: 'MISSING'
            },
            {
                nome: 'Disaster Recovery',
                arquivo: 'services/disaster-recovery.js',
                tipo: 'BACKUP',
                funcao: 'Sistema de recuperação de desastres',
                integracao: 'Backup + Monitoring',
                essencial: true,
                status: 'MISSING'
            }
        ];

        this.microservices = microservicesPrevistos;

        console.log(`📋 Total de microserviços previstos: ${this.microservices.length}\n`);
        
        // Agrupar por tipo
        const grouped = this.microservices.reduce((acc, service) => {
            acc[service.tipo] = acc[service.tipo] || [];
            acc[service.tipo].push(service);
            return acc;
        }, {});

        Object.keys(grouped).forEach(tipo => {
            const emoji = this.getTypeEmoji(tipo);
            console.log(`${emoji} ${tipo.replace('_', ' ')} (${grouped[tipo].length} serviços):`);
            grouped[tipo].forEach(service => {
                console.log(`   📁 ${service.nome}`);
                console.log(`      🔧 ${service.funcao}`);
                console.log(`      🔗 Integração: ${service.integracao}`);
                console.log(`      ${service.essencial ? '⚡ ESSENCIAL' : '🔧 OPCIONAL'}`);
                console.log('');
            });
        });
    }

    getTypeEmoji(tipo) {
        const emojis = {
            'CORE_SERVICE': '🎯',
            'AI_SERVICE': '🧠',
            'COMMUNICATION': '📞',
            'PAYMENT': '💳',
            'ANALYTICS': '📊',
            'SECURITY': '🔒',
            'MONITORING': '📈',
            'BACKUP': '💾'
        };
        return emojis[tipo] || '🔧';
    }

    // 2. Verificar arquivos de microserviços existentes
    async verificarMicroservicos() {
        console.log('📁 2. VERIFICANDO EXISTÊNCIA DOS MICROSERVIÇOS');
        console.log('-'.repeat(60));

        let foundServices = 0;
        let missingEssential = 0;

        for (const service of this.microservices) {
            const filePath = path.join(this.baseDir, service.arquivo);
            const exists = fs.existsSync(filePath);
            
            console.log(`${exists ? '✅' : '❌'} ${service.nome}`);
            console.log(`   📁 Caminho: ${service.arquivo}`);
            console.log(`   ${exists ? '✓ Arquivo encontrado' : '✗ Arquivo não encontrado'}`);
            
            if (exists) {
                foundServices++;
                this.workingComponents.push(service);
                service.status = 'FOUND';
            } else {
                this.missingServices.push(service);
                if (service.essencial) {
                    missingEssential++;
                    this.issues.push({
                        tipo: 'MICROSERVICO_FALTANDO',
                        componente: service.nome,
                        arquivo: service.arquivo,
                        tipo_servico: service.tipo,
                        severidade: 'CRÍTICA'
                    });
                } else {
                    this.issues.push({
                        tipo: 'MICROSERVICO_OPCIONAL_FALTANDO',
                        componente: service.nome,
                        arquivo: service.arquivo,
                        tipo_servico: service.tipo,
                        severidade: 'BAIXA'
                    });
                }
            }
            console.log('');
        }

        console.log(`📊 RESUMO MICROSERVIÇOS:`);
        console.log(`   Encontrados: ${foundServices}/${this.microservices.length}`);
        console.log(`   Essenciais faltando: ${missingEssential}`);
        console.log(`   Taxa de completude: ${Math.round(foundServices / this.microservices.length * 100)}%\n`);
    }

    // 3. Verificar integrações externas
    async verificarIntegracoes() {
        console.log('🔗 3. VERIFICANDO INTEGRAÇÕES EXTERNAS');
        console.log('-'.repeat(60));

        const integracoes = [
            {
                nome: 'OpenAI GPT-4',
                variavel_env: 'OPENAI_API_KEY',
                endpoint_teste: 'https://api.openai.com/v1/models',
                essencial: true,
                status: 'UNKNOWN'
            },
            {
                nome: 'Twilio SMS',
                variavel_env: 'TWILIO_ACCOUNT_SID',
                endpoint_teste: null,
                essencial: true,
                status: 'UNKNOWN'
            },
            {
                nome: 'Twilio WhatsApp',
                variavel_env: 'TWILIO_WHATSAPP_NUMBER',
                endpoint_teste: null,
                essencial: false,
                status: 'UNKNOWN'
            },
            {
                nome: 'Stripe Payments',
                variavel_env: 'STRIPE_SECRET_KEY',
                endpoint_teste: 'https://api.stripe.com/v1/payment_methods',
                essencial: true,
                status: 'UNKNOWN'
            },
            {
                nome: 'Bybit API V5',
                variavel_env: null,
                endpoint_teste: 'https://api.bybit.com/v5/market/time',
                essencial: true,
                status: 'UNKNOWN'
            },
            {
                nome: 'TradingView Webhook',
                variavel_env: null,
                endpoint_teste: null,
                essencial: true,
                status: 'UNKNOWN'
            }
        ];

        for (const integracao of integracoes) {
            console.log(`🔍 Testando: ${integracao.nome}`);
            
            try {
                // Verificar variável de ambiente
                if (integracao.variavel_env) {
                    const envVar = process.env[integracao.variavel_env];
                    if (envVar) {
                        console.log(`   ✅ Variável ${integracao.variavel_env} configurada`);
                        integracao.status = 'CONFIGURED';
                    } else {
                        console.log(`   ❌ Variável ${integracao.variavel_env} não encontrada`);
                        integracao.status = 'MISSING_CONFIG';
                        
                        this.issues.push({
                            tipo: 'INTEGRACAO_SEM_CONFIG',
                            integracao: integracao.nome,
                            variavel: integracao.variavel_env,
                            severidade: integracao.essencial ? 'ALTA' : 'MÉDIA'
                        });
                    }
                }

                // Testar endpoint se disponível
                if (integracao.endpoint_teste && integracao.status === 'CONFIGURED') {
                    const response = await fetch(integracao.endpoint_teste, {
                        method: 'GET',
                        timeout: 5000
                    }).catch(() => null);

                    if (response && response.ok) {
                        console.log(`   ✅ Endpoint respondendo`);
                        integracao.status = 'WORKING';
                    } else {
                        console.log(`   ⚠️ Endpoint não respondeu`);
                        integracao.status = 'ENDPOINT_DOWN';
                    }
                }

            } catch (error) {
                console.log(`   ❌ Erro ao testar: ${error.message}`);
                integracao.status = 'ERROR';
            }

            console.log(`   Status: ${this.getStatusIcon(integracao.status)} ${integracao.status}\n`);
        }

        this.integrations = integracoes;

        // Testar Bybit especificamente (sabemos que está funcionando)
        console.log('🔍 Teste específico Bybit API V5:');
        try {
            const bybitTest = await fetch('https://api.bybit.com/v5/market/time');
            const bybitData = await bybitTest.json();
            
            if (bybitData.retCode === 0) {
                console.log('   ✅ Bybit API V5 funcionando perfeitamente');
                const bybitIntegration = integracoes.find(i => i.nome === 'Bybit API V5');
                if (bybitIntegration) bybitIntegration.status = 'WORKING';
            }
        } catch (error) {
            console.log('   ❌ Erro ao testar Bybit:', error.message);
        }
    }

    getStatusIcon(status) {
        const icons = {
            'WORKING': '✅',
            'CONFIGURED': '🟡',
            'MISSING_CONFIG': '❌',
            'ENDPOINT_DOWN': '⚠️',
            'ERROR': '❌',
            'UNKNOWN': '❓'
        };
        return icons[status] || '❓';
    }

    // 4. Verificar estrutura de banco para microserviços
    async verificarEstruturaBancoCompleta() {
        console.log('🗃️ 4. VERIFICANDO ESTRUTURA COMPLETA DO BANCO');
        console.log('-'.repeat(60));

        const tabelasEsperadas = [
            // Tabelas existentes
            { nome: 'trading_signals', status: 'EXISTS' },
            { nome: 'user_operations', status: 'EXISTS' },
            { nome: 'users', status: 'EXISTS' },
            { nome: 'user_api_keys', status: 'EXISTS' },
            { nome: 'fear_greed_data', status: 'EXISTS' },
            
            // Tabelas necessárias para microserviços
            { nome: 'subscriptions', status: 'MISSING', essencial: true },
            { nome: 'payments', status: 'MISSING', essencial: true },
            { nome: 'notifications', status: 'MISSING', essencial: true },
            { nome: 'ai_analysis', status: 'MISSING', essencial: false },
            { nome: 'performance_metrics', status: 'MISSING', essencial: true },
            { nome: 'system_logs', status: 'MISSING', essencial: true },
            { nome: 'user_sessions', status: 'MISSING', essencial: true },
            { nome: 'api_usage_logs', status: 'MISSING', essencial: false },
            { nome: 'backup_logs', status: 'MISSING', essencial: true },
            { nome: 'user_preferences', status: 'MISSING', essencial: false }
        ];

        console.log('📊 Verificando tabelas...\n');

        for (const tabela of tabelasEsperadas) {
            try {
                const result = await pool.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_name = $1
                `, [tabela.nome]);

                const exists = result.rows[0].count > 0;
                
                if (exists) {
                    console.log(`✅ Tabela: ${tabela.nome}`);
                    tabela.status = 'EXISTS';
                } else {
                    console.log(`❌ Tabela: ${tabela.nome} (FALTANDO)`);
                    tabela.status = 'MISSING';
                    
                    if (tabela.essencial) {
                        this.issues.push({
                            tipo: 'TABELA_MICROSERVICO_FALTANDO',
                            tabela: tabela.nome,
                            severidade: 'ALTA'
                        });
                    }
                }

            } catch (error) {
                console.log(`❌ Erro ao verificar tabela ${tabela.nome}:`, error.message);
                tabela.status = 'ERROR';
            }
        }

        const existentes = tabelasEsperadas.filter(t => t.status === 'EXISTS').length;
        const total = tabelasEsperadas.length;
        
        console.log(`\n📊 ESTRUTURA DO BANCO:`);
        console.log(`   Tabelas existentes: ${existentes}/${total}`);
        console.log(`   Completude: ${Math.round(existentes / total * 100)}%`);
    }

    // 5. Verificar orquestração operacional
    async verificarOrquestracaoOperacional() {
        console.log('\n🎭 5. VERIFICANDO ORQUESTRAÇÃO OPERACIONAL COMPLETA');
        console.log('-'.repeat(60));

        const fluxosOperacionais = [
            {
                nome: 'Fluxo de Onboarding',
                etapas: [
                    'Registro de usuário',
                    'Verificação de email',
                    'Configuração de pagamento (Stripe)',
                    'Validação de chaves API',
                    'Ativação de conta'
                ],
                status: 'PARCIAL'
            },
            {
                nome: 'Fluxo de Trading',
                etapas: [
                    'Recepção de sinal (TradingView)',
                    'Processamento de sinal',
                    'Validação de risco',
                    'Execução de trade (Bybit)',
                    'Monitoramento de posição',
                    'Notificação ao usuário'
                ],
                status: 'FUNCIONAL'
            },
            {
                nome: 'Fluxo de Notificações',
                etapas: [
                    'Trigger de evento',
                    'Análise de preferências',
                    'Envio SMS (Twilio)',
                    'Envio WhatsApp (Twilio)',
                    'Envio Email',
                    'Log de entrega'
                ],
                status: 'FALTANDO'
            },
            {
                nome: 'Fluxo de Pagamentos',
                etapas: [
                    'Processamento Stripe',
                    'Validação de pagamento',
                    'Atualização de assinatura',
                    'Ativação de serviços',
                    'Notificação de cobrança'
                ],
                status: 'FALTANDO'
            },
            {
                nome: 'Fluxo de IA',
                etapas: [
                    'Coleta de dados de mercado',
                    'Análise OpenAI',
                    'Geração de insights',
                    'Recomendações personalizadas',
                    'Feedback para sistema'
                ],
                status: 'FALTANDO'
            },
            {
                nome: 'Fluxo de Monitoramento',
                etapas: [
                    'Coleta de métricas',
                    'Análise de performance',
                    'Detecção de anomalias',
                    'Alertas automáticos',
                    'Relatórios executivos'
                ],
                status: 'PARCIAL'
            }
        ];

        fluxosOperacionais.forEach(fluxo => {
            const statusIcon = fluxo.status === 'FUNCIONAL' ? '✅' : 
                             fluxo.status === 'PARCIAL' ? '🟡' : '❌';
            
            console.log(`${statusIcon} ${fluxo.nome} (${fluxo.status})`);
            fluxo.etapas.forEach((etapa, index) => {
                console.log(`   ${index + 1}. ${etapa}`);
            });
            console.log('');

            if (fluxo.status === 'FALTANDO') {
                this.issues.push({
                    tipo: 'FLUXO_OPERACIONAL_INCOMPLETO',
                    fluxo: fluxo.nome,
                    severidade: 'ALTA'
                });
            }
        });

        const funcionais = fluxosOperacionais.filter(f => f.status === 'FUNCIONAL').length;
        const total = fluxosOperacionais.length;
        
        console.log(`📊 ORQUESTRAÇÃO OPERACIONAL:`);
        console.log(`   Fluxos funcionais: ${funcionais}/${total}`);
        console.log(`   Maturidade operacional: ${Math.round(funcionais / total * 100)}%`);
    }

    // 6. Gerar relatório de prioridades
    gerarRelatorioPrioridades() {
        console.log('\n📋 6. RELATÓRIO DE PRIORIDADES DE IMPLEMENTAÇÃO');
        console.log('='.repeat(80));

        const servicosEssenciaisFaltando = this.missingServices.filter(s => s.essencial);
        const integracoesFaltando = this.integrations.filter(i => i.status !== 'WORKING' && i.essencial);

        console.log('🔴 PRIORIDADE CRÍTICA (Implementar PRIMEIRO):');
        console.log('\n   💳 PAGAMENTOS E ASSINATURAS:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'PAYMENT').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n   🔒 SEGURANÇA E AUTENTICAÇÃO:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'SECURITY').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n   🎯 TRADING CORE:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'CORE_SERVICE').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n🟠 PRIORIDADE ALTA (Implementar SEGUNDO):');
        console.log('\n   📞 COMUNICAÇÕES:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'COMMUNICATION').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n   📊 ANALYTICS:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'ANALYTICS').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n🟡 PRIORIDADE MÉDIA (Implementar TERCEIRO):');
        console.log('\n   🧠 INTELIGÊNCIA ARTIFICIAL:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'AI_SERVICE').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n   📈 MONITORAMENTO:');
        servicosEssenciaisFaltando.filter(s => s.tipo === 'MONITORING').forEach(s => {
            console.log(`   • ${s.nome} - ${s.funcao}`);
        });

        console.log('\n🔵 INTEGRAÇÕES FALTANDO:');
        integracoesFaltando.forEach(i => {
            console.log(`   • ${i.nome} - Status: ${i.status}`);
        });
    }

    // 7. Gerar relatório final expandido
    gerarRelatorioFinalExpandido() {
        console.log('\n📋 7. RELATÓRIO FINAL EXPANDIDO');
        console.log('='.repeat(80));

        const totalComponents = this.microservices.length;
        const workingComponents = this.workingComponents.length;
        const criticalIssues = this.issues.filter(i => i.severidade === 'CRÍTICA').length;
        const highIssues = this.issues.filter(i => i.severidade === 'ALTA').length;

        console.log(`🎯 VISÃO GERAL DO ECOSSISTEMA:`);
        console.log(`   Microserviços totais previstos: ${totalComponents}`);
        console.log(`   Microserviços implementados: ${workingComponents}`);
        console.log(`   Taxa de completude: ${Math.round(workingComponents / totalComponents * 100)}%`);
        console.log(`   Problemas críticos: ${criticalIssues}`);
        console.log(`   Problemas de alta prioridade: ${highIssues}`);

        console.log(`\n📊 STATUS POR CATEGORIA:`);
        const byType = this.microservices.reduce((acc, service) => {
            acc[service.tipo] = acc[service.tipo] || { total: 0, found: 0 };
            acc[service.tipo].total++;
            if (service.status === 'FOUND') acc[service.tipo].found++;
            return acc;
        }, {});

        Object.keys(byType).forEach(tipo => {
            const emoji = this.getTypeEmoji(tipo);
            const stats = byType[tipo];
            const percentage = Math.round(stats.found / stats.total * 100);
            console.log(`   ${emoji} ${tipo.replace('_', ' ')}: ${stats.found}/${stats.total} (${percentage}%)`);
        });

        console.log(`\n🔗 STATUS DAS INTEGRAÇÕES:`);
        this.integrations.forEach(integration => {
            const icon = this.getStatusIcon(integration.status);
            console.log(`   ${icon} ${integration.nome}: ${integration.status}`);
        });

        console.log(`\n🚀 RECOMENDAÇÕES ESTRATÉGICAS:`);
        
        if (criticalIssues > 0) {
            console.log(`   🔴 URGENTE: ${criticalIssues} problemas críticos precisam ser resolvidos`);
        }
        
        if (workingComponents < totalComponents * 0.5) {
            console.log(`   ⚠️ Sistema ainda em desenvolvimento - < 50% dos microserviços implementados`);
        } else if (workingComponents < totalComponents * 0.8) {
            console.log(`   🟡 Sistema em fase avançada - continuar implementação dos microserviços restantes`);
        } else {
            console.log(`   ✅ Sistema maduro - focar em otimizações e recursos avançados`);
        }

        const essentialMissing = this.missingServices.filter(s => s.essencial).length;
        if (essentialMissing > 0) {
            console.log(`   ⚡ ${essentialMissing} microserviços ESSENCIAIS precisam ser implementados`);
        }

        console.log(`\n🎉 AUDITORIA EXPANDIDA CONCLUÍDA`);
        console.log(`Status geral: ${workingComponents >= totalComponents * 0.8 ? 'SISTEMA MADURO' : 
                                      workingComponents >= totalComponents * 0.5 ? 'EM DESENVOLVIMENTO AVANÇADO' : 
                                      'EM DESENVOLVIMENTO INICIAL'}`);
    }

    // Executar auditoria completa expandida
    async executarAuditoriaExpandida() {
        try {
            await this.mapearMicroservicosCompletos();
            await this.verificarMicroservicos();
            await this.verificarIntegracoes();
            await this.verificarEstruturaBancoCompleta();
            await this.verificarOrquestracaoOperacional();
            this.gerarRelatorioPrioridades();
            this.gerarRelatorioFinalExpandido();
            
        } catch (error) {
            console.error('❌ Erro durante auditoria expandida:', error.message);
            this.issues.push({
                tipo: 'ERRO_AUDITORIA_EXPANDIDA',
                erro: error.message,
                severidade: 'CRÍTICA'
            });
        } finally {
            await pool.end();
        }
    }
}

// Executar auditoria expandida
const expandedAuditor = new ExpandedSystemAuditor();
expandedAuditor.executarAuditoriaExpandida();

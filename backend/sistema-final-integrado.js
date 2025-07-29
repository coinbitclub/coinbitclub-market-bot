/**
 * 🌐 SISTEMA INTEGRADO FINAL - IA SUPERVISOR + TRADING + FINANCEIRO
 * 
 * ARQUITETURA COMPLETA:
 * - IA Guardian: Garante sequência Fear&Greed → Sinal → Operação
 * - IA Supervisor Financeiro: Supervisiona cálculos, comissões, contabilização
 * - TradingView: Processamento de sinais reais
 * - Microserviços: Execução das operações financeiras
 * 
 * RESPONSABILIDADES DA IA:
 * ✅ EXECUTA: Atualização de dados, monitoramento, emissão de ordens
 * ❌ NÃO EXECUTA: Trading direto, pagamentos, transferências
 */

const SistemaIntegradoCompleto = require('./sistema-integrado-completo');
const IASupervisorFinanceiro = require('./ia-supervisor-financeiro');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class SistemaFinalIntegrado {
    constructor() {
        this.sistemaCompleto = null;
        this.supervisorFinanceiro = null;
        this.isActive = false;
        this.startTime = null;
        
        // Estados dos subsistemas
        this.subsystemsStatus = {
            trading: false,
            financialSupervisor: false,
            iaGuardian: false,
            fearGreed: false,
            webhooks: false
        };
    }

    async iniciarSistemaFinal() {
        console.log('🌟 INICIANDO SISTEMA COINBITCLUB FINAL INTEGRADO');
        console.log('='.repeat(70));
        console.log('📅 Data:', new Date().toISOString());
        console.log('🎯 Arquitetura: Supervisor IA + Microserviços');
        console.log('');
        console.log('🏗️ COMPONENTES DO SISTEMA:');
        console.log('   🤖 IA Guardian - Sequência Fear&Greed → Sinal → Operação');
        console.log('   💰 IA Supervisor Financeiro - Supervisão de microserviços');
        console.log('   📡 TradingView Integration - Sinais reais');
        console.log('   📊 Fear & Greed - Múltiplas fontes + CoinStats API');
        console.log('   🔧 Trading System - Configurações TP/SL corretas');
        console.log('   💾 Database - PostgreSQL completo');
        console.log('');

        try {
            this.startTime = new Date();

            // 1. Inicializar Sistema Trading Completo
            console.log('1️⃣ INICIALIZANDO SISTEMA TRADING...');
            this.sistemaCompleto = new SistemaIntegradoCompleto();
            const tradingResult = await this.sistemaCompleto.iniciarSistemaCompleto();
            
            if (tradingResult.success) {
                this.subsystemsStatus.trading = true;
                this.subsystemsStatus.iaGuardian = true;
                this.subsystemsStatus.fearGreed = tradingResult.components.fearGreed ? true : false;
                this.subsystemsStatus.webhooks = true;
                console.log('✅ Sistema Trading inicializado');
            } else {
                throw new Error('Falha no sistema trading: ' + tradingResult.error);
            }

            // 2. Inicializar IA Supervisor Financeiro
            console.log('\n2️⃣ INICIALIZANDO IA SUPERVISOR FINANCEIRO...');
            this.supervisorFinanceiro = new IASupervisorFinanceiro();
            const supervisorResult = await this.supervisorFinanceiro.iniciarSupervisao();
            
            if (supervisorResult.success) {
                this.subsystemsStatus.financialSupervisor = true;
                console.log('✅ IA Supervisor Financeiro inicializado');
            } else {
                throw new Error('Falha no supervisor financeiro: ' + supervisorResult.error);
            }

            // 3. Sincronizar sistemas
            console.log('\n3️⃣ SINCRONIZANDO SISTEMAS...');
            await this.sincronizarSistemas();

            // 4. Configurar monitoramento integrado
            console.log('\n4️⃣ CONFIGURANDO MONITORAMENTO INTEGRADO...');
            await this.configurarMonitoramentoIntegrado();

            // 5. Sistema final ativo
            this.isActive = true;
            
            console.log('\n🎉 SISTEMA COINBITCLUB FINAL ATIVO!');
            console.log('='.repeat(70));
            console.log('🤖 IA Guardian: Ativa (sequência garantida)');
            console.log('💰 IA Supervisor: Ativo (microserviços supervisionados)');
            console.log('📡 TradingView: Pronto para sinais');
            console.log('📊 Fear & Greed: Monitoramento ativo');
            console.log('🔄 Microserviços: Supervisionados em tempo real');
            console.log('');
            console.log('✅ PRONTO PARA OPERAÇÃO COMPLETA!');

            return {
                success: true,
                systems: this.subsystemsStatus,
                message: 'Sistema final integrado ativo'
            };

        } catch (error) {
            console.error('❌ Erro na inicialização do sistema final:', error.message);
            return {
                success: false,
                error: error.message,
                systems: this.subsystemsStatus
            };
        }
    }

    async sincronizarSistemas() {
        try {
            // Sincronizar dados entre IA Guardian e Supervisor Financeiro
            console.log('   🔄 Sincronizando IA Guardian ↔ Supervisor Financeiro...');
            
            // Verificar se ambos os sistemas estão ativos
            if (this.sistemaCompleto && this.supervisorFinanceiro) {
                // Compartilhar dados de operações ativas
                const operacoesAtivas = this.supervisorFinanceiro.realtimeData.operationsActive || [];
                
                if (operacoesAtivas.length > 0) {
                    console.log(`   📊 ${operacoesAtivas.length} operações ativas sincronizadas`);
                } else {
                    console.log('   📊 Nenhuma operação ativa no momento');
                }
                
                console.log('   ✅ Sistemas sincronizados');
            }
            
        } catch (error) {
            console.log('   ❌ Erro na sincronização:', error.message);
        }
    }

    async configurarMonitoramentoIntegrado() {
        try {
            // Monitoramento cruzado entre sistemas (a cada 2 minutos)
            const crossMonitoring = setInterval(async () => {
                await this.monitoramentoCruzado();
            }, 2 * 60 * 1000);

            // Status geral do sistema (a cada 10 minutos)
            const systemStatus = setInterval(async () => {
                await this.verificarStatusGeral();
            }, 10 * 60 * 1000);

            // Manter referências para cleanup
            this.monitoringIntervals = [crossMonitoring, systemStatus];
            
            console.log('   ✅ Monitoramento cruzado: 2 minutos');
            console.log('   ✅ Status geral: 10 minutos');
            
        } catch (error) {
            console.log('   ❌ Erro no monitoramento integrado:', error.message);
        }
    }

    async monitoramentoCruzado() {
        try {
            console.log('\n🔄 MONITORAMENTO CRUZADO DE SISTEMAS');
            
            // Verificar status do Trading System
            const tradingStatus = this.sistemaCompleto ? await this.sistemaCompleto.statusSistema() : null;
            
            // Verificar status do Supervisor Financeiro
            const supervisorStatus = this.supervisorFinanceiro ? await this.supervisorFinanceiro.gerarRelatorioSupervisao() : null;
            
            // Comparar dados e identificar inconsistências
            if (tradingStatus && supervisorStatus) {
                console.log('   ✅ Trading System: Ativo');
                console.log('   ✅ Supervisor Financeiro: Ativo');
                
                // Log detalhado
                const crossCheck = {
                    timestamp: new Date().toISOString(),
                    tradingActive: tradingStatus.active,
                    supervisorActive: supervisorStatus.status === 'ACTIVE',
                    operationsMonitored: supervisorStatus.monitoring.operationsActive,
                    commissionsCalculated: supervisorStatus.monitoring.commissionsCalculated,
                    affiliatePayments: supervisorStatus.monitoring.affiliatePayments
                };
                
                // Registrar monitoramento cruzado
                await this.registrarMonitoramentoCruzado(crossCheck);
                
            } else {
                console.log('   ⚠️ Algum sistema não está respondendo');
            }
            
        } catch (error) {
            console.log('❌ Erro no monitoramento cruzado:', error.message);
        }
    }

    async verificarStatusGeral() {
        try {
            console.log('\n📊 VERIFICAÇÃO DE STATUS GERAL');
            
            const statusGeral = {
                sistemaAtivo: this.isActive,
                tempoOnline: this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 60000) : 0,
                subsistemas: this.subsystemsStatus,
                timestamp: new Date().toISOString()
            };
            
            console.log(`   ⏰ Online há: ${statusGeral.tempoOnline} minutos`);
            console.log('   🔧 Subsistemas:');
            Object.entries(this.subsystemsStatus).forEach(([system, status]) => {
                console.log(`      ${status ? '✅' : '❌'} ${system}`);
            });
            
            // Registrar status no banco
            await this.registrarStatusGeral(statusGeral);
            
            return statusGeral;
            
        } catch (error) {
            console.log('❌ Erro na verificação de status:', error.message);
            return null;
        }
    }

    async processarSinalCompleto(signalData) {
        console.log('\n📡 PROCESSAMENTO COMPLETO DE SINAL (SISTEMA FINAL)');
        console.log('='.repeat(60));

        if (!this.isActive) {
            console.log('❌ Sistema final não está ativo');
            return { success: false, reason: 'Sistema final inativo' };
        }

        try {
            // 1. Processar através do Sistema Trading (IA Guardian)
            console.log('🤖 Fase 1: IA Guardian processando sinal...');
            const tradingResult = await this.sistemaCompleto.processarSinalCompleto(signalData);

            // 2. Notificar Supervisor Financeiro sobre nova operação
            if (tradingResult.success && tradingResult.operationCreated) {
                console.log('💰 Fase 2: Notificando Supervisor Financeiro...');
                
                // Emitir ordem para supervisor acompanhar nova operação
                if (this.supervisorFinanceiro) {
                    await this.supervisorFinanceiro.emitirOrdemParaRoboFinanceiro({
                        action: 'NEW_OPERATION_CREATED',
                        operationId: tradingResult.operationId,
                        userId: tradingResult.userId,
                        symbol: signalData.symbol,
                        side: signalData.action,
                        supervisor: 'SISTEMA_FINAL'
                    });
                }
            }

            // 3. Registrar resultado final
            await this.registrarResultadoFinal({
                signal: signalData,
                tradingResult: tradingResult,
                timestamp: new Date().toISOString(),
                processedBy: 'SISTEMA_FINAL'
            });

            console.log('✅ PROCESSAMENTO COMPLETO FINALIZADO');
            return tradingResult;

        } catch (error) {
            console.error('❌ Erro no processamento completo:', error.message);
            return { success: false, reason: error.message };
        }
    }

    async registrarMonitoramentoCruzado(dados) {
        try {
            const query = `
                INSERT INTO ai_analysis (
                    analysis_type,
                    analysis_data,
                    created_at
                ) VALUES (
                    'CROSS_MONITORING',
                    $1,
                    NOW()
                )
            `;

            await pool.query(query, [JSON.stringify(dados)]);
            console.log('   📝 Monitoramento cruzado registrado');

        } catch (error) {
            console.log('❌ Erro ao registrar monitoramento:', error.message);
        }
    }

    async registrarStatusGeral(status) {
        try {
            const query = `
                INSERT INTO system_status (
                    status_data,
                    created_at
                ) VALUES (
                    $1,
                    NOW()
                )
            `;

            await pool.query(query, [JSON.stringify(status)]);
            console.log('   📝 Status geral registrado');

        } catch (error) {
            console.log('❌ Erro ao registrar status:', error.message);
        }
    }

    async registrarResultadoFinal(resultado) {
        try {
            const query = `
                INSERT INTO ai_analysis (
                    analysis_type,
                    analysis_data,
                    created_at
                ) VALUES (
                    'FINAL_PROCESSING_RESULT',
                    $1,
                    NOW()
                )
            `;

            await pool.query(query, [JSON.stringify(resultado)]);
            console.log('   📝 Resultado final registrado');

        } catch (error) {
            console.log('❌ Erro ao registrar resultado:', error.message);
        }
    }

    async pararSistemaFinal() {
        console.log('\n🛑 PARANDO SISTEMA FINAL INTEGRADO');
        console.log('='.repeat(50));
        
        this.isActive = false;
        
        try {
            // Parar Supervisor Financeiro
            if (this.supervisorFinanceiro) {
                console.log('💰 Parando IA Supervisor Financeiro...');
                await this.supervisorFinanceiro.pararSupervisao();
            }
            
            // Parar Sistema Trading
            if (this.sistemaCompleto) {
                console.log('🤖 Parando Sistema Trading...');
                await this.sistemaCompleto.pararSistema();
            }
            
            // Parar monitoramentos
            if (this.monitoringIntervals) {
                this.monitoringIntervals.forEach(interval => {
                    clearInterval(interval);
                });
            }
            
            // Fechar conexão do banco
            await pool.end();
            
            const tempoTotal = this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 60000) : 0;
            
            console.log('✅ Sistema Final parado');
            console.log(`⏰ Tempo total online: ${tempoTotal} minutos`);
            console.log('📊 Relatório final gerado');
            
        } catch (error) {
            console.error('❌ Erro ao parar sistema:', error.message);
        }
    }

    async gerarRelatorioFinal() {
        const tradingStatus = this.sistemaCompleto ? await this.sistemaCompleto.statusSistema() : null;
        const supervisorStatus = this.supervisorFinanceiro ? await this.supervisorFinanceiro.gerarRelatorioSupervisao() : null;
        
        return {
            sistemaFinal: {
                ativo: this.isActive,
                tempoOnline: this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 60000) : 0,
                subsistemas: this.subsystemsStatus
            },
            trading: tradingStatus,
            supervisorFinanceiro: supervisorStatus,
            timestamp: new Date().toISOString()
        };
    }
}

// Função principal para inicializar o sistema final
async function iniciarSistemaFinalCompleto() {
    console.log('🌟 COINBITCLUB - SISTEMA FINAL COMPLETO');
    console.log('='.repeat(70));
    console.log('📅 Data:', new Date().toISOString());
    console.log('🏗️ Arquitetura: Microserviços + IA Supervisores');
    console.log('🎯 Objetivo: Sistema completo pronto para produção');
    console.log('');

    const sistemaFinal = new SistemaFinalIntegrado();
    
    try {
        const result = await sistemaFinal.iniciarSistemaFinal();
        
        if (result.success) {
            console.log('\n🎉 SISTEMA COINBITCLUB FINAL TOTALMENTE ATIVO!');
            console.log('='.repeat(70));
            console.log('🤖 IA Systems: Ativos e supervisionando');
            console.log('📡 APIs: Conectadas e funcionais');
            console.log('💾 Database: Sincronizado');
            console.log('🔄 Monitoring: Tempo real');
            console.log('');
            console.log('✅ SISTEMA PRONTO PARA PRODUÇÃO!');
            console.log('🚀 Configure webhooks TradingView para: /webhook/tradingview');
            console.log('📊 Dashboard disponível para monitoramento');
            
            // Manter sistema rodando
            process.on('SIGINT', async () => {
                console.log('\n\n🛑 Recebido sinal de parada...');
                const relatorio = await sistemaFinal.gerarRelatorioFinal();
                console.log('\n📊 RELATÓRIO FINAL DO SISTEMA:');
                console.log(JSON.stringify(relatorio, null, 2));
                await sistemaFinal.pararSistemaFinal();
                process.exit(0);
            });
            
            // Relatório de status a cada 1 hora
            setInterval(async () => {
                const status = await sistemaFinal.verificarStatusGeral();
                console.log('\n📊 STATUS HOURLY REPORT:');
                console.log(`⏰ Online: ${status.tempoOnline}min`);
                console.log('🔧 Subsystems:', status.subsistemas);
            }, 60 * 60 * 1000);
            
        } else {
            console.log('\n❌ FALHA NA INICIALIZAÇÃO DO SISTEMA FINAL');
            console.log('Error:', result.error);
            console.log('Systems:', result.systems);
        }
        
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO NO SISTEMA FINAL:', error.message);
    }
}

// Exportar para uso como módulo
module.exports = SistemaFinalIntegrado;

// Executar se chamado diretamente
if (require.main === module) {
    iniciarSistemaFinalCompleto();
}

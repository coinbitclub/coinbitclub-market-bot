/**
 * 📊 MONITOR EM TEMPO REAL - AMBIENTE DE PRODUÇÃO
 * Monitoramento contínuo do sistema em operação real
 */

const axios = require('axios');

class MonitorTempoReal {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.intervalId = null;
        this.estatisticas = {
            sinaisProcessados: 0,
            operacoesAbertas: 0,
            ciclosCompletos: 0,
            lucroTotal: 0,
            ultimaAtualizacao: null
        };
    }

    async obterStatusCompleto() {
        try {
            const [statusGestores, fearGreed, sinaisRecentes] = await Promise.all([
                axios.get(`${this.baseURL}/api/gestores/status`),
                axios.get(`${this.baseURL}/api/fear-greed/current`),
                axios.get(`${this.baseURL}/api/webhooks/signals/recent?limit=5`)
            ]);

            return {
                gestores: statusGestores.data.gestores,
                sistema: statusGestores.data.sistema,
                fearGreed: fearGreed.data.fear_greed,
                sinaisRecentes: sinaisRecentes.data.signals || []
            };

        } catch (error) {
            console.error('❌ Erro ao obter status:', error.message);
            return null;
        }
    }

    async exibirStatus() {
        const status = await this.obterStatusCompleto();
        if (!status) return;

        // Limpar console
        console.clear();

        console.log('📊 ========================================================');
        console.log('   COINBITCLUB MARKET BOT - MONITOR TEMPO REAL');
        console.log('========================================================');
        console.log(`⏰ ${new Date().toLocaleString('pt-BR')} | 🔄 Atualizando a cada 15s`);
        console.log('========================================================\n');

        // Status dos Gestores
        console.log('🎯 GESTORES AUTOMÁTICOS:');
        console.log('=========================');
        Object.keys(status.gestores).forEach(nome => {
            const gestor = status.gestores[nome];
            const statusIcon = gestor.isRunning ? '🟢' : '🔴';
            const nomeFormatado = nome.replace(/_/g, ' ').toUpperCase();
            
            console.log(`${statusIcon} ${nomeFormatado}: ${gestor.isRunning ? 'ATIVO' : 'INATIVO'}`);
            
            if (gestor.isRunning) {
                if (gestor.sinaisProcessados !== undefined) {
                    console.log(`   📊 Sinais processados: ${gestor.sinaisProcessados}`);
                }
                if (gestor.operacoesAtivas !== undefined) {
                    console.log(`   💼 Operações ativas: ${gestor.operacoesAtivas}`);
                }
                if (gestor.ciclosCompletos !== undefined) {
                    console.log(`   🔄 Ciclos completos: ${gestor.ciclosCompletos}`);
                }
            }
            console.log('');
        });

        // Fear & Greed e Direção de Mercado
        console.log('🎯 ANÁLISE DE MERCADO:');
        console.log('======================');
        console.log(`📊 Fear & Greed: ${status.fearGreed.value} (${status.fearGreed.classificacao_pt})`);
        
        let direcaoIcon = '🔄';
        if (status.fearGreed.direction_allowed === 'LONG_ONLY') direcaoIcon = '📈';
        if (status.fearGreed.direction_allowed === 'SHORT_ONLY') direcaoIcon = '📉';
        
        console.log(`${direcaoIcon} Direction Allowed: ${status.fearGreed.direction_allowed}`);
        console.log(`💡 Recomendação: ${status.fearGreed.trading_recommendation}`);
        console.log(`⏰ Última atualização: ${parseFloat(status.fearGreed.hours_ago).toFixed(1)}h atrás\n`);

        // Sistema Operacional
        console.log('⚡ SISTEMA OPERACIONAL:');
        console.log('=======================');
        console.log(`🔄 Componentes ativos: ${status.sistema.componentes_ativos.length}/4`);
        console.log(`📊 Cobertura: ${status.sistema.fluxo_operacional.cobertura}`);
        console.log(`🎯 Estado atual: ${status.sistema.fluxo_operacional.etapa_atual}`);
        console.log(`💼 Operações ativas: ${status.sistema.fluxo_operacional.operacoes_ativas}`);
        console.log(`🏁 Ciclos completos: ${status.sistema.fluxo_operacional.ciclos_completos}\n`);

        // Sinais Recentes
        console.log('📡 SINAIS RECENTES (últimos 5):');
        console.log('================================');
        if (status.sinaisRecentes.length > 0) {
            status.sinaisRecentes.forEach((sinal, index) => {
                const tempo = new Date(sinal.timestamp || sinal.created_at).toLocaleTimeString('pt-BR');
                const acao = sinal.action || sinal.signal_data?.action || 'N/A';
                const preco = sinal.signal_data?.price || sinal.price || 'N/A';
                
                let acaoIcon = '📊';
                if (acao === 'BUY') acaoIcon = '📈';
                if (acao === 'SELL') acaoIcon = '📉';
                
                console.log(`${acaoIcon} ${index + 1}. ${sinal.symbol} ${acao} - ${tempo} - $${preco}`);
            });
        } else {
            console.log('   📭 Nenhum sinal recente');
        }

        console.log('\n🔄 Próxima atualização em 15 segundos...');
        console.log('========================================================');

        // Atualizar estatísticas internas
        this.estatisticas.ultimaAtualizacao = new Date();
        this.estatisticas.sinaisProcessados = status.sinaisRecentes.length;
    }

    async iniciarMonitoramento() {
        console.log('🚀 Iniciando monitoramento em tempo real...');
        console.log('⏰ Atualizações a cada 15 segundos\n');
        
        // Primeira exibição imediata
        await this.exibirStatus();
        
        // Configurar intervalo de atualização
        this.intervalId = setInterval(async () => {
            await this.exibirStatus();
        }, 15000); // 15 segundos
        
        console.log('✅ Monitor ativo! Pressione Ctrl+C para parar');
    }

    pararMonitoramento() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('\n🛑 Monitoramento parado');
        }
    }

    async verificarAlertas() {
        const status = await this.obterStatusCompleto();
        if (!status) return;

        const alertas = [];

        // Verificar se algum gestor está inativo
        Object.keys(status.gestores).forEach(nome => {
            if (!status.gestores[nome].isRunning) {
                alertas.push(`⚠️ ALERTA: ${nome} está INATIVO`);
            }
        });

        // Verificar se Fear & Greed está muito antigo (> 3 horas)
        if (parseFloat(status.fearGreed.hours_ago) > 3) {
            alertas.push(`⚠️ ALERTA: Fear & Greed desatualizado (${parseFloat(status.fearGreed.hours_ago).toFixed(1)}h)`);
        }

        // Verificar condições extremas de mercado
        if (status.fearGreed.value < 20) {
            alertas.push(`🚨 ALERTA: Medo extremo detectado (${status.fearGreed.value}) - Oportunidade de COMPRA`);
        } else if (status.fearGreed.value > 85) {
            alertas.push(`🚨 ALERTA: Ganância extrema (${status.fearGreed.value}) - Considerar VENDA`);
        }

        if (alertas.length > 0) {
            console.log('\n🚨 ALERTAS DO SISTEMA:');
            console.log('======================');
            alertas.forEach(alerta => console.log(alerta));
        }

        return alertas;
    }

    async monitorComAlertas() {
        await this.iniciarMonitoramento();
        
        // Verificar alertas a cada minuto
        setInterval(async () => {
            await this.verificarAlertas();
        }, 60000); // 1 minuto
    }
}

// Função para monitoramento simples (sem alertas)
async function monitorSimples() {
    const monitor = new MonitorTempoReal();
    await monitor.iniciarMonitoramento();
    
    // Capturar Ctrl+C para parar graciosamente
    process.on('SIGINT', () => {
        monitor.pararMonitoramento();
        console.log('\n👋 Monitor finalizado. Sistema continua rodando em background.');
        process.exit(0);
    });
}

// Função para monitoramento completo (com alertas)
async function monitorCompleto() {
    const monitor = new MonitorTempoReal();
    await monitor.monitorComAlertas();
    
    // Capturar Ctrl+C para parar graciosamente
    process.on('SIGINT', () => {
        monitor.pararMonitoramento();
        console.log('\n👋 Monitor finalizado. Sistema continua rodando em background.');
        process.exit(0);
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--alertas')) {
        console.log('🚀 Iniciando monitor com alertas...');
        monitorCompleto().catch(error => {
            console.error('💥 Erro no monitor:', error);
            process.exit(1);
        });
    } else {
        console.log('🚀 Iniciando monitor simples...');
        monitorSimples().catch(error => {
            console.error('💥 Erro no monitor:', error);
            process.exit(1);
        });
    }
}

module.exports = { MonitorTempoReal, monitorSimples, monitorCompleto };

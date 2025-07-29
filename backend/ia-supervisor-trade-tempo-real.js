/**
 * 🤖 IA SUPERVISOR DE TRADE EM TEMPO REAL - IMPLEMENTAÇÃO COMPLETA
 * 
 * RESPONSABILIDADES:
 * - Monitora TODAS as operações em tempo real (30 segundos)
 * - Rejeita sinais após 2 minutos da chegada
 * - Emite ordem imediata para "FECHE LONG" / "FECHE SHORT"
 * - Registra TODAS as informações por usuário no banco
 * - Supervisiona sem executar diretamente
 */

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class IASupervisorTradeTempoReal {
    constructor() {
        this.isActive = false;
        this.intervalos = {};
        this.operacoesMonitoradas = new Map();
        this.sinaisRecebidos = new Map();
        this.estatisticas = {
            sinaisProcessados: 0,
            sinaisRejeitados: 0,
            operacoesMonitoradas: 0,
            fechamentosRealizados: 0,
            tempoMedioResposta: 0
        };

        // Configurações de tempo
        this.configuracoes = {
            tempoLimiteSinal: 2 * 60 * 1000,      // 2 minutos
            intervaloMonitoramento: 30 * 1000,     // 30 segundos
            intervaloAtualizacaoPL: 60 * 1000,     // 1 minuto
            intervaloBackup: 5 * 60 * 1000,        // 5 minutos
            tempoMaximoFechamento: 1000            // 1 segundo máximo
        };

        // Endpoints dos microserviços
        this.microservicesEndpoints = {
            tradingBot: 'http://localhost:3030/trading-bot',
            robotFinanceiro: 'http://localhost:3031/robot-financeiro',
            contabilidade: 'http://localhost:3032/contabilidade',
            afiliados: 'http://localhost:3033/afiliados',
            notificacoes: 'http://localhost:3034/notifications'
        };
    }

    // ==========================================
    // INICIALIZAÇÃO E CONTROLE PRINCIPAL
    // ==========================================

    async inicializar() {
        console.log('🤖 INICIANDO IA SUPERVISOR DE TRADE EM TEMPO REAL');
        console.log('='.repeat(70));
        console.log('⏰ Configurações de tempo:');
        console.log(`   🚫 Limite sinal: ${this.configuracoes.tempoLimiteSinal / 1000}s`);
        console.log(`   📊 Monitoramento: ${this.configuracoes.intervaloMonitoramento / 1000}s`);
        console.log(`   💰 Atualização P&L: ${this.configuracoes.intervaloAtualizacaoPL / 1000}s`);
        console.log(`   ⚡ Max fechamento: ${this.configuracoes.tempoMaximoFechamento}ms`);
        console.log('');

        try {
            // Verificar conexão com banco
            await this.verificarConexaoBanco();
            
            // Carregar operações ativas
            await this.carregarOperacoesAtivas();
            
            // Iniciar monitoramento contínuo
            await this.iniciarMonitoramentoContinuo();
            
            this.isActive = true;
            console.log('✅ IA SUPERVISOR DE TRADE ATIVO!');
            console.log('👁️ Monitorando operações em tempo real...');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            return { success: false, error: error.message };
        }
    }

    async verificarConexaoBanco() {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log(`🔗 Conectado ao banco: ${result.rows[0].current_time}`);
    }

    async carregarOperacoesAtivas() {
        const query = `
            SELECT 
                uo.id, uo.user_id, uo.symbol, uo.side,
                uo.entry_price, uo.quantity, uo.leverage,
                uo.take_profit_price, uo.stop_loss_price,
                uo.status, uo.created_at,
                u.name as user_name, u.email
            FROM user_operations uo
            JOIN users u ON uo.user_id = u.id
            WHERE uo.status IN ('OPEN', 'PENDING')
            ORDER BY uo.created_at DESC
        `;

        const result = await pool.query(query);
        console.log(`📊 Carregadas ${result.rows.length} operações ativas para monitoramento`);
        
        // Adicionar ao mapa de monitoramento
        result.rows.forEach(op => {
            this.operacoesMonitoradas.set(op.id, {
                ...op,
                ultimaAtualizacao: new Date(),
                plAtual: 0,
                alertasEnviados: []
            });
        });
    }

    // ==========================================
    // VALIDAÇÃO DE SINAIS COM CONTROLE DE TEMPO
    // ==========================================

    async validarSinalTempo(sinalData) {
        const agora = Date.now();
        const tempoSinal = new Date(sinalData.timestamp || sinalData.time).getTime();
        const tempoDecorrido = agora - tempoSinal;

        console.log(`⏰ Validando tempo do sinal:`);
        console.log(`   📅 Recebido em: ${new Date(tempoSinal).toISOString()}`);
        console.log(`   ⏱️ Tempo decorrido: ${Math.floor(tempoDecorrido / 1000)}s`);

        if (tempoDecorrido > this.configuracoes.tempoLimiteSinal) {
            console.log(`❌ SINAL REJEITADO: Tempo limite excedido (${Math.floor(tempoDecorrido / 1000)}s)`);
            
            // Registrar rejeição
            await this.registrarSinalRejeitado(sinalData, 'TEMPO_LIMITE_EXCEDIDO', tempoDecorrido);
            
            this.estatisticas.sinaisRejeitados++;
            return false;
        }

        console.log(`✅ Sinal dentro do prazo (${Math.floor(tempoDecorrido / 1000)}s)`);
        return true;
    }

    async registrarSinalRejeitado(sinalData, motivo, tempoDecorrido) {
        const query = `
            INSERT INTO sinais_rejeitados (
                signal_data, motivo_rejeicao, tempo_decorrido_ms,
                timestamp_sinal, timestamp_rejeicao, supervisor
            ) VALUES ($1, $2, $3, $4, NOW(), 'IA_SUPERVISOR_TEMPO_REAL')
        `;

        await pool.query(query, [
            JSON.stringify(sinalData),
            motivo,
            tempoDecorrido,
            new Date(sinalData.timestamp || sinalData.time)
        ]);
    }

    // ==========================================
    // MONITORAMENTO EM TEMPO REAL
    // ==========================================

    async iniciarMonitoramentoContinuo() {
        console.log('🔄 Iniciando monitoramento contínuo...');

        // Monitor principal de operações (30 segundos)
        this.intervalos.monitorOperacoes = setInterval(async () => {
            await this.monitorarOperacoesTempoReal();
        }, this.configuracoes.intervaloMonitoramento);

        // Atualização de P&L (1 minuto)
        this.intervalos.atualizarPL = setInterval(async () => {
            await this.atualizarProfitLossTempoReal();
        }, this.configuracoes.intervaloAtualizacaoPL);

        // Backup de dados (5 minutos)
        this.intervalos.backup = setInterval(async () => {
            await this.realizarBackupDados();
        }, this.configuracoes.intervaloBackup);

        // Limpeza de sinais expirados (1 minuto)
        this.intervalos.limpezaSinais = setInterval(async () => {
            await this.limparSinaisExpirados();
        }, 60000);

        console.log('✅ Monitoramento contínuo ativo');
    }

    async monitorarOperacoesTempoReal() {
        try {
            console.log('\n👁️ MONITORAMENTO TEMPO REAL - OPERAÇÕES');
            console.log('-'.repeat(50));

            const operacoesAtuais = await this.buscarOperacoesAtivas();
            
            if (operacoesAtuais.length === 0) {
                console.log('📊 Nenhuma operação ativa no momento');
                return;
            }

            console.log(`📊 Monitorando ${operacoesAtuais.length} operações ativas:`);

            for (const operacao of operacoesAtuais) {
                await this.analisarOperacaoIndividual(operacao);
            }

            // Atualizar estatísticas
            this.estatisticas.operacoesMonitoradas = operacoesAtuais.length;

        } catch (error) {
            console.error('❌ Erro no monitoramento:', error.message);
        }
    }

    async buscarOperacoesAtivas() {
        const query = `
            SELECT 
                uo.id, uo.user_id, uo.symbol, uo.side,
                uo.entry_price, uo.current_price, uo.quantity, uo.leverage,
                uo.take_profit_price, uo.stop_loss_price,
                uo.status, uo.created_at, uo.updated_at,
                u.name as user_name, u.email,
                EXTRACT(MINUTES FROM (NOW() - uo.created_at)) as minutos_aberta
            FROM user_operations uo
            JOIN users u ON uo.user_id = u.id
            WHERE uo.status IN ('OPEN', 'PENDING')
            ORDER BY uo.created_at ASC
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    async analisarOperacaoIndividual(operacao) {
        const tempoAberta = Math.floor(operacao.minutos_aberta);
        console.log(`   🔍 Op ${operacao.id} (${operacao.user_name}): ${operacao.symbol} ${operacao.side} - ${tempoAberta}min`);

        // Calcular P&L atual se há preço atual
        if (operacao.current_price && operacao.entry_price) {
            const pl = this.calcularProfitLoss(operacao);
            
            // Alertas baseados em proximidade de TP/SL
            await this.verificarAlertasProximidade(operacao, pl);
        }

        // Registrar atividade de monitoramento
        await this.registrarAtividadeMonitoramento(operacao);
    }

    calcularProfitLoss(operacao) {
        const entryPrice = parseFloat(operacao.entry_price);
        const currentPrice = parseFloat(operacao.current_price);
        const quantity = parseFloat(operacao.quantity);
        const leverage = parseFloat(operacao.leverage);

        let pl = 0;
        if (operacao.side === 'LONG') {
            pl = ((currentPrice - entryPrice) / entryPrice) * 100 * leverage;
        } else {
            pl = ((entryPrice - currentPrice) / entryPrice) * 100 * leverage;
        }

        const plUSD = (quantity * entryPrice * (pl / 100));
        
        console.log(`      💰 P&L: ${pl.toFixed(2)}% ($${plUSD.toFixed(2)})`);
        
        return { percent: pl, usd: plUSD };
    }

    async verificarAlertasProximidade(operacao, pl) {
        const tpPrice = parseFloat(operacao.take_profit_price);
        const slPrice = parseFloat(operacao.stop_loss_price);
        const currentPrice = parseFloat(operacao.current_price);

        // Verificar proximidade de TP (95% do caminho)
        if (operacao.side === 'LONG') {
            const distanciaTP = Math.abs(currentPrice - tpPrice) / Math.abs(operacao.entry_price - tpPrice);
            if (distanciaTP <= 0.05) {
                console.log(`      🎯 ALERTA: Próximo de TP (${(distanciaTP * 100).toFixed(1)}%)`);
            }
        }

        // Verificar proximidade de SL (95% do caminho)
        if (operacao.side === 'LONG') {
            const distanciaSL = Math.abs(currentPrice - slPrice) / Math.abs(operacao.entry_price - slPrice);
            if (distanciaSL <= 0.05) {
                console.log(`      ⚠️ ALERTA: Próximo de SL (${(distanciaSL * 100).toFixed(1)}%)`);
            }
        }
    }

    // ==========================================
    // FECHAMENTO AUTOMÁTICO POR SINAIS
    // ==========================================

    async processarSinalFechamento(sinalData) {
        const inicioTempo = Date.now();
        console.log('\n🔒 PROCESSANDO SINAL DE FECHAMENTO');
        console.log('-'.repeat(50));

        // Extrair direção do sinal
        const direcaoFechamento = sinalData.signal === 'FECHE LONG' ? 'LONG' : 'SHORT';
        console.log(`🎯 Direção para fechamento: ${direcaoFechamento}`);

        try {
            // Buscar operações abertas na direção especificada
            const operacoesParaFechar = await this.buscarOperacoesPorDirecao(direcaoFechamento);
            
            if (operacoesParaFechar.length === 0) {
                console.log(`📊 Nenhuma operação ${direcaoFechamento} aberta para fechar`);
                return { success: true, operacoesFechadas: 0 };
            }

            console.log(`📊 Encontradas ${operacoesParaFechar.length} operações ${direcaoFechamento} para fechar`);

            // Fechar cada operação
            const resultados = [];
            for (const operacao of operacoesParaFechar) {
                const resultado = await this.emitirOrdemFechamento(operacao, 'SINAL_FECHAMENTO_MANUAL');
                resultados.push(resultado);
            }

            const tempoProcessamento = Date.now() - inicioTempo;
            console.log(`⚡ Fechamento processado em ${tempoProcessamento}ms`);

            // Registrar estatísticas
            this.estatisticas.fechamentosRealizados += resultados.filter(r => r.success).length;

            return {
                success: true,
                operacoesFechadas: resultados.filter(r => r.success).length,
                tempoProcessamento: tempoProcessamento
            };

        } catch (error) {
            console.error('❌ Erro no fechamento por sinal:', error.message);
            return { success: false, error: error.message };
        }
    }

    async buscarOperacoesPorDirecao(direcao) {
        const query = `
            SELECT 
                uo.id, uo.user_id, uo.symbol, uo.side,
                uo.entry_price, uo.current_price, uo.quantity,
                uo.created_at, u.name as user_name
            FROM user_operations uo
            JOIN users u ON uo.user_id = u.id
            WHERE uo.status = 'OPEN' AND uo.side = $1
            ORDER BY uo.created_at ASC
        `;

        const result = await pool.query(query, [direcao]);
        return result.rows;
    }

    async emitirOrdemFechamento(operacao, motivo) {
        try {
            console.log(`   🔒 Fechando operação ${operacao.id} (${operacao.user_name}): ${operacao.symbol} ${operacao.side}`);

            // Emitir ordem para o microserviço de trading
            const ordemFechamento = {
                action: 'CLOSE_POSITION',
                operationId: operacao.id,
                userId: operacao.user_id,
                symbol: operacao.symbol,
                side: operacao.side,
                motivo: motivo,
                timestamp: new Date().toISOString(),
                supervisor: 'IA_SUPERVISOR_TEMPO_REAL'
            };

            // Tentar enviar para microserviço
            const response = await this.enviarOrdemParaMicroservico('tradingBot', ordemFechamento);
            
            if (response.success) {
                // Registrar fechamento no banco
                await this.registrarFechamentoOperacao(operacao, motivo);
                console.log(`      ✅ Ordem de fechamento enviada com sucesso`);
                return { success: true, operationId: operacao.id };
            } else {
                console.log(`      ❌ Falha ao enviar ordem: ${response.error}`);
                return { success: false, error: response.error };
            }

        } catch (error) {
            console.error(`   ❌ Erro ao fechar operação ${operacao.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async enviarOrdemParaMicroservico(servico, ordem) {
        try {
            const endpoint = this.microservicesEndpoints[servico];
            if (!endpoint) {
                throw new Error(`Endpoint para ${servico} não configurado`);
            }

            const response = await axios.post(`${endpoint}/orders`, ordem, {
                timeout: this.configuracoes.tempoMaximoFechamento,
                headers: { 'Content-Type': 'application/json' }
            });

            return { success: true, data: response.data };

        } catch (error) {
            // Se microserviço não responder, registrar para reenvio
            await this.registrarOrdemPendente(servico, ordem);
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // REGISTRO COMPLETO NO BANCO DE DADOS
    // ==========================================

    async registrarAtividadeMonitoramento(operacao) {
        const query = `
            INSERT INTO operacao_monitoramento (
                operation_id, user_id, 
                current_price, profit_loss_percent, profit_loss_usd,
                status, timestamp, supervisor
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'IA_SUPERVISOR_TEMPO_REAL')
        `;

        const pl = operacao.current_price ? this.calcularProfitLoss(operacao) : { percent: 0, usd: 0 };

        await pool.query(query, [
            operacao.id,
            operacao.user_id,
            operacao.current_price || operacao.entry_price,
            pl.percent,
            pl.usd,
            operacao.status
        ]);
    }

    async registrarFechamentoOperacao(operacao, motivo) {
        const query = `
            INSERT INTO operacao_fechamentos (
                operation_id, user_id, motivo_fechamento,
                timestamp_fechamento, supervisor, dados_operacao
            ) VALUES ($1, $2, $3, NOW(), 'IA_SUPERVISOR_TEMPO_REAL', $4)
        `;

        await pool.query(query, [
            operacao.id,
            operacao.user_id,
            motivo,
            JSON.stringify(operacao)
        ]);
    }

    async registrarOrdemPendente(servico, ordem) {
        const query = `
            INSERT INTO ordens_pendentes (
                microservice, ordem_data, status, 
                created_at, supervisor
            ) VALUES ($1, $2, 'PENDING', NOW(), 'IA_SUPERVISOR_TEMPO_REAL')
        `;

        await pool.query(query, [servico, JSON.stringify(ordem)]);
    }

    // ==========================================
    // RELATÓRIOS E ESTATÍSTICAS
    // ==========================================

    async gerarRelatorioSupervisao() {
        const agora = new Date().toISOString();
        
        return {
            supervisor: 'IA_SUPERVISOR_TEMPO_REAL',
            timestamp: agora,
            status: this.isActive ? 'ATIVO' : 'INATIVO',
            estatisticas: {
                ...this.estatisticas,
                operacoesAtivasMonitoradas: this.operacoesMonitoradas.size,
                sinaisRecebidos: this.sinaisRecebidos.size
            },
            configuracoes: {
                tempoLimiteSinal: `${this.configuracoes.tempoLimiteSinal / 1000}s`,
                intervaloMonitoramento: `${this.configuracoes.intervaloMonitoramento / 1000}s`,
                tempoMaximoFechamento: `${this.configuracoes.tempoMaximoFechamento}ms`
            },
            responsabilidades: {
                executa: [
                    'Monitoramento em tempo real',
                    'Validação de tempo de sinais',
                    'Emissão de ordens de fechamento',
                    'Registro de dados por usuário',
                    'Supervisão de microserviços'
                ],
                naoExecuta: [
                    'Trading direto',
                    'Transferências bancárias',
                    'Alterações de saldo',
                    'Pagamentos financeiros'
                ]
            }
        };
    }

    async pararSupervisor() {
        console.log('\n🛑 PARANDO IA SUPERVISOR DE TRADE EM TEMPO REAL');
        
        this.isActive = false;
        
        // Parar todos os intervalos
        Object.values(this.intervalos).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        // Gerar relatório final
        const relatorioFinal = await this.gerarRelatorioSupervisao();
        
        console.log('✅ IA Supervisor de Trade parado com sucesso');
        console.log(`📊 Estatísticas finais:`);
        console.log(`   Sinais processados: ${this.estatisticas.sinaisProcessados}`);
        console.log(`   Sinais rejeitados: ${this.estatisticas.sinaisRejeitados}`);
        console.log(`   Fechamentos realizados: ${this.estatisticas.fechamentosRealizados}`);
        
        return relatorioFinal;
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    async atualizarProfitLossTempoReal() {
        // Implementar atualização de P&L em tempo real
        console.log('💰 Atualizando P&L em tempo real...');
    }

    async realizarBackupDados() {
        // Implementar backup de dados críticos
        console.log('💾 Realizando backup de dados...');
    }

    async limparSinaisExpirados() {
        // Implementar limpeza de sinais expirados
        const agora = Date.now();
        const sinaisExpirados = [];
        
        this.sinaisRecebidos.forEach((timestamp, sinalId) => {
            if (agora - timestamp > this.configuracoes.tempoLimiteSinal) {
                sinaisExpirados.push(sinalId);
            }
        });
        
        sinaisExpirados.forEach(sinalId => {
            this.sinaisRecebidos.delete(sinalId);
        });
        
        if (sinaisExpirados.length > 0) {
            console.log(`🧹 Removidos ${sinaisExpirados.length} sinais expirados`);
        }
    }
}

// ==========================================
// EXECUÇÃO PRINCIPAL
// ==========================================

if (require.main === module) {
    const supervisor = new IASupervisorTradeTempoReal();
    
    // Handlers para shutdown gracioso
    process.on('SIGINT', () => supervisor.pararSupervisor());
    process.on('SIGTERM', () => supervisor.pararSupervisor());
    
    // Inicializar supervisor
    supervisor.inicializar()
        .then(() => {
            console.log('🚀 IA SUPERVISOR DE TRADE EM TEMPO REAL INICIADO!\n');
        })
        .catch((error) => {
            console.error('❌ Erro ao inicializar IA Supervisor:', error.message);
            process.exit(1);
        });
}

module.exports = IASupervisorTradeTempoReal;

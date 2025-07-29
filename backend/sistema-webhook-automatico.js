/**
 * 🚀 SISTEMA WEBHOOK SIMPLIFICADO - FUNCIONAMENTO GARANTIDO
 * ==========================================================
 * Sistema que EFETIVAMENTE abre operações automaticamente
 * Integrado com Fear & Greed + TradingView
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const MonitorInteligenteOperacoes = require('./monitor-inteligente-operacoes.js');
const fearGreedService = new (require('./fear-greed-integration.js'))();
const { calcularComissaoAutomatica } = require('./gestor-comissionamento-final.js');

const app = express();
const PORT = 3000;

// Configuração do banco
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ===============================================
// SISTEMA DE LOG
// ===============================================
const log = {
    info: (msg, data = {}) => console.log(`ℹ️ [${new Date().toLocaleString('pt-BR')}] ${msg}`, data),
    success: (msg, data = {}) => console.log(`✅ [${new Date().toLocaleString('pt-BR')}] ${msg}`, data),
    error: (msg, data = {}) => console.error(`❌ [${new Date().toLocaleString('pt-BR')}] ${msg}`, data),
    trade: (msg, data = {}) => console.log(`💰 [${new Date().toLocaleString('pt-BR')}] TRADE: ${msg}`, data)
};

// ===============================================
// CLASSE PRINCIPAL DO SISTEMA
// ===============================================
class SistemaAutomaticoSimplificado {
    constructor() {
        this.estatisticas = {
            sinaisRecebidos: 0,
            operacoesAbertas: 0,
            sinaisRejeitados: 0,
            iniciadoEm: new Date()
        };
        
        // Integração com Monitor Inteligente
        this.monitor = new MonitorInteligenteOperacoes();
    }

    async abrirOperacaoAutomatica(sinal, usuarioId = 12) { // ID da Paloma correto
        try {
            log.trade('🔄 Processando abertura automática...', { sinal: sinal.action, par: sinal.ticker });

            // 1. VERIFICAR FEAR & GREED
            let fearGeed;
            try {
                fearGeed = await fearGreedService.obterIndice();
            } catch (error) {
                log.error('Erro no Fear & Greed, usando fallback:', error.message);
                fearGeed = { valor: 50, categoria: 'Neutral', fonte: 'Fallback' };
            }
            const direcaoPermitida = this.validarDirecaoComFearGreed(sinal.action, fearGeed.valor);

            if (!direcaoPermitida) {
                log.error(`❌ Sinal rejeitado - Fear & Greed: ${fearGeed.valor}`, { 
                    sinal: sinal.action, 
                    fearGreed: fearGeed.valor 
                });
                this.estatisticas.sinaisRejeitados++;
                return { success: false, motivo: 'Fear & Greed não permite esta direção' };
            }

            // 2. DETERMINAR TIPO DA OPERAÇÃO
            const tipoOperacao = sinal.action.includes('LONG') ? 'LONG' : 
                                sinal.action.includes('SHORT') ? 'SHORT' : null;

            if (!tipoOperacao) {
                log.error('❌ Tipo de operação inválido:', sinal.action);
                return { success: false, motivo: 'Tipo de operação não reconhecido' };
            }

            // 3. CALCULAR VALOR DA OPERAÇÃO (5% do saldo)
            const saldoQuery = `SELECT balance_usd FROM users WHERE id = $1`;
            const saldoResult = await pool.query(saldoQuery, [usuarioId]);
            const saldoAtual = parseFloat(saldoResult.rows[0]?.balance_usd) || 500;
            const valorOperacao = saldoAtual * 0.05; // 5% do saldo

            // 4. INSERIR OPERAÇÃO
            const insertQuery = `
                INSERT INTO user_operations (
                    user_id, operation_type, symbol, entry_price, 
                    amount, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id
            `;

            const operacaoResult = await pool.query(insertQuery, [
                usuarioId,                    // user_id
                tipoOperacao,                 // operation_type  
                sinal.ticker,                 // symbol
                sinal.price,                  // entry_price
                valorOperacao,                // amount
                'active'                      // status
            ]);

            const operacaoId = operacaoResult.rows[0].id;

            // 5. REGISTRAR NO MONITOR INTELIGENTE
            await this.monitor.carregarOperacoesAtivas();

            // 6. REGISTRAR ESTATÍSTICAS
            this.estatisticas.operacoesAbertas++;

            log.trade('✅ OPERAÇÃO ABERTA COM SUCESSO!', {
                id: operacaoId,
                tipo: tipoOperacao,
                par: sinal.ticker,
                valor: valorOperacao,
                fearGreed: fearGeed.valor
            });

            return {
                success: true,
                operacaoId: operacaoId,
                tipo: tipoOperacao,
                valor: valorOperacao,
                fearGreed: fearGeed.valor
            };

        } catch (error) {
            log.error('Erro ao abrir operação automática:', error);
            return { success: false, erro: error.message };
        }
    }

    validarDirecaoComFearGreed(acao, indice) {
        // Lógica Fear & Greed:
        // 0-25: Extreme Fear (só LONG)
        // 26-45: Fear (só LONG) 
        // 46-54: Neutral (ambos)
        // 55-75: Greed (só SHORT)
        // 76-100: Extreme Greed (só SHORT)

        const isLong = acao.includes('LONG');
        const isShort = acao.includes('SHORT');

        if (indice <= 45) {
            return isLong; // Só permite LONG em fear
        } else if (indice >= 55) {
            return isShort; // Só permite SHORT em greed
        } else {
            return true; // Zona neutra permite ambos
        }
    }

    async fecharOperacao(sinal, usuarioId = 12) {
        try {
            log.trade('🔄 Processando fechamento automático...', { sinal: sinal.action });

            // USAR MONITOR INTELIGENTE PARA FECHAMENTO
            const resultado = await this.monitor.processarSinalFechamento(sinal);
            
            if (resultado.success) {
                this.estatisticas.operacoesFechadas = (this.estatisticas.operacoesFechadas || 0) + resultado.operacoesFechadas;
                
                log.trade('✅ OPERAÇÕES FECHADAS COM SUCESSO!', {
                    quantidade: resultado.operacoesFechadas,
                    tipo: resultado.tipo
                });

                // ===============================================
                // 💰 PROCESSAR COMISSÕES AUTOMATICAMENTE
                // ===============================================
                if (resultado.operacoesFechadas > 0 && resultado.operacoes) {
                    for (const operacao of resultado.operacoes) {
                        await this.processarComissaoOperacao(operacao);
                    }
                }
            }
            
            return resultado;

        } catch (error) {
            log.error('Erro ao fechar operação:', error);
            return { success: false, erro: error.message };
        }
    }

    /**
     * 💰 PROCESSAMENTO AUTOMÁTICO DE COMISSÕES
     */
    async processarComissaoOperacao(operacao) {
        try {
            // Verificar se houve lucro
            const pnl = parseFloat(operacao.pnl || 0);
            
            if (pnl > 0) {
                log.info('💰 Calculando comissão para operação lucrativa', {
                    operacaoId: operacao.id,
                    pnl: pnl,
                    userId: operacao.user_id
                });
                
                const resultadoComissao = await calcularComissaoAutomatica(
                    operacao.id, 
                    pnl, 
                    operacao.user_id
                );
                
                if (resultadoComissao.sucesso) {
                    log.success('✅ Comissão processada:', {
                        valor: resultadoComissao.comissaoUSD,
                        percentual: resultadoComissao.percentual,
                        tipo: resultadoComissao.tipoReceita,
                        plano: resultadoComissao.plano
                    });
                    
                    // Atualizar saldo do usuário
                    await pool.query(`
                        UPDATE user_balances 
                        SET 
                            balance = balance + $1,
                            updated_at = NOW()
                        WHERE user_id = $2
                    `, [resultadoComissao.comissaoUSD, operacao.user_id]);
                    
                    log.success('💳 Saldo atualizado com comissão');
                    
                } else {
                    log.error('❌ Erro ao calcular comissão:', resultadoComissao.erro);
                }
            } else {
                log.info('⚠️ Operação sem lucro, não há comissão');
            }
            
        } catch (error) {
            log.error('💥 Erro no processamento de comissão:', error.message);
        }
    }
}

// ===============================================
// INSTANCIAR SISTEMA
// ===============================================
const sistema = new SistemaAutomaticoSimplificado();

// ===============================================
// ROTAS DA API
// ===============================================

// WEBHOOK PRINCIPAL
app.post('/webhook/tradingview', async (req, res) => {
    try {
        const sinal = req.body;
        sistema.estatisticas.sinaisRecebidos++;

        log.trade('🔔 SINAL RECEBIDO', {
            action: sinal.action,
            ticker: sinal.ticker,
            price: sinal.price
        });

        let resultado;

        // Determinar tipo de ação
        if (sinal.action.includes('SINAL LONG') || sinal.action.includes('SINAL SHORT')) {
            // ABERTURA DE OPERAÇÃO
            resultado = await sistema.abrirOperacaoAutomatica(sinal);
        } else if (sinal.action.includes('FECHE LONG') || sinal.action.includes('FECHE SHORT')) {
            // FECHAMENTO DE OPERAÇÃO
            resultado = await sistema.fecharOperacao(sinal);
        } else {
            log.error('❌ Tipo de sinal não reconhecido:', sinal.action);
            return res.status(400).json({ success: false, erro: 'Tipo de sinal não reconhecido' });
        }

        res.json({
            success: resultado.success,
            resultado: resultado,
            estatisticas: sistema.estatisticas,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log.error('Erro no webhook:', error);
        res.status(500).json({ success: false, erro: error.message });
    }
});

// STATUS DO SISTEMA
app.get('/status', async (req, res) => {
    try {
        let fearGreed;
        try {
            fearGreed = await fearGreedService.obterIndice();
        } catch (error) {
            // Fallback se Fear & Greed falhar
            fearGreed = { valor: 50, categoria: 'Neutral', fonte: 'Fallback' };
        }
        
        res.json({
            status: 'ATIVO',
            sistema: 'Webhook Automatico Simplificado',
            fearGreed: fearGreed,
            estatisticas: sistema.estatisticas,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// DASHBOARD PALOMA
app.get('/api/dashboard/paloma', async (req, res) => {
    try {
        // Buscar dados da Paloma (user_id = 12)
        const usuarioQuery = `
            SELECT * FROM users WHERE id = 12
        `;
        
        const operacoesQuery = `
            SELECT *, 
                EXTRACT(EPOCH FROM (NOW() - created_at))/60 as duracao_minutos
            FROM user_operations 
            WHERE user_id = 12 AND status = 'active'
            ORDER BY created_at DESC
        `;

        const [usuarioResult, operacoesResult] = await Promise.all([
            pool.query(usuarioQuery),
            pool.query(operacoesQuery)
        ]);

        const usuario = usuarioResult.rows[0];
        const operacoes = operacoesResult.rows;

        res.json({
            usuario: {
                nome: usuario?.name || 'PALOMA AMARAL',
                email: usuario?.email || 'pamaral15@hotmail.com',
                saldo: parseFloat(usuario?.balance_usd) || 500.00
            },
            operacoes: operacoes,
            desempenho: {
                operacoesAtivas: operacoes.length,
                plTotal: operacoes.reduce((acc, op) => acc + (parseFloat(op.current_pl) || 0), 0)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log.error('Erro no dashboard:', error);
        res.status(500).json({ erro: error.message });
    }
});

// RELATÓRIO DO MONITOR INTELIGENTE
app.get('/api/monitor/relatorio', async (req, res) => {
    try {
        const relatorio = await sistema.monitor.obterRelatorioCompleto();
        res.json(relatorio);
    } catch (error) {
        log.error('Erro ao obter relatório do monitor:', error);
        res.status(500).json({ erro: error.message });
    }
});

// ESTATÍSTICAS DO MONITOR
app.get('/api/monitor/stats', async (req, res) => {
    try {
        const stats = sistema.monitor.obterEstatisticas();
        res.json(stats);
    } catch (error) {
        log.error('Erro ao obter estatísticas do monitor:', error);
        res.status(500).json({ erro: error.message });
    }
});

// ===============================================
// INICIALIZAR SERVIDOR
// ===============================================
app.listen(PORT, async () => {
    console.log(`
🚀 SISTEMA WEBHOOK AUTOMÁTICO ATIVO!
====================================
🌐 Servidor: http://localhost:${PORT}
🔔 Webhook: http://localhost:${PORT}/webhook/tradingview
📊 Status: http://localhost:${PORT}/status
💰 Dashboard: http://localhost:${PORT}/api/dashboard/paloma

✅ PRONTO PARA RECEBER SINAIS DO TRADINGVIEW!
`);
    
    log.success('Sistema Webhook Automático iniciado com sucesso!');
    
    // Iniciar Monitor Inteligente
    try {
        await sistema.monitor.iniciarMonitoramento();
        log.success('🎯 Monitor Inteligente integrado e ativo!');
    } catch (error) {
        log.error('Erro ao iniciar Monitor Inteligente:', error);
    }
});

module.exports = sistema;

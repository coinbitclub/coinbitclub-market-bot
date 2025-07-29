/**
 * ⚡ ORDER EXECUTOR INTEGRADO COM GESTOR DE OPERAÇÕES
 */
const exchangeManager = require('../services/exchangeManager');
const GestorOperacoes = require('../../gestor-operacoes-completo');
const { Pool } = require('pg');

class OrderExecutor {
    constructor() {
        this.executedOrders = [];
        this.gestorOperacoes = new GestorOperacoes();
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Iniciar monitoramento de operações
        this.gestorOperacoes.iniciarMonitoramento();
        console.log('✅ Gestor de Operações integrado e monitoramento ativo');
    }

    async processSignal(signal) {
        console.log('📡 Processando sinal para operações reais:', signal);
        
        try {
            // Buscar usuários ativos que têm chaves configuradas
            const usuariosAtivos = await this.buscarUsuariosAtivos();
            const results = [];

            if (usuariosAtivos.length === 0) {
                console.log('⚠️ Nenhum usuário ativo encontrado para processar o sinal');
                return { 
                    success: true, 
                    message: 'Sinal recebido mas nenhum usuário ativo',
                    results: [] 
                };
            }

            for (const usuario of usuariosAtivos) {
                try {
                    // Usar o Gestor de Operações para abertura inteligente
                    const resultado = await this.gestorOperacoes.abrirOperacao(signal, usuario.id);
                    
                    results.push({
                        user_id: usuario.id,
                        username: usuario.username,
                        success: resultado.sucesso,
                        operacao_id: resultado.operacao_id,
                        quantidade: resultado.quantidade,
                        exchanges: resultado.resultados_exchanges?.length || 0,
                        stop_loss: resultado.stop_loss,
                        take_profit: resultado.take_profit
                    });

                    console.log(`✅ Operação aberta para usuário ${usuario.username}:`, {
                        operacao_id: resultado.operacao_id,
                        symbol: signal.symbol,
                        quantidade: resultado.quantidade
                    });

                } catch (error) {
                    console.error(`❌ Erro ao processar sinal para usuário ${usuario.username}:`, error.message);
                    
                    results.push({
                        user_id: usuario.id,
                        username: usuario.username,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Salvar log do sinal processado
            await this.salvarLogSinal(signal, results);

            // Estatísticas do processamento
            const sucessos = results.filter(r => r.success).length;
            const falhas = results.filter(r => !r.success).length;

            this.executedOrders.push({ 
                signal, 
                results, 
                executedAt: new Date().toISOString(),
                stats: { sucessos, falhas, total: results.length }
            });

            console.log(`📊 Sinal processado: ${sucessos} sucessos, ${falhas} falhas de ${results.length} usuários`);

            return { 
                success: true, 
                message: `Sinal processado para ${results.length} usuários`,
                stats: { sucessos, falhas, total: results.length },
                results 
            };

        } catch (error) {
            console.error('❌ Erro grave no processamento do sinal:', error.message);
            
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    async buscarUsuariosAtivos() {
        const client = await this.pool.connect();
        try {
            // Buscar usuários que têm chaves de API ativas
            const usuarios = await client.query(`
                SELECT DISTINCT u.id, u.username, u.email
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE u.status = 'active' 
                AND u.role != 'admin'
                AND uak.status = 'active'
                ORDER BY u.created_at DESC;
            `);

            return usuarios.rows;

        } catch (error) {
            console.error('Erro ao buscar usuários ativos:', error.message);
            return [];
        } finally {
            client.release();
        }
    }

    async salvarLogSinal(signal, results) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO trading_signals_log (
                    signal_data, processing_results, processed_at,
                    total_users, successful_operations, failed_operations
                ) VALUES ($1, $2, NOW(), $3, $4, $5);
            `, [
                JSON.stringify(signal),
                JSON.stringify(results),
                results.length,
                results.filter(r => r.success).length,
                results.filter(r => !r.success).length
            ]);

        } catch (error) {
            console.error('Erro ao salvar log do sinal:', error.message);
        } finally {
            client.release();
        }
    }

    // Métodos para controle manual de operações
    async encerrarOperacao(operacaoId, motivo = 'manual') {
        try {
            const resultado = await this.gestorOperacoes.encerrarOperacao(operacaoId, motivo);
            console.log(`✅ Operação ${operacaoId} encerrada manualmente:`, resultado);
            return resultado;
        } catch (error) {
            console.error(`❌ Erro ao encerrar operação ${operacaoId}:`, error.message);
            throw error;
        }
    }

    async listarOperacoesAbertas() {
        const client = await this.pool.connect();
        try {
            const operacoes = await client.query(`
                SELECT 
                    uo.id, uo.user_id, uo.symbol, uo.side, 
                    uo.quantity, uo.entry_price, uo.stop_loss, 
                    uo.take_profit, uo.created_at,
                    u.username
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.status = 'open'
                ORDER BY uo.created_at DESC;
            `);

            return operacoes.rows;

        } catch (error) {
            console.error('Erro ao listar operações abertas:', error.message);
            return [];
        } finally {
            client.release();
        }
    }

    async obterEstatisticas() {
        try {
            const relatorio = await this.gestorOperacoes.gerarRelatorioCompleto();
            return {
                gestor_operacoes: this.gestorOperacoes.estatisticas,
                relatorio_completo: relatorio,
                sinais_processados: this.executedOrders.length,
                ultima_atualizacao: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    // Método para parar o monitoramento (cleanup)
    async parar() {
        if (this.gestorOperacoes && this.gestorOperacoes.monitoramento) {
            clearInterval(this.gestorOperacoes.monitoramento);
            console.log('🛑 Monitoramento de operações parado');
        }
        await this.pool.end();
    }
}

const orderExecutor = new OrderExecutor();

// Cleanup graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Parando Order Executor...');
    await orderExecutor.parar();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Parando Order Executor...');
    await orderExecutor.parar();
    process.exit(0);
});

module.exports = orderExecutor;
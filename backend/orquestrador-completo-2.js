/**
 * 🎯 ORQUESTRADOR COMPLETO V2 - COINBITCLUB MARKET BOT V3.0.0
 * Orquestração avançada e coordenação inteligente do sistema
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🎯 ORQUESTRADOR COMPLETO V2 - Iniciando...');

class OrquestradorCompleto {
    constructor() {
        this.orchestrationCount = 0;
        this.errorCount = 0;
        this.lastOrchestration = null;
        this.systemHealth = {
            database: true,
            apis: true,
            processing: true
        };
    }

    // Coordenar processamento de operações pendentes
    async coordenarOperacoesPendentes() {
        console.log('\n🔄 Coordenando operações pendentes...');

        try {
            // Buscar operações pendentes que precisam de processamento
            const operacoesPendentes = await pool.query(`
                SELECT 
                    uo.id, uo.user_id, uo.symbol, uo.side, uo.quantity,
                    uo.entry_price, uo.status, uo.order_link_id, uo.created_at,
                    u.name as user_name, u.is_active as user_active,
                    k.api_key, k.secret_key, k.is_active as api_active,
                    EXTRACT(EPOCH FROM (NOW() - uo.created_at)) as age_seconds
                FROM user_operations uo
                INNER JOIN users u ON uo.user_id = u.id
                INNER JOIN user_api_keys k ON u.id = k.user_id
                WHERE uo.status IN ('pending', 'partially_filled')
                AND u.is_active = true
                AND k.is_active = true
                AND uo.created_at > NOW() - INTERVAL '24 hours'
                ORDER BY uo.created_at ASC
                LIMIT 20
            `);

            const operacoes = operacoesPendentes.rows;

            if (operacoes.length === 0) {
                console.log('✅ Nenhuma operação pendente encontrada');
                return { processed: 0, errors: 0 };
            }

            console.log(`📊 ${operacoes.length} operações pendentes encontradas`);

            let processed = 0;
            let errors = 0;

            for (const operacao of operacoes) {
                try {
                    await this.processarOperacaoIndividual(operacao);
                    processed++;
                } catch (error) {
                    console.error(`❌ Erro ao processar operação ${operacao.id}:`, error.message);
                    errors++;
                }

                // Delay para evitar sobrecarga
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return { processed, errors };

        } catch (error) {
            console.error('❌ Erro na coordenação:', error.message);
            this.errorCount++;
            return { processed: 0, errors: 1 };
        }
    }

    async processarOperacaoIndividual(operacao) {
        console.log(`🔄 Processando operação ${operacao.id} - ${operacao.user_name}`);
        console.log(`📈 ${operacao.symbol} ${operacao.side} ${operacao.quantity}`);

        try {
            // Simular verificação de status na Bybit
            const statusAtualizado = await this.verificarStatusBybit(operacao);

            if (statusAtualizado) {
                // Atualizar status da operação
                await pool.query(`
                    UPDATE user_operations 
                    SET status = $1,
                        current_price = $2,
                        updated_at = NOW(),
                        last_check = NOW()
                    WHERE id = $3
                `, [statusAtualizado.status, statusAtualizado.current_price, operacao.id]);

                console.log(`✅ Operação ${operacao.id} atualizada: ${statusAtualizado.status}`);
            }

        } catch (error) {
            console.error(`❌ Erro ao processar operação ${operacao.id}:`, error.message);
            
            // Marcar operação com erro
            await pool.query(`
                UPDATE user_operations 
                SET processing_error = $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [error.message, operacao.id]);

            throw error;
        }
    }

    async verificarStatusBybit(operacao) {
        // Simulação de verificação na Bybit
        // Em produção, aqui faria chamada real para API Bybit
        
        const statusPossíveis = ['active', 'filled', 'cancelled', 'rejected'];
        const precoAtual = operacao.entry_price * (0.98 + Math.random() * 0.04); // Variação de ±2%

        // Simular status baseado na idade da operação
        const ageMinutes = (Date.now() - new Date(operacao.created_at).getTime()) / (1000 * 60);
        
        let novoStatus;
        if (ageMinutes > 30) {
            novoStatus = Math.random() > 0.7 ? 'filled' : 'active';
        } else {
            novoStatus = 'active';
        }

        return {
            status: novoStatus,
            current_price: precoAtual
        };
    }

    // Coordenar limpeza de dados antigos
    async coordenarLimpezaDados() {
        console.log('\n🧹 Coordenando limpeza de dados antigos...');

        try {
            let limpezas = 0;

            // Limpar sinais antigos processados (mais de 7 dias)
            const sinaisLimpeza = await pool.query(`
                DELETE FROM trading_signals 
                WHERE processed = true 
                AND created_at < NOW() - INTERVAL '7 days'
            `);

            if (sinaisLimpeza.rowCount > 0) {
                console.log(`🗑️ ${sinaisLimpeza.rowCount} sinais antigos removidos`);
                limpezas += sinaisLimpeza.rowCount;
            }

            // Limpar operações concluídas antigas (mais de 30 dias)
            const operacoesLimpeza = await pool.query(`
                DELETE FROM user_operations 
                WHERE status IN ('filled', 'cancelled', 'rejected')
                AND created_at < NOW() - INTERVAL '30 days'
            `);

            if (operacoesLimpeza.rowCount > 0) {
                console.log(`🗑️ ${operacoesLimpeza.rowCount} operações antigas removidas`);
                limpezas += operacoesLimpeza.rowCount;
            }

            return limpezas;

        } catch (error) {
            console.error('❌ Erro na limpeza de dados:', error.message);
            return 0;
        }
    }

    // Coordenar otimização de performance
    async coordenarOtimizacao() {
        console.log('\n⚡ Coordenando otimização de performance...');

        try {
            // Atualizar estatísticas das tabelas
            await pool.query('ANALYZE trading_signals, user_operations, users, user_api_keys');
            
            // Verificar saúde dos índices
            const indexHealth = await pool.query(`
                SELECT 
                    schemaname, tablename, indexname, 
                    idx_tup_read, idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE schemaname = 'public'
                ORDER BY idx_tup_read DESC
                LIMIT 10
            `);

            console.log(`📊 ${indexHealth.rows.length} índices verificados`);

            return true;

        } catch (error) {
            console.error('❌ Erro na otimização:', error.message);
            return false;
        }
    }

    // Coordenar sincronização entre componentes
    async coordenarSincronizacao() {
        console.log('\n🔄 Coordenando sincronização entre componentes...');

        try {
            // Verificar se todos os componentes estão sincronizados
            const componentStatus = await this.verificarStatusComponentes();
            
            if (componentStatus.allSynced) {
                console.log('✅ Todos os componentes sincronizados');
            } else {
                console.log('⚠️ Alguns componentes precisam de sincronização');
                await this.sincronizarComponentes(componentStatus.needsSync);
            }

            return componentStatus;

        } catch (error) {
            console.error('❌ Erro na sincronização:', error.message);
            return { allSynced: false, error: error.message };
        }
    }

    async verificarStatusComponentes() {
        try {
            // Verificar última atividade de cada componente
            const signalsActivity = await pool.query(`
                SELECT MAX(created_at) as last_activity 
                FROM trading_signals 
                WHERE created_at > NOW() - INTERVAL '1 hour'
            `);

            const operationsActivity = await pool.query(`
                SELECT MAX(updated_at) as last_activity 
                FROM user_operations 
                WHERE updated_at > NOW() - INTERVAL '1 hour'
            `);

            const keysActivity = await pool.query(`
                SELECT MAX(last_validated) as last_activity 
                FROM user_api_keys 
                WHERE last_validated > NOW() - INTERVAL '6 hours'
            `);

            const needsSync = [];
            
            if (!signalsActivity.rows[0].last_activity) {
                needsSync.push('signals_processor');
            }
            
            if (!operationsActivity.rows[0].last_activity) {
                needsSync.push('operations_manager');
            }
            
            if (!keysActivity.rows[0].last_activity) {
                needsSync.push('api_keys_validator');
            }

            return {
                allSynced: needsSync.length === 0,
                needsSync: needsSync,
                lastChecked: new Date()
            };

        } catch (error) {
            console.error('❌ Erro ao verificar status dos componentes:', error.message);
            return { allSynced: false, needsSync: [], error: error.message };
        }
    }

    async sincronizarComponentes(needsSync) {
        console.log(`🔄 Sincronizando componentes: ${needsSync.join(', ')}`);

        for (const component of needsSync) {
            try {
                switch (component) {
                    case 'signals_processor':
                        // Trigger para reprocessar sinais pendentes
                        await pool.query(`
                            UPDATE trading_signals 
                            SET processing_status = 'pending' 
                            WHERE processed = false
                        `);
                        break;

                    case 'operations_manager':
                        // Trigger para atualizar operações ativas
                        await pool.query(`
                            UPDATE user_operations 
                            SET updated_at = NOW() 
                            WHERE status IN ('active', 'pending')
                        `);
                        break;

                    case 'api_keys_validator':
                        // Trigger para revalidar chaves API
                        await pool.query(`
                            UPDATE user_api_keys 
                            SET last_validated = NULL 
                            WHERE is_active = true
                        `);
                        break;
                }

                console.log(`✅ Componente ${component} sincronizado`);

            } catch (error) {
                console.error(`❌ Erro ao sincronizar ${component}:`, error.message);
            }
        }
    }

    async obterEstatisticasOrquestracao() {
        try {
            const stats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM trading_signals) as total_signals,
                    (SELECT COUNT(*) FROM user_operations) as total_operations,
                    (SELECT COUNT(*) FROM user_operations WHERE status = 'active') as active_operations,
                    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
                    (SELECT COUNT(*) FROM user_api_keys WHERE is_active = true) as active_api_keys
            `);

            return stats.rows[0];

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    async executarCicloOrquestracao() {
        console.log(`\n🎯 Ciclo de orquestração iniciado - ${new Date().toISOString()}`);
        
        try {
            // 1. Coordenar operações pendentes
            const operacaoResult = await this.coordenarOperacoesPendentes();
            
            // 2. Coordenar sincronização
            const syncResult = await this.coordenarSincronizacao();
            
            // 3. Coordenar limpeza (a cada 10 ciclos)
            let limpezaResult = 0;
            if (this.orchestrationCount % 10 === 0) {
                limpezaResult = await this.coordenarLimpezaDados();
            }
            
            // 4. Coordenar otimização (a cada 20 ciclos)
            let otimizacaoResult = false;
            if (this.orchestrationCount % 20 === 0) {
                otimizacaoResult = await this.coordenarOtimizacao();
            }

            const stats = await this.obterEstatisticasOrquestracao();
            
            console.log('\n📊 RESULTADOS DA ORQUESTRAÇÃO:');
            console.log(`   Operações processadas: ${operacaoResult.processed}`);
            console.log(`   Erros de operação: ${operacaoResult.errors}`);
            console.log(`   Componentes sincronizados: ${syncResult.allSynced ? 'Sim' : 'Não'}`);
            if (limpezaResult > 0) console.log(`   Registros limpos: ${limpezaResult}`);
            if (otimizacaoResult) console.log(`   Otimização executada: Sim`);
            
            if (stats) {
                console.log('\n📈 ESTATÍSTICAS DO SISTEMA:');
                console.log(`   Total de sinais: ${stats.total_signals}`);
                console.log(`   Total de operações: ${stats.total_operations}`);
                console.log(`   Operações ativas: ${stats.active_operations}`);
                console.log(`   Usuários ativos: ${stats.active_users}`);
                console.log(`   Chaves API ativas: ${stats.active_api_keys}`);
            }

            this.orchestrationCount++;
            this.lastOrchestration = new Date();

            console.log(`✅ Ciclo ${this.orchestrationCount} concluído com sucesso`);

        } catch (error) {
            console.error('❌ Erro no ciclo de orquestração:', error.message);
            this.errorCount++;
        }
    }

    async iniciar() {
        console.log('🚀 Orquestrador Completo V2 iniciado');
        console.log('⏰ Orquestração a cada 30 segundos');
        
        // Executar primeiro ciclo
        await this.executarCicloOrquestracao();
        
        // Configurar interval de 30 segundos
        setInterval(() => {
            this.executarCicloOrquestracao();
        }, 30000);
    }

    // Método para orquestração manual
    async orquestrarAgora() {
        console.log('🔄 Orquestração manual iniciada...');
        await this.executarCicloOrquestracao();
    }

    // Método para verificar saúde geral do sistema
    async verificarSaudeGeral() {
        try {
            const health = {
                database: true,
                components: await this.verificarStatusComponentes(),
                statistics: await this.obterEstatisticasOrquestracao(),
                lastOrchestration: this.lastOrchestration,
                orchestrationCount: this.orchestrationCount,
                errorCount: this.errorCount
            };

            return health;

        } catch (error) {
            console.error('❌ Erro ao verificar saúde geral:', error.message);
            return { database: false, error: error.message };
        }
    }
}

// Inicializar orquestrador
const orquestrador = new OrquestradorCompleto();
orquestrador.iniciar();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Encerrando orquestrador completo...');
    await pool.end();
    console.log('✅ Orquestrador encerrado');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Encerrando orquestrador completo...');
    await pool.end();
    console.log('✅ Orquestrador encerrado');
    process.exit(0);
});

module.exports = OrquestradorCompleto;

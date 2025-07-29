/**
 * 🧹 SISTEMA DE LIMPEZA AUTOMÁTICA INTELIGENTE
 * Limpeza diferenciada: dados críticos (15 dias) vs não críticos (2h)
 */

const { Pool } = require('pg');

console.log('🧹 SISTEMA DE LIMPEZA AUTOMÁTICA INTELIGENTE');
console.log('==========================================');

class SistemaLimpezaAutomatica {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Intervalos de limpeza
        this.intervalos = {
            limpezaGeral: 2 * 60 * 60 * 1000,      // 2 horas
            limpezaCritica: 24 * 60 * 60 * 1000,   // 24 horas (verificação diária)
            manutencao: 7 * 24 * 60 * 60 * 1000    // 7 dias (manutenção semanal)
        };

        // Períodos de retenção
        this.retencao = {
            sinaisNormais: '2 hours',
            sinaisCriticos: '15 days',
            logsNormais: '3 hours',
            logsCriticos: '15 days',
            operacoesFinalizadas: '2 hours',
            operacoesCriticas: '30 days',
            sessoes: '24 hours',
            tentativasLogin: '7 days',
            dadosTemporarios: '1 hour'
        };

        // Categorias críticas
        this.categoriasCriticas = {
            sinais: ['ERRO_SISTEMA', 'FALHA_CONEXAO', 'OPERACAO_ALTA_PERDA'],
            logs: ['error', 'critical', 'security', 'trading_error', 'payment_error'],
            operacoes: ['high_value', 'error_state', 'fraud_suspected']
        };

        this.intervalIds = [];
        this.iniciarLimpezaAutomatica();
    }

    // ========================================
    // 1. INICIALIZAÇÃO DA LIMPEZA AUTOMÁTICA
    // ========================================

    iniciarLimpezaAutomatica() {
        console.log('🚀 Iniciando sistema de limpeza automática...');

        // Limpeza geral a cada 2 horas
        const limpezaGeral = setInterval(async () => {
            await this.executarLimpezaGeral();
        }, this.intervalos.limpezaGeral);

        // Limpeza de dados críticos diariamente
        const limpezaCritica = setInterval(async () => {
            await this.executarLimpezaCritica();
        }, this.intervalos.limpezaCritica);

        // Manutenção semanal
        const manutencao = setInterval(async () => {
            await this.executarManutencaoSemanal();
        }, this.intervalos.manutencao);

        this.intervalIds = [limpezaGeral, limpezaCritica, manutencao];

        console.log('✅ Sistema de limpeza configurado:');
        console.log('   🧹 Limpeza geral: a cada 2 horas');
        console.log('   🔒 Limpeza crítica: diariamente');
        console.log('   🔧 Manutenção: semanalmente');

        // Executar limpeza inicial após 30 segundos
        setTimeout(() => {
            this.executarLimpezaGeral();
        }, 30000);
    }

    pararLimpezaAutomatica() {
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];
        console.log('⏹️ Sistema de limpeza automática parado');
    }

    // ========================================
    // 2. LIMPEZA GERAL (2 HORAS)
    // ========================================

    async executarLimpezaGeral() {
        console.log('🧹 Executando limpeza geral (2h)...');
        
        const client = await this.pool.connect();
        const resultados = {};

        try {
            // 1. Limpar sinais não críticos expirados
            resultados.sinaisNormais = await this.limparSinaisNormais(client);

            // 2. Limpar logs não críticos
            resultados.logsNormais = await this.limparLogsNormais(client);

            // 3. Limpar operações finalizadas não críticas
            resultados.operacoesFinalizadas = await this.limparOperacoesFinalizadas(client);

            // 4. Limpar sessões expiradas
            resultados.sessoes = await this.limparSessoesExpiradas(client);

            // 5. Limpar dados temporários
            resultados.temporarios = await this.limparDadosTemporarios(client);

            // Log do resultado
            await this.registrarResultadoLimpeza('limpeza_geral', resultados, client);

            const totalRemovido = Object.values(resultados).reduce((acc, val) => acc + val, 0);
            console.log(`✅ Limpeza geral concluída: ${totalRemovido} registros removidos`);

        } catch (error) {
            console.error('❌ Erro na limpeza geral:', error.message);
            await this.registrarErroLimpeza('limpeza_geral', error, client);
        } finally {
            client.release();
        }
    }

    async limparSinaisNormais(client) {
        const resultado = await client.query(`
            DELETE FROM trading_signals 
            WHERE status IN ('expired', 'processed', 'rejected')
            AND signal_type NOT IN (${this.categoriasCriticas.sinais.map(s => `'${s}'`).join(',')})
            AND created_at < NOW() - INTERVAL '${this.retencao.sinaisNormais}'
            AND id NOT IN (
                SELECT DISTINCT signal_id 
                FROM trading_operations 
                WHERE signal_id IS NOT NULL 
                AND status = 'open'
            )
        `);

        console.log(`   - Sinais normais removidos: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparLogsNormais(client) {
        const resultado = await client.query(`
            DELETE FROM system_logs 
            WHERE level NOT IN (${this.categoriasCriticas.logs.map(l => `'${l}'`).join(',')})
            AND created_at < NOW() - INTERVAL '${this.retencao.logsNormais}'
        `);

        console.log(`   - Logs normais removidos: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparOperacoesFinalizadas(client) {
        const resultado = await client.query(`
            DELETE FROM trading_operations 
            WHERE status = 'closed'
            AND category NOT IN (${this.categoriasCriticas.operacoes.map(o => `'${o}'`).join(',')})
            AND closed_at < NOW() - INTERVAL '${this.retencao.operacoesFinalizadas}'
            AND id NOT IN (
                SELECT DISTINCT operation_id 
                FROM affiliate_commissions 
                WHERE created_at > NOW() - INTERVAL '24 hours'
            )
        `);

        console.log(`   - Operações finalizadas removidas: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparSessoesExpiradas(client) {
        const resultado = await client.query(`
            DELETE FROM user_sessions 
            WHERE expires_at < NOW()
            OR last_activity < NOW() - INTERVAL '${this.retencao.sessoes}'
        `);

        console.log(`   - Sessões expiradas removidas: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparDadosTemporarios(client) {
        let totalRemovido = 0;

        // Limpar tabelas temporárias
        const tabelasTemp = [
            'temp_trading_data',
            'temp_user_sessions',
            'temp_calculations',
            'temp_market_data'
        ];

        for (const tabela of tabelasTemp) {
            try {
                const resultado = await client.query(`
                    DELETE FROM ${tabela} 
                    WHERE created_at < NOW() - INTERVAL '${this.retencao.dadosTemporarios}'
                `);
                totalRemovido += resultado.rowCount;
            } catch (error) {
                // Tabela pode não existir, ignorar erro
            }
        }

        console.log(`   - Dados temporários removidos: ${totalRemovido}`);
        return totalRemovido;
    }

    // ========================================
    // 3. LIMPEZA CRÍTICA (15 DIAS)
    // ========================================

    async executarLimpezaCritica() {
        console.log('🔒 Executando limpeza de dados críticos (15 dias)...');
        
        const client = await this.pool.connect();
        const resultados = {};

        try {
            // 1. Limpar sinais críticos antigos (15 dias)
            resultados.sinaisCriticos = await this.limparSinaisCriticos(client);

            // 2. Limpar logs críticos antigos (15 dias)
            resultados.logsCriticos = await this.limparLogsCriticos(client);

            // 3. Limpar operações críticas antigas (30 dias)
            resultados.operacoesCriticas = await this.limparOperacoesCriticas(client);

            // 4. Limpar tentativas de login antigas
            resultados.tentativasLogin = await this.limparTentativasLogin(client);

            // Log do resultado
            await this.registrarResultadoLimpeza('limpeza_critica', resultados, client);

            const totalRemovido = Object.values(resultados).reduce((acc, val) => acc + val, 0);
            console.log(`✅ Limpeza crítica concluída: ${totalRemovido} registros removidos`);

        } catch (error) {
            console.error('❌ Erro na limpeza crítica:', error.message);
            await this.registrarErroLimpeza('limpeza_critica', error, client);
        } finally {
            client.release();
        }
    }

    async limparSinaisCriticos(client) {
        const resultado = await client.query(`
            DELETE FROM trading_signals 
            WHERE signal_type IN (${this.categoriasCriticas.sinais.map(s => `'${s}'`).join(',')})
            AND created_at < NOW() - INTERVAL '${this.retencao.sinaisCriticos}'
            AND status = 'processed'
        `);

        console.log(`   - Sinais críticos antigos removidos: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparLogsCriticos(client) {
        const resultado = await client.query(`
            DELETE FROM system_logs 
            WHERE level IN (${this.categoriasCriticas.logs.map(l => `'${l}'`).join(',')})
            AND created_at < NOW() - INTERVAL '${this.retencao.logsCriticos}'
            AND resolved = true
        `);

        console.log(`   - Logs críticos antigos removidos: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparOperacoesCriticas(client) {
        const resultado = await client.query(`
            DELETE FROM trading_operations 
            WHERE category IN (${this.categoriasCriticas.operacoes.map(o => `'${o}'`).join(',')})
            AND status = 'closed'
            AND closed_at < NOW() - INTERVAL '${this.retencao.operacoesCriticas}'
        `);

        console.log(`   - Operações críticas antigas removidas: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    async limparTentativasLogin(client) {
        const resultado = await client.query(`
            DELETE FROM login_attempts 
            WHERE created_at < NOW() - INTERVAL '${this.retencao.tentativasLogin}'
            AND result != 'security_violation'
        `);

        console.log(`   - Tentativas de login antigas removidas: ${resultado.rowCount}`);
        return resultado.rowCount;
    }

    // ========================================
    // 4. MANUTENÇÃO SEMANAL
    // ========================================

    async executarManutencaoSemanal() {
        console.log('🔧 Executando manutenção semanal...');
        
        const client = await this.pool.connect();
        
        try {
            // 1. Reorganizar índices
            await this.reorganizarIndices(client);

            // 2. Atualizar estatísticas
            await this.atualizarEstatisticas(client);

            // 3. Verificar integridade de dados
            await this.verificarIntegridadeDados(client);

            // 4. Compactar tabelas
            await this.compactarTabelas(client);

            console.log('✅ Manutenção semanal concluída');

        } catch (error) {
            console.error('❌ Erro na manutenção semanal:', error.message);
        } finally {
            client.release();
        }
    }

    async reorganizarIndices(client) {
        console.log('   🔧 Reorganizando índices...');
        
        const indices = [
            'idx_trading_signals_created_at',
            'idx_system_logs_created_at',
            'idx_trading_operations_status',
            'idx_users_email',
            'idx_user_sessions_expires_at'
        ];

        for (const indice of indices) {
            try {
                await client.query(`REINDEX INDEX CONCURRENTLY ${indice}`);
            } catch (error) {
                console.log(`   ⚠️ Índice ${indice} pode não existir`);
            }
        }
    }

    async atualizarEstatisticas(client) {
        console.log('   📊 Atualizando estatísticas das tabelas...');
        await client.query('ANALYZE');
    }

    async verificarIntegridadeDados(client) {
        console.log('   🔍 Verificando integridade de dados...');
        
        // Verificar consistência entre tabelas relacionadas
        const inconsistencias = await client.query(`
            SELECT 'orphaned_operations' as tipo, COUNT(*) as count
            FROM trading_operations to
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = to.user_id)
            
            UNION ALL
            
            SELECT 'orphaned_signals' as tipo, COUNT(*) as count
            FROM trading_signals ts
            WHERE ts.user_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ts.user_id)
        `);

        inconsistencias.rows.forEach(row => {
            if (row.count > 0) {
                console.log(`   ⚠️ Encontradas ${row.count} inconsistências do tipo: ${row.tipo}`);
            }
        });
    }

    async compactarTabelas(client) {
        console.log('   📦 Compactando tabelas...');
        
        const tabelas = [
            'trading_signals',
            'system_logs',
            'trading_operations',
            'user_sessions',
            'login_attempts'
        ];

        for (const tabela of tabelas) {
            try {
                await client.query(`VACUUM ANALYZE ${tabela}`);
            } catch (error) {
                console.log(`   ⚠️ Erro ao compactar ${tabela}: ${error.message}`);
            }
        }
    }

    // ========================================
    // 5. LOGS E AUDITORIA
    // ========================================

    async registrarResultadoLimpeza(tipo, resultados, client) {
        try {
            await client.query(`
                INSERT INTO maintenance_logs (
                    type, 
                    status, 
                    details, 
                    records_affected, 
                    created_at
                ) VALUES ($1, $2, $3, $4, NOW())
            `, [
                tipo,
                'success',
                JSON.stringify(resultados),
                Object.values(resultados).reduce((acc, val) => acc + val, 0)
            ]);
        } catch (error) {
            console.error('❌ Erro ao registrar log de limpeza:', error.message);
        }
    }

    async registrarErroLimpeza(tipo, erro, client) {
        try {
            await client.query(`
                INSERT INTO maintenance_logs (
                    type, 
                    status, 
                    error_message, 
                    created_at
                ) VALUES ($1, $2, $3, NOW())
            `, [tipo, 'error', erro.message]);
        } catch (error) {
            console.error('❌ Erro ao registrar erro de limpeza:', error.message);
        }
    }

    // ========================================
    // 6. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    async gerarRelatorioLimpeza(dias = 7) {
        const client = await this.pool.connect();
        try {
            const relatorio = await client.query(`
                SELECT 
                    DATE(created_at) as data,
                    type as tipo,
                    COUNT(*) as execucoes,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as sucessos,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as erros,
                    SUM(COALESCE(records_affected, 0)) as total_removido
                FROM maintenance_logs 
                WHERE created_at >= NOW() - INTERVAL '${dias} days'
                GROUP BY DATE(created_at), type
                ORDER BY data DESC, tipo
            `);

            return relatorio.rows;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            return [];
        } finally {
            client.release();
        }
    }

    async obterEstatisticasTabelas() {
        const client = await this.pool.connect();
        try {
            const stats = await client.query(`
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserções,
                    n_tup_upd as atualizações,
                    n_tup_del as exclusões,
                    n_live_tup as registros_vivos,
                    n_dead_tup as registros_mortos,
                    last_vacuum,
                    last_analyze
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public'
                ORDER BY n_live_tup DESC
            `);

            return stats.rows;

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return [];
        } finally {
            client.release();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const sistema = new SistemaLimpezaAutomatica();
    
    // Manter processo ativo
    process.on('SIGINT', () => {
        console.log('🛑 Parando sistema de limpeza...');
        sistema.pararLimpezaAutomatica();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('🛑 Finalizando sistema de limpeza...');
        sistema.pararLimpezaAutomatica();
        process.exit(0);
    });
    
    console.log('🚀 Sistema de limpeza automática ativo!');
}

// Função auxiliar para categorização de dados (para testes)
function categorizarDados(tabela) {
    const tabelasCriticas = [
        'trade_executions',
        'user_balances',
        'credit_transactions',
        'affiliate_commissions',
        'user_api_keys'
    ];

    return tabelasCriticas.includes(tabela) ? 'critico' : 'normal';
}

module.exports = SistemaLimpezaAutomatica;
module.exports.categorizarDados = categorizarDados;

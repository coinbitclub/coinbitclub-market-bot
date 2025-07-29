/**
 * 😨 GESTOR DE MEDO E GANÂNCIA - FEAR & GREED INDEX
 * Integração com CoinStats e lógica de direção de operações
 */

const axios = require('axios');
const { Pool } = require('pg');

console.log('😨 GESTOR DE MEDO E GANÂNCIA');
console.log('============================');

class GestorMedoGanancia {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Chave API CoinStats fornecida
        this.coinStatsApiKey = process.env.COINSTATS_API_KEY || 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=';
        this.coinstatsUrl = 'https://openapiv1.coinstats.app/coins/bitcoin/charts';
        
        this.ultimaAtualizacao = null;
        this.indiceFGAtual = 50; // Fallback padrão
        this.intervalId = null;
        this.limpezaIntervalId = null;

        // Iniciar atualização automática a cada 30 minutos
        this.iniciarAtualizacaoAutomatica();
        
        // Iniciar limpeza automática a cada 2 horas
        this.iniciarLimpezaAutomatica();
    }

    // ========================================
    // 2. ATUALIZAÇÃO AUTOMÁTICA (30 MINUTOS)
    // ========================================

    iniciarAtualizacaoAutomatica() {
        console.log('⏰ Iniciando atualização automática do Fear & Greed a cada 30 minutos');

        // Atualizar imediatamente
        this.obterIndiceFearGreed();

        // Configurar intervalo de 30 minutos (1800000 ms)
        this.intervalId = setInterval(() => {
            console.log('🔄 Executando atualização automática do Fear & Greed');
            this.obterIndiceFearGreed();
        }, 30 * 60 * 1000); // 30 minutos em milissegundos

        console.log('✅ Atualização automática configurada para 30 minutos');
    }

    pararAtualizacaoAutomatica() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Atualização automática interrompida');
        }
    }

    // ========================================
    // 3. OBTENÇÃO DO ÍNDICE FEAR & GREED
    // ========================================

    async obterIndiceFearGreed() {
        console.log('📊 Obtendo índice Fear & Greed do CoinStats...');

        try {
            let indice = await this.buscarDoCoinStats();
            
            if (indice === null) {
                console.log('⚠️ Falha na API CoinStats, usando fallback F&G = 50');
                indice = 50; // Fallback conforme especificação
            }

            // Salvar no banco de dados
            await this.salvarIndiceBanco(indice);
            
            this.indiceFGAtual = indice;
            this.ultimaAtualizacao = new Date();

            console.log(`✅ Índice F&G atualizado: ${indice} (${this.obterClassificacao(indice)})`);
            
            return {
                valor: indice,
                classificacao: this.obterClassificacao(indice),
                direcaoPermitida: this.obterDirecaoPermitida(indice),
                ultimaAtualizacao: this.ultimaAtualizacao
            };

        } catch (error) {
            console.error('❌ Erro ao obter índice F&G:', error.message);
            
            // Usar fallback em caso de erro
            const indiceFallback = 50;
            await this.salvarIndiceBanco(indiceFallback, `Fallback: ${error.message}`);
            
            return {
                valor: indiceFallback,
                classificacao: this.obterClassificacao(indiceFallback),
                direcaoPermitida: this.obterDirecaoPermitida(indiceFallback),
                ultimaAtualizacao: new Date(),
                erro: error.message
            };
        }
    }

    async buscarDoCoinStats() {
        if (!this.coinStatsApiKey) {
            console.log('⚠️ COINSTATS_API_KEY não configurada');
            return null;
        }

        try {
            // URL da API CoinStats para Fear & Greed Index
            const url = 'https://api.coinstats.app/public/v1/fear-greed';
            
            const response = await axios.get(url, {
                headers: {
                    'X-API-KEY': this.coinStatsApiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && response.data.value !== undefined) {
                return parseInt(response.data.value);
            }

            console.log('⚠️ Resposta inválida da API CoinStats');
            return null;

        } catch (error) {
            console.error('❌ Erro na API CoinStats:', error.message);
            return null;
        }
    }

    // ========================================
    // 2. LÓGICA DE CLASSIFICAÇÃO
    // ========================================

    obterClassificacao(indice) {
        if (indice < 30) {
            return 'SOMENTE_LONG';
        } else if (indice >= 30 && indice <= 80) {
            return 'LONG_E_SHORT';
        } else {
            return 'SOMENTE_SHORT';
        }
    }

    obterDirecaoPermitida(indice) {
        if (indice < 30) {
            return ['LONG'];
        } else if (indice >= 30 && indice <= 80) {
            return ['LONG', 'SHORT'];
        } else {
            return ['SHORT'];
        }
    }

    // ========================================
    // 3. VALIDAÇÃO DE SINAIS
    // ========================================

    async validarSinalComFG(tipoSinal, indiceFG = null) {
        console.log(`🔍 Validando sinal "${tipoSinal}" com F&G...`);

        try {
            // Usar índice atual se não fornecido
            if (indiceFG === null) {
                const dadosFG = await this.obterIndiceFearGreed();
                indiceFG = dadosFG.valor;
            }

            const direcaoSinal = this.extrairDirecaoDoSinal(tipoSinal);
            const direcoesPermitidas = this.obterDirecaoPermitida(indiceFG);

            const sinalValido = direcoesPermitidas.includes(direcaoSinal);

            const resultado = {
                sinalValido,
                indiceFG,
                classificacaoFG: this.obterClassificacao(indiceFG),
                tipoSinal,
                direcaoSinal,
                direcoesPermitidas,
                motivo: sinalValido ? 
                    `Sinal ${direcaoSinal} permitido com F&G ${indiceFG}` :
                    `Sinal ${direcaoSinal} BLOQUEADO com F&G ${indiceFG} (permite apenas: ${direcoesPermitidas.join(', ')})`
            };

            console.log(`${sinalValido ? '✅' : '❌'} ${resultado.motivo}`);

            // Salvar validação no banco
            await this.salvarValidacaoSinal(resultado);

            return resultado;

        } catch (error) {
            console.error('❌ Erro na validação do sinal:', error.message);
            throw error;
        }
    }

    extrairDirecaoDoSinal(tipoSinal) {
        const sinalUpper = tipoSinal.toUpperCase();
        
        if (sinalUpper.includes('LONG')) {
            return 'LONG';
        } else if (sinalUpper.includes('SHORT')) {
            return 'SHORT';
        } else {
            return 'INDEFINIDO';
        }
    }

    // ========================================
    // 4. GESTÃO DO BANCO DE DADOS
    // ========================================

    async salvarIndiceBanco(indice, observacoes = null) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO fear_greed_index (
                    value, classification, direction_allowed, 
                    source, observations, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                indice,
                this.obterClassificacao(indice),
                JSON.stringify(this.obterDirecaoPermitida(indice)),
                'coinstats',
                observacoes
            ]);

            // Manter apenas os últimos 1000 registros
            await client.query(`
                DELETE FROM fear_greed_index 
                WHERE id NOT IN (
                    SELECT id FROM fear_greed_index 
                    ORDER BY created_at DESC 
                    LIMIT 1000
                )
            `);

        } catch (error) {
            console.error('❌ Erro ao salvar índice F&G:', error.message);
        } finally {
            client.release();
        }
    }

    async salvarValidacaoSinal(validacao) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO signal_validations (
                    signal_type, signal_direction, fear_greed_value, 
                    fear_greed_classification, directions_allowed, 
                    signal_valid, validation_reason, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [
                validacao.tipoSinal,
                validacao.direcaoSinal,
                validacao.indiceFG,
                validacao.classificacaoFG,
                JSON.stringify(validacao.direcoesPermitidas),
                validacao.sinalValido,
                validacao.motivo
            ]);

        } catch (error) {
            console.error('❌ Erro ao salvar validação:', error.message);
            // Não lançar erro para não quebrar o fluxo principal
        } finally {
            client.release();
        }
    }

    async obterUltimoIndice() {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                SELECT value, classification, direction_allowed, created_at
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);

            if (resultado.rows.length > 0) {
                const registro = resultado.rows[0];
                return {
                    valor: registro.value,
                    classificacao: registro.classification,
                    direcaoPermitida: JSON.parse(registro.direction_allowed),
                    atualizadoEm: registro.created_at
                };
            }

            return null;

        } catch (error) {
            console.error('❌ Erro ao obter último índice:', error.message);
            return null;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 5. ATUALIZAÇÃO AUTOMÁTICA
    // ========================================

    iniciarAtualizacaoAutomatica() {
        console.log('⏰ Iniciando atualização automática a cada 30 minutos...');

        // Fazer primeira atualização imediatamente
        this.obterIndiceFearGreed().catch(error => {
            console.error('❌ Erro na primeira atualização:', error.message);
        });

        // Configurar atualização a cada 30 minutos (1800000 ms)
        this.intervalId = setInterval(async () => {
            try {
                await this.obterIndiceFearGreed();
            } catch (error) {
                console.error('❌ Erro na atualização automática:', error.message);
            }
        }, 30 * 60 * 1000); // 30 minutos

        console.log('✅ Atualização automática configurada');
    }

    pararAtualizacaoAutomatica() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Atualização automática parada');
        }
    }

    // ========================================
    // 6. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    async gerarRelatorioFG(periodo = '24h') {
        console.log(`📈 Gerando relatório F&G para ${periodo}...`);

        const client = await this.pool.connect();
        try {
            let whereClause = '';
            
            switch (periodo) {
                case '1h':
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '1 hour'";
                    break;
                case '24h':
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '24 hours'";
                    break;
                case '7d':
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '7 days'";
                    break;
                default:
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '24 hours'";
            }

            const estatisticas = await client.query(`
                SELECT 
                    COUNT(*) as total_registros,
                    AVG(value) as media_fg,
                    MIN(value) as min_fg,
                    MAX(value) as max_fg,
                    COUNT(CASE WHEN classification = 'SOMENTE_LONG' THEN 1 END) as periodo_long,
                    COUNT(CASE WHEN classification = 'LONG_E_SHORT' THEN 1 END) as periodo_ambos,
                    COUNT(CASE WHEN classification = 'SOMENTE_SHORT' THEN 1 END) as periodo_short
                FROM fear_greed_index ${whereClause}
            `);

            const validacoesSinais = await client.query(`
                SELECT 
                    COUNT(*) as total_validacoes,
                    COUNT(CASE WHEN signal_valid = true THEN 1 END) as sinais_aprovados,
                    COUNT(CASE WHEN signal_valid = false THEN 1 END) as sinais_bloqueados,
                    COUNT(CASE WHEN signal_direction = 'LONG' THEN 1 END) as sinais_long,
                    COUNT(CASE WHEN signal_direction = 'SHORT' THEN 1 END) as sinais_short
                FROM signal_validations ${whereClause}
            `);

            const stats = estatisticas.rows[0];
            const validacoes = validacoesSinais.rows[0];

            const relatorio = {
                periodo,
                indices_fear_greed: {
                    total_registros: parseInt(stats.total_registros),
                    media: parseFloat(stats.media_fg)?.toFixed(2) || 0,
                    minimo: parseInt(stats.min_fg) || 0,
                    maximo: parseInt(stats.max_fg) || 0,
                    distribuicao: {
                        periodo_long: parseInt(stats.periodo_long),
                        periodo_ambos: parseInt(stats.periodo_ambos),
                        periodo_short: parseInt(stats.periodo_short)
                    }
                },
                validacoes_sinais: {
                    total: parseInt(validacoes.total_validacoes),
                    aprovados: parseInt(validacoes.sinais_aprovados),
                    bloqueados: parseInt(validacoes.sinais_bloqueados),
                    taxa_aprovacao: validacoes.total_validacoes > 0 ? 
                        (validacoes.sinais_aprovados / validacoes.total_validacoes * 100).toFixed(1) + '%' : '0%',
                    por_direcao: {
                        long: parseInt(validacoes.sinais_long),
                        short: parseInt(validacoes.sinais_short)
                    }
                },
                situacao_atual: {
                    indice_atual: this.indiceFGAtual,
                    classificacao_atual: this.obterClassificacao(this.indiceFGAtual),
                    direcoes_permitidas: this.obterDirecaoPermitida(this.indiceFGAtual),
                    ultima_atualizacao: this.ultimaAtualizacao
                }
            };

            return relatorio;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 7. UTILITÁRIOS E TESTES
    // ========================================

    async testarIntegracaoCoinStats() {
        console.log('🧪 Testando integração com CoinStats...');

        try {
            const indice = await this.buscarDoCoinStats();
            
            if (indice !== null) {
                console.log(`✅ CoinStats funcionando - Índice obtido: ${indice}`);
                return { sucesso: true, indice };
            } else {
                console.log('❌ CoinStats não respondeu adequadamente');
                return { sucesso: false, erro: 'Resposta inválida da API' };
            }

        } catch (error) {
            console.log(`❌ Erro no teste CoinStats: ${error.message}`);
            return { sucesso: false, erro: error.message };
        }
    }

    async simularValidacoes() {
        console.log('🎮 Simulando validações de sinais...');

        const sinaisTestE = [
            'SINAL LONG',
            'SINAL SHORT', 
            'SINAL LONG FORTE',
            'SINAL SHORT FORTE'
        ];

        const indicesTesTe = [10, 25, 50, 75, 90]; // Diferentes cenários F&G

        for (const indice of indicesTesTe) {
            console.log(`\n📊 Testando com F&G = ${indice} (${this.obterClassificacao(indice)})`);
            
            for (const sinal of sinaisTestE) {
                const validacao = await this.validarSinalComFG(sinal, indice);
                console.log(`   ${validacao.sinalValido ? '✅' : '❌'} ${sinal}`);
            }
        }
    }

    // ========================================
    // 8. LIMPEZA AUTOMÁTICA (2H)
    // ========================================

    iniciarLimpezaAutomatica() {
        console.log('🧹 Iniciando limpeza automática de dados antigos (2h)');
        
        // Limpeza a cada 2 horas (7200000 ms)
        this.limpezaIntervalId = setInterval(async () => {
            await this.executarLimpeza();
        }, 2 * 60 * 60 * 1000); // 2 horas em milissegundos

        console.log('✅ Limpeza automática configurada para 2 horas');
    }

    async executarLimpeza() {
        console.log('🧹 Executando limpeza de dados antigos...');
        
        const client = await this.pool.connect();
        try {
            // Limpar sinais desatualizados (mais de 2 minutos)
            const sinaisRemovidos = await client.query(`
                DELETE FROM trading_signals 
                WHERE status IN ('pending', 'expired') 
                AND created_at < NOW() - INTERVAL '2 minutes'
            `);

            // Limpar logs sem criticidade (mais de 3 horas)
            const logsRemovidos = await client.query(`
                DELETE FROM system_logs 
                WHERE level NOT IN ('error', 'critical', 'warning') 
                AND created_at < NOW() - INTERVAL '3 hours'
            `);

            // Limpar dados de operações finalizadas há mais de 2 horas
            const operacoesLimpas = await client.query(`
                DELETE FROM trading_operations 
                WHERE status = 'closed' 
                AND closed_at < NOW() - INTERVAL '2 hours'
                AND id NOT IN (
                    SELECT DISTINCT operation_id 
                    FROM affiliate_commissions 
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                )
            `);

            // Limpar histórico Fear & Greed antigo (mais de 7 dias)
            const fgRemovidos = await client.query(`
                DELETE FROM fear_greed_history 
                WHERE created_at < NOW() - INTERVAL '7 days'
            `);

            console.log(`🧹 Limpeza concluída em ${new Date().toLocaleString()}:`);
            console.log(`   - Sinais desatualizados removidos: ${sinaisRemovidos.rowCount || 0}`);
            console.log(`   - Logs sem criticidade removidos: ${logsRemovidos.rowCount || 0}`);
            console.log(`   - Operações antigas limpas: ${operacoesLimpas.rowCount || 0}`);
            console.log(`   - Histórico F&G antigo removido: ${fgRemovidos.rowCount || 0}`);

            // Log da limpeza
            await client.query(`
                INSERT INTO system_logs (level, category, message, created_at)
                VALUES ('info', 'maintenance', $1, NOW())
            `, [`Limpeza automática executada: ${sinaisRemovidos.rowCount + logsRemovidos.rowCount + operacoesLimpas.rowCount + fgRemovidos.rowCount} registros removidos`]);

        } catch (error) {
            console.error('❌ Erro na limpeza automática:', error.message);
            
            // Log do erro
            try {
                await client.query(`
                    INSERT INTO system_logs (level, category, message, details, created_at)
                    VALUES ('error', 'maintenance', 'Erro na limpeza automática', $1, NOW())
                `, [JSON.stringify({ error: error.message, stack: error.stack })]);
            } catch (logError) {
                console.error('❌ Erro ao registrar log de erro:', logError.message);
            }
        } finally {
            client.release();
        }
    }

    pararLimpezaAutomatica() {
        if (this.limpezaIntervalId) {
            clearInterval(this.limpezaIntervalId);
            this.limpezaIntervalId = null;
            console.log('⏹️ Limpeza automática parada');
        }
    }

    // ========================================
    // 9. MANUTENÇÃO DE DADOS
    // ========================================

    async executarManutencaoDados() {
        console.log('🔧 Executando manutenção de dados do sistema...');
        
        const client = await this.pool.connect();
        try {
            // Reorganizar índices para melhor performance
            await client.query('REINDEX DATABASE coinbitclub');
            
            // Atualizar estatísticas das tabelas
            await client.query('ANALYZE');
            
            // Limpar tabelas temporárias se existirem
            await client.query(`
                DROP TABLE IF EXISTS temp_trading_data, temp_user_sessions
            `);

            console.log('✅ Manutenção de dados concluída');

        } catch (error) {
            console.error('❌ Erro na manutenção de dados:', error.message);
        } finally {
            client.release();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorMedoGanancia();
    
    // Manter processo ativo
    process.on('SIGINT', () => {
        console.log('� Parando Gestor de Medo e Ganância...');
        gestor.pararAtualizacaoAutomatica();
        gestor.pararLimpezaAutomatica();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('🛑 Finalizando Gestor de Medo e Ganância...');
        gestor.pararAtualizacaoAutomatica();
        gestor.pararLimpezaAutomatica();
        process.exit(0);
    });
    
    console.log('🚀 Gestor de Medo e Ganância ativo e rodando!');
    console.log('   ⏰ Atualização F&G: a cada 30 minutos');
    console.log('   🧹 Limpeza automática: a cada 2 horas');
}

// Função auxiliar para classificação (para testes)
function classificarDirecao(indice) {
    if (indice < 30) {
        return 'LONG';     // Medo extremo - ideal para compras
    } else if (indice > 70) {
        return 'SHORT';    // Ganância extrema - ideal para vendas
    } else {
        return 'AMBOS';    // Neutro - ambas direções permitidas
    }
}

module.exports = GestorMedoGanancia;
module.exports.classificarDirecao = classificarDirecao;

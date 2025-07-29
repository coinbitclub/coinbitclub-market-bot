/**
 * 😱 GESTOR FEAR & GREED INDEX COMPLETO
 * Integração com COINSTATS para análise de sentimento do mercado
 * Regras: < 30 apenas LONG | 30-80 LONG/SHORT | > 80 apenas SHORT
 */

const axios = require('axios');
const { Pool } = require('pg');

console.log('😱 GESTOR FEAR & GREED INDEX COMPLETO');
console.log('====================================');

class GestorFearGreed {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.configuracoes = {
            api: {
                coinstats_url: 'https://api.coinstats.app/public/v1/fear-greed',
                backup_url: 'https://api.alternative.me/fng/',
                timeout: 10000,
                retry_attempts: 3
            },
            intervalos: {
                atualizacao: 30 * 60 * 1000,     // 30 minutos conforme especificação
                verificacao: 5 * 60 * 1000,      // 5 minutos verificação
                cache_expiry: 35 * 60 * 1000     // 35 minutos cache
            },
            regras: {
                extreme_fear: { min: 0, max: 30, direction: 'LONG_ONLY' },
                fear_to_greed: { min: 30, max: 80, direction: 'BOTH' },
                extreme_greed: { min: 80, max: 100, direction: 'SHORT_ONLY' }
            }
        };

        this.cache = {
            ultimo_indice: null,
            ultima_atualizacao: null,
            historico: [],
            status_conexao: 'desconectado'
        };

        this.agendamentos = {
            atualizacao: null,
            verificacao: null,
            limpeza: null
        };

        this.estatisticas = {
            total_consultas: 0,
            consultas_sucesso: 0,
            consultas_erro: 0,
            media_indice: 0,
            tendencia: 'neutro'
        };
    }

    // ========================================
    // 1. OBTENÇÃO DOS DADOS FEAR & GREED
    // ========================================

    async obterIndiceFearGreed() {
        console.log('📊 Obtendo índice Fear & Greed...');

        try {
            // Verificar cache primeiro
            if (this.cacheValido()) {
                console.log('✅ Usando dados do cache');
                return this.cache.ultimo_indice;
            }

            let dadosIndice = null;

            // Tentar API principal (COINSTATS)
            try {
                dadosIndice = await this.consultarCoinstats();
                console.log('✅ Dados obtidos via COINSTATS');
            } catch (error) {
                console.log('⚠️ Falha na API COINSTATS, tentando backup...');
                
                // Tentar API backup
                try {
                    dadosIndice = await this.consultarAlternativeMe();
                    console.log('✅ Dados obtidos via API backup');
                } catch (backupError) {
                    console.error('❌ Todas as APIs falharam');
                    return this.usarDadosCache();
                }
            }

            // Processar e salvar dados
            if (dadosIndice) {
                await this.processarDadosIndice(dadosIndice);
                this.estatisticas.consultas_sucesso++;
            }

            this.estatisticas.total_consultas++;
            return this.cache.ultimo_indice;

        } catch (error) {
            console.error('Erro ao obter índice Fear & Greed:', error.message);
            this.estatisticas.consultas_erro++;
            return this.usarDadosCache();
        }
    }

    async consultarCoinstats() {
        const response = await axios.get(this.configuracoes.api.coinstats_url, {
            timeout: this.configuracoes.api.timeout,
            headers: {
                'User-Agent': 'CoinbitClub-Bot/1.0',
                'Accept': 'application/json'
            }
        });

        if (!response.data || typeof response.data.value === 'undefined') {
            throw new Error('Resposta inválida da API COINSTATS');
        }

        return {
            value: parseInt(response.data.value),
            value_classification: response.data.value_classification || this.classificarIndice(response.data.value),
            timestamp: new Date().toISOString(),
            source: 'coinstats'
        };
    }

    async consultarAlternativeMe() {
        const response = await axios.get(this.configuracoes.api.backup_url, {
            timeout: this.configuracoes.api.timeout,
            params: { limit: 1 }
        });

        if (!response.data || !response.data.data || !response.data.data[0]) {
            throw new Error('Resposta inválida da API backup');
        }

        const dados = response.data.data[0];
        return {
            value: parseInt(dados.value),
            value_classification: dados.value_classification,
            timestamp: new Date().toISOString(),
            source: 'alternative.me'
        };
    }

    classificarIndice(valor) {
        if (valor <= 25) return 'Extreme Fear';
        if (valor <= 45) return 'Fear';
        if (valor <= 55) return 'Neutral';
        if (valor <= 75) return 'Greed';
        return 'Extreme Greed';
    }

    // ========================================
    // 2. PROCESSAMENTO E ANÁLISE
    // ========================================

    async processarDadosIndice(dadosIndice) {
        const client = await this.pool.connect();
        try {
            // Salvar no banco de dados
            await client.query(`
                INSERT INTO fear_greed_index (
                    value, classification, direction_allowed, 
                    source, raw_data, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW());
            `, [
                dadosIndice.value,
                dadosIndice.value_classification,
                this.obterDirecaoPermitida(dadosIndice.value),
                dadosIndice.source,
                JSON.stringify(dadosIndice)
            ]);

            // Atualizar cache
            this.cache.ultimo_indice = dadosIndice;
            this.cache.ultima_atualizacao = Date.now();
            this.cache.status_conexao = 'conectado';

            // Adicionar ao histórico (manter últimos 100)
            this.cache.historico.push({
                valor: dadosIndice.value,
                timestamp: dadosIndice.timestamp,
                direcao: this.obterDirecaoPermitida(dadosIndice.value)
            });

            if (this.cache.historico.length > 100) {
                this.cache.historico = this.cache.historico.slice(-100);
            }

            // Calcular estatísticas
            await this.atualizarEstatisticas();

            // Notificar mudanças significativas
            await this.verificarMudancasSignificativas(dadosIndice);

            console.log(`📊 Índice processado: ${dadosIndice.value} (${dadosIndice.value_classification})`);

        } catch (error) {
            console.error('Erro ao processar dados do índice:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    obterDirecaoPermitida(valor) {
        if (valor < 30) {
            return 'LONG_ONLY';
        } else if (valor >= 30 && valor <= 80) {
            return 'BOTH';
        } else {
            return 'SHORT_ONLY';
        }
    }

    async atualizarEstatisticas() {
        if (this.cache.historico.length === 0) return;

        // Calcular média dos últimos valores
        const valores = this.cache.historico.slice(-20).map(h => h.valor);
        this.estatisticas.media_indice = valores.reduce((a, b) => a + b, 0) / valores.length;

        // Determinar tendência (últimos 5 vs anteriores 5)
        if (valores.length >= 10) {
            const recentes = valores.slice(-5);
            const anteriores = valores.slice(-10, -5);
            
            const mediaRecente = recentes.reduce((a, b) => a + b, 0) / recentes.length;
            const mediaAnterior = anteriores.reduce((a, b) => a + b, 0) / anteriores.length;

            if (mediaRecente > mediaAnterior + 5) {
                this.estatisticas.tendencia = 'alta';
            } else if (mediaRecente < mediaAnterior - 5) {
                this.estatisticas.tendencia = 'baixa';
            } else {
                this.estatisticas.tendencia = 'estavel';
            }
        }
    }

    async verificarMudancasSignificativas(novoIndice) {
        if (!this.cache.historico.length) return;

        const ultimoIndice = this.cache.historico[this.cache.historico.length - 2];
        if (!ultimoIndice) return;

        const mudanca = Math.abs(novoIndice.value - ultimoIndice.valor);
        const direcaoAnterior = ultimoIndice.direcao;
        const direcaoAtual = this.obterDirecaoPermitida(novoIndice.value);

        // Mudança de direção permitida
        if (direcaoAnterior !== direcaoAtual) {
            await this.notificarMudancaDirecao(direcaoAnterior, direcaoAtual, novoIndice);
        }

        // Mudança significativa de valor (>15 pontos)
        if (mudanca >= 15) {
            await this.notificarMudancaSignificativa(ultimoIndice.valor, novoIndice.value, mudanca);
        }
    }

    // ========================================
    // 3. VALIDAÇÃO DE SINAIS
    // ========================================

    async validarSinalContraIndice(sinal) {
        try {
            const indiceAtual = await this.obterIndiceFearGreed();
            
            if (!indiceAtual) {
                console.log('⚠️ Índice não disponível, permitindo sinal por precaução');
                return { valido: true, motivo: 'indice_indisponivel' };
            }

            const direcaoPermitida = this.obterDirecaoPermitida(indiceAtual.value);
            const direcaoSinal = sinal.direction?.toUpperCase();

            // Aplicar regras conforme especificação
            switch (direcaoPermitida) {
                case 'LONG_ONLY':
                    if (direcaoSinal !== 'LONG') {
                        return {
                            valido: false,
                            motivo: `Fear & Greed ${indiceAtual.value} (${indiceAtual.value_classification}): apenas LONG permitido`,
                            indice_atual: indiceAtual.value,
                            direcao_permitida: 'LONG_ONLY'
                        };
                    }
                    break;

                case 'SHORT_ONLY':
                    if (direcaoSinal !== 'SHORT') {
                        return {
                            valido: false,
                            motivo: `Fear & Greed ${indiceAtual.value} (${indiceAtual.value_classification}): apenas SHORT permitido`,
                            indice_atual: indiceAtual.value,
                            direcao_permitida: 'SHORT_ONLY'
                        };
                    }
                    break;

                case 'BOTH':
                    // Ambas direções permitidas
                    break;
            }

            return {
                valido: true,
                indice_atual: indiceAtual.value,
                classificacao: indiceAtual.value_classification,
                direcao_permitida: direcaoPermitida
            };

        } catch (error) {
            console.error('Erro ao validar sinal contra índice:', error.message);
            // Em caso de erro, permitir sinal por segurança
            return { valido: true, motivo: 'erro_validacao' };
        }
    }

    // ========================================
    // 4. CACHE E UTILIDADES
    // ========================================

    cacheValido() {
        return this.cache.ultima_atualizacao &&
               this.cache.ultimo_indice &&
               (Date.now() - this.cache.ultima_atualizacao) < this.configuracoes.intervalos.cache_expiry;
    }

    usarDadosCache() {
        if (this.cache.ultimo_indice) {
            console.log('📋 Usando último índice válido do cache');
            this.cache.status_conexao = 'cache';
            return this.cache.ultimo_indice;
        }

        // Fallback para valor neutro
        console.log('⚠️ Sem dados disponíveis, usando valor neutro (50)');
        this.cache.status_conexao = 'fallback';
        return {
            value: 50,
            value_classification: 'Neutral',
            timestamp: new Date().toISOString(),
            source: 'fallback'
        };
    }

    // ========================================
    // 5. NOTIFICAÇÕES
    // ========================================

    async notificarMudancaDirecao(direcaoAnterior, direcaoAtual, indice) {
        const mensagem = `🔄 Fear & Greed mudou direção: ${direcaoAnterior} → ${direcaoAtual} (Índice: ${indice.value})`;
        console.log(mensagem);

        // Salvar notificação no banco
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO system_notifications (
                    type, title, message, data, created_at
                ) VALUES ('fear_greed_direction_change', $1, $2, $3, NOW());
            `, [
                'Mudança de Direção Trading',
                mensagem,
                JSON.stringify({
                    direcao_anterior: direcaoAnterior,
                    direcao_atual: direcaoAtual,
                    indice: indice.value,
                    classificacao: indice.value_classification
                })
            ]);
        } catch (error) {
            console.error('Erro ao salvar notificação:', error.message);
        } finally {
            client.release();
        }
    }

    async notificarMudancaSignificativa(valorAnterior, valorAtual, mudanca) {
        const direcao = valorAtual > valorAnterior ? '📈' : '📉';
        const mensagem = `${direcao} Fear & Greed mudança significativa: ${valorAnterior} → ${valorAtual} (Δ${mudanca})`;
        console.log(mensagem);
    }

    // ========================================
    // 6. RELATÓRIOS E HISTÓRICO
    // ========================================

    async obterRelatorioHistorico(dias = 7) {
        const client = await this.pool.connect();
        try {
            const historico = await client.query(`
                SELECT 
                    value, classification, direction_allowed,
                    source, created_at,
                    LAG(value) OVER (ORDER BY created_at) as valor_anterior
                FROM fear_greed_index 
                WHERE created_at >= NOW() - INTERVAL '${dias} days'
                ORDER BY created_at DESC;
            `);

            const estatisticas = await client.query(`
                SELECT 
                    AVG(value) as media,
                    MIN(value) as minimo,
                    MAX(value) as maximo,
                    COUNT(*) as total_registros,
                    COUNT(CASE WHEN direction_allowed = 'LONG_ONLY' THEN 1 END) as dias_long_only,
                    COUNT(CASE WHEN direction_allowed = 'SHORT_ONLY' THEN 1 END) as dias_short_only,
                    COUNT(CASE WHEN direction_allowed = 'BOTH' THEN 1 END) as dias_ambas_direcoes
                FROM fear_greed_index 
                WHERE created_at >= NOW() - INTERVAL '${dias} days';
            `);

            return {
                periodo: `${dias} dias`,
                historico: historico.rows,
                estatisticas: estatisticas.rows[0],
                cache_status: this.cache.status_conexao,
                ultima_atualizacao: this.cache.ultima_atualizacao,
                tendencia_atual: this.estatisticas.tendencia
            };

        } catch (error) {
            console.error('Erro ao gerar relatório histórico:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 7. AGENDAMENTOS AUTOMÁTICOS
    // ========================================

    iniciarAgendamentos() {
        console.log('⏰ Iniciando agendamentos Fear & Greed...');

        // Atualização principal a cada 30 minutos
        this.agendamentos.atualizacao = setInterval(async () => {
            try {
                await this.obterIndiceFearGreed();
            } catch (error) {
                console.error('Erro na atualização automática:', error.message);
            }
        }, this.configuracoes.intervalos.atualizacao);

        // Verificação de status a cada 5 minutos
        this.agendamentos.verificacao = setInterval(async () => {
            try {
                await this.verificarStatusConexao();
            } catch (error) {
                console.error('Erro na verificação de status:', error.message);
            }
        }, this.configuracoes.intervalos.verificacao);

        // Limpeza de dados antigos diariamente
        this.agendamentos.limpeza = setInterval(async () => {
            try {
                await this.limparDadosAntigos();
            } catch (error) {
                console.error('Erro na limpeza de dados:', error.message);
            }
        }, 24 * 60 * 60 * 1000); // 24 horas

        console.log('✅ Agendamentos Fear & Greed iniciados');
    }

    async verificarStatusConexao() {
        const tempoUltimaAtualizacao = Date.now() - this.cache.ultima_atualizacao;
        
        if (tempoUltimaAtualizacao > this.configuracoes.intervalos.cache_expiry * 2) {
            console.log('⚠️ Dados Fear & Greed desatualizados, forçando nova consulta...');
            this.cache.status_conexao = 'desatualizado';
            await this.obterIndiceFearGreed();
        }
    }

    async limparDadosAntigos() {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                DELETE FROM fear_greed_index 
                WHERE created_at < NOW() - INTERVAL '90 days';
            `);

            console.log(`🧹 Limpeza: ${resultado.rowCount} registros Fear & Greed antigos removidos`);

        } catch (error) {
            console.error('Erro na limpeza de dados antigos:', error.message);
        } finally {
            client.release();
        }
    }

    pararAgendamentos() {
        Object.values(this.agendamentos).forEach(intervalo => {
            if (intervalo) {
                clearInterval(intervalo);
            }
        });
        console.log('🛑 Agendamentos Fear & Greed parados');
    }

    // ========================================
    // 8. STATUS E DIAGNÓSTICO
    // ========================================

    obterStatus() {
        return {
            status_conexao: this.cache.status_conexao,
            ultimo_indice: this.cache.ultimo_indice?.value || null,
            ultima_atualizacao: this.cache.ultima_atualizacao,
            cache_valido: this.cacheValido(),
            historico_count: this.cache.historico.length,
            estatisticas: this.estatisticas,
            agendamentos_ativos: Object.keys(this.agendamentos).filter(
                key => this.agendamentos[key] !== null
            ).length
        };
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestorFearGreed = new GestorFearGreed();
    
    // Iniciar primeira consulta
    gestorFearGreed.obterIndiceFearGreed().then(() => {
        console.log('✅ Primeira consulta Fear & Greed concluída');
        
        // Iniciar agendamentos
        gestorFearGreed.iniciarAgendamentos();
        
        // Mostrar status inicial
        console.log('📊 Status inicial:', gestorFearGreed.obterStatus());
    });
    
    // Cleanup
    process.on('SIGINT', () => {
        console.log('\n🛑 Parando gestor Fear & Greed...');
        gestorFearGreed.pararAgendamentos();
        process.exit(0);
    });
}

module.exports = GestorFearGreed;

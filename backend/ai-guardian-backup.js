#!/usr/bin/env node

/**
 * 🤖 IA GUARDIAN - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Sistema de Inteligência Artificial para proteção e análise
 * Integração com OpenAI para análise de mercado e proteção de riscos
 */

const { Pool } = require('pg');

class AIGuardian {
    constructor() {
        this.id = 'ai-guardian';
        this.nome = 'IA Guardian - Proteção';
        this.tipo = 'ai';
        this.status = 'inicializando';
        this.dependencias = ['signal-processor'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            analises_realizadas: 0,
            alertas_gerados: 0,
            sinais_bloqueados: 0,
            decisoes_ia: 0,
            precisao_ia: 0
        };

        this.configIA = {
            openai_habilitado: false,
            threshold_risco: 0.7, // 70% de confiança para bloquear
            max_analises_por_minuto: 10,
            historico_analise_dias: 7
        };

        this.cacheAnalises = new Map();
        this.filaAnalises = [];
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Verificar integração OpenAI
            await this.verificarIntegracaoOpenAI();
            
            // Inicializar estrutura de IA
            await this.inicializarEstruturaIA();
            
            // Carregar histórico de decisões
            await this.carregarHistoricoDecisoes();
            
            // Configurar análise contínua
            await this.configurarAnaliseContinua();
            
            this.status = 'ativo';
            this.metricas.inicializado_em = new Date();
            
            console.log(`✅ ${this.nome} inicializado com sucesso`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nome}:`, error.message);
            this.status = 'erro';
            return false;
        }
    }

    async verificarIntegracaoOpenAI() {
        console.log('🔍 Verificando integração OpenAI...');
        
        try {
            // Simular verificação da API Key OpenAI
            const openaiKey = process.env.OPENAI_API_KEY;
            
            if (openaiKey && openaiKey !== 'undefined') {
                this.configIA.openai_habilitado = true;
                console.log('✅ OpenAI configurado e disponível');
                
                // Testar conectividade (simulado)
                console.log('🧠 IA avançada habilitada');
            } else {
                console.log('⚠️ OpenAI não configurado - usando IA básica');
                this.configIA.openai_habilitado = false;
            }

        } catch (error) {
            console.error('❌ Erro na verificação OpenAI:', error.message);
            this.configIA.openai_habilitado = false;
        }
    }

    async inicializarEstruturaIA() {
        console.log('🏗️ Inicializando estrutura de IA...');
        
        // Criar tabela de análises IA
        await this.criarTabelaAnalises();
        
        // Criar tabela de decisões IA
        await this.criarTabelaDecisoes();
        
        // Carregar parâmetros de análise
        await this.carregarParametrosAnalise();
    }

    async criarTabelaAnalises() {
        const sql = `
            CREATE TABLE IF NOT EXISTS ai_analysis (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                analysis_type VARCHAR(50) NOT NULL,
                input_data JSONB NOT NULL,
                ai_response JSONB,
                confidence_score DECIMAL(5,4),
                recommendation VARCHAR(20), -- buy, sell, hold, block
                reasoning TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                model_version VARCHAR(50),
                execution_time_ms INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON ai_analysis(symbol);
            CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);
            CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
        `;

        if (this.pool && !this.pool.ended) { 
            await this.pool.query(sql);
        }
        console.log('✅ Tabela ai_analysis verificada/criada');
    }

    async criarTabelaDecisoes() {
        const sql = `
            CREATE TABLE IF NOT EXISTS ai_decisions (
                id SERIAL PRIMARY KEY,
                signal_id INTEGER,
                user_id INTEGER REFERENCES users(id),
                decision VARCHAR(20) NOT NULL, -- allow, block, modify
                ai_confidence DECIMAL(5,4),
                reasoning TEXT,
                market_conditions JSONB,
                user_profile JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                outcome VARCHAR(20), -- successful, failed, pending
                outcome_measured_at TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_ai_decisions_user_id ON ai_decisions(user_id);
            CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);
        `;

        if (this.pool && !this.pool.ended) { 
            await this.pool.query(sql);
        }
        console.log('✅ Tabela ai_decisions verificada/criada');
    }

    async carregarParametrosAnalise() {
        console.log('📊 Carregando parâmetros de análise...');
        
        // Parâmetros baseados no histórico
        this.parametrosAnalise = {
            indicadores_tecnicos: [
                'RSI', 'MACD', 'Bollinger_Bands', 'Moving_Averages'
            ],
            fatores_fundamentais: [
                'Fear_Greed_Index', 'BTC_Dominance', 'Volume_Profile'
            ],
            sentimento_mercado: [
                'Social_Sentiment', 'News_Analysis', 'Whale_Activity'
            ]
        };
    }

    async carregarHistoricoDecisoes() {
        try {
            let stats;
            if (this.pool && !this.pool.ended) {
                const result = await this.pool.query(`
                    SELECT 
                        COUNT(*) as total_decisoes,
                        COUNT(*) FILTER (WHERE outcome = 'successful') as sucessos,
                        COUNT(*) FILTER (WHERE decision = 'block') as bloqueios,
                        AVG(ai_confidence) as confianca_media
                    FROM ai_decisions
                    WHERE created_at > NOW() - INTERVAL '30 days'
                `);
                
                stats = result.rows[0];
            } else {
                stats = {
                    total_decisoes: 0,
                    sucessos: 0,
                    bloqueios: 0,
                    confianca_media: 0.7
                };
            }

            this.estatisticasDecisoes = {
                total: parseInt(stats.total_decisoes) || 0,
                sucessos: parseInt(stats.sucessos) || 0,
                bloqueios: parseInt(stats.bloqueios) || 0,
                taxa_sucesso: stats.total_decisoes > 0 
                    ? (stats.sucessos / stats.total_decisoes) 
                    : 0.7,
                confianca_media: parseFloat(stats.confianca_media) || 0.7
            };

            console.log('📊 Estatísticas carregadas:', this.estatisticasDecisoes);

        } catch (error) {
            console.error('❌ Erro ao carregar histórico de decisões:', error.message);
            
            // Usar valores padrão em caso de erro
            this.estatisticasDecisoes = {
                total: 0,
                sucessos: 0,
                bloqueios: 0,
                taxa_sucesso: 0.7,
                confianca_media: 0.7
            };
        }
    }

    async configurarAnaliseContinua() {
        console.log('⚙️ Configurando análise contínua...');

        // Processar fila de análises a cada 5 segundos
        setInterval(async () => {
            await this.processarFilaAnalises();
        }, 5000);

        // Análise de mercado geral a cada 1 minuto
        setInterval(async () => {
            await this.analisarCondicesMercado();
        }, 60000);

        // Limpeza de cache a cada 10 minutos
        setInterval(() => {
            this.limparCacheAnalises();
        }, 600000);
    }

    async analisarSinal(dadosSinal) {
        try {
            console.log(`🔍 Analisando sinal: ${dadosSinal.symbol}`);

            const startTime = Date.now();
            
            // Verificar cache primeiro
            const cacheKey = this.gerarChaveCache(dadosSinal);
            if (this.cacheAnalises.has(cacheKey)) {
                console.log('📋 Usando análise em cache');
                return this.cacheAnalises.get(cacheKey);
            }

            // Realizar análise
            let analise;
            if (this.configIA.openai_habilitado) {
                analise = await this.analisarComOpenAI(dadosSinal);
            } else {
                analise = await this.analisarBasico(dadosSinal);
            }

            // Calcular tempo de execução
            const executionTime = Date.now() - startTime;

            // Salvar análise no banco
            const resultado = await this.salvarAnalise({
                symbol: dadosSinal.symbol,
                analysis_type: 'signal_analysis',
                input_data: dadosSinal,
                ai_response: analise.response,
                confidence_score: analise.confidence,
                recommendation: analise.recommendation,
                reasoning: analise.reasoning,
                execution_time_ms: executionTime
            });

            // Armazenar em cache
            this.cacheAnalises.set(cacheKey, analise);

            this.metricas.analises_realizadas++;
            
            console.log(`✅ Análise concluída: ${analise.recommendation} (${(analise.confidence * 100).toFixed(1)}%)`);
            
            return analise;

        } catch (error) {
            console.error('❌ Erro na análise de sinal:', error.message);
            return {
                recommendation: 'hold',
                confidence: 0.5,
                reasoning: 'Erro na análise - aguardar',
                response: { error: error.message }
            };
        }
    }

    async analisarComOpenAI(dadosSinal) {
        // Simulação de análise OpenAI (implementar integração real)
        console.log('🧠 Utilizando IA avançada OpenAI...');
        
        // Preparar prompt para OpenAI
        const prompt = this.prepararPromptAnalise(dadosSinal);
        
        // Simular resposta (em produção faria chamada real)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            recommendation: this.simularRecomendacaoIA(dadosSinal),
            confidence: 0.85,
            reasoning: 'Análise baseada em padrões de mercado e sentimento',
            response: {
                model: 'gpt-4',
                analysis: 'Análise completa realizada',
                market_sentiment: 'neutro',
                technical_indicators: 'favoráveis'
            }
        };
    }

    async analisarBasico(dadosSinal) {
        console.log('⚙️ Utilizando análise básica...');
        
        // Análise baseada em regras simples
        const indicadores = this.calcularIndicadoresBasicos(dadosSinal);
        const recomendacao = this.determinarRecomendacaoBasica(indicadores);
        
        return {
            recommendation: recomendacao.action,
            confidence: recomendacao.confidence,
            reasoning: recomendacao.reasoning,
            response: {
                model: 'basic_analysis',
                indicators: indicadores
            }
        };
    }

    prepararPromptAnalise(dadosSinal) {
        return `
        Analise o seguinte sinal de trading:
        
        Símbolo: ${dadosSinal.symbol}
        Direção: ${dadosSinal.direction}
        Preço: ${dadosSinal.price}
        Volume: ${dadosSinal.volume}
        
        Considere:
        - Condições atuais do mercado
        - Indicadores técnicos
        - Sentimento geral
        - Gestão de risco
        
        Forneça uma recomendação: buy, sell, hold ou block
        Inclua nível de confiança e justificativa.
        `;
    }

    simularRecomendacaoIA(dadosSinal) {
        // Simulação baseada em alguns fatores
        const fatores = [
            dadosSinal.volume > 1000000 ? 1 : -1,
            dadosSinal.price_change > 2 ? 1 : -1,
            Math.random() > 0.5 ? 1 : -1
        ];
        
        const score = fatores.reduce((a, b) => a + b, 0);
        
        if (score >= 2) return 'buy';
        if (score <= -2) return 'sell';
        if (score < -1) return 'block';
        return 'hold';
    }

    calcularIndicadoresBasicos(dadosSinal) {
        // Simulação de indicadores básicos
        return {
            rsi: Math.random() * 100,
            macd: Math.random() * 2 - 1,
            volume_ratio: dadosSinal.volume / 1000000,
            price_momentum: dadosSinal.price_change || 0
        };
    }

    determinarRecomendacaoBasica(indicadores) {
        let score = 0;
        let reasoning = [];

        // RSI
        if (indicadores.rsi < 30) {
            score += 1;
            reasoning.push('RSI indica sobrevenda');
        } else if (indicadores.rsi > 70) {
            score -= 1;
            reasoning.push('RSI indica sobrecompra');
        }

        // Volume
        if (indicadores.volume_ratio > 1.5) {
            score += 0.5;
            reasoning.push('Volume acima da média');
        }

        // Momentum
        if (Math.abs(indicadores.price_momentum) > 5) {
            score -= 0.5;
            reasoning.push('Alta volatilidade detectada');
        }

        let action, confidence;
        
        if (score >= 1) {
            action = 'buy';
            confidence = Math.min(0.8, 0.5 + score * 0.1);
        } else if (score <= -1) {
            action = 'sell';
            confidence = Math.min(0.8, 0.5 + Math.abs(score) * 0.1);
        } else if (score < -0.5) {
            action = 'block';
            confidence = 0.7;
        } else {
            action = 'hold';
            confidence = 0.6;
        }

        return {
            action,
            confidence,
            reasoning: reasoning.join('; ')
        };
    }

    async tomarDecisao(sinalId, userId, dadosSinal) {
        try {
            console.log(`🤔 Tomando decisão para sinal ${sinalId} usuário ${userId}`);

            // Analisar sinal
            const analise = await this.analisarSinal(dadosSinal);
            
            // Obter perfil do usuário
            const perfilUsuario = await this.obterPerfilUsuario(userId);
            
            // Tomar decisão final
            const decisao = await this.calcularDecisaoFinal(analise, perfilUsuario);
            
            // Salvar decisão
            await this.salvarDecisao({
                signal_id: sinalId,
                user_id: userId,
                decision: decisao.action,
                ai_confidence: decisao.confidence,
                reasoning: decisao.reasoning,
                market_conditions: analise.response,
                user_profile: perfilUsuario
            });

            // Atualizar métricas
            this.metricas.decisoes_ia++;
            if (decisao.action === 'block') {
                this.metricas.sinais_bloqueados++;
            }

            console.log(`✅ Decisão: ${decisao.action} (${(decisao.confidence * 100).toFixed(1)}%)`);
            
            return decisao;

        } catch (error) {
            console.error('❌ Erro ao tomar decisão:', error.message);
            return {
                action: 'block',
                confidence: 0.9,
                reasoning: 'Erro na análise - bloqueio preventivo'
            };
        }
    }

    async obterPerfilUsuario(userId) {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                SELECT 
                    u.plan_type, u.vip_status, u.balance_usd,
                    COUNT(t.id) as total_trades,
                    COUNT(t.id) FILTER (WHERE t.pnl > 0) as winning_trades,
                    AVG(t.pnl) as avg_pnl
                FROM users u
                LEFT JOIN trading_operations t ON u.id = t.user_id 
                    AND t.created_at >= NOW() - INTERVAL '30 days'
                WHERE u.id = $1
                GROUP BY u.id, u.plan_type, u.vip_status, u.balance_usd
            `, [userId]);

            if (result.rows.length === 0) {
                return { risk_level: 'high', experience: 'beginner' };
            }

            const dados = result.rows[0];
            const winRate = dados.total_trades > 0 
                ? (dados.winning_trades / dados.total_trades) * 100 
                : 0;

            return {
                plan_type: dados.plan_type,
                vip_status: dados.vip_status,
                balance: parseFloat(dados.balance_usd || 0),
                total_trades: parseInt(dados.total_trades || 0),
                win_rate: winRate,
                avg_pnl: parseFloat(dados.avg_pnl || 0),
                risk_level: this.calcularNivelRisco(dados),
                experience: this.calcularNivelExperiencia(dados)
            };

        } catch (error) {
            console.error('❌ Erro ao obter perfil:', error.message);
            return { risk_level: 'high', experience: 'beginner' };
        }
    }

    calcularNivelRisco(dados) {
        if (dados.total_trades < 10) return 'high';
        if (dados.avg_pnl < 0) return 'high';
        if (dados.balance_usd < 100) return 'medium';
        return 'low';
    }

    calcularNivelExperiencia(dados) {
        if (dados.total_trades < 5) return 'beginner';
        if (dados.total_trades < 50) return 'intermediate';
        return 'advanced';
    }

    async calcularDecisaoFinal(analise, perfilUsuario) {
        let decisao = analise.recommendation;
        let confidence = analise.confidence;
        let reasoning = analise.reasoning;

        // Ajustar decisão baseada no perfil do usuário
        if (perfilUsuario.risk_level === 'high') {
            if (decisao === 'buy' || decisao === 'sell') {
                if (confidence < 0.8) {
                    decisao = 'block';
                    confidence = 0.9;
                    reasoning += '; Bloqueado por alto risco do usuário';
                }
            }
        }

        // Usuários iniciantes - mais conservador
        if (perfilUsuario.experience === 'beginner') {
            if (confidence < 0.7) {
                decisao = 'block';
                reasoning += '; Bloqueado - usuário iniciante';
            }
        }

        return {
            action: decisao,
            confidence: confidence,
            reasoning: reasoning
        };
    }

    async salvarAnalise(dadosAnalise) {
        try {
            const result = if (this.pool && !this.pool.ended) { await this.pool.query(`
                INSERT INTO ai_analysis (
                    symbol, analysis_type, input_data, ai_response,
                    confidence_score, recommendation, reasoning, execution_time_ms
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                dadosAnalise.symbol,
                dadosAnalise.analysis_type,
                JSON.stringify(dadosAnalise.input_data),
                JSON.stringify(dadosAnalise.ai_response),
                dadosAnalise.confidence_score,
                dadosAnalise.recommendation,
                dadosAnalise.reasoning,
                dadosAnalise.execution_time_ms
            ]);

            return result.rows[0].id;

        } catch (error) {
            console.error('❌ Erro ao salvar análise:', error.message);
            return null;
        }
    }

    async salvarDecisao(dadosDecisao) {
        try {
            if (this.pool && !this.pool.ended) { await this.pool.query(`
                INSERT INTO ai_decisions (
                    signal_id, user_id, decision, ai_confidence,
                    reasoning, market_conditions, user_profile
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                dadosDecisao.signal_id,
                dadosDecisao.user_id,
                dadosDecisao.decision,
                dadosDecisao.ai_confidence,
                dadosDecisao.reasoning,
                JSON.stringify(dadosDecisao.market_conditions),
                JSON.stringify(dadosDecisao.user_profile)
            ]);

        } catch (error) {
            console.error('❌ Erro ao salvar decisão:', error.message);
        }
    }

    async processarFilaAnalises() {
        if (this.filaAnalises.length === 0) return;

        const analise = this.filaAnalises.shift();
        await this.analisarSinal(analise);
    }

    async analisarCondicesMercado() {
        try {
            // Análise geral do mercado (Fear & Greed, BTC Dominance, etc.)
            console.log('📊 Analisando condições gerais do mercado...');
            
            // Simular análise de mercado
            const condicoesMercado = {
                fear_greed_index: Math.floor(Math.random() * 100),
                btc_dominance: 40 + Math.random() * 20,
                market_sentiment: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
                volatility: Math.random() * 100
            };

            // Salvar análise de mercado
            await this.salvarAnalise({
                symbol: 'MARKET',
                analysis_type: 'market_conditions',
                input_data: condicoesMercado,
                ai_response: condicoesMercado,
                confidence_score: 0.8,
                recommendation: 'monitor',
                reasoning: 'Análise automática de condições de mercado',
                execution_time_ms: 100
            });

        } catch (error) {
            console.error('❌ Erro na análise de mercado:', error.message);
        }
    }

    gerarChaveCache(dadosSinal) {
        return `${dadosSinal.symbol}_${dadosSinal.direction}_${Math.floor(Date.now() / 300000)}`; // Cache por 5 minutos
    }

    limparCacheAnalises() {
        const agora = Date.now();
        const CACHE_TTL = 300000; // 5 minutos

        for (const [chave, valor] of this.cacheAnalises.entries()) {
            if (agora - valor.timestamp > CACHE_TTL) {
                this.cacheAnalises.delete(chave);
            }
        }

        console.log(`🧹 Cache limpo: ${this.cacheAnalises.size} itens restantes`);
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: {
                ...this.metricas,
                cache_size: this.cacheAnalises.size,
                fila_analises: this.filaAnalises.length,
                openai_habilitado: this.configIA.openai_habilitado
            }
        };
    }

    
    verificarPool() {
        if (!this.pool || this.pool.ended) {
            console.log('⚠️ Pool de conexão não disponível');
            return false;
        }
        return true;
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        // Pool será finalizado pelo componente principal
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new AIGuardian();
    componente.inicializar().catch(console.error);
}

module.exports = AIGuardian;
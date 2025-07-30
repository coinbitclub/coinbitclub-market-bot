#!/usr/bin/env node

/**
 * 🤖 AI GUARDIAN - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Sistema de Inteligência Artificial para análise e proteção
 * Validação de sinais, análise de riscos e tomada de decisão automatizada
 */

const { Pool } = require('pg');
const crypto = require('crypto');

class AIGuardian {
    constructor() {
        this.id = 'ai-guardian';
        this.nome = 'AI Guardian - Proteção';
        this.tipo = 'ai';
        this.status = 'inicializando';
        this.dependencias = ['database-manager'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            analises_realizadas: 0,
            sinais_aprovados: 0,
            sinais_bloqueados: 0,
            decisoes_tomadas: 0,
            precisao_media: 0.75,
            ultima_atualizacao: null
        };

        this.openaiKey = process.env.OPENAI_API_KEY || null;
        this.cacheAnalises = new Map();
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Verificar integração OpenAI
            console.log('🔍 Verificando integração OpenAI...');
            if (!this.openaiKey) {
                console.log('⚠️ OpenAI não configurado - usando IA básica');
            }
            
            // Configurar estrutura de dados
            console.log('🏗️ Inicializando estrutura de IA...');
            await this.criarTabelasIA();
            
            this.metricas.inicializado_em = new Date();
            this.status = 'ativo';
            
            console.log(`✅ ${this.nome} inicializado com sucesso`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nome}:`, error.message);
            this.status = 'erro';
            throw error;
        }
    }

    async criarTabelasIA() {
        const sql = `
            CREATE TABLE IF NOT EXISTS ai_analysis (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) DEFAULT 1,
                symbol VARCHAR(20) NOT NULL,
                signal_type VARCHAR(10) NOT NULL DEFAULT 'hold',
                confidence_score DECIMAL(5,4) DEFAULT 0.5,
                source VARCHAR(100) DEFAULT 'AI_Guardian',
                analysis_type VARCHAR(50) NOT NULL DEFAULT 'signal_analysis',
                input_data JSONB DEFAULT '{}',
                output_data JSONB DEFAULT '{}',
                ai_model VARCHAR(50) DEFAULT 'basic',
                reasoning TEXT DEFAULT 'Análise automática',
                market_conditions JSONB DEFAULT '{}',
                processing_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
            CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON ai_analysis(symbol);
        `;

        if (this.pool && !this.pool.ended) {
            await this.pool.query(sql);
        }
        console.log('✅ Tabela ai_analysis verificada/criada');
    }

    async analisarSinal(dadosSinal) {
        const inicioTempo = Date.now();
        
        try {
            console.log(`🔍 Analisando sinal: ${dadosSinal.symbol}`);
            
            // Realizar análise básica
            const analise = await this.analisarBasico(dadosSinal);
            
            // Calcular tempo de processamento
            analise.processing_time = Date.now() - inicioTempo;
            
            // Salvar análise
            await this.salvarAnalise(analise);
            
            this.metricas.analises_realizadas++;
            this.metricas.ultima_atualizacao = new Date();
            
            console.log(`✅ Análise concluída: ${analise.signal_type} (${(analise.confidence_score*100).toFixed(1)}%)`);
            return analise;
            
        } catch (error) {
            console.error('❌ Erro na análise do sinal:', error.message);
            
            return {
                symbol: dadosSinal.symbol || 'UNKNOWN',
                signal_type: 'hold',
                confidence_score: 0.5,
                source: 'AI_Guardian_Error',
                reasoning: `Erro na análise: ${error.message}`,
                processing_time: Date.now() - inicioTempo
            };
        }
    }

    async analisarBasico(dadosSinal) {
        console.log('⚙️ Utilizando análise básica...');
        
        // Simular análise com base em dados do sinal
        let signalType = 'hold';
        let confidence = 0.6;
        let reasoning = 'Análise neutra';
        
        // Lógica de análise simplificada
        if (dadosSinal.confidence_score && dadosSinal.confidence_score > 0.7) {
            signalType = dadosSinal.signal_type || 'buy';
            confidence = 0.75;
            reasoning = 'Sinal com alta confiança';
        } else if (dadosSinal.confidence_score && dadosSinal.confidence_score < 0.4) {
            signalType = 'hold';
            confidence = 0.5;
            reasoning = 'Sinal com baixa confiança - aguardar';
        }
        
        return {
            symbol: dadosSinal.symbol,
            signal_type: signalType,
            confidence_score: confidence,
            source: 'AI_Guardian_Basic',
            reasoning: reasoning,
            ai_model: 'basic_analysis',
            input_data: dadosSinal,
            analysis_type: 'basic_technical'
        };
    }

    async tomarDecisao(sinalId, userId, dadosSinal) {
        try {
            console.log(`🎯 Tomando decisão para sinal ${sinalId} do usuário ${userId}`);
            
            // Realizar análise do sinal
            const analise = await this.analisarSinal(dadosSinal);
            
            // Decidir com base na análise
            let acao = 'allow';
            let confianca = analise.confidence_score;
            let justificativa = analise.reasoning;

            // Aplicar regras de decisão
            if (analise.confidence_score < 0.6) {
                acao = 'block';
                justificativa = 'Confiança baixa do sinal';
            }

            const decisao = { acao, confianca, justificativa };
            
            this.metricas.decisoes_tomadas++;
            
            if (decisao.acao === 'allow') {
                this.metricas.sinais_aprovados++;
            } else {
                this.metricas.sinais_bloqueados++;
            }
            
            console.log(`✅ Decisão tomada: ${decisao.acao} (${(decisao.confianca*100).toFixed(1)}%)`);
            return decisao;
            
        } catch (error) {
            console.error('❌ Erro ao tomar decisão:', error.message);
            
            return {
                acao: 'block',
                confianca: 0.3,
                justificativa: `Erro na análise: ${error.message}`
            };
        }
    }

    async salvarAnalise(dadosAnalise) {
        try {
            if (this.pool && !this.pool.ended) {
                await this.pool.query(`
                    INSERT INTO ai_analysis (
                        symbol, signal_type, confidence_score, source, analysis_type,
                        input_data, output_data, ai_model, reasoning, 
                        processing_time, user_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    dadosAnalise.symbol, dadosAnalise.signal_type, dadosAnalise.confidence_score,
                    dadosAnalise.source, dadosAnalise.analysis_type || 'signal_analysis',
                    JSON.stringify(dadosAnalise.input_data || {}),
                    JSON.stringify(dadosAnalise.output_data || {}),
                    dadosAnalise.ai_model || 'basic', dadosAnalise.reasoning,
                    dadosAnalise.processing_time, dadosAnalise.user_id || 1
                ]);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar análise:', error.message);
        }
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: {
                ...this.metricas,
                openai_disponivel: !!this.openaiKey
            }
        };
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        
        if (this.pool && !this.pool.ended) {
            await this.pool.end();
        }
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new AIGuardian();
    componente.inicializar().catch(console.error);
}

module.exports = AIGuardian;

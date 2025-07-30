#!/usr/bin/env node

/**
 * 📡 SIGNAL PROCESSOR - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Processador de sinais de trading com múltiplas fontes
 * Análise técnica, fundamental e processamento em tempo real
 */

const { Pool } = require('pg');
const WebSocket = require('ws');

class SignalProcessor {
    constructor() {
        this.id = 'signal-processor';
        this.nome = 'Signal Processor';
        this.tipo = 'signal';
        this.status = 'inicializando';
        this.dependencias = ['database-manager'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            sinais_processados: 0,
            sinais_validos: 0,
            sinais_rejeitados: 0,
            fontes_ativas: 0,
            ultima_atualizacao: null
        };

        this.fontesAtivas = new Map();
        this.filaSinais = [];
        this.configuracoes = {
            max_sinais_por_minuto: 100,
            timeout_validacao: 5000, // 5 segundos
            min_confidence_score: 0.6,
            symbols_permitidos: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'XRPUSDT']
        };

        this.indicadoresTecnicos = new Map();
        this.dadosMercado = new Map();
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Inicializar estrutura de dados
            await this.inicializarEstruturaDados();
            
            // Configurar fontes de sinais
            await this.configurarFontesSinais();
            
            // Inicializar análise técnica
            await this.inicializarAnaliseTecnica();
            
            // Configurar processamento contínuo
            await this.configurarProcessamentoContinuo();
            
            // Conectar WebSocket para dados em tempo real
            await this.conectarWebSocketBybit();
            
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

    async inicializarEstruturaDados() {
        console.log('🏗️ Inicializando estrutura de dados...');
        
        // Criar tabela de sinais
        await this.criarTabelaSinais();
        
        // Criar tabela de fontes
        await this.criarTabelaFontes();
        
        // Criar tabela de análises técnicas
        await this.criarTabelaAnalisesTecnicas();
    }

    async criarTabelaSinais() {
        const sql = `
            CREATE TABLE IF NOT EXISTS trading_signals (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                signal_type VARCHAR(20) NOT NULL, -- buy, sell, hold
                source VARCHAR(50) NOT NULL,
                confidence_score DECIMAL(5,4) NOT NULL,
                entry_price DECIMAL(20,8),
                stop_loss DECIMAL(20,8),
                take_profit DECIMAL(20,8),
                volume_suggested DECIMAL(20,8),
                timeframe VARCHAR(10),
                technical_indicators JSONB,
                market_data JSONB,
                reasoning TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, executed
                validity_score DECIMAL(5,4),
                ai_analysis JSONB
            );

            CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
            CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at);
            CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
            CREATE INDEX IF NOT EXISTS idx_trading_signals_source ON trading_signals(source);
        `;

        await this.pool.query(sql);
        console.log('✅ Tabela trading_signals verificada/criada');
    }

    async criarTabelaFontes() {
        const sql = `
            CREATE TABLE IF NOT EXISTS signal_sources (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                type VARCHAR(50) NOT NULL, -- api, manual, ai, technical, news
                endpoint_url VARCHAR(500),
                api_key_required BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
                reliability_score DECIMAL(5,4) DEFAULT 0.5,
                signals_processed INTEGER DEFAULT 0,
                signals_successful INTEGER DEFAULT 0,
                last_signal_at TIMESTAMP,
                configuration JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_signal_sources_status ON signal_sources(status);
            CREATE INDEX IF NOT EXISTS idx_signal_sources_type ON signal_sources(type);
        `;

        await this.pool.query(sql);
        console.log('✅ Tabela signal_sources verificada/criada');
    }

    async criarTabelaAnalisesTecnicas() {
        const sql = `
            CREATE TABLE IF NOT EXISTS technical_analysis (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                timeframe VARCHAR(10) NOT NULL,
                rsi DECIMAL(8,4),
                macd DECIMAL(15,8),
                macd_signal DECIMAL(15,8),
                bb_upper DECIMAL(20,8),
                bb_middle DECIMAL(20,8),
                bb_lower DECIMAL(20,8),
                sma_20 DECIMAL(20,8),
                sma_50 DECIMAL(20,8),
                sma_200 DECIMAL(20,8),
                ema_12 DECIMAL(20,8),
                ema_26 DECIMAL(20,8),
                volume DECIMAL(25,8),
                price DECIMAL(20,8),
                price_change DECIMAL(15,8),
                analysis_score DECIMAL(5,4),
                trend_direction VARCHAR(10), -- bullish, bearish, neutral
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_technical_analysis_symbol ON technical_analysis(symbol);
            CREATE INDEX IF NOT EXISTS idx_technical_analysis_created_at ON technical_analysis(created_at);
        `;

        await this.pool.query(sql);
        console.log('✅ Tabela technical_analysis verificada/criada');
    }

    async configurarFontesSinais() {
        console.log('📡 Configurando fontes de sinais...');
        
        // Definir fontes padrão
        const fontesDefaut = [
            {
                name: 'Bybit_Technical_Analysis',
                type: 'technical',
                reliability_score: 0.75,
                configuration: { symbols: this.configuracoes.symbols_permitidos }
            },
            {
                name: 'AI_Signal_Generator',
                type: 'ai',
                reliability_score: 0.80,
                configuration: { model: 'v3.0', confidence_threshold: 0.7 }
            },
            {
                name: 'Manual_Expert_Signals',
                type: 'manual',
                reliability_score: 0.85,
                configuration: { expert_level: 'premium' }
            },
            {
                name: 'Market_News_Sentiment',
                type: 'news',
                reliability_score: 0.60,
                configuration: { sentiment_threshold: 0.6 }
            }
        ];

        // Inserir fontes no banco
        for (const fonte of fontesDefaut) {
            await this.adicionarFonteSeNaoExistir(fonte);
        }

        // Carregar fontes ativas
        await this.carregarFontesAtivas();
    }

    async adicionarFonteSeNaoExistir(fonte) {
        try {
            const existe = await this.pool.query(
                'SELECT id FROM signal_sources WHERE name = $1',
                [fonte.name]
            );

            if (existe.rows.length === 0) {
                await this.pool.query(`
                    INSERT INTO signal_sources (name, type, reliability_score, configuration)
                    VALUES ($1, $2, $3, $4)
                `, [fonte.name, fonte.type, fonte.reliability_score, JSON.stringify(fonte.configuration)]);
                
                console.log(`✅ Fonte adicionada: ${fonte.name}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao adicionar fonte ${fonte.name}:`, error.message);
        }
    }

    async carregarFontesAtivas() {
        try {
            const result = await this.pool.query(`
                SELECT * FROM signal_sources 
                WHERE status = 'active'
                ORDER BY reliability_score DESC
            `);

            for (const fonte of result.rows) {
                this.fontesAtivas.set(fonte.name, {
                    id: fonte.id,
                    type: fonte.type,
                    reliability: fonte.reliability_score,
                    config: fonte.configuration,
                    stats: {
                        processed: fonte.signals_processed,
                        successful: fonte.signals_successful
                    }
                });
            }

            this.metricas.fontes_ativas = this.fontesAtivas.size;
            console.log(`📊 Fontes ativas carregadas: ${this.metricas.fontes_ativas}`);

        } catch (error) {
            console.error('❌ Erro ao carregar fontes:', error.message);
        }
    }

    async inicializarAnaliseTecnica() {
        console.log('📈 Inicializando análise técnica...');
        
        // Carregar dados históricos para cada símbolo
        for (const symbol of this.configuracoes.symbols_permitidos) {
            await this.carregarDadosHistoricos(symbol);
        }
    }

    async carregarDadosHistoricos(symbol) {
        try {
            // Simular carregamento de dados históricos
            console.log(`📊 Carregando dados históricos para ${symbol}...`);
            
            // Em produção, faria chamada real para API Bybit
            const dadosHistoricos = await this.simularDadosHistoricos(symbol);
            
            // Calcular indicadores técnicos
            const indicadores = await this.calcularIndicadoresTecnicos(dadosHistoricos);
            
            // Armazenar em cache
            this.indicadoresTecnicos.set(symbol, indicadores);
            this.dadosMercado.set(symbol, dadosHistoricos.slice(-50)); // Últimas 50 velas
            
            // Salvar análise no banco
            await this.salvarAnaliseTecnica(symbol, indicadores);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar dados de ${symbol}:`, error.message);
        }
    }

    async simularDadosHistoricos(symbol) {
        // Simular dados de velas (em produção usaria API real)
        const dados = [];
        let preco = 50000; // Preço base para BTC
        
        if (symbol === 'ETHUSDT') preco = 3000;
        else if (symbol === 'ADAUSDT') preco = 0.5;
        else if (symbol === 'BNBUSDT') preco = 300;
        else if (symbol === 'XRPUSDT') preco = 0.6;

        for (let i = 0; i < 200; i++) {
            const variacao = (Math.random() - 0.5) * 0.05; // ±2.5%
            preco = preco * (1 + variacao);
            
            dados.push({
                timestamp: Date.now() - (200 - i) * 60000, // Dados por minuto
                open: preco * 0.999,
                high: preco * 1.002,
                low: preco * 0.998,
                close: preco,
                volume: Math.random() * 1000000
            });
        }

        return dados;
    }

    async calcularIndicadoresTecnicos(dados) {
        const closes = dados.map(d => d.close);
        const volumes = dados.map(d => d.volume);
        
        // RSI (14 períodos)
        const rsi = this.calcularRSI(closes, 14);
        
        // MACD (12, 26, 9)
        const macd = this.calcularMACD(closes, 12, 26, 9);
        
        // Bollinger Bands (20, 2)
        const bb = this.calcularBollingerBands(closes, 20, 2);
        
        // Médias móveis
        const sma20 = this.calcularSMA(closes, 20);
        const sma50 = this.calcularSMA(closes, 50);
        const sma200 = this.calcularSMA(closes, 200);
        
        const ema12 = this.calcularEMA(closes, 12);
        const ema26 = this.calcularEMA(closes, 26);

        // Calcular score geral
        const analysisScore = this.calcularScoreAnalise({
            rsi: rsi[rsi.length - 1],
            macd: macd.macd[macd.macd.length - 1],
            price: closes[closes.length - 1],
            sma20: sma20[sma20.length - 1],
            sma50: sma50[sma50.length - 1]
        });

        return {
            rsi: rsi[rsi.length - 1],
            macd: macd.macd[macd.macd.length - 1],
            macd_signal: macd.signal[macd.signal.length - 1],
            bb_upper: bb.upper[bb.upper.length - 1],
            bb_middle: bb.middle[bb.middle.length - 1],
            bb_lower: bb.lower[bb.lower.length - 1],
            sma_20: sma20[sma20.length - 1],
            sma_50: sma50[sma50.length - 1],
            sma_200: sma200[sma200.length - 1],
            ema_12: ema12[ema12.length - 1],
            ema_26: ema26[ema26.length - 1],
            volume: volumes[volumes.length - 1],
            price: closes[closes.length - 1],
            price_change: ((closes[closes.length - 1] / closes[closes.length - 2]) - 1) * 100,
            analysis_score: analysisScore,
            trend_direction: this.determinarTendencia(analysisScore)
        };
    }

    calcularRSI(prices, period) {
        const rsi = [];
        let gains = 0;
        let losses = 0;

        // Primeira média
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change >= 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));

        // RSI seguintes
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change >= 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }

        return rsi;
    }

    calcularMACD(prices, fastPeriod, slowPeriod, signalPeriod) {
        const emaFast = this.calcularEMA(prices, fastPeriod);
        const emaSlow = this.calcularEMA(prices, slowPeriod);
        
        const macdLine = [];
        for (let i = 0; i < emaFast.length; i++) {
            macdLine.push(emaFast[i] - emaSlow[i]);
        }
        
        const signalLine = this.calcularEMA(macdLine, signalPeriod);
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: macdLine.map((m, i) => m - (signalLine[i] || 0))
        };
    }

    calcularBollingerBands(prices, period, multiplier) {
        const sma = this.calcularSMA(prices, period);
        const upper = [];
        const lower = [];

        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const mean = sma[i - period + 1];
            const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
            const stdDev = Math.sqrt(variance);

            upper.push(mean + (stdDev * multiplier));
            lower.push(mean - (stdDev * multiplier));
        }

        return {
            upper: upper,
            middle: sma.slice(period - 1),
            lower: lower
        };
    }

    calcularSMA(prices, period) {
        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    calcularEMA(prices, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        // Primeira EMA é a SMA
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += prices[i];
        }
        ema.push(sum / period);

        // EMAs seguintes
        for (let i = period; i < prices.length; i++) {
            ema.push((prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier)));
        }

        return ema;
    }

    calcularScoreAnalise(indicadores) {
        let score = 0.5; // Neutro

        // RSI
        if (indicadores.rsi < 30) score += 0.2; // Oversold - bullish
        else if (indicadores.rsi > 70) score -= 0.2; // Overbought - bearish

        // MACD
        if (indicadores.macd > 0) score += 0.1;
        else score -= 0.1;

        // Tendência de preço vs médias
        if (indicadores.price > indicadores.sma20) score += 0.1;
        if (indicadores.price > indicadores.sma50) score += 0.1;

        return Math.max(0, Math.min(1, score));
    }

    determinarTendencia(score) {
        if (score > 0.6) return 'bullish';
        if (score < 0.4) return 'bearish';
        return 'neutral';
    }

    async salvarAnaliseTecnica(symbol, indicadores) {
        try {
            await this.pool.query(`
                INSERT INTO technical_analysis (
                    symbol, timeframe, rsi, macd, macd_signal,
                    bb_upper, bb_middle, bb_lower,
                    sma_20, sma_50, sma_200,
                    ema_12, ema_26, volume, price, price_change,
                    analysis_score, trend_direction
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            `, [
                symbol, '1m',
                indicadores.rsi, indicadores.macd, indicadores.macd_signal,
                indicadores.bb_upper, indicadores.bb_middle, indicadores.bb_lower,
                indicadores.sma_20, indicadores.sma_50, indicadores.sma_200,
                indicadores.ema_12, indicadores.ema_26,
                indicadores.volume, indicadores.price, indicadores.price_change,
                indicadores.analysis_score, indicadores.trend_direction
            ]);

        } catch (error) {
            console.error(`❌ Erro ao salvar análise técnica de ${symbol}:`, error.message);
        }
    }

    async configurarProcessamentoContinuo() {
        console.log('⚙️ Configurando processamento contínuo...');

        // Processar fila de sinais a cada 2 segundos
        setInterval(async () => {
            await this.processarFilaSinais();
        }, 2000);

        // Gerar sinais técnicos a cada 1 minuto
        setInterval(async () => {
            await this.gerarSinaisTecnicos();
        }, 60000);

        // Atualizar análises técnicas a cada 5 minutos
        setInterval(async () => {
            await this.atualizarAnalisesTecnicas();
        }, 300000);

        // Verificar fontes ativas a cada 30 segundos
        setInterval(async () => {
            await this.verificarFontesAtivas();
        }, 30000);
    }

    async conectarWebSocketBybit() {
        try {
            console.log('🔌 Conectando WebSocket Bybit...');
            
            // Simular conexão WebSocket (em produção usar wss://stream.bybit.com/v5/public/linear)
            this.ws = {
                connected: true,
                symbols: this.configuracoes.symbols_permitidos
            };

            // Simular recebimento de dados em tempo real
            setInterval(() => {
                this.simularDadosTempoReal();
            }, 1000);

            console.log('✅ WebSocket Bybit conectado');

        } catch (error) {
            console.error('❌ Erro ao conectar WebSocket:', error.message);
        }
    }

    simularDadosTempoReal() {
        // Simular dados de preço em tempo real
        for (const symbol of this.configuracoes.symbols_permitidos) {
            const dadosAtuais = this.dadosMercado.get(symbol);
            if (dadosAtuais && dadosAtuais.length > 0) {
                const ultimoPreco = dadosAtuais[dadosAtuais.length - 1].close;
                const variacao = (Math.random() - 0.5) * 0.02; // ±1%
                const novoPreco = ultimoPreco * (1 + variacao);

                // Atualizar dados em cache
                this.atualizarDadosTempoReal(symbol, novoPreco);
            }
        }
    }

    atualizarDadosTempoReal(symbol, preco) {
        const dadosAtuais = this.dadosMercado.get(symbol) || [];
        
        // Adicionar nova vela
        const novaVela = {
            timestamp: Date.now(),
            open: preco * 0.999,
            high: preco * 1.001,
            low: preco * 0.999,
            close: preco,
            volume: Math.random() * 100000
        };

        dadosAtuais.push(novaVela);
        
        // Manter apenas últimas 50 velas
        if (dadosAtuais.length > 50) {
            dadosAtuais.shift();
        }

        this.dadosMercado.set(symbol, dadosAtuais);
    }

    async processarSinal(dadosSinal) {
        try {
            console.log(`📡 Processando sinal: ${dadosSinal.symbol} ${dadosSinal.signal_type}`);

            // Validar sinal
            const validacao = await this.validarSinal(dadosSinal);
            if (!validacao.valido) {
                console.log(`❌ Sinal rejeitado: ${validacao.motivo}`);
                this.metricas.sinais_rejeitados++;
                return null;
            }

            // Enriquecer sinal com análise técnica
            const sinalEnriquecido = await this.enriquecerSinal(dadosSinal);

            // Salvar sinal no banco
            const sinalId = await this.salvarSinal(sinalEnriquecido);

            this.metricas.sinais_processados++;
            this.metricas.sinais_validos++;
            this.metricas.ultima_atualizacao = new Date();

            console.log(`✅ Sinal processado: ID ${sinalId}`);
            return sinalId;

        } catch (error) {
            console.error('❌ Erro ao processar sinal:', error.message);
            this.metricas.sinais_rejeitados++;
            return null;
        }
    }

    async analisarSinal(symbol, timeframe = '1m') {
        try {
            console.log(`🔍 Analisando sinal: ${symbol} [${timeframe}]`);

            // Carregar dados históricos se necessário
            if (!this.dadosMercado.has(symbol)) {
                await this.carregarDadosHistoricos(symbol);
            }

            // Gerar análise técnica
            const analise = await this.gerarAnaliseTecnica(symbol);
            if (!analise) {
                return {
                    symbol,
                    signal_type: 'hold',
                    confidence_score: 0.5,
                    source: 'SignalProcessor_Technical',
                    reasoning: 'Dados insuficientes para análise'
                };
            }

            // Determinar tipo de sinal baseado na análise
            let signalType = 'hold';
            let confidence = 0.5;
            let reasoning = [];

            // Análise RSI
            if (analise.rsi < 30) {
                signalType = 'buy';
                confidence += 0.2;
                reasoning.push('RSI oversold');
            } else if (analise.rsi > 70) {
                signalType = 'sell';
                confidence += 0.2;
                reasoning.push('RSI overbought');
            }

            // Análise MACD
            if (analise.macd > analise.macd_signal) {
                if (signalType === 'buy' || signalType === 'hold') {
                    signalType = 'buy';
                    confidence += 0.15;
                    reasoning.push('MACD bullish');
                }
            } else {
                if (signalType === 'sell' || signalType === 'hold') {
                    signalType = 'sell';
                    confidence += 0.15;
                    reasoning.push('MACD bearish');
                }
            }

            // Análise de tendência com médias móveis
            if (analise.sma_20 > analise.sma_50 && analise.price > analise.sma_20) {
                if (signalType === 'buy' || signalType === 'hold') {
                    signalType = 'buy';
                    confidence += 0.1;
                    reasoning.push('Tendência de alta');
                }
            } else if (analise.sma_20 < analise.sma_50 && analise.price < analise.sma_20) {
                if (signalType === 'sell' || signalType === 'hold') {
                    signalType = 'sell';
                    confidence += 0.1;
                    reasoning.push('Tendência de baixa');
                }
            }

            // Análise de volume
            if (analise.volume > 1.5) { // Volume acima da média
                confidence += 0.05;
                reasoning.push('Volume confirmando');
            }

            // Garantir que confidence não exceda 0.95
            confidence = Math.min(0.95, confidence);

            const sinalGerado = {
                symbol,
                signal_type: signalType,
                confidence_score: confidence,
                source: 'SignalProcessor_Technical',
                entry_price: analise.price,
                stop_loss: signalType === 'buy' 
                    ? analise.price * 0.98 
                    : analise.price * 1.02,
                take_profit: signalType === 'buy' 
                    ? analise.price * 1.04 
                    : analise.price * 0.96,
                timeframe,
                reasoning: reasoning.length > 0 ? reasoning.join(', ') : 'Análise neutra',
                technical_data: analise
            };

            console.log(`✅ Sinal analisado: ${symbol} → ${signalType} (${(confidence*100).toFixed(1)}%)`);
            return sinalGerado;

        } catch (error) {
            console.error(`❌ Erro ao analisar sinal ${symbol}:`, error.message);
            return {
                symbol,
                signal_type: 'hold',
                confidence_score: 0.3,
                source: 'SignalProcessor_Error',
                reasoning: `Erro na análise: ${error.message}`
            };
        }
    }

    async validarSinal(sinal) {
        // Validações básicas
        if (!sinal.symbol || !sinal.signal_type || !sinal.source) {
            return { valido: false, motivo: 'Dados obrigatórios ausentes' };
        }

        if (!this.configuracoes.symbols_permitidos.includes(sinal.symbol)) {
            return { valido: false, motivo: 'Símbolo não permitido' };
        }

        if (!['buy', 'sell', 'hold'].includes(sinal.signal_type)) {
            return { valido: false, motivo: 'Tipo de sinal inválido' };
        }

        if (sinal.confidence_score < this.configuracoes.min_confidence_score) {
            return { valido: false, motivo: 'Score de confiança muito baixo' };
        }

        // Verificar se fonte é confiável
        const fonte = this.fontesAtivas.get(sinal.source);
        if (!fonte || fonte.reliability < 0.5) {
            return { valido: false, motivo: 'Fonte não confiável' };
        }

        return { valido: true };
    }

    async enriquecerSinal(sinal) {
        // Adicionar análise técnica atual
        const indicadores = this.indicadoresTecnicos.get(sinal.symbol);
        const dadosMercado = this.dadosMercado.get(sinal.symbol);

        const sinalEnriquecido = {
            ...sinal,
            technical_indicators: indicadores,
            market_data: {
                current_price: dadosMercado ? dadosMercado[dadosMercado.length - 1].close : null,
                volume_24h: dadosMercado ? dadosMercado.slice(-24).reduce((sum, d) => sum + d.volume, 0) : null,
                price_change_1h: this.calcularMudancaPreco(dadosMercado, 60)
            },
            validity_score: this.calcularScoreValidacao(sinal, indicadores),
            processed_at: new Date()
        };

        return sinalEnriquecido;
    }

    calcularMudancaPreco(dados, periodos) {
        if (!dados || dados.length < periodos) return 0;
        
        const precoAtual = dados[dados.length - 1].close;
        const precoAnterior = dados[dados.length - periodos].close;
        
        return ((precoAtual / precoAnterior) - 1) * 100;
    }

    calcularScoreValidacao(sinal, indicadores) {
        let score = sinal.confidence_score || 0.5;

        if (indicadores) {
            // Ajustar score baseado em indicadores técnicos
            if (sinal.signal_type === 'buy' && indicadores.trend_direction === 'bullish') {
                score += 0.1;
            } else if (sinal.signal_type === 'sell' && indicadores.trend_direction === 'bearish') {
                score += 0.1;
            }

            // RSI confirma o sinal?
            if (sinal.signal_type === 'buy' && indicadores.rsi < 40) {
                score += 0.05;
            } else if (sinal.signal_type === 'sell' && indicadores.rsi > 60) {
                score += 0.05;
            }
        }

        // Limitar score entre 0 e 1
        return Math.max(0, Math.min(1, score));
    }

    async salvarSinal(sinal) {
        try {
            const result = await this.pool.query(`
                INSERT INTO trading_signals (
                    symbol, signal_type, source, confidence_score,
                    entry_price, stop_loss, take_profit, volume_suggested,
                    timeframe, technical_indicators, market_data,
                    reasoning, validity_score, processed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id
            `, [
                sinal.symbol, sinal.signal_type, sinal.source, sinal.confidence_score,
                sinal.entry_price, sinal.stop_loss, sinal.take_profit, sinal.volume_suggested,
                sinal.timeframe, JSON.stringify(sinal.technical_indicators),
                JSON.stringify(sinal.market_data), sinal.reasoning,
                sinal.validity_score, sinal.processed_at
            ]);

            return result.rows[0].id;

        } catch (error) {
            console.error('❌ Erro ao salvar sinal:', error.message);
            return null;
        }
    }

    async processarFilaSinais() {
        if (this.filaSinais.length === 0) return;

        const sinal = this.filaSinais.shift();
        await this.processarSinal(sinal);
    }

    async gerarSinaisTecnicos() {
        try {
            for (const symbol of this.configuracoes.symbols_permitidos) {
                const indicadores = this.indicadoresTecnicos.get(symbol);
                if (!indicadores) continue;

                const sinalTecnico = this.analisarIndicadoresTecnicos(symbol, indicadores);
                if (sinalTecnico) {
                    await this.processarSinal(sinalTecnico);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao gerar sinais técnicos:', error.message);
        }
    }

    analisarIndicadoresTecnicos(symbol, indicadores) {
        let sinalTipo = 'hold';
        let confidence = 0.5;
        let reasoning = [];

        // Análise RSI
        if (indicadores.rsi < 30) {
            sinalTipo = 'buy';
            confidence += 0.2;
            reasoning.push('RSI indica oversold');
        } else if (indicadores.rsi > 70) {
            sinalTipo = 'sell';
            confidence += 0.2;
            reasoning.push('RSI indica overbought');
        }

        // Análise MACD
        if (indicadores.macd > indicadores.macd_signal) {
            if (sinalTipo === 'buy' || sinalTipo === 'hold') {
                sinalTipo = 'buy';
                confidence += 0.1;
                reasoning.push('MACD bullish');
            }
        } else {
            if (sinalTipo === 'sell' || sinalTipo === 'hold') {
                sinalTipo = 'sell';
                confidence += 0.1;
                reasoning.push('MACD bearish');
            }
        }

        // Análise Bollinger Bands
        if (indicadores.price <= indicadores.bb_lower) {
            sinalTipo = 'buy';
            confidence += 0.15;
            reasoning.push('Preço na banda inferior de Bollinger');
        } else if (indicadores.price >= indicadores.bb_upper) {
            sinalTipo = 'sell';
            confidence += 0.15;
            reasoning.push('Preço na banda superior de Bollinger');
        }

        // Só gerar sinal se confidence for suficiente
        if (confidence < this.configuracoes.min_confidence_score) {
            return null;
        }

        return {
            symbol: symbol,
            signal_type: sinalTipo,
            source: 'Bybit_Technical_Analysis',
            confidence_score: Math.min(0.95, confidence),
            entry_price: indicadores.price,
            stop_loss: sinalTipo === 'buy' 
                ? indicadores.price * 0.98 
                : indicadores.price * 1.02,
            take_profit: sinalTipo === 'buy' 
                ? indicadores.price * 1.04 
                : indicadores.price * 0.96,
            timeframe: '1m',
            reasoning: reasoning.join('; ')
        };
    }

    async atualizarAnalisesTecnicas() {
        console.log('🔄 Atualizando análises técnicas...');
        
        for (const symbol of this.configuracoes.symbols_permitidos) {
            await this.carregarDadosHistoricos(symbol);
        }
    }

    async verificarFontesAtivas() {
        // Verificar se todas as fontes estão respondendo
        for (const [nome, fonte] of this.fontesAtivas) {
            // Simular verificação de saúde da fonte
            if (Math.random() > 0.95) { // 5% chance de erro simulado
                console.log(`⚠️ Fonte ${nome} apresentando problemas`);
            }
        }
    }

    adicionarSinalAFila(sinal) {
        if (this.filaSinais.length < this.configuracoes.max_sinais_por_minuto) {
            this.filaSinais.push(sinal);
            return true;
        }
        
        console.log('⚠️ Fila de sinais cheia, descartando sinal');
        return false;
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: {
                ...this.metricas,
                fila_sinais: this.filaSinais.length,
                websocket_conectado: this.ws?.connected || false
            }
        };
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        
        if (this.ws?.close) {
            this.ws.close();
        }
        
        await this.pool.end();
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new SignalProcessor();
    componente.inicializar().catch(console.error);
}

module.exports = SignalProcessor;
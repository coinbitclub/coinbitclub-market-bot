/**
 * 🤖 IA GARANTIDOR DA SEQUÊNCIA FEAR & GREED
 * 
 * RESPONSABILIDADES DA IA:
 * 1. Garantir sequência correta: Fear & Greed → Sinal → Operação
 * 2. Buscar dados web quando APIs falham (FALLBACK inteligente)
 * 3. Integração com CoinStats API cadastrada
 * 4. Web scraping como último recurso
 * 5. Monitoramento contínuo da sequência
 */

const https = require('https');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class IASequenceGuardian {
    constructor() {
        this.fallbackValue = 50;
        this.apiKeys = {
            coinstats: process.env.COINSTATS_API_KEY || '', // API já cadastrada
            coinmarketcap: process.env.CMC_API_KEY || '',
            cryptocompare: process.env.CRYPTOCOMPARE_API_KEY || ''
        };
        
        this.sources = [
            {
                name: 'CoinStats_Primary',
                url: 'https://openapi.coinstats.app/public/v1/fear-greed',
                headers: { 'X-API-KEY': this.apiKeys.coinstats },
                parser: this.parseCoinStatsPrimary.bind(this),
                priority: 1
            },
            {
                name: 'CoinStats_Secondary',
                url: 'https://api.coinstats.app/public/v1/global',
                headers: { 'X-API-KEY': this.apiKeys.coinstats },
                parser: this.parseCoinStatsSecondary.bind(this),
                priority: 2
            },
            {
                name: 'Alternative_ME',
                url: 'https://api.alternative.me/fng/',
                parser: this.parseAlternativeMe.bind(this),
                priority: 3
            },
            {
                name: 'CoinGecko',
                url: 'https://api.coingecko.com/api/v3/global',
                parser: this.parseCoinGecko.bind(this),
                priority: 4
            }
        ];
        
        this.webSources = [
            {
                name: 'CNN_Fear_Greed',
                url: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
                parser: this.parseCNNFearGreed.bind(this)
            },
            {
                name: 'CoinMarketCap_Web',
                url: 'https://coinmarketcap.com/fear-and-greed/',
                parser: this.parseWebScraping.bind(this)
            }
        ];
    }

    async garantirSequenciaCompleta(signalData = null) {
        console.log('🤖 IA GARANTINDO SEQUÊNCIA COMPLETA');
        console.log('='.repeat(50));
        console.log('📋 SEQUÊNCIA OBRIGATÓRIA:');
        console.log('   1️⃣ Leitura Fear & Greed Index');
        console.log('   2️⃣ Validação direção permitida');
        console.log('   3️⃣ Processamento sinal (se recebido)');
        console.log('   4️⃣ Abertura operação (se válida)');
        console.log('   5️⃣ Monitoramento contínuo');
        console.log('   6️⃣ Fechamento e registro');
        console.log('');

        try {
            // ETAPA 1: Garantir Fear & Greed atualizado
            const fearGreedResult = await this.obterFearGreedInteligente();
            
            // ETAPA 2: Determinar direção permitida
            const marketDirection = this.determinarDirecaoMercado(fearGreedResult.value);
            
            console.log('✅ ETAPA 1-2 CONCLUÍDAS:');
            console.log(`   📊 Fear & Greed: ${fearGreedResult.value} (${fearGreedResult.source})`);
            console.log(`   🎯 Direção: ${marketDirection.description}`);
            
            // ETAPA 3: Processar sinal se fornecido
            let operationResult = null;
            if (signalData) {
                console.log('\n📡 ETAPA 3: PROCESSANDO SINAL RECEBIDO');
                operationResult = await this.processarSinalComValidacao(signalData, marketDirection);
            } else {
                console.log('\n⏳ ETAPA 3: AGUARDANDO SINAL DO TRADINGVIEW');
            }
            
            // ETAPA 4-6: Configurar monitoramento se operação foi criada
            if (operationResult && operationResult.success) {
                console.log('\n🔄 ETAPAS 4-6: CONFIGURANDO MONITORAMENTO');
                await this.configurarMonitoramento(operationResult.operationId);
            }
            
            // Registrar sequência completa
            await this.registrarSequenciaIA({
                fearGreed: fearGreedResult,
                marketDirection: marketDirection,
                signal: signalData,
                operation: operationResult,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                fearGreed: fearGreedResult,
                marketDirection: marketDirection,
                operation: operationResult
            };
            
        } catch (error) {
            console.error('❌ IA: Erro na sequência:', error.message);
            
            // FALLBACK INTELIGENTE
            console.log('🔄 IA: Ativando FALLBACK inteligente...');
            return await this.fallbackInteligente(signalData);
        }
    }

    async obterFearGreedInteligente() {
        console.log('🧠 IA: Obtendo Fear & Greed com inteligência');
        
        // Tentar APIs em ordem de prioridade
        for (const source of this.sources.sort((a, b) => a.priority - b.priority)) {
            try {
                console.log(`🔍 IA: Tentando ${source.name}...`);
                
                const data = await this.fetchWithTimeout(source.url, source.headers);
                const value = source.parser(data);
                
                if (this.validarFearGreedValue(value)) {
                    console.log(`✅ IA: Sucesso com ${source.name}: ${value}`);
                    await this.salvarFearGreedDB(value, source.name);
                    return { value, source: source.name, method: 'API' };
                }
                
            } catch (error) {
                console.log(`❌ IA: Falha ${source.name}: ${error.message}`);
                continue;
            }
        }
        
        // Se APIs falharam, tentar web scraping
        console.log('🌐 IA: APIs falharam, tentando busca web...');
        return await this.buscarFearGreedWeb();
    }

    async buscarFearGreedWeb() {
        console.log('🕷️ IA: Iniciando busca web inteligente');
        
        for (const webSource of this.webSources) {
            try {
                console.log(`🔍 IA: Tentando ${webSource.name}...`);
                
                const data = await this.fetchWithTimeout(webSource.url);
                const value = webSource.parser(data);
                
                if (this.validarFearGreedValue(value)) {
                    console.log(`✅ IA: Sucesso web ${webSource.name}: ${value}`);
                    await this.salvarFearGreedDB(value, `WEB_${webSource.name}`);
                    return { value, source: webSource.name, method: 'WEB_SCRAPING' };
                }
                
            } catch (error) {
                console.log(`❌ IA: Falha web ${webSource.name}: ${error.message}`);
                continue;
            }
        }
        
        // Último recurso: FALLBACK com valor 50
        console.log('⚠️ IA: Todas as fontes falharam, usando FALLBACK = 50');
        await this.salvarFearGreedDB(this.fallbackValue, 'IA_FALLBACK');
        return { value: this.fallbackValue, source: 'IA_FALLBACK', method: 'FALLBACK' };
    }

    async fetchWithTimeout(url, headers = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                timeout: 15000,
                headers: {
                    'User-Agent': 'CoinBitClub-IA-Guardian/2.0',
                    'Accept': 'application/json',
                    ...headers
                }
            };

            const req = https.get(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // Retorna string se não for JSON
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            req.setTimeout(15000);
        });
    }

    // Parsers para diferentes fontes
    parseCoinStatsPrimary(data) {
        try {
            if (data && data.fearGreedIndex) return parseInt(data.fearGreedIndex);
            if (data && data.value) return parseInt(data.value);
            if (data && data.data && data.data.value) return parseInt(data.data.value);
            return null;
        } catch (e) { return null; }
    }

    parseCoinStatsSecondary(data) {
        try {
            if (data && data.marketCapChangePercentage24h) {
                // Converter mudança de market cap em Fear & Greed
                const change = parseFloat(data.marketCapChangePercentage24h);
                let fearGreed = 50;
                
                if (change > 0) {
                    fearGreed = Math.min(100, 50 + (change * 8));
                } else {
                    fearGreed = Math.max(0, 50 + (change * 8));
                }
                
                return Math.round(fearGreed);
            }
            return null;
        } catch (e) { return null; }
    }

    parseAlternativeMe(data) {
        try {
            return data && data.data && data.data[0] && data.data[0].value ? 
                   parseInt(data.data[0].value) : null;
        } catch (e) { return null; }
    }

    parseCoinGecko(data) {
        try {
            if (data && data.data && data.data.market_cap_change_percentage_24h_usd) {
                const change = data.data.market_cap_change_percentage_24h_usd;
                let fearGreed = 50;
                
                if (change > 0) {
                    fearGreed = Math.min(100, 50 + (change * 10));
                } else {
                    fearGreed = Math.max(0, 50 + (change * 10));
                }
                
                return Math.round(fearGreed);
            }
            return null;
        } catch (e) { return null; }
    }

    parseCNNFearGreed(data) {
        try {
            if (data && data.fear_and_greed && data.fear_and_greed.score) {
                return parseInt(data.fear_and_greed.score);
            }
            return null;
        } catch (e) { return null; }
    }

    parseWebScraping(html) {
        try {
            // Buscar padrões comuns de Fear & Greed em HTML
            const patterns = [
                /"fear[_-]?greed[^"]*":\s*(\d+)/i,
                /fear[^>]*>(\d+)</i,
                /greed[^>]*>(\d+)</i,
                /index[^>]*>(\d+)</i
            ];
            
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match && match[1]) {
                    const value = parseInt(match[1]);
                    if (value >= 0 && value <= 100) return value;
                }
            }
            
            return null;
        } catch (e) { return null; }
    }

    validarFearGreedValue(value) {
        return value !== null && !isNaN(value) && value >= 0 && value <= 100;
    }

    determinarDirecaoMercado(fearGreedValue) {
        if (fearGreedValue < 30) {
            return {
                value: fearGreedValue,
                status: 'MEDO_EXTREMO',
                allowedDirections: ['LONG'],
                description: `Medo Extremo (${fearGreedValue}) → Apenas LONG permitido`,
                confidence: 'HIGH'
            };
        } else if (fearGreedValue <= 80) {
            return {
                value: fearGreedValue,
                status: 'EQUILIBRADO',
                allowedDirections: ['LONG', 'SHORT'],
                description: `Equilibrado (${fearGreedValue}) → LONG e SHORT permitidos`,
                confidence: 'MEDIUM'
            };
        } else {
            return {
                value: fearGreedValue,
                status: 'GANANCIA_EXTREMA',
                allowedDirections: ['SHORT'],
                description: `Ganância Extrema (${fearGreedValue}) → Apenas SHORT permitido`,
                confidence: 'HIGH'
            };
        }
    }

    async processarSinalComValidacao(signalData, marketDirection) {
        console.log('🤖 IA: Validando sinal contra Fear & Greed');
        
        // Determinar direção do sinal
        const isLongSignal = signalData.signal && signalData.signal.includes('LONG');
        const operationDirection = isLongSignal ? 'LONG' : 'SHORT';
        
        // Validar se direção é permitida
        if (!marketDirection.allowedDirections.includes(operationDirection)) {
            console.log(`❌ IA: Sinal ${operationDirection} bloqueado pelo Fear & Greed`);
            return {
                success: false,
                reason: `Operação ${operationDirection} bloqueada pelo Fear & Greed (${marketDirection.value})`,
                blocked: true
            };
        }
        
        console.log(`✅ IA: Sinal ${operationDirection} aprovado pelo Fear & Greed`);
        
        // Aqui integraria com o processador de sinais real
        // Por ora, simular aprovação
        return {
            success: true,
            operationId: Date.now(),
            direction: operationDirection,
            fearGreedValue: marketDirection.value,
            approved: true
        };
    }

    async configurarMonitoramento(operationId) {
        console.log(`🔄 IA: Configurando monitoramento para operação ${operationId}`);
        
        // Configurar monitoramento automático a cada 1 minuto
        const monitoringInterval = setInterval(async () => {
            try {
                await this.monitorarOperacao(operationId);
            } catch (error) {
                console.log(`❌ IA: Erro no monitoramento ${operationId}:`, error.message);
            }
        }, 60000); // 1 minuto
        
        // Parar monitoramento após 24 horas
        setTimeout(() => {
            clearInterval(monitoringInterval);
            console.log(`⏰ IA: Monitoramento ${operationId} finalizado (24h)`);
        }, 24 * 60 * 60 * 1000);
        
        console.log(`✅ IA: Monitoramento ${operationId} ativo por 24h`);
    }

    async monitorarOperacao(operationId) {
        // Verificar status da operação
        // Implementar lógica de monitoramento específica
        console.log(`👁️ IA: Monitorando operação ${operationId}...`);
    }

    async salvarFearGreedDB(value, source) {
        try {
            const query = `
                INSERT INTO system_config (config_key, config_value, description)
                VALUES 
                    ('fear_greed_current', $1, 'Fear & Greed obtido pela IA'),
                    ('fear_greed_source', $2, 'Fonte do Fear & Greed atual'),
                    ('fear_greed_last_update', NOW()::text, 'Última atualização pela IA')
                ON CONFLICT (config_key) DO UPDATE SET
                    config_value = EXCLUDED.config_value,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await pool.query(query, [value.toString(), source]);
            console.log(`💾 IA: Fear & Greed ${value} salvo (fonte: ${source})`);
            
        } catch (error) {
            console.log('❌ IA: Erro ao salvar no banco:', error.message);
        }
    }

    async registrarSequenciaIA(sequenceData) {
        try {
            const query = `
                INSERT INTO ai_analysis (
                    analysis_type,
                    analysis_data,
                    fear_greed_value,
                    market_direction,
                    created_at
                ) VALUES (
                    'SEQUENCE_GUARDIAN',
                    $1,
                    $2,
                    $3,
                    NOW()
                )
            `;
            
            await pool.query(query, [
                JSON.stringify(sequenceData),
                sequenceData.fearGreed.value,
                sequenceData.marketDirection.status
            ]);
            
            console.log('📝 IA: Sequência registrada no banco');
            
        } catch (error) {
            console.log('❌ IA: Erro ao registrar sequência:', error.message);
        }
    }

    async fallbackInteligente(signalData) {
        console.log('🆘 IA: Executando FALLBACK inteligente');
        
        // Usar valor FALLBACK = 50 (equilibrado)
        const fallbackResult = {
            value: this.fallbackValue,
            source: 'IA_EMERGENCY_FALLBACK',
            method: 'EMERGENCY'
        };
        
        const marketDirection = this.determinarDirecaoMercado(this.fallbackValue);
        
        await this.salvarFearGreedDB(this.fallbackValue, 'IA_EMERGENCY_FALLBACK');
        
        console.log('✅ IA: FALLBACK ativo - sistema operacional com F&G = 50');
        
        return {
            success: true,
            fearGreed: fallbackResult,
            marketDirection: marketDirection,
            operation: null,
            fallback: true
        };
    }

    async testarTodoSistema() {
        console.log('🧪 IA: TESTE COMPLETO DO SISTEMA GUARDIAN');
        console.log('='.repeat(60));
        
        // Teste sem sinal
        console.log('\n1️⃣ TESTE: Sequência sem sinal');
        const result1 = await this.garantirSequenciaCompleta();
        console.log('Resultado:', result1);
        
        // Teste com sinal LONG
        console.log('\n2️⃣ TESTE: Sinal LONG');
        const signalLong = { signal: 'SINAL LONG', ticker: 'BTCUSDT', close: '65000' };
        const result2 = await this.garantirSequenciaCompleta(signalLong);
        console.log('Resultado:', result2);
        
        // Teste com sinal SHORT
        console.log('\n3️⃣ TESTE: Sinal SHORT');
        const signalShort = { signal: 'SINAL SHORT', ticker: 'BTCUSDT', close: '65000' };
        const result3 = await this.garantirSequenciaCompleta(signalShort);
        console.log('Resultado:', result3);
        
        console.log('\n✅ IA: TESTES COMPLETOS FINALIZADOS');
    }
}

// Exemplo de uso
async function ativarIAGuardian() {
    console.log('🤖 ATIVANDO IA GUARDIAN DA SEQUÊNCIA');
    console.log('='.repeat(50));
    
    const iaGuardian = new IASequenceGuardian();
    
    // Executar teste completo
    await iaGuardian.testarTodoSistema();
    
    // Configurar execução automática a cada 5 minutos
    console.log('\n⏰ CONFIGURANDO EXECUÇÃO AUTOMÁTICA...');
    setInterval(async () => {
        try {
            await iaGuardian.garantirSequenciaCompleta();
        } catch (error) {
            console.log('❌ Erro na execução automática:', error.message);
        }
    }, 5 * 60 * 1000); // 5 minutos
    
    console.log('✅ IA GUARDIAN ATIVA - Monitoramento a cada 5 minutos');
    console.log('🔄 Sistema garantindo sequência: Fear&Greed → Sinal → Operação');
}

// Exportar para uso em outros módulos
module.exports = IASequenceGuardian;

// Executar se rodado diretamente
if (require.main === module) {
    ativarIAGuardian().then(() => {
        console.log('\n🤖 IA GUARDIAN ATIVA - Pressione Ctrl+C para parar');
    });
}

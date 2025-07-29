/**
 * 🔍 INTEGRAÇÃO FEAR & GREED INDEX - MÚLTIPLAS FONTES
 * 
 * SEQUÊNCIA CORRETA:
 * 1. Leitura do Fear & Greed Index
 * 2. Validação da direção permitida
 * 3. Processamento do sinal de abertura
 * 4. Abertura com especificações corretas
 * 5. Monitoramento contínuo
 * 6. Fechamento (com ou sem sinal)
 * 7. Registro completo da operação
 * 
 * FALLBACK = 50 (equilibrado)
 */

const https = require('https');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class FearGreedIntegration {
    constructor() {
        this.fallbackValue = 50; // Valor padrão quando APIs falham
        this.sources = [
            {
                name: 'Alternative.me',
                url: 'https://api.alternative.me/fng/',
                parser: this.parseAlternativeMe.bind(this)
            },
            {
                name: 'CoinGecko',
                url: 'https://api.coingecko.com/api/v3/global',
                parser: this.parseCoinGecko.bind(this)
            },
            {
                name: 'CoinStats',
                url: 'https://openapiv1.coinstats.app/coins/fear-greed-index',
                parser: this.parseCoinStats.bind(this),
                headers: {
                    'X-API-KEY': process.env.COINSTATS_API_KEY || ''
                }
            }
        ];
    }

    async getFearGreedIndex() {
        console.log('📊 OBTENDO FEAR & GREED INDEX');
        console.log('-'.repeat(40));

        // Tentar cada fonte em sequência
        for (const source of this.sources) {
            try {
                console.log(`🔍 Tentando fonte: ${source.name}`);
                
                const data = await this.fetchFromSource(source);
                const fearGreedValue = source.parser(data);
                
                if (fearGreedValue !== null && fearGreedValue >= 0 && fearGreedValue <= 100) {
                    console.log(`✅ Fear & Greed obtido de ${source.name}: ${fearGreedValue}`);
                    
                    // Salvar no banco para cache
                    await this.saveFearGreedToDatabase(fearGreedValue, source.name);
                    
                    return {
                        value: fearGreedValue,
                        source: source.name,
                        success: true,
                        timestamp: new Date().toISOString()
                    };
                }
                
            } catch (error) {
                console.log(`❌ Erro na fonte ${source.name}: ${error.message}`);
                continue;
            }
        }

        // Se todas as fontes falharam, usar fallback
        console.log(`⚠️ Todas as APIs falharam, usando FALLBACK = ${this.fallbackValue}`);
        
        await this.saveFearGreedToDatabase(this.fallbackValue, 'FALLBACK');
        
        return {
            value: this.fallbackValue,
            source: 'FALLBACK',
            success: false,
            timestamp: new Date().toISOString()
        };
    }

    async fetchFromSource(source) {
        return new Promise((resolve, reject) => {
            const options = {
                timeout: 10000,
                headers: {
                    'User-Agent': 'CoinBitClub-Bot/1.0',
                    ...source.headers
                }
            };

            const req = https.get(source.url, options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`JSON parse error: ${e.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.setTimeout(10000);
        });
    }

    parseAlternativeMe(data) {
        try {
            if (data && data.data && data.data[0] && data.data[0].value) {
                return parseInt(data.data[0].value);
            }
            return null;
        } catch (error) {
            console.log('❌ Erro ao parsear Alternative.me:', error.message);
            return null;
        }
    }

    parseCoinGecko(data) {
        try {
            // CoinGecko não tem Fear & Greed direto, mas podemos calcular
            // baseado no market cap e volume
            if (data && data.data && data.data.market_cap_change_percentage_24h_usd) {
                const change = data.data.market_cap_change_percentage_24h_usd;
                
                // Converter mudança de market cap em índice de 0-100
                let fearGreed = 50; // neutro
                
                if (change > 0) {
                    fearGreed = Math.min(100, 50 + (change * 5));
                } else {
                    fearGreed = Math.max(0, 50 + (change * 5));
                }
                
                return Math.round(fearGreed);
            }
            return null;
        } catch (error) {
            console.log('❌ Erro ao parsear CoinGecko:', error.message);
            return null;
        }
    }

    parseCoinStats(data) {
        try {
            // Verificar diferentes estruturas possíveis da API CoinStats
            if (data && data.fearGreedIndex) {
                return parseInt(data.fearGreedIndex);
            }
            
            if (data && data.value) {
                return parseInt(data.value);
            }
            
            if (data && data.data && data.data.value) {
                return parseInt(data.data.value);
            }
            
            return null;
        } catch (error) {
            console.log('❌ Erro ao parsear CoinStats:', error.message);
            return null;
        }
    }

    async saveFearGreedToDatabase(value, source) {
        try {
            // Salvar no sistema de configuração
            const saveConfigQuery = `
                INSERT INTO system_config (config_key, config_value, description)
                VALUES 
                    ('fear_greed_current', $1, 'Valor atual do Fear & Greed Index'),
                    ('fear_greed_source', $2, 'Fonte do Fear & Greed atual'),
                    ('fear_greed_last_update', NOW()::text, 'Última atualização do Fear & Greed')
                ON CONFLICT (config_key) DO UPDATE SET
                    config_value = EXCLUDED.config_value,
                    updated_at = CURRENT_TIMESTAMP
            `;

            await pool.query(saveConfigQuery, [value.toString(), source]);

            // Salvar histórico se tabela existir
            const saveHistoryQuery = `
                INSERT INTO fear_greed_index (value, source, created_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT DO NOTHING
            `;

            try {
                await pool.query(saveHistoryQuery, [value, source]);
            } catch (error) {
                // Tabela de histórico pode não existir, ignorar erro
                console.log('⚠️ Tabela fear_greed_index não existe, salvando apenas em system_config');
            }

            console.log(`✅ Fear & Greed ${value} salvo no banco (fonte: ${source})`);

        } catch (error) {
            console.log('❌ Erro ao salvar Fear & Greed no banco:', error.message);
        }
    }

    getMarketDirection(fearGreedValue) {
        if (fearGreedValue < 30) {
            return {
                value: fearGreedValue,
                status: 'MEDO_EXTREMO',
                allowedDirections: ['LONG'],
                description: `Medo Extremo (${fearGreedValue}) → Apenas operações LONG permitidas`,
                color: 'red'
            };
        } else if (fearGreedValue <= 80) {
            return {
                value: fearGreedValue,
                status: 'EQUILIBRADO',
                allowedDirections: ['LONG', 'SHORT'],
                description: `Equilibrado (${fearGreedValue}) → LONG e SHORT permitidos`,
                color: 'yellow'
            };
        } else {
            return {
                value: fearGreedValue,
                status: 'GANANCIA_EXTREMA',
                allowedDirections: ['SHORT'],
                description: `Ganância Extrema (${fearGreedValue}) → Apenas operações SHORT permitidas`,
                color: 'green'
            };
        }
    }

    async testAllSources() {
        console.log('🧪 TESTANDO TODAS AS FONTES DE FEAR & GREED');
        console.log('='.repeat(50));

        for (const source of this.sources) {
            console.log(`\n🔍 TESTANDO: ${source.name}`);
            console.log(`📡 URL: ${source.url}`);
            
            try {
                const data = await this.fetchFromSource(source);
                console.log(`📊 Dados recebidos:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
                
                const value = source.parser(data);
                console.log(`📈 Valor extraído: ${value}`);
                
                if (value !== null) {
                    const direction = this.getMarketDirection(value);
                    console.log(`🎯 Direção: ${direction.description}`);
                } else {
                    console.log('❌ Não foi possível extrair valor');
                }
                
            } catch (error) {
                console.log(`❌ Erro: ${error.message}`);
            }
        }

        console.log('\n📊 TESTE DE INTEGRAÇÃO COMPLETO');
        const result = await this.getFearGreedIndex();
        console.log('📈 Resultado final:', result);
        
        const direction = this.getMarketDirection(result.value);
        console.log('🎯 Direção final:', direction.description);

        return { result, direction };
    }
}

// Função para integrar com o sistema de trading
async function integrarFearGreedNoSistema() {
    console.log('🔧 INTEGRANDO FEAR & GREED NO SISTEMA DE TRADING');
    console.log('='.repeat(60));

    const fearGreedIntegration = new FearGreedIntegration();
    
    try {
        // Testar todas as fontes
        await fearGreedIntegration.testAllSources();
        
        // Configurar atualização automática a cada 30 minutos
        console.log('\n⏰ CONFIGURANDO ATUALIZAÇÃO AUTOMÁTICA...');
        
        setInterval(async () => {
            console.log('\n🔄 ATUALIZAÇÃO AUTOMÁTICA FEAR & GREED');
            try {
                const result = await fearGreedIntegration.getFearGreedIndex();
                const direction = fearGreedIntegration.getMarketDirection(result.value);
                console.log(`📊 F&G atualizado: ${result.value} (${direction.status})`);
            } catch (error) {
                console.log('❌ Erro na atualização automática:', error.message);
            }
        }, 30 * 60 * 1000); // 30 minutos
        
        console.log('✅ Sistema Fear & Greed integrado com sucesso!');
        console.log('🔄 Atualização automática a cada 30 minutos ativada');
        
    } catch (error) {
        console.error('❌ Erro na integração:', error.message);
    }
}

// Exportar para uso em outros módulos
module.exports = FearGreedIntegration;

// Executar teste se rodado diretamente
if (require.main === module) {
    integrarFearGreedNoSistema().then(() => {
        // Manter processo rodando para testes
        console.log('\n✅ Processo mantido rodando para testes...');
        console.log('Pressione Ctrl+C para sair');
    });
}

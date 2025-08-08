// 📊 Coletor Fear & Greed Index com CoinStats (Primário) e Alternative.me (Fallback)
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

class FearGreedCollector {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.logger = this.createLogger();
    }

    createLogger() {
        return {
            info: (msg) => console.log(`[${new Date().toISOString()}] [FEAR_GREED] [INFO] ${msg}`),
            error: (msg) => console.log(`[${new Date().toISOString()}] [FEAR_GREED] [ERROR] ${msg}`),
            warn: (msg) => console.log(`[${new Date().toISOString()}] [FEAR_GREED] [WARN] ${msg}`)
        };
    }

    async collectFearGreedData() {
        // Prioridade 1: CoinStats (nossa API do Railway)
        try {
            if (process.env.COINSTATS_API_KEY) {
                this.logger.info('🔄 Coletando Fear & Greed da CoinStats (Primário)...');
                
                const response = await axios.get('https://openapiv1.coinstats.app/insights/fear-and-greed', {
                    headers: {
                        'X-API-KEY': process.env.COINSTATS_API_KEY
                    }
                });
                
                if (response.data && response.data.now && response.data.now.value) {
                    const nowData = response.data.now;
                    this.logger.info(`📊 CoinStats - Dados coletados: ${nowData.value} (${nowData.value_classification})`);
                    
                    return {
                        value: parseInt(nowData.value),
                        value_classification: nowData.value_classification,
                        timestamp_unix: nowData.timestamp.toString(),
                        time_until_update: null,
                        source: 'coinstats'
                    };
                }
            }
        } catch (error) {
            this.logger.error(`Erro CoinStats: ${error.message}`);
        }

        // Fallback: Alternative.me (gratuito)
        try {
            this.logger.info('🔄 Usando Alternative.me como fallback...');
            
            const response = await axios.get('https://api.alternative.me/fng/?limit=1');
            const fearGreedData = response.data.data[0];
            
            this.logger.info(`📊 Alternative.me - Dados coletados: ${fearGreedData.value} (${fearGreedData.value_classification})`);
            
            return {
                value: parseInt(fearGreedData.value),
                value_classification: fearGreedData.value_classification,
                timestamp_unix: fearGreedData.timestamp,
                time_until_update: fearGreedData.time_until_update,
                source: 'alternative.me'
            };
            
        } catch (error) {
            this.logger.error(`Erro ao coletar dados da Alternative.me: ${error.message}`);
            throw new Error('Falha em ambas as APIs de Fear & Greed');
        }
    }

    getClassification(value) {
        if (value >= 75) return 'Extreme Greed';
        if (value >= 54) return 'Greed';
        if (value >= 46) return 'Neutral';
        if (value >= 25) return 'Fear';
        return 'Extreme Fear';
    }

    async saveToDatabase(fearGreedData) {
        try {
            // Verificar se já existe um valor igual recente (última hora)
            const existingQuery = `
                SELECT value, collected_at 
                FROM fear_greed_index 
                WHERE collected_at > NOW() - INTERVAL '1 hour' 
                AND value = $1
                ORDER BY collected_at DESC 
                LIMIT 1
            `;
            
            const existing = await pool.query(existingQuery, [fearGreedData.value]);
            
            if (existing.rows.length > 0) {
                this.logger.info(`⏭️ Valor inalterado (${fearGreedData.value}), pulando inserção`);
                return { inserted: false, reason: 'duplicate_value' };
            }

            // Inserir novo registro - APENAS Fear & Greed data (market cap vem da dominância)
            const insertQuery = `
                INSERT INTO fear_greed_index (
                    value, 
                    value_classification, 
                    timestamp_unix, 
                    time_until_update,
                    source,
                    data_source,
                    collected_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id, value, value_classification, collected_at
            `;

            const result = await pool.query(insertQuery, [
                fearGreedData.value,
                fearGreedData.value_classification,
                fearGreedData.timestamp_unix,
                fearGreedData.time_until_update,
                fearGreedData.source,
                fearGreedData.source
            ]);

            this.logger.info(`✅ Dados salvos no banco: ID ${result.rows[0].id}`);
            return { 
                inserted: true, 
                data: result.rows[0] 
            };

        } catch (error) {
            this.logger.error(`Erro ao salvar no banco: ${error.message}`);
            throw error;
        }
    }

    async runCollection() {
        try {
            this.logger.info('🚀 === INICIANDO COLETA FEAR & GREED ===');
            
            // Coletar dados Fear & Greed
            const fearGreedData = await this.collectFearGreedData();
            
            // Salvar no banco de dados
            const saveResult = await this.saveToDatabase(fearGreedData);
            
            if (saveResult.inserted) {
                this.logger.info('✅ === COLETA CONCLUÍDA: SUCESSO ===');
            } else {
                this.logger.info('✅ === COLETA CONCLUÍDA: DUPLICADO ===');
            }
            
            return saveResult;
            
        } catch (error) {
            this.logger.error(`❌ Erro na coleta: ${error.message}`);
            throw error;
        }
    }

    start() {
        if (this.isRunning) {
            this.logger.warn('⚠️ Coletor já está rodando');
            return;
        }

        this.logger.info('🚀 Iniciando Fear & Greed Collector');
        this.logger.info('⏰ Configuração: Coleta a cada 30 minutos');
        
        this.isRunning = true;
        
        // Execução imediata
        this.runCollection().catch(error => {
            this.logger.error(`❌ Erro na execução inicial: ${error.message}`);
        });
        
        // Execução a cada 30 minutos (1800000ms)
        this.intervalId = setInterval(async () => {
            try {
                await this.runCollection();
            } catch (error) {
                this.logger.error(`❌ Erro na execução agendada: ${error.message}`);
            }
        }, 30 * 60 * 1000);
        
        this.logger.info('✅ Fear & Greed Collector iniciado com sucesso');
    }

    stop() {
        if (!this.isRunning) {
            this.logger.warn('⚠️ Coletor não está rodando');
            return;
        }

        this.logger.info('🛑 Parando Fear & Greed Collector');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        this.logger.info('✅ Fear & Greed Collector parado');
    }

    async healthCheck() {
        try {
            const result = await pool.query('SELECT COUNT(*) as count FROM fear_greed_index WHERE collected_at > NOW() - INTERVAL \'1 hour\'');
            const recentCount = parseInt(result.rows[0].count);
            
            const latest = await pool.query('SELECT value, value_classification, collected_at FROM fear_greed_index ORDER BY collected_at DESC LIMIT 1');
            
            return {
                status: 'healthy',
                isRunning: this.isRunning,
                recentCollections: recentCount,
                latestData: latest.rows[0] || null
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                isRunning: this.isRunning
            };
        }
    }
}

// Instância única
const fearGreedCollector = new FearGreedCollector();

// CLI commands
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--once')) {
        console.log('😨 FEAR & GREED INDEX COLLECTOR');
        console.log('================================');
        console.log('✅ Conexão com banco estabelecida');
        console.log('🔄 Executando coleta única...');
        
        fearGreedCollector.runCollection()
            .then(result => {
                console.log('✅ Coleta única concluída');
                console.log(`📊 Status: ${result.inserted ? 'Novo valor coletado' : 'Valor duplicado'}`);
                if (result.data) {
                    console.log(`📊 Valor atual: ${result.data.value} (${result.data.value_classification})`);
                }
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Erro na coleta:', error.message);
                process.exit(1);
            });
    } else if (args.includes('--status')) {
        fearGreedCollector.healthCheck()
            .then(status => {
                console.log('\n😨 FEAR & GREED COLLECTOR STATUS');
                console.log('=================================');
                console.log(`📊 Status: ${status.status}`);
                console.log(`🔄 Running: ${status.isRunning}`);
                console.log(`📈 Recent Collections: ${status.recentCollections}`);
                if (status.latestData) {
                    console.log(`📊 Latest: ${status.latestData.value} (${status.latestData.value_classification}) at ${status.latestData.collected_at}`);
                }
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Erro no status:', error.message);
                process.exit(1);
            });
    } else {
        console.log('😨 FEAR & GREED INDEX COLLECTOR');
        console.log('================================');
        console.log('🚀 Iniciando coleta contínua...');
        
        fearGreedCollector.start();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Recebido SIGINT, parando coleta...');
            fearGreedCollector.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Recebido SIGTERM, parando coleta...');
            fearGreedCollector.stop();
            process.exit(0);
        });
    }
}

module.exports = fearGreedCollector;

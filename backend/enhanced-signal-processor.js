// ENHANCED SIGNAL PROCESSOR
// Processa sinais de trading com validação e segurança

const { Pool } = require('pg');

class EnhancedSignalProcessor {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async processSignal(signalData) {
        console.log('🔄 Processando sinal:', signalData);

        try {
            // Validar estrutura do sinal
            if (!signalData || typeof signalData !== 'object') {
                throw new Error('Dados do sinal inválidos');
            }

            // Extrair informações básicas
            const {
                symbol = 'UNKNOWN',
                action = 'BUY',
                price = 0,
                leverage = 1,
                timestamp = new Date().toISOString()
            } = signalData;

            // Registrar sinal no banco
            const query = `
                INSERT INTO signals (
                    symbol, action, price, leverage, 
                    raw_data, processed_at, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;

            const values = [
                symbol,
                action,
                price,
                leverage,
                JSON.stringify(signalData),
                new Date(),
                'PROCESSED'
            ];

            const result = await this.pool.query(query, values);
            const signalId = result.rows[0]?.id;

            console.log('✅ Sinal processado com ID:', signalId);

            return {
                id: signalId,
                symbol,
                action,
                price,
                leverage,
                status: 'PROCESSED',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erro ao processar sinal:', error);
            
            // Tentar registrar erro no banco
            try {
                await this.pool.query(`
                    INSERT INTO signals (
                        symbol, action, raw_data, processed_at, status, error_message
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    'ERROR',
                    'FAILED',
                    JSON.stringify(signalData),
                    new Date(),
                    'ERROR',
                    error.message
                ]);
            } catch (dbError) {
                console.error('❌ Erro ao registrar erro no banco:', dbError);
            }

            throw error;
        }
    }

    async getRecentSignals(limit = 10) {
        try {
            const query = `
                SELECT * FROM signals 
                ORDER BY processed_at DESC 
                LIMIT $1
            `;
            
            const result = await this.pool.query(query, [limit]);
            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar sinais:', error);
            return [];
        }
    }

    async createSignalsTable() {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(50) NOT NULL,
                    action VARCHAR(20) NOT NULL,
                    price DECIMAL(20, 8) DEFAULT 0,
                    leverage INTEGER DEFAULT 1,
                    raw_data JSONB,
                    processed_at TIMESTAMP DEFAULT NOW(),
                    status VARCHAR(20) DEFAULT 'PENDING',
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
                CREATE INDEX IF NOT EXISTS idx_signals_processed_at ON signals(processed_at);
                CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
            `;

            await this.pool.query(query);
            console.log('✅ Tabela signals criada/verificada');

        } catch (error) {
            console.error('❌ Erro ao criar tabela signals:', error);
        }
    }
}

module.exports = EnhancedSignalProcessor;

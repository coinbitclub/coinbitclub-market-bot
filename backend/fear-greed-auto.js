/**
 * 🔧 FEAR & GREED INDEX AUTOMÁTICO - COINBITCLUB MARKET BOT V3.0.0
 * Coleta automática de dados de Fear & Greed Index da CNN
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('📊 FEAR & GREED INDEX AUTOMÁTICO - Iniciando...');

class FearGreedCollector {
    constructor() {
        this.collectCount = 0;
        this.errorCount = 0;
        this.lastCollection = null;
    }

    async coletarFearGreedIndex() {
        console.log('\n📡 Coletando Fear & Greed Index...');

        try {
            // URL da API do Fear & Greed Index (gratuita)
            const url = 'https://api.alternative.me/fng/?limit=1';
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                const fearGreedData = data.data[0];
                
                console.log(`📊 Fear & Greed Index: ${fearGreedData.value} (${fearGreedData.value_classification})`);
                console.log(`📅 Data: ${new Date(fearGreedData.timestamp * 1000).toISOString()}`);

                // Salvar no banco de dados
                await this.salvarNoBanco(fearGreedData);
                
                this.collectCount++;
                this.lastCollection = new Date();
                
                return {
                    success: true,
                    value: parseInt(fearGreedData.value),
                    classification: fearGreedData.value_classification,
                    timestamp: new Date(fearGreedData.timestamp * 1000)
                };

            } else {
                throw new Error('Dados não encontrados na resposta da API');
            }

        } catch (error) {
            console.error('❌ Erro ao coletar Fear & Greed Index:', error.message);
            this.errorCount++;
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    async salvarNoBanco(fearGreedData) {
        try {
            const value = parseInt(fearGreedData.value);
            const classification = fearGreedData.value_classification;
            const timestamp = new Date(fearGreedData.timestamp * 1000);

            // Verificar se já existe um registro para este timestamp
            const existingRecord = await pool.query(`
                SELECT id FROM fear_greed_data 
                WHERE DATE(recorded_at) = DATE($1)
            `, [timestamp]);

            if (existingRecord.rows.length > 0) {
                // Atualizar registro existente
                await pool.query(`
                    UPDATE fear_greed_data 
                    SET fg_value = $1, 
                        fg_classification = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [value, classification, existingRecord.rows[0].id]);

                console.log(`✅ Registro atualizado para ${timestamp.toDateString()}`);

            } else {
                // Inserir novo registro
                const result = await pool.query(`
                    INSERT INTO fear_greed_data (
                        fg_value, fg_classification, recorded_at, created_at
                    ) VALUES ($1, $2, $3, NOW())
                    RETURNING id
                `, [value, classification, timestamp]);

                console.log(`✅ Novo registro inserido - ID: ${result.rows[0].id}`);
            }

        } catch (error) {
            console.error('❌ Erro ao salvar no banco:', error.message);
            throw error;
        }
    }

    async criarTabelaSeNaoExistir() {
        try {
            console.log('🔧 Verificando tabela fear_greed_data...');

            await pool.query(`
                CREATE TABLE IF NOT EXISTS fear_greed_data (
                    id SERIAL PRIMARY KEY,
                    fg_value INTEGER NOT NULL,
                    fg_classification VARCHAR(50) NOT NULL,
                    recorded_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Criar índice para otimizar consultas
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_fear_greed_recorded_at 
                ON fear_greed_data(recorded_at)
            `);

            console.log('✅ Tabela fear_greed_data verificada/criada');

        } catch (error) {
            console.error('❌ Erro ao criar tabela:', error.message);
            throw error;
        }
    }

    async obterEstatisticas() {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_records,
                    AVG(fg_value) as avg_value,
                    MIN(fg_value) as min_value,
                    MAX(fg_value) as max_value,
                    MAX(recorded_at) as last_record,
                    COUNT(*) FILTER (WHERE recorded_at > NOW() - INTERVAL '7 days') as records_last_week
                FROM fear_greed_data
            `);

            const latest = await pool.query(`
                SELECT fg_value, fg_classification, recorded_at
                FROM fear_greed_data
                ORDER BY recorded_at DESC
                LIMIT 1
            `);

            return {
                statistics: stats.rows[0],
                latest: latest.rows[0] || null
            };

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    interpretarIndicador(value) {
        if (value >= 75) return '🔥 GREED EXTREMO - Considere venda';
        if (value >= 55) return '😄 GREED - Mercado otimista';
        if (value >= 45) return '😐 NEUTRO - Mercado equilibrado';
        if (value >= 25) return '😰 FEAR - Mercado pessimista';
        return '💀 FEAR EXTREMO - Considere compra';
    }

    async executarCicloColeta() {
        console.log(`\n🔄 Ciclo de coleta iniciado - ${new Date().toISOString()}`);
        
        const resultado = await this.coletarFearGreedIndex();
        
        if (resultado.success) {
            const interpretacao = this.interpretarIndicador(resultado.value);
            console.log(`🧠 Interpretação: ${interpretacao}`);
        }

        const stats = await this.obterEstatisticas();
        if (stats) {
            console.log('\n📊 ESTATÍSTICAS:');
            console.log(`   Total de registros: ${stats.statistics.total_records}`);
            console.log(`   Valor médio: ${parseFloat(stats.statistics.avg_value || 0).toFixed(1)}`);
            console.log(`   Último valor: ${stats.latest?.fg_value || 'N/A'} (${stats.latest?.fg_classification || 'N/A'})`);
            console.log(`   Registros última semana: ${stats.statistics.records_last_week}`);
        }

        console.log(`✅ Ciclo concluído - Coletas: ${this.collectCount} | Erros: ${this.errorCount}`);
    }

    async iniciar() {
        console.log('🚀 Fear & Greed Collector iniciado');
        console.log('⏰ Coleta a cada 15 minutos');
        
        // Criar tabela se não existir
        await this.criarTabelaSeNaoExistir();
        
        // Executar primeiro ciclo
        await this.executarCicloColeta();
        
        // Configurar interval de 15 minutos (900000ms)
        setInterval(() => {
            this.executarCicloColeta();
        }, 15 * 60 * 1000);
    }

    // Método para coleta manual
    async coletarAgora() {
        console.log('🔄 Coleta manual iniciada...');
        return await this.coletarFearGreedIndex();
    }

    // Método para obter últimos dados
    async obterUltimosDados(limit = 7) {
        try {
            const result = await pool.query(`
                SELECT fg_value, fg_classification, recorded_at
                FROM fear_greed_data
                ORDER BY recorded_at DESC
                LIMIT $1
            `, [limit]);

            return result.rows.map(row => ({
                value: row.fg_value,
                classification: row.fg_classification,
                date: row.recorded_at,
                interpretation: this.interpretarIndicador(row.fg_value)
            }));

        } catch (error) {
            console.error('❌ Erro ao obter últimos dados:', error.message);
            return [];
        }
    }
}

// Inicializar coletor
const fearGreedCollector = new FearGreedCollector();
fearGreedCollector.iniciar();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Encerrando coletor Fear & Greed...');
    await pool.end();
    console.log('✅ Coletor encerrado');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Encerrando coletor Fear & Greed...');
    await pool.end();
    console.log('✅ Coletor encerrado');
    process.exit(0);
});

module.exports = FearGreedCollector;

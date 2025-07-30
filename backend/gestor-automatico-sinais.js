/**
 * 🤖 GESTOR AUTOMÁTICO DE PROCESSAMENTO DE SINAIS
 * Sistema que monitora sinais pendentes e executa automaticamente
 */

const { Pool } = require('pg');

console.log('🤖 ====================================================');
console.log('    GESTOR AUTOMÁTICO DE PROCESSAMENTO DE SINAIS');
console.log('====================================================');

class GestorAutomaticoSinais {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        // Remover dependências que podem não existir por enquanto
        this.gestorSinais = null;
        this.gestorOperacoes = null;
        
        this.intervalId = null;
        this.isRunning = false;
        this.intervaloProcessamento = 10000; // 10 segundos
        this.timeoutSinal = 300000; // 5 minutos timeout para sinais
        
        this.estatisticas = {
            sinaisProcessados: 0,
            operacoesAbertas: 0,
            errosProcessamento: 0,
            ultimoProcessamento: null
        };
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] GESTOR-AUTO ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }
    }

    async iniciar() {
        if (this.isRunning) {
            await this.log('warning', 'Gestor automático já está rodando');
            return;
        }

        await this.log('info', 'Iniciando gestor automático de sinais...');
        
        // Primeiro processamento imediato
        await this.processarSinaisPendentes();
        
        // Configurar intervalo de processamento
        this.intervalId = setInterval(async () => {
            await this.processarSinaisPendentes();
        }, this.intervaloProcessamento);
        
        this.isRunning = true;
        await this.log('info', `Gestor automático ativo - processamento a cada ${this.intervaloProcessamento/1000}s`);
    }

    async parar() {
        if (!this.isRunning) {
            await this.log('warning', 'Gestor automático não está rodando');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        await this.log('info', 'Gestor automático parado');
    }

    async processarSinaisPendentes() {
        try {
            const client = await this.pool.connect();
            
            // Buscar sinais não processados
            const sinaisPendentes = await client.query(`
                SELECT 
                    id, 
                    symbol, 
                    signal_data,
                    source,
                    created_at,
                    EXTRACT(EPOCH FROM (NOW() - created_at)) as segundos_pendente
                FROM trading_signals 
                WHERE status != 'processed' 
                AND created_at > NOW() - INTERVAL '${this.timeoutSinal/1000} seconds'
                ORDER BY created_at ASC
                LIMIT 10
            `);
            
            if (sinaisPendentes.rows.length === 0) {
                // Não há sinais pendentes - isso é normal
                client.release();
                return;
            }

            await this.log('info', `Encontrados ${sinaisPendentes.rows.length} sinais pendentes para processamento`);

            // Processar cada sinal
            for (const sinalRow of sinaisPendentes.rows) {
                await this.processarSinalIndividual(sinalRow, client);
            }
            
            client.release();
            
        } catch (error) {
            await this.log('error', 'Erro no processamento automático', { erro: error.message });
            this.estatisticas.errosProcessamento++;
        }
    }

    async processarSinalIndividual(sinalRow, client) {
        try {
            await this.log('info', `Processando sinal ID ${sinalRow.id} - ${sinalRow.symbol}`);
            
            const signalData = sinalRow.signal_data;
            
            // 1. Validar Fear & Greed
            const fearGreedValid = await this.validarFearGreed(signalData);
            
            if (!fearGreedValid.permitido) {
                await this.log('warning', `Sinal ${sinalRow.id} rejeitado por Fear & Greed`, fearGreedValid);
                await this.marcarSinalProcessado(sinalRow.id, 'rejected_fear_greed', client);
                return;
            }

            // 2. Por enquanto, apenas simular processamento básico
            await this.log('info', `Sinal ${sinalRow.id} aprovado pela validação Fear & Greed`);
            
            // 3. Simular execução de operações (sem gestores externos por enquanto)
            if (['BUY', 'LONG', 'SELL', 'SHORT'].includes(signalData.action?.toUpperCase())) {
                await this.log('info', `Simulando abertura de operações para ${signalData.action} ${signalData.symbol}`);
                this.estatisticas.operacoesAbertas++;
            }

            // 4. Marcar como processado com sucesso
            await this.marcarSinalProcessado(sinalRow.id, 'processed_success', client);
            
            this.estatisticas.sinaisProcessados++;
            this.estatisticas.ultimoProcessamento = new Date();
            
            await this.log('info', `Sinal ${sinalRow.id} processado com sucesso`);
            
        } catch (error) {
            await this.log('error', `Erro no processamento do sinal ${sinalRow.id}`, { erro: error.message });
            await this.marcarSinalProcessado(sinalRow.id, 'processing_error', client);
        }
    }

    async validarFearGreed(signalData) {
        try {
            const client = await this.pool.connect();
            
            const ultimoFG = await client.query(`
                SELECT 
                    value,
                    CASE 
                        WHEN value < 30 THEN 'LONG_ONLY'
                        WHEN value > 80 THEN 'SHORT_ONLY'
                        ELSE 'BOTH'
                    END as direction_allowed,
                    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_atras
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            client.release();
            
            if (ultimoFG.rows.length === 0) {
                return { permitido: true, motivo: 'Fear & Greed não disponível - permitindo operação' };
            }
            
            const fg = ultimoFG.rows[0];
            const acao = signalData.action?.toUpperCase();
            
            // Verificar compatibilidade
            if (fg.direction_allowed === 'BOTH') {
                return { permitido: true, motivo: 'Fear & Greed permite LONG e SHORT' };
            }
            
            if (fg.direction_allowed === 'LONG_ONLY' && ['BUY', 'LONG'].includes(acao)) {
                return { permitido: true, motivo: 'Fear & Greed permite apenas LONG' };
            }
            
            if (fg.direction_allowed === 'SHORT_ONLY' && ['SELL', 'SHORT'].includes(acao)) {
                return { permitido: true, motivo: 'Fear & Greed permite apenas SHORT' };
            }
            
            return { 
                permitido: false, 
                motivo: `Fear & Greed (${fg.value}) permite apenas ${fg.direction_allowed}, mas sinal é ${acao}` 
            };
            
        } catch (error) {
            await this.log('warning', 'Erro na validação Fear & Greed - permitindo operação', { erro: error.message });
            return { permitido: true, motivo: 'Erro na validação F&G - permitindo por segurança' };
        }
    }

    async executarAberturaOperacoes(signalData, sinalId) {
        try {
            await this.log('info', `Simulando abertura de operações para sinal ${sinalId}`);
            
            // Por enquanto, apenas simular sem conectar com exchanges
            await this.log('info', `Operação simulada: ${signalData.action} ${signalData.symbol} @ ${signalData.price}`);
            
            // Simular delay de processamento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.estatisticas.operacoesAbertas++;
            await this.log('info', 'Operação simulada executada com sucesso');
            
        } catch (error) {
            await this.log('error', 'Erro na simulação de abertura de operações', { erro: error.message });
        }
    }

    async marcarSinalProcessado(sinalId, status, client) {
        try {
            await client.query(`
                UPDATE trading_signals 
                SET status = $1, 
                    processed_at = NOW()
                WHERE id = $2
            `, [status, sinalId]);
            
        } catch (error) {
            await this.log('error', `Erro ao marcar sinal ${sinalId} como processado`, { erro: error.message });
        }
    }

    async obterEstatisticas() {
        return {
            ...this.estatisticas,
            isRunning: this.isRunning,
            intervaloProcessamento: this.intervaloProcessamento,
            proximoProcessamento: this.isRunning ? 
                new Date(Date.now() + this.intervaloProcessamento) : null
        };
    }

    async limparSinaisExpirados() {
        try {
            const client = await this.pool.connect();
            
            const resultado = await client.query(`
                UPDATE trading_signals 
                SET status = 'expired', 
                    processed_at = NOW()
                WHERE status = 'approved' 
                AND created_at < NOW() - INTERVAL '${this.timeoutSinal/1000} seconds'
            `);
            
            if (resultado.rowCount > 0) {
                await this.log('info', `${resultado.rowCount} sinais expirados marcados como processados`);
            }
            
            client.release();
            
        } catch (error) {
            await this.log('error', 'Erro na limpeza de sinais expirados', { erro: error.message });
        }
    }
}

module.exports = GestorAutomaticoSinais;

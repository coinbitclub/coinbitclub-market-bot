/**
 * 📊 GESTOR FEAR & GREED - INTEGRAÇÃO COINSTATS
 * Sistema de validação baseado no índice Fear & Greed para direção de operações
 */

const axios = require('axios');
const { Pool } = require('pg');

console.log('📊 GESTOR FEAR & GREED - COINSTATS INTEGRATION');
console.log('==============================================');

class GestorFearGreed {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.coinStatsAPI = 'https://api.coinstats.app/public/v1/';
        this.fearGreedAPI = 'https://api.alternative.me/fng/';
        this.ultimoIndice = null;
        this.ultimaAtualizacao = null;
        this.fallbackValue = 50; // Valor padrão conforme especificação

        // Regras conforme especificação
        this.regras = {
            SOMENTE_LONG: { min: 0, max: 29 },      // < 30: Só permite LONG
            LONG_E_SHORT: { min: 30, max: 80 },     // 30-80: Permite LONG e SHORT  
            SOMENTE_SHORT: { min: 81, max: 100 }    // > 80: Só permite SHORT
        };

        this.iniciarAtualizacaoAutomatica();
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }

        // Salvar no banco para auditoria
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO fear_greed_logs (timestamp, level, message, data, created_at)
                VALUES ($1, $2, $3, $4, NOW());
            `, [timestamp, nivel, mensagem, JSON.stringify(dados)]);
            client.release();
        } catch (error) {
            // Não quebrar por erro de log
        }
    }

    // ========================================
    // 1. BUSCA E ATUALIZAÇÃO DO ÍNDICE F&G
    // ========================================

    async buscarIndiceFearGreed() {
        await this.log('info', 'Iniciando busca do índice Fear & Greed');

        try {
            // Tentar primeiro a API alternative.me (mais confiável para F&G)
            const response = await axios.get(`${this.fearGreedAPI}?limit=1`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'CoinbitClub-MarketBot/1.0'
                }
            });

            if (response.data && response.data.data && response.data.data[0]) {
                const dadosFG = response.data.data[0];
                const indice = parseInt(dadosFG.value);
                const classificacao = dadosFG.value_classification;

                await this.salvarIndiceBanco(indice, classificacao, 'alternative.me');
                
                this.ultimoIndice = indice;
                this.ultimaAtualizacao = new Date();

                await this.log('info', `Índice Fear & Greed atualizado com sucesso`, {
                    indice,
                    classificacao,
                    fonte: 'alternative.me',
                    direcao_permitida: this.obterDirecaoPermitida(indice)
                });

                return {
                    sucesso: true,
                    indice,
                    classificacao,
                    fonte: 'alternative.me',
                    timestamp: this.ultimaAtualizacao
                };
            }

        } catch (error) {
            await this.log('warning', 'Falha na API alternative.me, tentando CoinStats', { erro: error.message });

            // Fallback para CoinStats se alternative.me falhar
            try {
                return await this.buscarCoinStats();
            } catch (errorCoinStats) {
                await this.log('error', 'Falha em ambas APIs, usando fallback', { 
                    erro_alternative: error.message,
                    erro_coinstats: errorCoinStats.message
                });
                
                return await this.usarFallback();
            }
        }
    }

    async buscarCoinStats() {
        const response = await axios.get(`${this.coinStatsAPI}global`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'CoinbitClub-MarketBot/1.0'
            }
        });

        // CoinStats pode não ter F&G direto, simular baseado em market cap change
        if (response.data) {
            const marketData = response.data;
            const marketCapChange = parseFloat(marketData.marketCapChange || 0);
            
            // Converter market cap change para escala F&G (aproximação)
            let indiceFG;
            if (marketCapChange > 5) indiceFG = 80; // Muito positivo = greed
            else if (marketCapChange > 2) indiceFG = 65;
            else if (marketCapChange > -2) indiceFG = 50;
            else if (marketCapChange > -5) indiceFG = 35;
            else indiceFG = 20; // Muito negativo = fear

            await this.salvarIndiceBanco(indiceFG, this.obterClassificacao(indiceFG), 'coinstats');
            
            this.ultimoIndice = indiceFG;
            this.ultimaAtualizacao = new Date();

            await this.log('info', `Índice F&G calculado via CoinStats`, {
                indice: indiceFG,
                market_cap_change: marketCapChange,
                fonte: 'coinstats'
            });

            return {
                sucesso: true,
                indice: indiceFG,
                classificacao: this.obterClassificacao(indiceFG),
                fonte: 'coinstats',
                timestamp: this.ultimaAtualizacao
            };
        }

        throw new Error('Dados inválidos da CoinStats API');
    }

    async usarFallback() {
        await this.log('warning', `Usando valor fallback F&G = ${this.fallbackValue} conforme especificação`);

        await this.salvarIndiceBanco(this.fallbackValue, this.obterClassificacao(this.fallbackValue), 'fallback');
        
        this.ultimoIndice = this.fallbackValue;
        this.ultimaAtualizacao = new Date();

        return {
            sucesso: true,
            indice: this.fallbackValue,
            classificacao: this.obterClassificacao(this.fallbackValue),
            fonte: 'fallback',
            timestamp: this.ultimaAtualizacao
        };
    }

    async salvarIndiceBanco(indice, classificacao, fonte) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO fear_greed_index (
                    index_value, classification, source, 
                    direction_allowed, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (DATE(created_at)) 
                DO UPDATE SET 
                    index_value = $1,
                    classification = $2,
                    source = $3,
                    direction_allowed = $4,
                    updated_at = NOW();
            `, [
                indice, 
                classificacao, 
                fonte, 
                this.obterDirecaoPermitida(indice)
            ]);

        } catch (error) {
            await this.log('error', 'Erro ao salvar índice no banco', { erro: error.message });
        } finally {
            client.release();
        }
    }

    // ========================================
    // 2. VALIDAÇÃO DE DIREÇÃO CONFORME REGRAS
    // ========================================

    validarDirecaoSinal(tipoSinal, indiceFG = null) {
        const indice = indiceFG || this.ultimoIndice || this.fallbackValue;
        const direcaoPermitida = this.obterDirecaoPermitida(indice);

        // Normalizar tipo do sinal
        const sinalNormalizado = tipoSinal.toUpperCase();
        let direcaoSinal;

        if (sinalNormalizado.includes('LONG')) {
            direcaoSinal = 'LONG';
        } else if (sinalNormalizado.includes('SHORT')) {
            direcaoSinal = 'SHORT';
        } else {
            // Para sinais de fechamento ou confirmação, sempre permitir
            if (sinalNormalizado.includes('FECHE') || sinalNormalizado.includes('CONFIRMAÇÃO')) {
                return {
                    permitido: true,
                    motivo: 'Sinal de fechamento/confirmação sempre permitido',
                    indice_fg: indice,
                    direcao_permitida: direcaoPermitida,
                    tipo_sinal: tipoSinal
                };
            }
            
            return {
                permitido: false,
                motivo: 'Tipo de sinal não reconhecido',
                indice_fg: indice,
                direcao_permitida: direcaoPermitida,
                tipo_sinal: tipoSinal
            };
        }

        // Aplicar regras conforme especificação
        let permitido = false;
        let motivo = '';

        switch (direcaoPermitida) {
            case 'SOMENTE_LONG':
                permitido = direcaoSinal === 'LONG';
                motivo = permitido ? 
                    `F&G ${indice} permite apenas LONG` : 
                    `F&G ${indice} < 30: BLOQUEADO sinal SHORT`;
                break;

            case 'LONG_E_SHORT':
                permitido = true;
                motivo = `F&G ${indice} (30-80): LIBERADO LONG e SHORT`;
                break;

            case 'SOMENTE_SHORT':
                permitido = direcaoSinal === 'SHORT';
                motivo = permitido ? 
                    `F&G ${indice} permite apenas SHORT` : 
                    `F&G ${indice} > 80: BLOQUEADO sinal LONG`;
                break;
        }

        const resultado = {
            permitido,
            motivo,
            indice_fg: indice,
            direcao_permitida: direcaoPermitida,
            direcao_sinal: direcaoSinal,
            tipo_sinal: tipoSinal,
            timestamp: new Date().toISOString()
        };

        // Log da validação
        this.log(permitido ? 'info' : 'warning', 
            `Validação sinal: ${permitido ? 'LIBERADO' : 'BLOQUEADO'}`, resultado);

        return resultado;
    }

    obterDirecaoPermitida(indice) {
        if (indice <= this.regras.SOMENTE_LONG.max) {
            return 'SOMENTE_LONG';
        } else if (indice >= this.regras.LONG_E_SHORT.min && indice <= this.regras.LONG_E_SHORT.max) {
            return 'LONG_E_SHORT';
        } else {
            return 'SOMENTE_SHORT';
        }
    }

    obterClassificacao(indice) {
        if (indice <= 10) return 'Extreme Fear';
        if (indice <= 25) return 'Fear';
        if (indice <= 45) return 'Neutral';
        if (indice <= 55) return 'Neutral';
        if (indice <= 75) return 'Greed';
        return 'Extreme Greed';
    }

    // ========================================
    // 3. ATUALIZAÇÃO AUTOMÁTICA (30 MIN)
    // ========================================

    iniciarAtualizacaoAutomatica() {
        console.log('🔄 Iniciando atualização automática F&G a cada 30 minutos');

        // Buscar imediatamente
        this.buscarIndiceFearGreed();

        // Configurar atualização a cada 30 minutos conforme especificação
        setInterval(async () => {
            try {
                await this.buscarIndiceFearGreed();
            } catch (error) {
                await this.log('error', 'Erro na atualização automática F&G', { erro: error.message });
            }
        }, 30 * 60 * 1000); // 30 minutos

        console.log('✅ Atualização automática F&G configurada');
    }

    // ========================================
    // 4. MÉTODOS PÚBLICOS PARA INTEGRAÇÃO
    // ========================================

    async obterIndiceFearGreedAtual() {
        // Se não tem índice ou está muito antigo (mais de 2 horas), buscar novo
        const agora = new Date();
        const diferencaHoras = this.ultimaAtualizacao ? 
            (agora - this.ultimaAtualizacao) / (1000 * 60 * 60) : 999;

        if (!this.ultimoIndice || diferencaHoras > 2) {
            await this.buscarIndiceFearGreed();
        }

        return {
            indice: this.ultimoIndice || this.fallbackValue,
            classificacao: this.obterClassificacao(this.ultimoIndice || this.fallbackValue),
            direcao_permitida: this.obterDirecaoPermitida(this.ultimoIndice || this.fallbackValue),
            ultima_atualizacao: this.ultimaAtualizacao,
            fonte: this.ultimaAtualizacao ? 'api' : 'fallback'
        };
    }

    async gerarRelatorioFearGreed() {
        const client = await this.pool.connect();
        try {
            const relatorio = await client.query(`
                SELECT 
                    index_value,
                    classification,
                    direction_allowed,
                    source,
                    created_at
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 24;
            `);

            return {
                indice_atual: this.ultimoIndice,
                historico_24h: relatorio.rows,
                ultima_atualizacao: this.ultimaAtualizacao,
                proxima_atualizacao: new Date(Date.now() + 30 * 60 * 1000)
            };

        } catch (error) {
            await this.log('error', 'Erro ao gerar relatório F&G', { erro: error.message });
            return null;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 5. CLEANUP E PARADA GRACIOSA
    // ========================================

    async parar() {
        console.log('🛑 Parando Gestor Fear & Greed...');
        await this.pool.end();
        console.log('✅ Gestor Fear & Greed parado');
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorFearGreed();

    // Testar funcionamento
    setTimeout(async () => {
        const indiceAtual = await gestor.obterIndiceFearGreedAtual();
        console.log('📊 Índice atual:', indiceAtual);

        // Testar validações
        const testes = [
            'SINAL LONG',
            'SINAL SHORT', 
            'SINAL LONG FORTE',
            'FECHE LONG',
            'CONFIRMAÇÃO SHORT'
        ];

        for (const teste of testes) {
            const validacao = gestor.validarDirecaoSinal(teste);
            console.log(`🧪 ${teste}: ${validacao.permitido ? '✅ LIBERADO' : '❌ BLOQUEADO'} - ${validacao.motivo}`);
        }

    }, 2000);

    // Cleanup graceful
    process.on('SIGINT', async () => {
        await gestor.parar();
        process.exit(0);
    });
}

module.exports = GestorFearGreed;

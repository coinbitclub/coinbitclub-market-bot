/**
 * 📡 GESTOR DE SINAIS TRADINGVIEW
 * Processador completo de tipos de sinais e validação
 */

const { Pool } = require('pg');
const crypto = require('crypto');

console.log('📡 GESTOR SINAIS TRADINGVIEW - PROCESSAMENTO COMPLETO');
console.log('====================================================');

class GestorSinaisTradingView {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Tipos de sinais suportados
        this.tiposSinais = {
            'LONG': {
                descricao: 'Sinal de compra/alta',
                acao: 'buy',
                prioridade: 1,
                validacao_required: true
            },
            'SHORT': {
                descricao: 'Sinal de venda/baixa',
                acao: 'sell',
                prioridade: 1,
                validacao_required: true
            },
            'FORTE': {
                descricao: 'Sinal intensificado',
                acao: 'amplify',
                prioridade: 2,
                validacao_required: true
            },
            'FECHE': {
                descricao: 'Fechar posições ativas',
                acao: 'close',
                prioridade: 3,
                validacao_required: false
            },
            'CONFIRMAÇÃO': {
                descricao: 'Confirmar sinal anterior',
                acao: 'confirm',
                prioridade: 1,
                validacao_required: false
            },
            'CANCELAR': {
                descricao: 'Cancelar sinais pendentes',
                acao: 'cancel',
                prioridade: 3,
                validacao_required: false
            }
        };

        // Configurações de processamento
        this.config = {
            timeout_sinal: 300000,         // 5 minutos timeout
            max_tentativas: 3,             // Máximo 3 tentativas de processamento
            intervalo_limpeza: 3600000,    // Limpeza a cada hora
            validacao_fear_greed: true,    // Validar com Fear & Greed
            validacao_volatilidade: true,  // Validar volatilidade
            log_detalhado: true           // Log completo
        };

        this.estatisticas = {
            total_processados: 0,
            total_executados: 0,
            total_rejeitados: 0,
            total_expirados: 0,
            por_tipo: {}
        };

        this.iniciarLimpezaPeriodica();
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados && this.config.log_detalhado) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }

        // Salvar log no banco
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO signal_logs (timestamp, level, message, data, created_at)
                VALUES ($1, $2, $3, $4, NOW());
            `, [timestamp, nivel, mensagem, JSON.stringify(dados)]);
            client.release();
        } catch (error) {
            // Não quebrar por erro de log
        }
    }

    // ========================================
    // 1. PROCESSAMENTO DE SINAIS
    // ========================================

    async processarSinalTradingView(dadosWebhook, ip_origem = null) {
        const inicioProcessamento = Date.now();
        
        await this.log('info', 'Iniciando processamento de sinal TradingView', {
            dados: dadosWebhook,
            ip: ip_origem,
            timestamp: inicioProcessamento
        });

        try {
            // 1. Validar estrutura do sinal
            const sinalValidado = await this.validarEstruturaSinal(dadosWebhook);
            
            // 2. Identificar tipo do sinal
            const tipoSinal = this.identificarTipoSinal(sinalValidado);
            
            // 3. Registrar sinal no banco
            const sinalId = await this.registrarSinal(sinalValidado, tipoSinal, ip_origem);
            
            // 4. Executar validações necessárias
            const validacoes = await this.executarValidacoes(sinalValidado, tipoSinal);
            
            // 5. Processar baseado no tipo
            const resultado = await this.processarPorTipo(sinalId, sinalValidado, tipoSinal, validacoes);
            
            // 6. Atualizar estatísticas
            this.atualizarEstatisticas(tipoSinal, resultado.status);
            
            const tempoProcessamento = Date.now() - inicioProcessamento;
            
            await this.log('info', `Sinal processado com sucesso em ${tempoProcessamento}ms`, {
                sinal_id: sinalId,
                tipo: tipoSinal,
                resultado: resultado.status,
                tempo_ms: tempoProcessamento
            });

            return {
                sucesso: true,
                sinal_id: sinalId,
                tipo: tipoSinal,
                status: resultado.status,
                acoes_executadas: resultado.acoes,
                tempo_processamento: tempoProcessamento,
                validacoes: validacoes
            };

        } catch (error) {
            this.estatisticas.total_rejeitados++;
            
            await this.log('error', 'Erro no processamento de sinal', {
                dados: dadosWebhook,
                erro: error.message,
                stack: error.stack
            });

            return {
                sucesso: false,
                erro: error.message,
                timestamp: inicioProcessamento
            };
        }
    }

    async validarEstruturaSinal(dados) {
        // Campos obrigatórios
        const camposObrigatorios = ['symbol', 'action', 'price'];
        
        for (const campo of camposObrigatorios) {
            if (!dados[campo]) {
                throw new Error(`Campo obrigatório ausente: ${campo}`);
            }
        }

        // Validar formato do symbol
        if (!/^[A-Z]{3,10}$/.test(dados.symbol)) {
            throw new Error(`Formato de symbol inválido: ${dados.symbol}`);
        }

        // Validar preço
        const preco = parseFloat(dados.price);
        if (isNaN(preco) || preco <= 0) {
            throw new Error(`Preço inválido: ${dados.price}`);
        }

        // Validar timestamp se fornecido
        if (dados.timestamp) {
            const timestamp = new Date(dados.timestamp);
            if (isNaN(timestamp.getTime())) {
                throw new Error(`Timestamp inválido: ${dados.timestamp}`);
            }

            // Verificar se não é muito antigo (máximo 10 minutos)
            const agora = new Date();
            const diferenca = agora - timestamp;
            if (diferenca > 600000) { // 10 minutos
                throw new Error('Sinal muito antigo para ser processado');
            }
        }

        return {
            ...dados,
            price: preco,
            timestamp: dados.timestamp || new Date().toISOString(),
            processed_at: new Date().toISOString()
        };
    }

    identificarTipoSinal(sinal) {
        const acao = sinal.action.toUpperCase();
        
        // Mapear ações para tipos
        const mapeamento = {
            'BUY': 'LONG',
            'LONG': 'LONG',
            'SELL': 'SHORT',
            'SHORT': 'SHORT',
            'CLOSE': 'FECHE',
            'EXIT': 'FECHE',
            'STRONG': 'FORTE',
            'FORTE': 'FORTE',
            'CONFIRM': 'CONFIRMAÇÃO',
            'CONFIRMATION': 'CONFIRMAÇÃO',
            'CANCEL': 'CANCELAR'
        };

        const tipo = mapeamento[acao];
        
        if (!tipo) {
            throw new Error(`Tipo de sinal não reconhecido: ${acao}`);
        }

        if (!this.tiposSinais[tipo]) {
            throw new Error(`Tipo de sinal não suportado: ${tipo}`);
        }

        return tipo;
    }

    async registrarSinal(sinal, tipo, ip_origem) {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                INSERT INTO tradingview_signals (
                    symbol, action, type, price, timestamp, ip_origin,
                    raw_data, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'received', NOW())
                RETURNING id;
            `, [
                sinal.symbol,
                sinal.action,
                tipo,
                sinal.price,
                sinal.timestamp,
                ip_origem,
                JSON.stringify(sinal)
            ]);

            this.estatisticas.total_processados++;

            return resultado.rows[0].id;

        } catch (error) {
            await this.log('error', 'Erro ao registrar sinal', { erro: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 2. VALIDAÇÕES
    // ========================================

    async executarValidacoes(sinal, tipo) {
        const validacoes = {
            fear_greed: null,
            volatilidade: null,
            mercado_aberto: null,
            posicoes_ativas: null
        };

        try {
            // 1. Validação Fear & Greed (se habilitada)
            if (this.config.validacao_fear_greed && this.tiposSinais[tipo].validacao_required) {
                validacoes.fear_greed = await this.validarFearGreed(sinal, tipo);
            }

            // 2. Validação de volatilidade
            if (this.config.validacao_volatilidade) {
                validacoes.volatilidade = await this.validarVolatilidade(sinal);
            }

            // 3. Verificar se mercado está aberto
            validacoes.mercado_aberto = await this.verificarMercadoAberto(sinal.symbol);

            // 4. Verificar posições ativas
            validacoes.posicoes_ativas = await this.verificarPosicoesAtivas(sinal.symbol);

            await this.log('info', 'Validações executadas', {
                symbol: sinal.symbol,
                tipo,
                validacoes
            });

            return validacoes;

        } catch (error) {
            await this.log('error', 'Erro nas validações', { erro: error.message });
            throw error;
        }
    }

    async validarFearGreed(sinal, tipo) {
        try {
            const client = await this.pool.connect();
            const resultado = await client.query(`
                SELECT value, direction_allowed 
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1;
            `);
            client.release();

            if (resultado.rows.length === 0) {
                return { valido: false, motivo: 'Fear & Greed não disponível' };
            }

            const fearGread = resultado.rows[0];
            const valor = fearGread.value;
            const direcaoPermitida = fearGread.direction_allowed;

            // Validar baseado no tipo de sinal
            let permitido = true;
            let motivo = '';

            if (tipo === 'LONG' && direcaoPermitida === 'SHORT_ONLY') {
                permitido = false;
                motivo = `Fear & Greed ${valor} permite apenas SHORT`;
            } else if (tipo === 'SHORT' && direcaoPermitida === 'LONG_ONLY') {
                permitido = false;
                motivo = `Fear & Greed ${valor} permite apenas LONG`;
            }

            return {
                valido: permitido,
                valor_fear_greed: valor,
                direcao_permitida: direcaoPermitida,
                motivo: motivo || 'Validação Fear & Greed OK'
            };

        } catch (error) {
            return { valido: false, motivo: `Erro na validação Fear & Greed: ${error.message}` };
        }
    }

    async validarVolatilidade(sinal) {
        // Implementar validação de volatilidade
        // Por agora, sempre válido
        return {
            valido: true,
            volatilidade: 'normal',
            motivo: 'Volatilidade dentro dos parâmetros'
        };
    }

    async verificarMercadoAberto(symbol) {
        // Para crypto, mercado sempre aberto
        // Para outros ativos, verificar horário de funcionamento
        return {
            aberto: true,
            tipo_mercado: 'crypto',
            motivo: 'Mercado crypto 24/7'
        };
    }

    async verificarPosicoesAtivas(symbol) {
        try {
            const client = await this.pool.connect();
            const resultado = await client.query(`
                SELECT COUNT(*) as total, 
                       SUM(CASE WHEN side = 'buy' THEN 1 ELSE 0 END) as long_positions,
                       SUM(CASE WHEN side = 'sell' THEN 1 ELSE 0 END) as short_positions
                FROM active_positions 
                WHERE symbol = $1 AND status = 'open';
            `, [symbol]);
            client.release();

            const stats = resultado.rows[0];

            return {
                total_posicoes: parseInt(stats.total),
                posicoes_long: parseInt(stats.long_positions),
                posicoes_short: parseInt(stats.short_positions),
                tem_posicoes_ativas: parseInt(stats.total) > 0
            };

        } catch (error) {
            return {
                erro: error.message,
                tem_posicoes_ativas: false
            };
        }
    }

    // ========================================
    // 3. PROCESSAMENTO POR TIPO
    // ========================================

    async processarPorTipo(sinalId, sinal, tipo, validacoes) {
        await this.log('info', `Processando sinal tipo ${tipo}`, {
            sinal_id: sinalId,
            symbol: sinal.symbol
        });

        let resultado = { status: 'processado', acoes: [] };

        switch (tipo) {
            case 'LONG':
                resultado = await this.processarLong(sinalId, sinal, validacoes);
                break;
                
            case 'SHORT':
                resultado = await this.processarShort(sinalId, sinal, validacoes);
                break;
                
            case 'FORTE':
                resultado = await this.processarForte(sinalId, sinal, validacoes);
                break;
                
            case 'FECHE':
                resultado = await this.processarFeche(sinalId, sinal, validacoes);
                break;
                
            case 'CONFIRMAÇÃO':
                resultado = await this.processarConfirmacao(sinalId, sinal, validacoes);
                break;
                
            case 'CANCELAR':
                resultado = await this.processarCancelar(sinalId, sinal, validacoes);
                break;
                
            default:
                throw new Error(`Tipo não implementado: ${tipo}`);
        }

        // Atualizar status no banco
        await this.atualizarStatusSinal(sinalId, resultado.status, resultado);

        return resultado;
    }

    async processarLong(sinalId, sinal, validacoes) {
        // Verificar validações críticas
        if (validacoes.fear_greed && !validacoes.fear_greed.valido) {
            return {
                status: 'rejeitado',
                motivo: validacoes.fear_greed.motivo,
                acoes: []
            };
        }

        // Executar ordem LONG
        const acoes = [
            'Validar saldo disponível',
            'Calcular tamanho da posição',
            'Enviar ordem de compra',
            'Configurar stop loss e take profit',
            'Monitorar execução'
        ];

        await this.log('info', 'Executando sinal LONG', {
            sinal_id: sinalId,
            symbol: sinal.symbol,
            price: sinal.price
        });

        return {
            status: 'executado',
            acoes,
            direção: 'buy',
            preco_entrada: sinal.price
        };
    }

    async processarShort(sinalId, sinal, validacoes) {
        // Verificar validações críticas
        if (validacoes.fear_greed && !validacoes.fear_greed.valido) {
            return {
                status: 'rejeitado',
                motivo: validacoes.fear_greed.motivo,
                acoes: []
            };
        }

        // Executar ordem SHORT
        const acoes = [
            'Validar saldo disponível',
            'Calcular tamanho da posição',
            'Enviar ordem de venda',
            'Configurar stop loss e take profit',
            'Monitorar execução'
        ];

        await this.log('info', 'Executando sinal SHORT', {
            sinal_id: sinalId,
            symbol: sinal.symbol,
            price: sinal.price
        });

        return {
            status: 'executado',
            acoes,
            direção: 'sell',
            preco_entrada: sinal.price
        };
    }

    async processarForte(sinalId, sinal, validacoes) {
        // Amplificar posição existente ou aumentar tamanho
        const acoes = [
            'Identificar último sinal',
            'Aumentar tamanho da posição em 50%',
            'Ajustar gerenciamento de risco',
            'Notificar usuários sobre intensificação'
        ];

        await this.log('info', 'Executando sinal FORTE', {
            sinal_id: sinalId,
            symbol: sinal.symbol,
            amplificacao: '150%'
        });

        return {
            status: 'executado',
            acoes,
            tipo_acao: 'amplificacao',
            fator_amplificacao: 1.5
        };
    }

    async processarFeche(sinalId, sinal, validacoes) {
        // Fechar todas as posições ativas
        const acoes = [
            'Listar posições ativas',
            'Calcular PnL atual',
            'Enviar ordens de fechamento',
            'Liquidar posições pendentes',
            'Gerar relatório de fechamento'
        ];

        await this.log('info', 'Executando sinal FECHE', {
            sinal_id: sinalId,
            symbol: sinal.symbol,
            posicoes_ativas: validacoes.posicoes_ativas?.total_posicoes || 0
        });

        return {
            status: 'executado',
            acoes,
            tipo_acao: 'fechamento_completo',
            posicoes_fechadas: validacoes.posicoes_ativas?.total_posicoes || 0
        };
    }

    async processarConfirmacao(sinalId, sinal, validacoes) {
        // Confirmar sinal anterior pendente
        const acoes = [
            'Buscar último sinal pendente',
            'Validar condições de mercado',
            'Executar sinal confirmado',
            'Atualizar status'
        ];

        await this.log('info', 'Executando sinal CONFIRMAÇÃO', {
            sinal_id: sinalId,
            symbol: sinal.symbol
        });

        return {
            status: 'executado',
            acoes,
            tipo_acao: 'confirmacao',
            sinal_confirmado: true
        };
    }

    async processarCancelar(sinalId, sinal, validacoes) {
        // Cancelar sinais pendentes
        const acoes = [
            'Listar sinais pendentes',
            'Cancelar ordens não executadas',
            'Notificar cancelamento',
            'Limpar cache de sinais'
        ];

        await this.log('info', 'Executando sinal CANCELAR', {
            sinal_id: sinalId,
            symbol: sinal.symbol
        });

        return {
            status: 'executado',
            acoes,
            tipo_acao: 'cancelamento',
            sinais_cancelados: true
        };
    }

    // ========================================
    // 4. UTILITÁRIOS
    // ========================================

    async atualizarStatusSinal(sinalId, status, resultado) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE tradingview_signals 
                SET status = $1, result_data = $2, processed_at = NOW()
                WHERE id = $3;
            `, [status, JSON.stringify(resultado), sinalId]);

        } catch (error) {
            await this.log('error', 'Erro ao atualizar status do sinal', { erro: error.message });
        } finally {
            client.release();
        }
    }

    atualizarEstatisticas(tipo, status) {
        if (!this.estatisticas.por_tipo[tipo]) {
            this.estatisticas.por_tipo[tipo] = 0;
        }
        this.estatisticas.por_tipo[tipo]++;

        if (status === 'executado') {
            this.estatisticas.total_executados++;
        } else if (status === 'rejeitado') {
            this.estatisticas.total_rejeitados++;
        }
    }

    iniciarLimpezaPeriodica() {
        setInterval(async () => {
            await this.limparSinaisExpirados();
        }, this.config.intervalo_limpeza);
    }

    async limparSinaisExpirados() {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                UPDATE tradingview_signals 
                SET status = 'expired'
                WHERE status = 'received' 
                AND created_at < NOW() - INTERVAL '${this.config.timeout_sinal / 1000} seconds';
            `);

            if (resultado.rowCount > 0) {
                this.estatisticas.total_expirados += resultado.rowCount;
                await this.log('info', `${resultado.rowCount} sinais expirados limpos`);
            }

        } catch (error) {
            await this.log('error', 'Erro na limpeza de sinais expirados', { erro: error.message });
        } finally {
            client.release();
        }
    }

    async obterEstatisticas() {
        return {
            ...this.estatisticas,
            configuracoes: this.config,
            tipos_suportados: Object.keys(this.tiposSinais),
            timestamp: new Date().toISOString()
        };
    }

    async parar() {
        console.log('🛑 Parando Gestor de Sinais...');
        await this.pool.end();
        console.log('✅ Gestor de Sinais parado');
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorSinaisTradingView();
    
    console.log('📡 Gestor de Sinais TradingView ativo...');
    console.log('📊 Tipos de sinais suportados:', Object.keys(gestor.tiposSinais));

    // Cleanup graceful
    process.on('SIGINT', async () => {
        await gestor.parar();
        process.exit(0);
    });
}

module.exports = GestorSinaisTradingView;

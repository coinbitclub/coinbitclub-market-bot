/**
 * 📡 PROCESSADOR DE SINAIS TRADINGVIEW
 * Webhook para receber e processar sinais: SINAL LONG, SINAL SHORT, etc.
 */

const express = require('express');
const { Pool } = require('pg');
const GestorMedoGanancia = require('./gestor-medo-ganancia');
const GestorOperacoesAvancado = require('./gestor-operacoes-avancado');

console.log('📡 PROCESSADOR DE SINAIS TRADINGVIEW');
console.log('===================================');

class ProcessadorSinaisTradingView {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.gestorMG = new GestorMedoGanancia();
        this.gestorOperacoes = new GestorOperacoesAvancado();
        
        // Timeout para sinais (2 minutos = 120000 ms)
        this.timeoutSinal = 2 * 60 * 1000;
        
        // Tipos de sinais suportados
        this.tiposSinaisSuportados = [
            'SINAL LONG',
            'SINAL SHORT',
            'SINAL LONG FORTE',
            'SINAL SHORT FORTE',
            'FECHE LONG',
            'FECHE SHORT',
            'CONFIRMAÇÃO LONG',
            'CONFIRMAÇÃO SHORT'
        ];

        // Iniciar limpeza automática e timeout de sinais
        this.iniciarLimpezaAutomatica();
        this.iniciarMonitoramentoTimeout();
    }

    // ========================================
    // 1. WEBHOOK ENDPOINT PRINCIPAL
    // ========================================

    configurarWebhook(app) {
        console.log('🔗 Configurando webhook /webhook para sinais TradingView...');

        // Endpoint principal para receber sinais
        app.post('/webhook', async (req, res) => {
            try {
                console.log('📨 Sinal recebido do TradingView:', req.body);

                const resultado = await this.processarSinal(req.body);
                
                res.status(200).json({
                    sucesso: true,
                    mensagem: 'Sinal processado com sucesso',
                    dados: resultado
                });

            } catch (error) {
                console.error('❌ Erro ao processar sinal:', error.message);
                
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        // Endpoint de teste para sinais
        app.post('/webhook/teste', async (req, res) => {
            try {
                const sinalTeste = {
                    signal: req.body.signal || 'SINAL LONG',
                    symbol: req.body.symbol || 'BTCUSDT',
                    price: req.body.price || 45000,
                    timestamp: new Date().toISOString(),
                    source: 'teste'
                };

                const resultado = await this.processarSinal(sinalTeste);
                
                res.status(200).json({
                    sucesso: true,
                    mensagem: 'Sinal de teste processado',
                    dados: resultado
                });

            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    erro: error.message
                });
            }
        });

        console.log('✅ Webhook configurado');
    }

    // ========================================
    // 2. PROCESSAMENTO PRINCIPAL DE SINAIS
    // ========================================

    async processarSinal(dadosSinal) {
        console.log('🔄 Processando sinal:', dadosSinal);

        try {
            // 1. Validar estrutura do sinal
            const validacaoEstrutura = this.validarEstruturaSinal(dadosSinal);
            if (!validacaoEstrutura.valido) {
                throw new Error(`Estrutura inválida: ${validacaoEstrutura.erro}`);
            }

            // 2. Extrair informações do sinal
            const infoSinal = this.extrairInformacoesSinal(dadosSinal);
            
            // 3. Salvar sinal recebido
            const sinalId = await this.salvarSinalRecebido(infoSinal);

            // 4. Verificar se sinal ainda é válido (2 minutos)
            if (!this.sinalDentroPrazo(infoSinal.timestamp)) {
                await this.marcarSinalComoExpirado(sinalId);
                throw new Error('Sinal expirado - mais de 2 minutos');
            }

            // 5. Processar baseado no tipo de sinal
            let resultado;
            
            switch (infoSinal.categoria) {
                case 'abertura':
                    resultado = await this.processarSinalAbertura(infoSinal, sinalId);
                    break;
                    
                case 'fechamento':
                    resultado = await this.processarSinalFechamento(infoSinal, sinalId);
                    break;
                    
                case 'confirmacao':
                    resultado = await this.processarSinalConfirmacao(infoSinal, sinalId);
                    break;
                    
                default:
                    throw new Error(`Categoria de sinal desconhecida: ${infoSinal.categoria}`);
            }

            // 6. Atualizar status do sinal
            await this.atualizarStatusSinal(sinalId, 'processado', resultado);

            console.log('✅ Sinal processado com sucesso:', resultado);
            return resultado;

        } catch (error) {
            console.error('❌ Erro no processamento:', error.message);
            throw error;
        }
    }

    // ========================================
    // 3. VALIDAÇÃO E EXTRAÇÃO DE DADOS
    // ========================================

    validarEstruturaSinal(dados) {
        if (!dados.signal) {
            return { valido: false, erro: 'Campo "signal" obrigatório' };
        }

        if (!this.tiposSinaisSuportados.includes(dados.signal.toUpperCase())) {
            return { 
                valido: false, 
                erro: `Tipo de sinal "${dados.signal}" não suportado. Tipos válidos: ${this.tiposSinaisSuportados.join(', ')}` 
            };
        }

        return { valido: true };
    }

    extrairInformacoesSinal(dados) {
        const sinal = dados.signal.toUpperCase();
        
        let categoria, direcao, forca;
        
        // Determinar categoria
        if (sinal.includes('FECHE')) {
            categoria = 'fechamento';
        } else if (sinal.includes('CONFIRMAÇÃO')) {
            categoria = 'confirmacao';
        } else if (sinal.includes('SINAL')) {
            categoria = 'abertura';
        } else {
            categoria = 'desconhecido';
        }

        // Determinar direção
        if (sinal.includes('LONG')) {
            direcao = 'LONG';
        } else if (sinal.includes('SHORT')) {
            direcao = 'SHORT';
        } else {
            direcao = 'INDEFINIDO';
        }

        // Determinar força
        forca = sinal.includes('FORTE') ? 'forte' : 'normal';

        return {
            sinalOriginal: dados.signal,
            categoria,
            direcao,
            forca,
            symbol: dados.symbol || 'BTCUSDT',
            price: parseFloat(dados.price) || null,
            timestamp: dados.timestamp || new Date().toISOString(),
            source: dados.source || 'tradingview',
            dadosCompletos: dados
        };
    }

    sinalDentroPrazo(timestamp) {
        const agora = new Date();
        const timestampSinal = new Date(timestamp);
        const diferencaMinutos = (agora - timestampSinal) / (1000 * 60);
        
        return diferencaMinutos <= 2; // Máximo 2 minutos
    }

    // ========================================
    // 4. PROCESSAMENTO POR TIPO DE SINAL
    // ========================================

    async processarSinalAbertura(infoSinal, sinalId) {
        console.log(`📈 Processando sinal de abertura: ${infoSinal.sinalOriginal}`);

        try {
            // 1. Validar com Fear & Greed Index
            const validacaoFG = await this.gestorMG.validarSinalComFG(infoSinal.sinalOriginal);
            
            if (!validacaoFG.sinalValido) {
                return {
                    acao: 'bloqueado',
                    motivo: validacaoFG.motivo,
                    fearGreedIndex: validacaoFG.indiceFG,
                    operacoesAbertas: 0
                };
            }

            // 2. Buscar usuários ativos para executar operações
            const usuariosAtivos = await this.buscarUsuariosAtivos();
            
            const resultados = [];
            
            for (const usuario of usuariosAtivos) {
                try {
                    // Verificar se usuário pode abrir operação
                    const podeAbrir = await this.gestorOperacoes.podeAbrirOperacao(
                        usuario.id, 
                        infoSinal.symbol
                    );

                    if (podeAbrir.pode) {
                        // Abrir operação
                        const operacao = await this.gestorOperacoes.abrirOperacao({
                            userId: usuario.id,
                            symbol: infoSinal.symbol,
                            side: infoSinal.direcao,
                            entryPrice: infoSinal.price,
                            signalId: sinalId,
                            signalType: infoSinal.sinalOriginal,
                            fearGreedIndex: validacaoFG.indiceFG
                        });

                        resultados.push({
                            userId: usuario.id,
                            username: usuario.username,
                            sucesso: true,
                            operacaoId: operacao.operacaoId
                        });
                    } else {
                        resultados.push({
                            userId: usuario.id,
                            username: usuario.username,
                            sucesso: false,
                            motivo: podeAbrir.motivo
                        });
                    }

                } catch (error) {
                    resultados.push({
                        userId: usuario.id,
                        username: usuario.username,
                        sucesso: false,
                        erro: error.message
                    });
                }
            }

            const operacoesAbertas = resultados.filter(r => r.sucesso).length;

            return {
                acao: 'executado',
                fearGreedIndex: validacaoFG.indiceFG,
                usuariosProcessados: resultados.length,
                operacoesAbertas,
                detalhes: resultados
            };

        } catch (error) {
            console.error('❌ Erro no processamento de abertura:', error.message);
            throw error;
        }
    }

    async processarSinalFechamento(infoSinal, sinalId) {
        console.log(`🔒 Processando sinal de fechamento: ${infoSinal.sinalOriginal}`);

        try {
            // Buscar operações abertas na direção especificada
            const operacoesAbertas = await this.buscarOperacoesAbertas(infoSinal.direcao, infoSinal.symbol);
            
            const resultados = [];

            for (const operacao of operacoesAbertas) {
                try {
                    const fechamento = await this.gestorOperacoes.fecharOperacao(
                        operacao.id,
                        infoSinal.price,
                        `Fechamento por sinal: ${infoSinal.sinalOriginal}`
                    );

                    resultados.push({
                        operacaoId: operacao.id,
                        userId: operacao.user_id,
                        sucesso: true,
                        resultado: fechamento.resultado
                    });

                } catch (error) {
                    resultados.push({
                        operacaoId: operacao.id,
                        userId: operacao.user_id,
                        sucesso: false,
                        erro: error.message
                    });
                }
            }

            const operacoesFechadas = resultados.filter(r => r.sucesso).length;

            return {
                acao: 'fechamento_executado',
                direcao: infoSinal.direcao,
                symbol: infoSinal.symbol,
                operacoesFechadas,
                detalhes: resultados
            };

        } catch (error) {
            console.error('❌ Erro no processamento de fechamento:', error.message);
            throw error;
        }
    }

    async processarSinalConfirmacao(infoSinal, sinalId) {
        console.log(`ℹ️ Processando sinal de confirmação: ${infoSinal.sinalOriginal}`);

        // Sinais de confirmação são apenas informativos - não geram ações
        await this.salvarLogConfirmacao(infoSinal, sinalId);

        return {
            acao: 'confirmacao_registrada',
            direcao: infoSinal.direcao,
            mensagem: 'Sinal de confirmação registrado para análise da IA'
        };
    }

    // ========================================
    // 5. CONSULTAS DO BANCO DE DADOS
    // ========================================

    async salvarSinalRecebido(infoSinal) {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                INSERT INTO trading_signals (
                    signal_type, signal_direction, signal_strength,
                    symbol, price, category, timestamp_received,
                    source, raw_data, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                RETURNING id
            `, [
                infoSinal.sinalOriginal,
                infoSinal.direcao,
                infoSinal.forca,
                infoSinal.symbol,
                infoSinal.price,
                infoSinal.categoria,
                infoSinal.timestamp,
                infoSinal.source,
                JSON.stringify(infoSinal.dadosCompletos),
                'recebido'
            ]);

            return resultado.rows[0].id;

        } catch (error) {
            console.error('❌ Erro ao salvar sinal:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async buscarUsuariosAtivos() {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                SELECT DISTINCT u.id, u.username, u.email
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE u.status = 'active' 
                AND u.role = 'user'
                AND uak.status = 'active'
                ORDER BY u.id
            `);

            return resultado.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar usuários:', error.message);
            return [];
        } finally {
            client.release();
        }
    }

    async buscarOperacoesAbertas(direcao, symbol = null) {
        const client = await this.pool.connect();
        try {
            let query = `
                SELECT id, user_id, symbol, side, entry_price, created_at
                FROM trading_operations 
                WHERE status = 'open' AND side = $1
            `;
            
            const params = [direcao];
            
            if (symbol) {
                query += ' AND symbol = $2';
                params.push(symbol);
            }

            const resultado = await client.query(query, params);
            return resultado.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar operações:', error.message);
            return [];
        } finally {
            client.release();
        }
    }

    async atualizarStatusSinal(sinalId, status, resultado = null) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE trading_signals 
                SET status = $1, 
                    processing_result = $2,
                    processed_at = NOW()
                WHERE id = $3
            `, [status, JSON.stringify(resultado), sinalId]);

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error.message);
        } finally {
            client.release();
        }
    }

    async marcarSinalComoExpirado(sinalId) {
        await this.atualizarStatusSinal(sinalId, 'expirado', { motivo: 'Sinal expirado - mais de 2 minutos' });
    }

    async salvarLogConfirmacao(infoSinal, sinalId) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO ai_confirmations (
                    signal_id, direction, symbol, price, 
                    confirmation_type, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                sinalId,
                infoSinal.direcao,
                infoSinal.symbol,
                infoSinal.price,
                infoSinal.sinalOriginal
            ]);

        } catch (error) {
            console.error('❌ Erro ao salvar confirmação:', error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 6. MONITORAMENTO DE TIMEOUT
    // ========================================

    iniciarMonitoramentoTimeout() {
        console.log('⏰ Iniciando monitoramento de timeout de sinais (2 minutos)');

        // Verificar sinais expirados a cada 30 segundos
        setInterval(() => {
            this.verificarSinaisExpirados();
        }, 30 * 1000);

        console.log('✅ Monitoramento de timeout configurado');
    }

    async verificarSinaisExpirados() {
        const client = await this.pool.connect();
        
        try {
            // Marcar sinais que expiraram (não processados em 2 minutos)
            const sinaisExpirados = await client.query(`
                UPDATE trading_signals 
                SET status = 'expirado', 
                    processed_at = NOW(),
                    result_data = '{"motivo": "Timeout de 2 minutos atingido"}'
                WHERE status = 'recebido'
                AND timestamp_received < NOW() - INTERVAL '2 minutes'
                RETURNING id, signal_type, symbol
            `);

            if (sinaisExpirados.rows.length > 0) {
                console.log(`⏰ ${sinaisExpirados.rows.length} sinais expirados por timeout:`);
                sinaisExpirados.rows.forEach(sinal => {
                    console.log(`   - ID ${sinal.id}: ${sinal.signal_type} em ${sinal.symbol}`);
                });
            }

        } catch (error) {
            console.error('❌ Erro ao verificar sinais expirados:', error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 6.5. MONITORAMENTO DE TIMEOUT (2 MIN)
    // ========================================

    iniciarMonitoramentoTimeout() {
        console.log('⏰ Iniciando monitoramento de timeout de sinais (2 min)...');

        // Verificar sinais expirados a cada 30 segundos
        setInterval(async () => {
            try {
                await this.verificarSinaisExpirados();
            } catch (error) {
                console.error('❌ Erro no monitoramento de timeout:', error.message);
            }
        }, 30 * 1000); // 30 segundos

        console.log('✅ Monitoramento de timeout configurado');
    }

    async verificarSinaisExpirados() {
        const client = await this.pool.connect();
        try {
            // Marcar sinais não processados em 2 minutos como expirados
            const sinaisExpirados = await client.query(`
                UPDATE trading_signals 
                SET status = 'expirado',
                    updated_at = NOW(),
                    expiry_reason = 'timeout_2_minutos'
                WHERE status = 'recebido'
                AND created_at < NOW() - INTERVAL '2 minutes'
                RETURNING id, signal_type, symbol, created_at
            `);

            if (sinaisExpirados.rowCount > 0) {
                console.log(`⏰ ${sinaisExpirados.rowCount} sinais marcados como expirados por timeout:`);
                
                sinaisExpirados.rows.forEach(sinal => {
                    const idadeMinutos = Math.round((Date.now() - new Date(sinal.created_at)) / 60000);
                    console.log(`   - Sinal ${sinal.id}: ${sinal.signal_type} ${sinal.symbol} (${idadeMinutos}min)`);
                });

                // Log para auditoria
                await client.query(`
                    INSERT INTO system_logs (level, category, message, details, created_at)
                    VALUES ('warning', 'trading_signals', 'Sinais expirados por timeout', $1, NOW())
                `, [JSON.stringify({
                    count: sinaisExpirados.rowCount,
                    signals: sinaisExpirados.rows.map(s => ({
                        id: s.id,
                        type: s.signal_type,
                        symbol: s.symbol,
                        age_minutes: Math.round((Date.now() - new Date(s.created_at)) / 60000)
                    }))
                })]);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar sinais expirados:', error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 7. LIMPEZA AUTOMÁTICA
    // ========================================

    iniciarLimpezaAutomatica() {
        console.log('🧹 Iniciando limpeza automática de sinais...');

        // Limpeza a cada 1 hora
        setInterval(async () => {
            try {
                await this.limparSinaisAntigos();
            } catch (error) {
                console.error('❌ Erro na limpeza automática:', error.message);
            }
        }, 60 * 60 * 1000); // 1 hora

        console.log('✅ Limpeza automática configurada');
    }

    async limparSinaisAntigos() {
        console.log('🧹 Executando limpeza de sinais antigos...');

        const client = await this.pool.connect();
        try {
            // Remover sinais não processados há mais de 1 hora
            const sinaisNaoProcessados = await client.query(`
                DELETE FROM trading_signals 
                WHERE status IN ('recebido', 'expirado') 
                AND created_at < NOW() - INTERVAL '1 hour'
                RETURNING id
            `);

            // Remover sinais processados há mais de 2 horas após fechamento da operação
            const sinaisProcessados = await client.query(`
                DELETE FROM trading_signals ts
                WHERE ts.status = 'processado'
                AND ts.id NOT IN (
                    SELECT DISTINCT signal_id 
                    FROM trading_operations 
                    WHERE signal_id = ts.id 
                    AND status = 'open'
                )
                AND ts.processed_at < NOW() - INTERVAL '2 hours'
                RETURNING ts.id
            `);

            console.log(`✅ Limpeza concluída:`);
            console.log(`   - ${sinaisNaoProcessados.rows.length} sinais não processados removidos`);
            console.log(`   - ${sinaisProcessados.rows.length} sinais processados antigos removidos`);

        } catch (error) {
            console.error('❌ Erro na limpeza:', error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 7. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    async gerarRelatorioSinais(periodo = '24h') {
        console.log(`📊 Gerando relatório de sinais para ${periodo}...`);

        const client = await this.pool.connect();
        try {
            let whereClause = '';
            
            switch (periodo) {
                case '1h':
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '1 hour'";
                    break;
                case '24h':
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '24 hours'";
                    break;
                case '7d':
                    whereClause = "WHERE created_at >= NOW() - INTERVAL '7 days'";
                    break;
            }

            const estatisticas = await client.query(`
                SELECT 
                    COUNT(*) as total_sinais,
                    COUNT(CASE WHEN status = 'processado' THEN 1 END) as processados,
                    COUNT(CASE WHEN status = 'expirado' THEN 1 END) as expirados,
                    COUNT(CASE WHEN category = 'abertura' THEN 1 END) as abertura,
                    COUNT(CASE WHEN category = 'fechamento' THEN 1 END) as fechamento,
                    COUNT(CASE WHEN category = 'confirmacao' THEN 1 END) as confirmacao,
                    COUNT(CASE WHEN signal_direction = 'LONG' THEN 1 END) as long_signals,
                    COUNT(CASE WHEN signal_direction = 'SHORT' THEN 1 END) as short_signals
                FROM trading_signals ${whereClause}
            `);

            const stats = estatisticas.rows[0];

            return {
                periodo,
                resumo: {
                    total_sinais: parseInt(stats.total_sinais),
                    processados: parseInt(stats.processados),
                    expirados: parseInt(stats.expirados),
                    taxa_processamento: stats.total_sinais > 0 ? 
                        (stats.processados / stats.total_sinais * 100).toFixed(1) + '%' : '0%'
                },
                por_categoria: {
                    abertura: parseInt(stats.abertura),
                    fechamento: parseInt(stats.fechamento),
                    confirmacao: parseInt(stats.confirmacao)
                },
                por_direcao: {
                    long: parseInt(stats.long_signals),
                    short: parseInt(stats.short_signals)
                }
            };

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

// Função auxiliar para validação de sinais (para testes)
function validarSinal(sinal) {
    if (!sinal || typeof sinal !== 'object') {
        return { valido: false, erro: 'Sinal deve ser um objeto válido' };
    }

    // Validar campos obrigatórios
    const camposObrigatorios = ['symbol', 'action'];
    for (const campo of camposObrigatorios) {
        if (!sinal[campo]) {
            return { valido: false, erro: `Campo obrigatório ausente: ${campo}` };
        }
    }

    // Validar symbol
    if (typeof sinal.symbol !== 'string' || sinal.symbol.length < 3) {
        return { valido: false, erro: 'Symbol deve ser uma string válida com pelo menos 3 caracteres' };
    }

    // Validar action
    const acoesValidas = ['BUY', 'SELL', 'LONG', 'SHORT', 'CLOSE', 'CANCEL'];
    if (!acoesValidas.includes(sinal.action.toUpperCase())) {
        return { valido: false, erro: `Action deve ser uma das: ${acoesValidas.join(', ')}` };
    }

    // Validar price se fornecido
    if (sinal.price && (typeof sinal.price !== 'number' || sinal.price <= 0)) {
        return { valido: false, erro: 'Price deve ser um número positivo' };
    }

    return { valido: true };
}

module.exports = ProcessadorSinaisTradingView;
module.exports.validarSinal = validarSinal;

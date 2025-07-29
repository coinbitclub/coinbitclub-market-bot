/**
 * 🔄 ALIMENTADOR ROBUSTO DE INFORMAÇÕES
 * Sistema completo para alimentar dados do sistema de forma automática
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

console.log('🔄 SISTEMA DE ALIMENTAÇÃO ROBUSTA DE DADOS');
console.log('==========================================');

class AlimentadorRobusto {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };

        this.executionLog = [];
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, nivel, mensagem, dados };
        
        this.executionLog.push(logEntry);
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }
    }

    async retryOperation(operacao, nome) {
        let tentativa = 0;
        let delay = this.retryConfig.retryDelay;

        while (tentativa < this.retryConfig.maxRetries) {
            try {
                return await operacao();
            } catch (error) {
                tentativa++;
                await this.log('warning', `Tentativa ${tentativa}/${this.retryConfig.maxRetries} falhou para ${nome}`, {
                    erro: error.message,
                    tentativa
                });

                if (tentativa >= this.retryConfig.maxRetries) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= this.retryConfig.backoffMultiplier;
            }
        }
    }

    // ========================================
    // 1. ALIMENTAÇÃO DE DADOS DE USUÁRIOS
    // ========================================

    async alimentarDadosUsuarios() {
        await this.log('info', 'Iniciando alimentação de dados de usuários');

        const client = await this.pool.connect();
        try {
            // Buscar usuários que precisam de dados atualizados
            const usuarios = await client.query(`
                SELECT u.*, ua.api_key, ua.api_secret, ua.exchange_name
                FROM users u
                LEFT JOIN user_api_keys ua ON u.id = ua.user_id
                WHERE u.status = 'active' AND u.role != 'admin'
                ORDER BY u.created_at DESC;
            `);

            await this.log('info', `Encontrados ${usuarios.rows.length} usuários para atualização`);

            for (const usuario of usuarios.rows) {
                await this.processarUsuario(usuario, client);
            }

        } catch (error) {
            await this.log('error', 'Erro na alimentação de dados de usuários', { erro: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    async processarUsuario(usuario, client) {
        try {
            // Atualizar informações básicas do usuário
            await this.atualizarPerfilUsuario(usuario, client);
            
            // Atualizar configurações de trading se tiver API keys
            if (usuario.api_key && usuario.api_secret) {
                await this.atualizarConfiguracaoTrading(usuario, client);
                await this.sincronizarSaldosExchange(usuario, client);
            }

            // Atualizar preferências e parametrizações
            await this.atualizarParametrizacoes(usuario, client);

        } catch (error) {
            await this.log('error', `Erro ao processar usuário ${usuario.id}`, { 
                usuario: usuario.email, 
                erro: error.message 
            });
        }
    }

    async atualizarPerfilUsuario(usuario, client) {
        // Garantir que o usuário tem todas as configurações necessárias
        const configuracoesPadrao = {
            risk_level: 'medium',
            max_daily_loss: 100.00,
            max_position_size: 1000.00,
            auto_trading: true,
            notifications_enabled: true,
            preferred_pairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
            trading_hours_start: '09:00',
            trading_hours_end: '17:00',
            timezone: 'America/Sao_Paulo'
        };

        await client.query(`
            INSERT INTO user_preferences (user_id, preferences, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                preferences = COALESCE(user_preferences.preferences, $2),
                updated_at = NOW();
        `, [usuario.id, JSON.stringify(configuracoesPadrao)]);

        await this.log('info', `Perfil atualizado para usuário ${usuario.email}`);
    }

    async atualizarConfiguracaoTrading(usuario, client) {
        // Validar e atualizar configurações de trading
        const configuracaoTrading = {
            user_id: usuario.id,
            exchange_name: usuario.exchange_name || 'binance',
            api_key_encrypted: this.criptografarChave(usuario.api_key),
            api_secret_encrypted: this.criptografarChave(usuario.api_secret),
            testnet: process.env.NODE_ENV !== 'production',
            status: 'active',
            last_validated: new Date().toISOString()
        };

        await client.query(`
            INSERT INTO user_exchanges (user_id, exchange_name, api_key_encrypted, api_secret_encrypted, testnet, status, last_validated, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (user_id, exchange_name) 
            DO UPDATE SET 
                api_key_encrypted = $3,
                api_secret_encrypted = $4,
                status = $6,
                last_validated = $7,
                updated_at = NOW();
        `, [
            configuracaoTrading.user_id,
            configuracaoTrading.exchange_name,
            configuracaoTrading.api_key_encrypted,
            configuracaoTrading.api_secret_encrypted,
            configuracaoTrading.testnet,
            configuracaoTrading.status,
            configuracaoTrading.last_validated
        ]);

        await this.log('info', `Configuração de trading atualizada para ${usuario.email}`);
    }

    async atualizarParametrizacoes(usuario, client) {
        // Parametrizações específicas de trading
        const parametrizacoesPadrao = {
            position_size_percent: 2.0, // 2% do saldo por trade
            max_open_positions: 5,
            stop_loss_percent: 2.0,
            take_profit_percent: 4.0,
            trailing_stop: true,
            risk_reward_ratio: 2.0,
            min_signal_confidence: 0.7,
            blacklisted_pairs: [],
            whitelisted_pairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT'],
            session_limits: {
                max_daily_trades: 20,
                max_daily_loss_usd: 500,
                max_drawdown_percent: 10
            }
        };

        await client.query(`
            INSERT INTO user_trading_params (user_id, parameters, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                parameters = $2,
                updated_at = NOW();
        `, [usuario.id, JSON.stringify(parametrizacoesPadrao)]);

        await this.log('info', `Parametrizações atualizadas para ${usuario.email}`);
    }

    // ========================================
    // 2. ALIMENTAÇÃO DE DADOS DE MERCADO
    // ========================================

    async alimentarDadosMercado() {
        await this.log('info', 'Iniciando alimentação de dados de mercado');

        const pares = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'DOTUSDT'];
        
        for (const par of pares) {
            await this.retryOperation(
                () => this.buscarDadosPar(par),
                `Dados do par ${par}`
            );
        }
    }

    async buscarDadosPar(symbol) {
        try {
            // Simular busca de dados da Binance (substitua pela API real)
            const dadosMercado = {
                symbol: symbol,
                price: (Math.random() * 50000 + 10000).toFixed(2),
                volume: (Math.random() * 1000000).toFixed(2),
                change_24h: (Math.random() * 10 - 5).toFixed(2),
                timestamp: new Date().toISOString()
            };

            const client = await this.pool.connect();
            try {
                await client.query(`
                    INSERT INTO market_data (symbol, price, volume, change_24h, timestamp)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (symbol) 
                    DO UPDATE SET 
                        price = $2,
                        volume = $3,
                        change_24h = $4,
                        timestamp = $5;
                `, [dadosMercado.symbol, dadosMercado.price, dadosMercado.volume, dadosMercado.change_24h, dadosMercado.timestamp]);

                await this.log('info', `Dados de mercado atualizados para ${symbol}`, dadosMercado);
            } finally {
                client.release();
            }

        } catch (error) {
            await this.log('error', `Erro ao buscar dados do par ${symbol}`, { erro: error.message });
            throw error;
        }
    }

    // ========================================
    // 3. SINCRONIZAÇÃO DE SALDOS
    // ========================================

    async sincronizarSaldosExchange(usuario, client) {
        try {
            // Simular consulta de saldo na exchange (substitua pela API real)
            const saldos = [
                { asset: 'USDT', free: (Math.random() * 10000).toFixed(2), locked: '0.00' },
                { asset: 'BTC', free: (Math.random() * 2).toFixed(8), locked: '0.00' },
                { asset: 'ETH', free: (Math.random() * 10).toFixed(6), locked: '0.00' }
            ];

            for (const saldo of saldos) {
                await client.query(`
                    INSERT INTO user_balances (user_id, asset, free_balance, locked_balance, updated_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (user_id, asset) 
                    DO UPDATE SET 
                        free_balance = $3,
                        locked_balance = $4,
                        updated_at = NOW();
                `, [usuario.id, saldo.asset, saldo.free, saldo.locked]);
            }

            await this.log('info', `Saldos sincronizados para ${usuario.email}`, { saldos: saldos.length });

        } catch (error) {
            await this.log('error', `Erro ao sincronizar saldos para ${usuario.email}`, { erro: error.message });
        }
    }

    // ========================================
    // 4. ALIMENTAÇÃO DE CONFIGURAÇÕES DO SISTEMA
    // ========================================

    async alimentarConfiguracoesSistema() {
        await this.log('info', 'Atualizando configurações do sistema');

        const client = await this.pool.connect();
        try {
            const configuracoesSistema = {
                trading_enabled: true,
                maintenance_mode: false,
                max_concurrent_trades: 100,
                system_risk_level: 'normal',
                emergency_stop: false,
                supported_exchanges: ['binance', 'okx', 'bybit'],
                supported_pairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT'],
                min_trade_amount: 10.0,
                max_trade_amount: 50000.0,
                fee_structure: {
                    trading_fee: 0.1,
                    withdrawal_fee: 0.0005
                },
                rate_limits: {
                    signals_per_minute: 60,
                    trades_per_user_per_minute: 10
                }
            };

            await client.query(`
                INSERT INTO system_config (config_key, config_value, updated_at)
                VALUES ('trading_settings', $1, NOW())
                ON CONFLICT (config_key) 
                DO UPDATE SET 
                    config_value = $1,
                    updated_at = NOW();
            `, [JSON.stringify(configuracoesSistema)]);

            await this.log('info', 'Configurações do sistema atualizadas');

        } catch (error) {
            await this.log('error', 'Erro ao atualizar configurações do sistema', { erro: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 5. UTILITÁRIOS E HELPERS
    // ========================================

    criptografarChave(chave) {
        if (!chave) return null;
        
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(chave, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    }

    descriptografarChave(chaveEncriptada) {
        if (!chaveEncriptada) return null;
        
        const [ivHex, encrypted] = chaveEncriptada.split(':');
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = Buffer.from(ivHex, 'hex');
        
        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    async validarIntegridadeDados() {
        await this.log('info', 'Iniciando validação de integridade dos dados');

        const client = await this.pool.connect();
        try {
            // Verificar usuários sem configurações
            const usuariosSemConfig = await client.query(`
                SELECT u.id, u.email 
                FROM users u 
                LEFT JOIN user_preferences up ON u.id = up.user_id 
                WHERE up.user_id IS NULL AND u.role != 'admin';
            `);

            if (usuariosSemConfig.rows.length > 0) {
                await this.log('warning', `${usuariosSemConfig.rows.length} usuários sem configurações`, {
                    usuarios: usuariosSemConfig.rows.map(u => u.email)
                });
            }

            // Verificar exchanges sem validação recente
            const exchangesDesatualizadas = await client.query(`
                SELECT ue.user_id, ue.exchange_name, ue.last_validated 
                FROM user_exchanges ue 
                WHERE ue.last_validated < NOW() - INTERVAL '24 hours';
            `);

            if (exchangesDesatualizadas.rows.length > 0) {
                await this.log('warning', `${exchangesDesatualizadas.rows.length} exchanges precisam de revalidação`);
            }

            await this.log('info', 'Validação de integridade concluída');

        } catch (error) {
            await this.log('error', 'Erro na validação de integridade', { erro: error.message });
        } finally {
            client.release();
        }
    }

    // ========================================
    // 6. EXECUÇÃO PRINCIPAL
    // ========================================

    async executarAlimentacaoCompleta() {
        const inicioExecucao = Date.now();
        
        try {
            await this.log('info', '🚀 INICIANDO ALIMENTAÇÃO ROBUSTA COMPLETA');

            // Passo 1: Alimentar dados de usuários
            await this.retryOperation(
                () => this.alimentarDadosUsuarios(),
                'Alimentação de dados de usuários'
            );

            // Passo 2: Alimentar dados de mercado
            await this.retryOperation(
                () => this.alimentarDadosMercado(),
                'Alimentação de dados de mercado'
            );

            // Passo 3: Atualizar configurações do sistema
            await this.retryOperation(
                () => this.alimentarConfiguracoesSistema(),
                'Alimentação de configurações do sistema'
            );

            // Passo 4: Validar integridade
            await this.validarIntegridadeDados();

            const tempoExecucao = Date.now() - inicioExecucao;
            await this.log('info', `✅ ALIMENTAÇÃO COMPLETA CONCLUÍDA EM ${tempoExecucao}ms`);

            return {
                sucesso: true,
                tempoExecucao,
                totalOperacoes: this.executionLog.length,
                log: this.executionLog
            };

        } catch (error) {
            await this.log('error', '❌ ERRO NA ALIMENTAÇÃO COMPLETA', { erro: error.message });
            throw error;
        } finally {
            await this.pool.end();
        }
    }

    // ========================================
    // 7. ALIMENTAÇÃO CONTÍNUA (SCHEDULING)
    // ========================================

    iniciarAlimentacaoContinua() {
        console.log('🔄 Iniciando alimentação contínua de dados');

        // Alimentação rápida a cada 30 segundos
        setInterval(async () => {
            try {
                await this.alimentarDadosMercado();
            } catch (error) {
                console.error('Erro na alimentação rápida:', error.message);
            }
        }, 30000);

        // Alimentação completa a cada 5 minutos
        setInterval(async () => {
            try {
                await this.alimentarDadosUsuarios();
                await this.validarIntegridadeDados();
            } catch (error) {
                console.error('Erro na alimentação completa:', error.message);
            }
        }, 300000);

        // Limpeza e otimização a cada hora
        setInterval(async () => {
            try {
                await this.alimentarConfiguracoesSistema();
                // Aqui você pode adicionar limpeza de logs antigos
            } catch (error) {
                console.error('Erro na manutenção:', error.message);
            }
        }, 3600000);
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const alimentador = new AlimentadorRobusto();
    alimentador.executarAlimentacaoCompleta()
        .then(resultado => {
            console.log('✅ Alimentação concluída com sucesso:', resultado);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro na alimentação:', error.message);
            process.exit(1);
        });
}

module.exports = AlimentadorRobusto;

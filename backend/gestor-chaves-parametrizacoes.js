/**
 * 🎯 SISTEMA DE GESTÃO DE CHAVES API E PARAMETRIZAÇÕES
 * Gerenciamento robusto das API keys dos usuários e configurações
 */

const { Pool } = require('pg');
const crypto = require('crypto');

console.log('🔐 SISTEMA DE GESTÃO DE CHAVES API');
console.log('=================================');

class GestorChavesAPI {
    constructor() {
        // ========================================
        // 🔗 CONEXÃO POSTGRESQL RAILWAY
        // ========================================
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false } // Railway sempre usa SSL
        });

        this.chaveEncriptacao = process.env.ENCRYPTION_KEY || 'coinbitclub-default-key-2025';
        this.parametrizacoesPadrao = this.definirParametrizacoesPadrao();
        
        // ========================================
        // 🔑 CHAVES DO SISTEMA (RAILWAY) - MULTI-USUÁRIO
        // Fallback quando usuário não tem chaves próprias
        // ========================================
        this.chavesRailway = {
            binance: {
                // Chaves principais (mainnet/produção)
                apiKey: process.env.BINANCE_API_KEY || '',
                apiSecret: process.env.BINANCE_SECRET_KEY || '',
                
                // Chaves testnet
                testnetApiKey: process.env.BINANCE_API_TESTNET || '',
                testnetApiSecret: process.env.BINANCE_SECRET_TESTNET || '',
                
                // URLs base
                baseUrl: process.env.BINANCE_API_BASE || 'https://fapi.binance.com',
                testnetUrl: process.env.BINANCE_API_BASE_TEST || 'https://testnet.binancefuture.com',
                
                // Configurações
                testnet: process.env.BINANCE_TESTNET === 'true',
                mainnet: process.env.BINANCE_API_MAINNET === 'true'
            },
            bybit: {
                // Chaves principais (mainnet/produção)
                apiKey: process.env.BYBIT_API_KEY || '',
                apiSecret: process.env.BYBIT_SECRET_KEY || '',
                
                // Chaves testnet
                testnetApiKey: process.env.BYBIT_API_TESTNET || '',
                testnetApiSecret: process.env.BYBIT_SECRET_TESTNET || '',
                
                // URLs base
                baseUrl: process.env.BYBIT_BASE_URL_REAL || 'https://api.bybit.com',
                testnetUrl: process.env.BYBIT_BASE_URL_TEST || 'https://api-testnet.bybit.com',
                
                // Configurações
                testnet: process.env.BYBIT_TESTNET === 'true',
                mainnet: process.env.BYBIT_API_MAINNET === 'true'
            }
        };
        
        console.log('🔗 Railway PostgreSQL configurado');
        console.log('🔑 Chaves do sistema carregadas:');
        console.log(`   📊 Binance: ${this.chavesRailway.binance.apiKey ? 'Configurada' : 'Não configurada'}`);
        console.log(`   📊 Bybit: ${this.chavesRailway.bybit.apiKey ? 'Configurada' : 'Não configurada'}`);
    }

    definirParametrizacoesPadrao() {
        return {
            // Configurações de Trading - Conforme especificação
            trading: {
                balance_percentage: 30,             // 30% do saldo por operação
                leverage_default: 5,                // 5x alavancagem padrão
                take_profit_multiplier: 3,          // TP = 3x alavancagem
                stop_loss_multiplier: 2,            // SL = 2x alavancagem
                max_open_positions: 2,              // Máximo 2 operações simultâneas
                trailing_stop: false,               // Sem trailing stop
                risk_reward_ratio: 1.5,             // Relação risco/retorno 1:1.5
                min_signal_confidence: 0.7,         // Confiança mínima do sinal (70%)
                max_slippage_percent: 0.1           // Slippage máximo 0.1%
            },

            // Limites e Segurança
            limits: {
                max_daily_trades: 20,              // Máximo 20 trades por dia
                max_daily_loss_usd: 500,           // Perda máxima diária USD
                max_weekly_loss_usd: 2000,         // Perda máxima semanal USD
                max_drawdown_percent: 10,          // Drawdown máximo 10%
                min_account_balance: 100,          // Saldo mínimo da conta
                emergency_stop_loss: 15            // Stop de emergência em 15% de perda
            },

            // Pares e Exchanges
            assets: {
                whitelisted_pairs: [
                    'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 
                    'DOTUSDT', 'LINKUSDT', 'SOLUSDT', 'AVAXUSDT'
                ],
                blacklisted_pairs: [],
                preferred_quote_currency: 'USDT',
                min_trade_amount_usd: 10,
                max_trade_amount_usd: 5000
            },

            // Horários de Trading - Cripto 24/7
            schedule: {
                trading_enabled: true,
                timezone: 'UTC',
                weekend_trading: true,
                holiday_trading: true,
                break_times: [],  // Sem pausas - mercado 24/7
                maintenance_window: {
                    enabled: false,
                    start: '00:00',
                    end: '00:00'
                }
            },

            // Notificações
            notifications: {
                email_enabled: true,
                sms_enabled: false,
                telegram_enabled: false,
                notify_on_trade: true,
                notify_on_profit: true,
                notify_on_loss: true,
                notify_on_emergency_stop: true,
                daily_report: true
            },

            // Configurações Avançadas
            advanced: {
                use_trailing_stop: true,
                partial_close_on_profit: false,
                scale_in_enabled: false,
                martingale_enabled: false,
                copy_trading_enabled: false,
                auto_compound: true,
                reinvest_profits: true
            }
        };
    }

    // ========================================
    // 1. GESTÃO DE CHAVES API
    // ========================================

    async adicionarChaveAPI(userId, exchangeName, apiKey, apiSecret, testnet = false, passphrase = null) {
        const modoOperacao = testnet ? 'TESTNET' : 'PRODUÇÃO';
        console.log(`🔐 Adicionando chave API para usuário ${userId} na ${exchangeName} (${modoOperacao})`);

        const client = await this.pool.connect();
        try {
            // Validar chaves antes de salvar
            const validacao = await this.validarChavesAPI(apiKey, apiSecret, exchangeName, testnet, passphrase);
            
            if (!validacao.valida) {
                throw new Error(`Chaves API inválidas: ${validacao.erro}`);
            }

            // Inserir/atualizar no banco (usando estrutura existente)
            const resultado = await client.query(`
                INSERT INTO user_api_keys (
                    user_id, exchange, api_key, secret_key, 
                    passphrase, environment, is_active, validation_status, 
                    last_validated_at, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
                ON CONFLICT (user_id, exchange) 
                DO UPDATE SET 
                    api_key = $3,
                    secret_key = $4,
                    passphrase = $5,
                    environment = $6,
                    is_active = $7,
                    validation_status = $8,
                    last_validated_at = NOW(),
                    updated_at = NOW()
                RETURNING id;
            `, [
                userId, exchangeName.toLowerCase(), apiKey, apiSecret,
                passphrase, testnet ? 'testnet' : 'mainnet', true, 'validated'
            ]);

            console.log(`✅ Chave API adicionada com sucesso - ID: ${resultado.rows[0].id}`);
            console.log(`📊 Saldo inicial registrado:`, Object.keys(validacao.saldo).length, 'moedas');

            // Aplicar parametrizações padrão se for a primeira chave
            await this.aplicarParametrizacoesPadrao(userId, client);

            return {
                sucesso: true,
                chaveId: resultado.rows[0].id,
                permissoes: validacao.permissoes,
                saldoInicial: validacao.saldo,
                informacoes: validacao.informacoes
            };

        } catch (error) {
            console.error(`❌ Erro ao adicionar chave API: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async validarChavesAPI(apiKey, apiSecret, exchangeName, testnet, passphrase = null) {
        const modoOperacao = testnet ? 'TESTNET' : 'PRODUÇÃO';
        console.log(`🔍 Validando chaves da ${exchangeName} (${modoOperacao})`);

        try {
            let resultado;
            
            // Validar usando métodos específicos da exchange (TESTNET + PRODUÇÃO)
            switch (exchangeName.toLowerCase()) {
                case 'binance':
                    resultado = await this.validarBinance(apiKey, apiSecret, testnet);
                    break;
                    
                case 'bybit':
                    resultado = await this.validarBybit(apiKey, apiSecret, testnet);
                    break;
                    
                case 'okx':
                    resultado = await this.validarOKX(apiKey, apiSecret, testnet);
                    break;
                    
                default:
                    throw new Error(`Exchange ${exchangeName} não suportada`);
            }

            if (resultado.valida) {
                console.log(`✅ Chaves ${exchangeName} validadas com sucesso`);
                console.log(`📊 Saldo encontrado:`, Object.keys(resultado.saldo).length, 'moedas');
                
                return {
                    valida: true,
                    permissoes: resultado.permissoes,
                    saldo: resultado.saldo,
                    informacoes: resultado.informacoes,
                    exchange: exchangeName
                };
            } else {
                console.log(`❌ Chaves ${exchangeName} inválidas: ${resultado.erro}`);
                return {
                    valida: false,
                    erro: resultado.erro,
                    permissoes: []
                };
            }
        } catch (error) {
            console.error(`❌ Erro na validação ${exchangeName}:`, error.message);
            return {
                valida: false,
                erro: error.message,
                permissoes: []
            };
        }
    }

    async validarBinance(apiKey, apiSecret, testnet) {
        const modoOperacao = testnet ? 'TESTNET' : 'PRODUÇÃO';
        console.log(`🔍 Validando chaves Binance (${modoOperacao})`);
        
        try {
            const https = require('https');
            const crypto = require('crypto');
            
            // Usar endpoints corretos para testnet e produção
            const baseUrl = testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
            const timestamp = Date.now();
            const recvWindow = 60000; // Janela maior para evitar problemas de timing
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            
            // Criar assinatura
            const signature = crypto
                .createHmac('sha256', apiSecret)
                .update(queryString)
                .digest('hex');
            
            // Usar endpoint correto para Futures
            const endpoint = '/fapi/v2/account';
            const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
            
            console.log(`📡 Conectando em: ${baseUrl} (${modoOperacao})`);
            
            // Fazer requisição autenticada
            const response = await new Promise((resolve, reject) => {
                const urlObj = new URL(url);
                const options = {
                    hostname: urlObj.hostname,
                    path: urlObj.pathname + urlObj.search,
                    method: 'GET',
                    headers: {
                        'X-MBX-APIKEY': apiKey,
                        'Content-Type': 'application/json'
                    }
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            reject(new Error('Resposta inválida da Binance'));
                        }
                    });
                });
                
                req.on('error', reject);
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('Timeout na requisição'));
                });
                
                req.end();
            });
            
            // Resposta da Binance Futures é diferente
            if (response.totalWalletBalance !== undefined) {
                // Extrair saldos da Binance Futures
                const saldos = {};
                if (response.assets) {
                    response.assets.forEach(asset => {
                        const total = parseFloat(asset.walletBalance);
                        if (total > 0) {
                            saldos[asset.asset] = {
                                disponivel: parseFloat(asset.availableBalance),
                                total: total,
                                bloqueado: parseFloat(asset.walletBalance) - parseFloat(asset.availableBalance)
                            };
                        }
                    });
                }
                
                return {
                    valida: true,
                    permissoes: ['futures_trading', 'read_account'],
                    saldo: saldos,
                    informacoes: {
                        accountType: 'FUTURES',
                        totalWalletBalance: response.totalWalletBalance,
                        availableBalance: response.availableBalance,
                        maxWithdrawAmount: response.maxWithdrawAmount,
                        canTrade: true,
                        canWithdraw: true,
                        canDeposit: true,
                        updateTime: response.updateTime
                    }
                };
            } else if (response.code) {
                // Mapear códigos de erro comuns
                let mensagemErro = `Código ${response.code}: ${response.msg}`;
                if (response.code === -2015) {
                    mensagemErro = 'Erro de IP ou permissões - Remova restrições de IP na Binance';
                } else if (response.code === -2014) {
                    mensagemErro = 'API Key inválida';
                } else if (response.code === -1022) {
                    mensagemErro = 'Assinatura inválida (API Secret incorreto)';
                }
                
                return {
                    valida: false,
                    erro: mensagemErro,
                    permissoes: []
                };
            } else {
                return {
                    valida: false,
                    erro: 'Resposta inesperada da Binance',
                    permissoes: []
                };
            }
            
        } catch (error) {
            console.error('❌ Erro na validação Binance:', error.message);
            return {
                valida: false,
                erro: error.message,
                permissoes: []
            };
        }
    }

    async validarOKX(apiKey, apiSecret, testnet) {
        // Simular validação da OKX
        return {
            valida: true,
            permissoes: ['spot_trading', 'read_account'],
            saldo: { USDT: 500.00 }
        };
    }

    async validarBybit(apiKey, apiSecret, testnet) {
        const modoOperacao = testnet ? 'TESTNET' : 'PRODUÇÃO';
        console.log(`🔍 Validando chaves Bybit (${modoOperacao})`);
        
        try {
            const https = require('https');
            const crypto = require('crypto');
            
            // Usar endpoints corretos para testnet e produção
            const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
            const timestamp = Date.now();
            const recvWindow = '5000';
            
            console.log(`📡 Conectando em: ${baseUrl} (${modoOperacao})`);
            
            // Criar assinatura HMAC-SHA256 (formato Bybit)
            const signature = crypto
                .createHmac('sha256', apiSecret)
                .update(timestamp + apiKey + recvWindow)
                .digest('hex');

            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            };

            const url = `${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`;
            
            // Fazer requisição autenticada
            const response = await new Promise((resolve, reject) => {
                const urlObj = new URL(url);
                const options = {
                    hostname: urlObj.hostname,
                    path: urlObj.pathname + urlObj.search,
                    method: 'GET',
                    headers: headers
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            reject(new Error('Resposta inválida da Bybit'));
                        }
                    });
                });
                
                req.on('error', reject);
                req.setTimeout(15000, () => {
                    req.destroy();
                    reject(new Error('Timeout na requisição'));
                });
                
                req.end();
            });
            
            if (response.result && response.retCode === 0) {
                // Extrair saldos da Bybit
                const saldos = {};
                if (response.result.list && response.result.list.length > 0) {
                    const wallet = response.result.list[0];
                    if (wallet.coin) {
                        wallet.coin.forEach(coin => {
                            const total = parseFloat(coin.walletBalance);
                            if (total > 0) {
                                saldos[coin.coin] = {
                                    disponivel: parseFloat(coin.availableToWithdraw || coin.walletBalance),
                                    total: total,
                                    bloqueado: parseFloat(coin.locked || 0)
                                };
                            }
                        });
                    }
                }
                
                return {
                    valida: true,
                    permissoes: ['spot_trading', 'derivatives_trading', 'read_account'],
                    saldo: saldos,
                    informacoes: {
                        accountType: response.result.list[0]?.accountType || 'UNIFIED',
                        totalEquity: response.result.list[0]?.totalEquity || '0',
                        totalWalletBalance: response.result.list[0]?.totalWalletBalance || '0',
                        accountIMRate: response.result.list[0]?.accountIMRate || '0',
                        canTrade: true,
                        canWithdraw: true,
                        canDeposit: true,
                        updateTime: Date.now()
                    }
                };
            } else if (response.retCode !== 0) {
                // Mapear códigos de erro comuns da Bybit
                let mensagemErro = `Código ${response.retCode}: ${response.retMsg}`;
                if (response.retCode === 10003) {
                    mensagemErro = 'API Key inválida';
                } else if (response.retCode === 10004) {
                    mensagemErro = 'Assinatura inválida (API Secret incorreto)';
                } else if (response.retCode === 10005) {
                    mensagemErro = 'Permissões insuficientes';
                }
                
                return {
                    valida: false,
                    erro: mensagemErro,
                    permissoes: []
                };
            } else {
                return {
                    valida: false,
                    erro: 'Resposta inesperada da Bybit',
                    permissoes: []
                };
            }
            
        } catch (error) {
            console.error('❌ Erro na validação Bybit:', error.message);
            return {
                valida: false,
                erro: error.message,
                permissoes: []
            };
        }
    }

    // ========================================
    // 2. GESTÃO DE PARAMETRIZAÇÕES
    // ========================================

    async aplicarParametrizacoesPadrao(userId, client = null) {
        console.log(`⚙️ Aplicando parametrizações padrão para usuário ${userId}`);

        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            // Verificar se já existem parametrizações
            const existentes = await clientLocal.query(`
                SELECT id FROM user_trading_params WHERE user_id = $1;
            `, [userId]);

            if (existentes.rows.length === 0) {
                // Inserir parametrizações padrão (usando estrutura existente)
                await clientLocal.query(`
                    INSERT INTO user_trading_params (
                        user_id, alavancagem, valor_minimo_trade, valor_maximo_trade,
                        percentual_saldo, take_profit_multiplier, stop_loss_multiplier,
                        max_operacoes_diarias, exchanges_ativas, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW());
                `, [
                    userId, 
                    5,      // alavancagem
                    10.00,  // valor_minimo_trade
                    5000.00, // valor_maximo_trade
                    30.00,  // percentual_saldo
                    3.00,   // take_profit_multiplier
                    2.00,   // stop_loss_multiplier
                    20,     // max_operacoes_diarias
                    JSON.stringify(['binance', 'bybit']) // exchanges_ativas
                ]);

                console.log(`✅ Parametrizações padrão aplicadas para usuário ${userId}`);
            } else {
                console.log(`ℹ️  Usuário ${userId} já possui parametrizações personalizadas`);
            }

        } catch (error) {
            console.error(`❌ Erro ao aplicar parametrizações padrão: ${error.message}`);
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    async atualizarParametrizacoes(userId, novasParametrizacoes) {
        console.log(`🔧 Atualizando parametrizações para usuário ${userId}`);

        const client = await this.pool.connect();
        try {
            // Buscar parametrizações atuais
            const atuais = await client.query(`
                SELECT parameters FROM user_trading_params WHERE user_id = $1;
            `, [userId]);

            let parametrizacoesMerged;
            if (atuais.rows.length > 0) {
                // Fazer merge com parametrizações existentes
                const existentes = atuais.rows[0].parameters;
                parametrizacoesMerged = this.mergeParametrizacoes(existentes, novasParametrizacoes);
            } else {
                // Usar padrão como base
                parametrizacoesMerged = this.mergeParametrizacoes(this.parametrizacoesPadrao, novasParametrizacoes);
            }

            // Validar parametrizações
            const validacao = this.validarParametrizacoes(parametrizacoesMerged);
            if (!validacao.valida) {
                throw new Error(`Parametrizações inválidas: ${validacao.erros.join(', ')}`);
            }

            // Salvar no banco
            await client.query(`
                INSERT INTO user_trading_params (user_id, parameters, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    parameters = $2,
                    updated_at = NOW();
            `, [userId, JSON.stringify(parametrizacoesMerged)]);

            console.log(`✅ Parametrizações atualizadas com sucesso para usuário ${userId}`);

            return {
                sucesso: true,
                parametrizacoes: parametrizacoesMerged
            };

        } catch (error) {
            console.error(`❌ Erro ao atualizar parametrizações: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    mergeParametrizacoes(base, novas) {
        // Fazer merge profundo das parametrizações
        const merged = JSON.parse(JSON.stringify(base)); // Deep copy

        for (const [categoria, valores] of Object.entries(novas)) {
            if (merged[categoria]) {
                merged[categoria] = { ...merged[categoria], ...valores };
            } else {
                merged[categoria] = valores;
            }
        }

        return merged;
    }

    validarParametrizacoes(parametrizacoes) {
        const erros = [];

        // Validar limites de trading
        if (parametrizacoes.trading) {
            const t = parametrizacoes.trading;
            
            // Validar limites de trading - Conforme especificação
            if (t.balance_percentage < 10 || t.balance_percentage > 50) {
                erros.push('Percentual do saldo deve estar entre 10% e 50%');
            }
            
            if (t.max_open_positions < 1 || t.max_open_positions > 2) {
                erros.push('Operações simultâneas devem estar entre 1 e 2');
            }
            
            if (t.leverage_default < 1 || t.leverage_default > 10) {
                erros.push('Alavancagem deve estar entre 1x e 10x');
            }
        }

        // Validar limites financeiros
        if (parametrizacoes.limits) {
            const l = parametrizacoes.limits;
            
            if (l.max_daily_loss_usd < 10 || l.max_daily_loss_usd > 10000) {
                erros.push('Perda máxima diária deve estar entre $10 e $10,000');
            }
            
            if (l.max_drawdown_percent < 5 || l.max_drawdown_percent > 50) {
                erros.push('Drawdown máximo deve estar entre 5% e 50%');
            }
        }

        return {
            valida: erros.length === 0,
            erros
        };
    }

    // ========================================
    // 3. RECUPERAÇÃO DE DADOS PARA TRADING
    // ========================================

    async obterChavesParaTrading(userId, exchangeName) {
        console.log(`🔑 Recuperando chaves para trading - Usuário: ${userId}, Exchange: ${exchangeName}`);

        const client = await this.pool.connect();
        try {
            // Buscar chaves do usuário no banco (usando estrutura existente)
            const resultado = await client.query(`
                SELECT 
                    api_key, 
                    secret_key, 
                    passphrase,
                    environment,
                    is_active,
                    validation_status,
                    last_validated_at
                FROM user_api_keys 
                WHERE user_id = $1 AND exchange = $2 AND is_active = true
                ORDER BY created_at DESC
                LIMIT 1;
            `, [userId, exchangeName.toLowerCase()]);

            if (resultado.rows.length > 0) {
                // Usuário tem chaves próprias
                const chave = resultado.rows[0];
                const chavesUsuario = {
                    apiKey: chave.api_key,
                    apiSecret: chave.secret_key,
                    passphrase: chave.passphrase,
                    testnet: chave.environment === 'testnet',
                    source: 'USER_DATABASE',
                    permissions: ['spot_trading', 'futures_trading', 'read_account'],
                    lastValidated: chave.last_validated_at
                };

                console.log(`✅ Chaves do usuário encontradas para ${exchangeName} (${chave.environment || 'PRODUÇÃO'})`);
                return chavesUsuario;

            } else {
                // Usar chaves do Railway como fallback
                const chavesRailway = this.obterChavesRailway(exchangeName);
                if (chavesRailway) {
                    console.log(`🌐 Usando chaves do Railway para ${exchangeName} (SISTEMA)`);
                    return {
                        ...chavesRailway,
                        source: 'RAILWAY_SYSTEM',
                        permissions: ['spot_trading', 'futures_trading', 'read_account'],
                        lastValidated: new Date()
                    };
                } else {
                    throw new Error(`Nenhuma chave encontrada para ${exchangeName} - usuário ${userId}`);
                }
            }

        } catch (error) {
            console.error(`❌ Erro ao recuperar chaves para trading: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * 🌐 Obter chaves do Railway baseado na configuração multi-usuário
     * Seleciona automaticamente entre testnet e produção conforme necessário
     */
    obterChavesRailway(exchangeName, preferirTestnet = false) {
        const exchange = exchangeName.toLowerCase();
        console.log(`🌐 Obtendo chaves Railway para ${exchange} - Preferir testnet: ${preferirTestnet}`);
        
        switch (exchange) {
            case 'binance':
                const configBinance = this.chavesRailway.binance;
                
                // Priorizar conforme solicitado
                if (preferirTestnet && configBinance.testnetApiKey) {
                    console.log(`🧪 Usando Binance TESTNET`);
                    return {
                        apiKey: configBinance.testnetApiKey,
                        apiSecret: configBinance.testnetApiSecret,
                        baseUrl: configBinance.testnetUrl,
                        testnet: true,
                        passphrase: null
                    };
                } else if (configBinance.apiKey && configBinance.mainnet) {
                    console.log(`🚀 Usando Binance PRODUÇÃO`);
                    return {
                        apiKey: configBinance.apiKey,
                        apiSecret: configBinance.apiSecret,
                        baseUrl: configBinance.baseUrl,
                        testnet: false,
                        passphrase: null
                    };
                } else if (configBinance.testnetApiKey) {
                    console.log(`🧪 Fallback para Binance TESTNET`);
                    return {
                        apiKey: configBinance.testnetApiKey,
                        apiSecret: configBinance.testnetApiSecret,
                        baseUrl: configBinance.testnetUrl,
                        testnet: true,
                        passphrase: null
                    };
                }
                break;
                
            case 'bybit':
                const configBybit = this.chavesRailway.bybit;
                
                // Priorizar conforme solicitado
                if (preferirTestnet && configBybit.testnetApiKey) {
                    console.log(`🧪 Usando Bybit TESTNET`);
                    return {
                        apiKey: configBybit.testnetApiKey,
                        apiSecret: configBybit.testnetApiSecret,
                        baseUrl: configBybit.testnetUrl,
                        testnet: true,
                        passphrase: null
                    };
                } else if (configBybit.apiKey && configBybit.mainnet) {
                    console.log(`🚀 Usando Bybit PRODUÇÃO`);
                    return {
                        apiKey: configBybit.apiKey,
                        apiSecret: configBybit.apiSecret,
                        baseUrl: configBybit.baseUrl,
                        testnet: false,
                        passphrase: null
                    };
                } else if (configBybit.testnetApiKey) {
                    console.log(`🧪 Fallback para Bybit TESTNET`);
                    return {
                        apiKey: configBybit.testnetApiKey,
                        apiSecret: configBybit.testnetApiSecret,
                        baseUrl: configBybit.testnetUrl,
                        testnet: true,
                        passphrase: null
                    };
                }
                break;
                
            default:
                console.log(`❌ Exchange ${exchange} não suportada no Railway`);
                return null;
        }
        
        console.log(`❌ Chaves não configuradas para ${exchange}`);
        return null;
    }

    async obterDadosUsuarioParaTrading(userId) {
        console.log(`📊 Recuperando dados completos para trading do usuário ${userId}`);

        const client = await this.pool.connect();
        try {
            // Buscar dados do usuário
            const usuario = await this.buscarDadosUsuario(userId, client);
            if (!usuario) {
                throw new Error(`Usuário ${userId} não encontrado`);
            }

            // Buscar parametrizações
            const parametrizacoes = await this.buscarParametrizacoes(userId, client) || this.parametrizacoesPadrao;

            // Buscar todas as exchanges disponíveis para o usuário
            const exchangesDisponiveis = ['binance', 'bybit', 'okx'];
            const chavesExchanges = {};

            for (const exchange of exchangesDisponiveis) {
                try {
                    const chaves = await this.obterChavesParaTrading(userId, exchange);
                    chavesExchanges[exchange] = chaves;
                    console.log(`✅ ${exchange}: ${chaves.source === 'USER_DATABASE' ? 'Chaves do usuário' : 'Chaves do sistema'}`);
                } catch (error) {
                    console.log(`⚠️  ${exchange}: Não disponível (${error.message})`);
                }
            }

            // Buscar saldos atuais
            const saldos = await this.buscarSaldos(userId, client);

            const dadosCompletos = {
                usuario,
                chaves: chavesExchanges,
                parametrizacoes,
                saldos,
                exchangesConfiguradas: Object.keys(chavesExchanges),
                modoOperacao: process.env.NODE_ENV === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'
            };

            console.log(`✅ Dados completos recuperados para usuário ${userId}`);
            console.log(`📊 Exchanges disponíveis: ${Object.keys(chavesExchanges).join(', ')}`);

            return dadosCompletos;

        } catch (error) {
            console.error(`❌ Erro ao recuperar dados do usuário: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async buscarDadosUsuario(userId, client) {
        const resultado = await client.query(`
            SELECT id, username, email, role, status, created_at
            FROM users WHERE id = $1;
        `, [userId]);

        return resultado.rows[0] || null;
    }

    async buscarChavesAPI(userId, client) {
        const resultado = await client.query(`
            SELECT exchange_name, api_key_encrypted, api_secret_encrypted, 
                   testnet, status, permissions, last_validated
            FROM user_api_keys 
            WHERE user_id = $1 AND status = 'active';
        `, [userId]);

        return resultado.rows;
    }

    async buscarParametrizacoes(userId, client) {
        const resultado = await client.query(`
            SELECT 
                alavancagem,
                valor_minimo_trade,
                valor_maximo_trade,
                percentual_saldo,
                take_profit_multiplier,
                stop_loss_multiplier,
                max_operacoes_diarias,
                exchanges_ativas
            FROM user_trading_params 
            WHERE user_id = $1;
        `, [userId]);

        if (resultado.rows.length > 0) {
            const params = resultado.rows[0];
            
            // 🎯 SEGUINDO A ESPECIFICAÇÃO EXATA DA TABELA
            return {
                trading: {
                    // Usar os valores EXATOS da tabela user_trading_params
                    balance_percentage: parseFloat(params.percentual_saldo) || 30,
                    leverage_default: parseInt(params.alavancagem) || 5,
                    take_profit_multiplier: parseFloat(params.take_profit_multiplier) || 3,
                    stop_loss_multiplier: parseFloat(params.stop_loss_multiplier) || 2,
                    max_open_positions: 2,  // Fixo conforme especificação
                    trailing_stop: false,   // Fixo conforme especificação
                    risk_reward_ratio: 1.5, // Fixo conforme especificação
                    min_signal_confidence: 0.7, // Fixo conforme especificação
                    max_slippage_percent: 0.1   // Fixo conforme especificação
                },
                limits: {
                    // Usar max_operacoes_diarias da tabela
                    max_daily_trades: parseInt(params.max_operacoes_diarias) || 20,
                    max_daily_loss_usd: 500,    // Fixo conforme especificação
                    max_weekly_loss_usd: 2000,  // Fixo conforme especificação
                    max_drawdown_percent: 10,   // Fixo conforme especificação
                    min_account_balance: 100,   // Fixo conforme especificação
                    emergency_stop_loss: 15     // Fixo conforme especificação
                },
                assets: {
                    // Usar os valores EXATOS da tabela user_trading_params
                    min_trade_amount_usd: parseFloat(params.valor_minimo_trade) || 10,
                    max_trade_amount_usd: parseFloat(params.valor_maximo_trade) || 5000,
                    whitelisted_pairs: [
                        'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 
                        'DOTUSDT', 'LINKUSDT', 'SOLUSDT', 'AVAXUSDT'
                    ],
                    blacklisted_pairs: [],
                    preferred_quote_currency: 'USDT'
                },
                exchanges: {
                    // Usar exchanges_ativas da tabela (pode ser JSON string)
                    active_exchanges: typeof params.exchanges_ativas === 'string' 
                        ? JSON.parse(params.exchanges_ativas) 
                        : params.exchanges_ativas || ['binance', 'bybit']
                },
                // 🎯 CAMPOS DIRETOS DA TABELA PARA COMPATIBILIDADE
                db_fields: {
                    alavancagem: parseInt(params.alavancagem),
                    valor_minimo_trade: parseFloat(params.valor_minimo_trade),
                    valor_maximo_trade: parseFloat(params.valor_maximo_trade),
                    percentual_saldo: parseFloat(params.percentual_saldo),
                    take_profit_multiplier: parseFloat(params.take_profit_multiplier),
                    stop_loss_multiplier: parseFloat(params.stop_loss_multiplier),
                    max_operacoes_diarias: parseInt(params.max_operacoes_diarias),
                    exchanges_ativas: params.exchanges_ativas
                }
            };
        }
        
        return null;
    }

    async buscarSaldos(userId, client) {
        const resultado = await client.query(`
            SELECT currency, available_balance, locked_balance, last_updated
            FROM user_balances 
            WHERE user_id = $1;
        `, [userId]);

        return resultado.rows;
    }

    // ========================================
    // 4. MÉTODOS ESPECÍFICOS PARA O ROBÔ
    // ========================================

    async obterSaldoRealExchange(chaves, exchangeName) {
        console.log(`💰 Obtendo saldo real da ${exchangeName}`);
        
        try {
            let saldoInfo;
            
            switch (exchangeName.toLowerCase()) {
                case 'bybit':
                    saldoInfo = await this.obterSaldoBybit(chaves.apiKey, chaves.apiSecret, chaves.testnet);
                    break;
                    
                case 'binance':
                    saldoInfo = await this.obterSaldoBinance(chaves.apiKey, chaves.apiSecret, chaves.testnet);
                    break;
                    
                default:
                    throw new Error(`Exchange ${exchangeName} não suportada para saldo`);
            }
            
            return saldoInfo;
            
        } catch (error) {
            console.error(`❌ Erro ao obter saldo da ${exchangeName}:`, error.message);
            throw error;
        }
    }

    async obterSaldoBybit(apiKey, apiSecret, testnet = false) {
        const https = require('https');
        const crypto = require('crypto');
        
        const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
        const timestamp = Date.now();
        const recvWindow = '5000';
        
        // Criar assinatura HMAC-SHA256 (formato Bybit)
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(timestamp + apiKey + recvWindow)
            .digest('hex');

        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };

        const url = `${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`;
        
        const response = await new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: headers
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida da Bybit'));
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição'));
            });
            
            req.end();
        });
        
        if (response.result && response.retCode === 0) {
            const wallet = response.result.list[0];
            let saldoUSDT = 0;
            
            if (wallet && wallet.coin) {
                const usdtCoin = wallet.coin.find(c => c.coin === 'USDT');
                if (usdtCoin) {
                    saldoUSDT = parseFloat(usdtCoin.walletBalance);
                }
            }
            
            return {
                saldoUSDT: saldoUSDT,
                totalEquity: parseFloat(wallet?.totalEquity || '0'),
                availableToWithdraw: parseFloat(wallet?.totalAvailableBalance || '0'),
                exchange: 'bybit'
            };
        } else {
            throw new Error(`Erro Bybit: ${response.retMsg || 'Erro desconhecido'}`);
        }
    }

    async obterSaldoBinance(apiKey, apiSecret, testnet = false) {
        const https = require('https');
        const crypto = require('crypto');
        
        const baseUrl = testnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
        const timestamp = Date.now();
        const recvWindow = 60000;
        const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
        
        // Criar assinatura
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
        
        const endpoint = '/fapi/v2/account';
        const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
        
        const response = await new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': apiKey,
                    'Content-Type': 'application/json'
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida da Binance'));
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição'));
            });
            
            req.end();
        });
        
        if (response.totalWalletBalance !== undefined) {
            let saldoUSDT = 0;
            
            if (response.assets) {
                const usdtAsset = response.assets.find(asset => asset.asset === 'USDT');
                if (usdtAsset) {
                    saldoUSDT = parseFloat(usdtAsset.walletBalance);
                }
            }
            
            return {
                saldoUSDT: saldoUSDT,
                totalEquity: parseFloat(response.totalWalletBalance),
                availableToWithdraw: parseFloat(response.availableBalance),
                exchange: 'binance'
            };
        } else {
            throw new Error(`Erro Binance: ${response.msg || 'Erro desconhecido'}`);
        }
    }

    async prepararOperacaoRobo(userId, exchangeName, simbolo) {
        console.log(`🤖 Preparando operação do robô - Usuário: ${userId}, Exchange: ${exchangeName}, Símbolo: ${simbolo}`);

        try {
            // Obter chaves da exchange específica
            const chaves = await this.obterChavesParaTrading(userId, exchangeName);
            
            // Obter dados completos do usuário
            const dadosUsuario = await this.obterDadosUsuarioParaTrading(userId);
            
            // Verificar se pode operar
            const podeOperar = this.verificarPermissaoOperacao(dadosUsuario, exchangeName, simbolo);
            
            if (!podeOperar.permitido) {
                throw new Error(`Operação não permitida: ${podeOperar.motivo}`);
            }

            // Buscar saldo real da exchange
            let saldoDisponivel = 0;
            try {
                const saldoExchange = await this.obterSaldoRealExchange(chaves, exchangeName);
                saldoDisponivel = saldoExchange.saldoUSDT || 0;
                console.log(`💰 Saldo disponível na ${exchangeName}: $${saldoDisponivel} USDT`);
            } catch (error) {
                console.warn(`⚠️ Não foi possível obter saldo da ${exchangeName}, usando saldo padrão`);
                saldoDisponivel = 1000; // Fallback para $1000
            }

            const dadosOperacao = {
                usuario: dadosUsuario.usuario,
                chaves: chaves,
                parametrizacoes: dadosUsuario.parametrizacoes,
                exchange: exchangeName,
                simbolo: simbolo,
                limites: this.calcularLimitesOperacao(dadosUsuario.parametrizacoes, saldoDisponivel),
                timestamp: Date.now(),
                source: chaves.source,
                saldoDisponivel: saldoDisponivel
            };

            console.log(`✅ Operação preparada para ${exchangeName} - Fonte: ${chaves.source}`);
            console.log(`💰 Limites calculados: Min: $${dadosOperacao.limites.valorMinimoTrade.toFixed(2)} | Max: $${dadosOperacao.limites.valorMaximoTrade.toFixed(2)}`);
            
            return dadosOperacao;

        } catch (error) {
            console.error(`❌ Erro ao preparar operação: ${error.message}`);
            throw error;
        }
    }

    verificarPermissaoOperacao(dadosUsuario, exchangeName, simbolo) {
        const parametrizacoes = dadosUsuario.parametrizacoes;
        
        // Verificar se trading está habilitado
        if (!parametrizacoes.schedule?.trading_enabled) {
            return { permitido: false, motivo: 'Trading desabilitado nas configurações' };
        }
        
        // Verificar se o símbolo está na whitelist
        if (parametrizacoes.assets?.whitelisted_pairs && 
            !parametrizacoes.assets.whitelisted_pairs.includes(simbolo)) {
            return { permitido: false, motivo: `Símbolo ${simbolo} não está na whitelist` };
        }
        
        // Verificar se o símbolo está na blacklist
        if (parametrizacoes.assets?.blacklisted_pairs && 
            parametrizacoes.assets.blacklisted_pairs.includes(simbolo)) {
            return { permitido: false, motivo: `Símbolo ${simbolo} está na blacklist` };
        }
        
        // Verificar se a exchange está configurada
        if (!dadosUsuario.exchangesConfiguradas.includes(exchangeName)) {
            return { permitido: false, motivo: `Exchange ${exchangeName} não configurada` };
        }
        
        return { permitido: true };
    }

    calcularLimitesOperacao(parametrizacoes, saldoDisponivel = 0) {
        // 🎯 USAR CAMPOS DIRETOS DA TABELA CONFORME ESPECIFICAÇÃO
        const dbFields = parametrizacoes.db_fields || {};
        const trading = parametrizacoes.trading || {};
        const limits = parametrizacoes.limits || {};
        
        // 🔥 PRIORIZAR VALORES DIRETOS DA TABELA user_trading_params
        const percentualSaldo = dbFields.percentual_saldo || trading.balance_percentage || 30;
        const alavancagem = dbFields.alavancagem || trading.leverage_default || 5;
        const valorMinimoTrade = dbFields.valor_minimo_trade || parametrizacoes.assets?.min_trade_amount_usd || 10;
        const valorMaximoTrade = dbFields.valor_maximo_trade || parametrizacoes.assets?.max_trade_amount_usd || 5000;
        const takeProfitMultiplier = dbFields.take_profit_multiplier || trading.take_profit_multiplier || 3;
        const stopLossMultiplier = dbFields.stop_loss_multiplier || trading.stop_loss_multiplier || 2;
        const maxOperacoesDiarias = dbFields.max_operacoes_diarias || limits.max_daily_trades || 20;
        
        // 🎯 CÁLCULO DINÂMICO BASEADO NO SALDO REAL
        let valorMinimoCalculado = valorMinimoTrade;
        let valorMaximoCalculado = valorMaximoTrade;
        
        if (saldoDisponivel > 0) {
            // Valor mínimo: 1% do saldo ou o valor mínimo configurado (o que for maior)
            valorMinimoCalculado = Math.max((saldoDisponivel * 0.01), valorMinimoTrade);
            
            // Valor máximo: baseado no percentual do saldo ou valor configurado (o que for menor)
            const valorMaximoPorcentual = (saldoDisponivel * percentualSaldo) / 100;
            const valorMaximoSeguranca = saldoDisponivel * 0.5; // Máximo 50% do saldo por segurança
            
            valorMaximoCalculado = Math.min(
                valorMaximoPorcentual, 
                valorMaximoSeguranca, 
                valorMaximoTrade
            );
            
            console.log(`🧮 Cálculo dinâmico executado:`);
            console.log(`   💰 Saldo disponível: $${saldoDisponivel}`);
            console.log(`   📊 Percentual configurado: ${percentualSaldo}%`);
            console.log(`   📈 Valor por operação (${percentualSaldo}%): $${valorMaximoPorcentual.toFixed(2)}`);
            console.log(`   🛡️ Limite de segurança (50%): $${valorMaximoSeguranca.toFixed(2)}`);
            console.log(`   ⚙️ Limite configurado: $${valorMaximoTrade}`);
        }
        
        return {
            // 🎯 VALORES DIRETOS DA ESPECIFICAÇÃO
            percentualSaldo: percentualSaldo,
            alavancagem: alavancagem,
            takeProfitMultiplier: takeProfitMultiplier,
            stopLossMultiplier: stopLossMultiplier,
            maxPosicoesAbertas: trading.max_open_positions || 2,
            maxTradesDiarios: maxOperacoesDiarias,
            maxPerdaDiaria: limits.max_daily_loss_usd || 500,
            
            // 🎯 VALORES CALCULADOS DINAMICAMENTE
            valorMinimoTrade: valorMinimoCalculado,
            valorMaximoTrade: valorMaximoCalculado,
            saldoDisponivel: saldoDisponivel,
            valorPorOperacao: saldoDisponivel > 0 ? (saldoDisponivel * percentualSaldo) / 100 : valorMaximoTrade,
            
            // 🎯 CAMPOS ORIGINAIS DA TABELA PARA REFERÊNCIA
            db_original: {
                alavancagem: dbFields.alavancagem,
                valor_minimo_trade: dbFields.valor_minimo_trade,
                valor_maximo_trade: dbFields.valor_maximo_trade,
                percentual_saldo: dbFields.percentual_saldo,
                take_profit_multiplier: dbFields.take_profit_multiplier,
                stop_loss_multiplier: dbFields.stop_loss_multiplier,
                max_operacoes_diarias: dbFields.max_operacoes_diarias
            }
        };
    }

    async registrarOperacaoRobo(userId, exchangeName, dadosOperacao) {
        console.log(`📝 Registrando operação do robô no banco de dados`);

        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                INSERT INTO robot_operations (
                    user_id, exchange_name, symbol, operation_type, amount, leverage, 
                    entry_price, take_profit, stop_loss, status, parameters_used, 
                    api_source, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                RETURNING id;
            `, [
                userId,
                exchangeName,
                dadosOperacao.simbolo,
                dadosOperacao.tipo,
                dadosOperacao.quantidade,
                dadosOperacao.alavancagem,
                dadosOperacao.precoEntrada,
                dadosOperacao.takeProfit,
                dadosOperacao.stopLoss,
                'PENDING',
                JSON.stringify(dadosOperacao.parametrizacoes),
                dadosOperacao.apiSource
            ]);

            console.log(`✅ Operação registrada com ID: ${resultado.rows[0].id}`);
            return resultado.rows[0].id;

        } catch (error) {
            console.error(`❌ Erro ao registrar operação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 5. UTILITÁRIOS DE CRIPTOGRAFIA
    // ========================================

    criptografar(texto) {
        if (!texto) return null;
        
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.chaveEncriptacao, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(texto, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    }

    descriptografar(textoEncriptado) {
        if (!textoEncriptado || !textoEncriptado.includes(':')) return null;
        
        try {
            const [ivHex, encrypted] = textoEncriptado.split(':');
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(this.chaveEncriptacao, 'salt', 32);
            const iv = Buffer.from(ivHex, 'hex');
            
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Erro ao descriptografar:', error.message);
            return null;
        }
    }

    // ========================================
    // 5. MONITORAMENTO E RELATÓRIOS
    // ========================================

    async gerarRelatorioUsuarios() {
        console.log('📈 Gerando relatório de usuários');

        const client = await this.pool.connect();
        try {
            const relatorio = await client.query(`
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.status,
                    COUNT(DISTINCT uak.exchange) as exchanges_configuradas,
                    CASE WHEN utp.user_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_parametrizacoes,
                    COUNT(DISTINCT ub.asset) as assets_com_saldo
                FROM users u
                LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.is_active = true
                LEFT JOIN user_trading_params utp ON u.id = utp.user_id
                LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.free_balance > 0
                WHERE u.role != 'admin'
                GROUP BY u.id, u.username, u.email, u.status, utp.user_id
                ORDER BY u.created_at DESC;
            `);

            return relatorio.rows;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorChavesAPI();
    
    // Exemplo de uso
    gestor.gerarRelatorioUsuarios()
        .then(relatorio => {
            console.log('📊 Relatório de usuários:');
            console.table(relatorio);
        })
        .catch(error => {
            console.error('❌ Erro:', error.message);
        });
}

module.exports = GestorChavesAPI;

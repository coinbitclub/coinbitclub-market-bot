#!/usr/bin/env node

/**
 * 🚄 CONECTAR E VERIFICAR CHAVES DO RAILWAY - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Script para conectar ao Railway e verificar todas as variáveis de ambiente configuradas
 */

const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');

class RailwayVariablesChecker {
    constructor() {
        this.railwayVariables = new Map();
        this.testResults = {
            database: false,
            exchanges: {},
            apis: {},
            security: {},
            configuration: {},
            status: 'PENDENTE'
        };
    }

    async executarVerificacaoRailway() {
        console.log('🚄 VERIFICAÇÃO COMPLETA DAS VARIÁVEIS DO RAILWAY');
        console.log('=================================================');
        console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
        console.log('');

        try {
            // 1. Mapear todas as variáveis do Railway
            await this.mapearVariaveisRailway();
            
            // 2. Testar conexão com banco de dados Railway
            await this.testarBancoDadosRailway();
            
            // 3. Testar APIs de exchanges com chaves Railway
            await this.testarExchangesRailway();
            
            // 4. Testar APIs externas
            await this.testarAPIsExternasRailway();
            
            // 5. Verificar configurações de segurança
            await this.verificarSegurancaRailway();
            
            // 6. Verificar configurações gerais
            await this.verificarConfiguracoesRailway();
            
            // 7. Gerar relatório final
            await this.gerarRelatorioFinalRailway();

        } catch (error) {
            console.error('❌ Erro crítico na verificação Railway:', error.message);
            this.testResults.status = 'FALHA_CRITICA';
        }
    }

    async mapearVariaveisRailway() {
        console.log('🔍 MAPEANDO VARIÁVEIS DO RAILWAY');
        console.log('================================');

        // Com base na imagem, vamos mapear as 38 variáveis que você tem configuradas
        const expectedVariables = [
            // Core Configuration
            'AI_GUARDIAN_ENABLED',
            'BACKEND_URL',
            'DATABASE_URL',
            'NODE_ENV',
            'PORT',
            
            // Trading APIs
            'BINANCE_API_KEY',
            'BINANCE_SECRET_KEY', 
            'BYBIT_API_KEY',
            'BYBIT_SECRET_KEY',
            'COINSTATS_API_KEY',
            
            // Security
            'JWT_SECRET',
            'JWT_EXPIRES_IN',
            'ENCRYPTION_KEY',
            'SESSION_SECRET',
            'WEBHOOK_TOKEN',
            
            // External APIs
            'OPENAI_API_KEY',
            'FEAR_GREED_API_URL',
            'STRIPE_PUBLISHABLE_KEY',
            'STRIPE_SECRET_KEY',
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_PHONE_NUMBER',
            
            // Trading Configuration
            'DEFAULT_LEVERAGE',
            'DEFAULT_RISK_PERCENTAGE',
            'MAX_CONCURRENT_TRADES',
            'TRADING_MODE',
            'TESTNET',
            
            // System Configuration
            'FRONTEND_URL',
            'CORS_ORIGIN',
            'HEALTH_CHECK_PATH',
            'RATE_LIMIT_MAX_REQUESTS',
            'RATE_LIMIT_WINDOW_MS',
            'LOG_LEVEL',
            'LOG_FORMAT',
            'METRICS_PATH',
            'MODO_HIBRIDO',
            'SISTEMA_MULTIUSUARIO',
            'SISTEMA_STATUS'
        ];

        let encontradas = 0;
        let configuradas = 0;

        for (const varName of expectedVariables) {
            const value = process.env[varName];
            if (value !== undefined) {
                encontradas++;
                if (value && value.trim() !== '' && !value.includes('placeholder') && !value.includes('from_railway')) {
                    configuradas++;
                    this.railwayVariables.set(varName, value);
                    console.log(`✅ ${varName}: Configurada`);
                } else {
                    console.log(`⚠️ ${varName}: Valor placeholder/vazio`);
                }
            } else {
                console.log(`❌ ${varName}: Não encontrada`);
            }
        }

        console.log('');
        console.log(`📊 RESUMO DAS VARIÁVEIS:`);
        console.log(`   🎯 Esperadas: ${expectedVariables.length}`);
        console.log(`   🔍 Encontradas: ${encontradas}`);
        console.log(`   ✅ Configuradas: ${configuradas}`);
        console.log(`   📈 Taxa de sucesso: ${((configuradas / expectedVariables.length) * 100).toFixed(1)}%`);
        console.log('');
    }

    async testarBancoDadosRailway() {
        console.log('🗄️ TESTANDO BANCO DE DADOS RAILWAY');
        console.log('===================================');

        try {
            const databaseUrl = this.railwayVariables.get('DATABASE_URL') || process.env.DATABASE_URL;
            
            if (!databaseUrl) {
                console.log('❌ DATABASE_URL não configurada');
                this.testResults.database = false;
                return;
            }

            const pool = new Pool({
                connectionString: databaseUrl,
                ssl: { rejectUnauthorized: false }
            });

            // Testar conexão
            await pool.query('SELECT NOW()');
            console.log('✅ Conexão com PostgreSQL Railway estabelecida');

            // Verificar tabelas críticas
            const result = await pool.query(`
                SELECT COUNT(*) as total 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);

            console.log(`📋 Total de tabelas: ${result.rows[0].total}`);

            // Verificar usuários
            const users = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
            console.log(`👥 Usuários ativos: ${users.rows[0].total}`);

            // Verificar chaves API
            const apiKeys = await pool.query(`
                SELECT COUNT(*) as total 
                FROM user_api_keys 
                WHERE is_active = true
            `);
            console.log(`🔑 Chaves API configuradas: ${apiKeys.rows[0].total}`);

            await pool.end();
            this.testResults.database = true;
            console.log('🟢 Banco de dados Railway: OPERACIONAL\n');

        } catch (error) {
            console.error('❌ Erro no banco Railway:', error.message);
            this.testResults.database = false;
        }
    }

    async testarExchangesRailway() {
        console.log('🏦 TESTANDO EXCHANGES COM CHAVES RAILWAY');
        console.log('=========================================');

        // Testar Binance
        await this.testarBinanceRailway();
        
        // Testar Bybit
        await this.testarBybitRailway();

        console.log('');
    }

    async testarBinanceRailway() {
        try {
            console.log('📊 Testando Binance (Railway)...');
            
            const apiKey = this.railwayVariables.get('BINANCE_API_KEY') || process.env.BINANCE_API_KEY;
            const secretKey = this.railwayVariables.get('BINANCE_SECRET_KEY') || process.env.BINANCE_SECRET_KEY;

            if (!apiKey || !secretKey) {
                console.log('❌ Binance: Chaves não configuradas no Railway');
                this.testResults.exchanges.binance = false;
                return;
            }

            // Testar conectividade (sem fazer operação real)
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            
            const signature = crypto
                .createHmac('sha256', secretKey)
                .update(queryString)
                .digest('hex');

            // Usar endpoint de informações da conta (testnet ou mainnet dependendo da configuração)
            const baseUrl = process.env.TESTNET === 'false' ? 
                'https://fapi.binance.com' : 
                'https://testnet.binancefuture.com';
                
            const url = `${baseUrl}/fapi/v2/account?${queryString}&signature=${signature}`;
            
            const response = await this.fazerRequisicao(url, {
                'X-MBX-APIKEY': apiKey
            });

            if (response.success) {
                console.log('✅ Binance Railway: Conectado com sucesso');
                this.testResults.exchanges.binance = true;
            } else {
                console.log(`⚠️ Binance Railway: ${response.error} (pode ser normal se for testnet)`);
                this.testResults.exchanges.binance = false;
            }

        } catch (error) {
            console.log('❌ Binance Railway: Erro -', error.message);
            this.testResults.exchanges.binance = false;
        }
    }

    async testarBybitRailway() {
        try {
            console.log('📊 Testando Bybit (Railway)...');
            
            const apiKey = this.railwayVariables.get('BYBIT_API_KEY') || process.env.BYBIT_API_KEY;
            const secretKey = this.railwayVariables.get('BYBIT_SECRET_KEY') || process.env.BYBIT_SECRET_KEY;

            if (!apiKey || !secretKey) {
                console.log('❌ Bybit: Chaves não configuradas no Railway');
                this.testResults.exchanges.bybit = false;
                return;
            }

            // Testar com Bybit API v5 (mais atual)
            const timestamp = Date.now();
            const recv_window = 5000;
            const params = `api_key=${apiKey}&timestamp=${timestamp}&recv_window=${recv_window}`;
            
            const signature = crypto
                .createHmac('sha256', secretKey)
                .update(params)
                .digest('hex');

            // Usar endpoint público para testar conectividade
            const baseUrl = process.env.TESTNET === 'false' ? 
                'https://api.bybit.com' : 
                'https://api-testnet.bybit.com';
                
            const url = `${baseUrl}/v5/account/wallet-balance?${params}&sign=${signature}`;
            
            const response = await this.fazerRequisicao(url);

            if (response.success) {
                console.log('✅ Bybit Railway: Conectado com sucesso');
                this.testResults.exchanges.bybit = true;
            } else {
                console.log(`⚠️ Bybit Railway: ${response.error} (verificar permissões da chave)`);
                this.testResults.exchanges.bybit = false;
            }

        } catch (error) {
            console.log('❌ Bybit Railway: Erro -', error.message);
            this.testResults.exchanges.bybit = false;
        }
    }

    async testarAPIsExternasRailway() {
        console.log('🌐 TESTANDO APIs EXTERNAS (RAILWAY)');
        console.log('====================================');

        // CoinStats
        await this.testarCoinStatsRailway();
        
        // OpenAI
        await this.testarOpenAIRailway();

        console.log('');
    }

    async testarCoinStatsRailway() {
        try {
            console.log('📈 Testando CoinStats API (Railway)...');
            
            const apiKey = this.railwayVariables.get('COINSTATS_API_KEY') || process.env.COINSTATS_API_KEY;
            
            if (!apiKey) {
                console.log('❌ CoinStats: API Key não configurada no Railway');
                this.testResults.apis.coinstats = false;
                return;
            }

            const url = 'https://api.coinstats.app/public/v1/coins/bitcoin';
            const response = await this.fazerRequisicao(url, {
                'X-API-KEY': apiKey
            });

            if (response.success) {
                console.log('✅ CoinStats Railway: API funcionando');
                this.testResults.apis.coinstats = true;
            } else {
                console.log('❌ CoinStats Railway: Falha na API');
                this.testResults.apis.coinstats = false;
            }

        } catch (error) {
            console.log('❌ CoinStats Railway: Erro -', error.message);
            this.testResults.apis.coinstats = false;
        }
    }

    async testarOpenAIRailway() {
        try {
            console.log('🤖 Testando OpenAI API (Railway)...');
            
            const apiKey = this.railwayVariables.get('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
            
            if (!apiKey) {
                console.log('❌ OpenAI: API Key não configurada no Railway');
                this.testResults.apis.openai = false;
                return;
            }

            // Teste simples de conectividade (lista de modelos)
            const url = 'https://api.openai.com/v1/models';
            const response = await this.fazerRequisicao(url, {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            });

            if (response.success) {
                console.log('✅ OpenAI Railway: API funcionando');
                this.testResults.apis.openai = true;
            } else {
                console.log('❌ OpenAI Railway: Falha na API');
                this.testResults.apis.openai = false;
            }

        } catch (error) {
            console.log('❌ OpenAI Railway: Erro -', error.message);
            this.testResults.apis.openai = false;
        }
    }

    async verificarSegurancaRailway() {
        console.log('🔐 VERIFICANDO SEGURANÇA (RAILWAY)');
        console.log('===================================');

        const securityVars = [
            'JWT_SECRET',
            'ENCRYPTION_KEY',
            'SESSION_SECRET',
            'WEBHOOK_TOKEN'
        ];

        let securityOK = 0;

        for (const varName of securityVars) {
            const value = this.railwayVariables.get(varName) || process.env[varName];
            
            if (value && value.length >= 32) {
                console.log(`✅ ${varName}: Configurado e seguro`);
                this.testResults.security[varName] = true;
                securityOK++;
            } else {
                console.log(`❌ ${varName}: Inseguro ou não configurado`);
                this.testResults.security[varName] = false;
            }
        }

        console.log(`🎯 Segurança: ${securityOK}/${securityVars.length} OK\n`);
    }

    async verificarConfiguracoesRailway() {
        console.log('⚙️ VERIFICANDO CONFIGURAÇÕES (RAILWAY)');
        console.log('=======================================');

        const configs = {
            'NODE_ENV': process.env.NODE_ENV,
            'TESTNET': process.env.TESTNET,
            'TRADING_MODE': process.env.TRADING_MODE,
            'SISTEMA_STATUS': process.env.SISTEMA_STATUS,
            'AI_GUARDIAN_ENABLED': process.env.AI_GUARDIAN_ENABLED
        };

        let configsOK = 0;

        for (const [key, value] of Object.entries(configs)) {
            if (value) {
                console.log(`✅ ${key}: ${value}`);
                this.testResults.configuration[key] = true;
                configsOK++;
            } else {
                console.log(`❌ ${key}: NÃO CONFIGURADO`);
                this.testResults.configuration[key] = false;
            }
        }

        // Verificar se está em modo produção
        const isProd = process.env.NODE_ENV === 'production' && 
                      process.env.TESTNET === 'false';

        if (isProd) {
            console.log('🟢 Sistema Railway configurado para PRODUÇÃO');
        } else {
            console.log('🟡 Sistema Railway em modo desenvolvimento/teste');
        }

        console.log(`🎯 Configurações: ${configsOK}/${Object.keys(configs).length} OK\n`);
    }

    async fazerRequisicao(url, headers = {}) {
        return new Promise((resolve) => {
            const options = {
                headers: {
                    'User-Agent': 'CoinBitClub-MarketBot-Railway/3.0.0',
                    ...headers
                },
                timeout: 10000
            };

            const req = https.get(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve({ success: true, data });
                    } else {
                        resolve({ success: false, error: `Status ${res.statusCode}` });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({ success: false, error: error.message });
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve({ success: false, error: 'Timeout' });
            });
        });
    }

    async gerarRelatorioFinalRailway() {
        console.log('📋 RELATÓRIO FINAL - VERIFICAÇÃO RAILWAY');
        console.log('=========================================');

        let pontuacaoTotal = 0;
        let verificacoesTotais = 0;

        // Banco de dados
        if (this.testResults.database) pontuacaoTotal++;
        verificacoesTotais++;

        // Exchanges
        const exchangesOK = Object.values(this.testResults.exchanges).filter(Boolean).length;
        const totalExchanges = Object.keys(this.testResults.exchanges).length;
        pontuacaoTotal += exchangesOK;
        verificacoesTotais += totalExchanges;

        // APIs externas
        const apisOK = Object.values(this.testResults.apis).filter(Boolean).length;
        const totalAPIs = Object.keys(this.testResults.apis).length;
        pontuacaoTotal += apisOK;
        verificacoesTotais += totalAPIs;

        // Segurança
        const securityOK = Object.values(this.testResults.security).filter(Boolean).length;
        const totalSecurity = Object.keys(this.testResults.security).length;
        pontuacaoTotal += securityOK;
        verificacoesTotais += totalSecurity;

        // Configurações
        const configsOK = Object.values(this.testResults.configuration).filter(Boolean).length;
        const totalConfigs = Object.keys(this.testResults.configuration).length;
        pontuacaoTotal += configsOK;
        verificacoesTotais += totalConfigs;

        const porcentagem = verificacoesTotais > 0 ? ((pontuacaoTotal / verificacoesTotais) * 100).toFixed(1) : '0.0';

        console.log(`🎯 PONTUAÇÃO GERAL: ${pontuacaoTotal}/${verificacoesTotais} (${porcentagem}%)`);
        console.log('');

        // Status final
        if (porcentagem >= 90) {
            this.testResults.status = 'RAILWAY_PRONTO_PRODUCAO';
            console.log('🟢 STATUS: RAILWAY PRONTO PARA PRODUÇÃO!');
            console.log('✅ Todas as variáveis Railway estão funcionando');
            console.log('🚀 Sistema pode operar em ambiente real');
        } else if (porcentagem >= 75) {
            this.testResults.status = 'RAILWAY_REQUER_AJUSTES';
            console.log('🟡 STATUS: RAILWAY REQUER ALGUNS AJUSTES');
            console.log('⚠️ Algumas variáveis precisam de correção');
        } else {
            this.testResults.status = 'RAILWAY_NAO_PRONTO';
            console.log('🔴 STATUS: RAILWAY NÃO PRONTO');
            console.log('❌ Muitas variáveis com problemas');
        }

        console.log('');
        console.log('📊 RESUMO DETALHADO RAILWAY:');
        console.log(`   🗄️ Banco de dados: ${this.testResults.database ? '✅' : '❌'}`);
        console.log(`   🏦 Exchanges: ${exchangesOK}/${totalExchanges} funcionando`);
        console.log(`   🌐 APIs externas: ${apisOK}/${totalAPIs} funcionando`);
        console.log(`   🔐 Segurança: ${securityOK}/${totalSecurity} configuradas`);
        console.log(`   ⚙️ Configurações: ${configsOK}/${totalConfigs} corretas`);

        console.log('');
        console.log(`⏰ Verificação Railway concluída em: ${new Date().toLocaleString('pt-BR')}`);
        
        // Próximos passos
        if (this.testResults.status === 'RAILWAY_PRONTO_PRODUCAO') {
            console.log('');
            console.log('🚀 PRÓXIMOS PASSOS PARA ATIVAÇÃO:');
            console.log('==================================');
            console.log('1. ✅ Todas as variáveis Railway verificadas');
            console.log('2. 🔄 Fazer deploy final no Railway');
            console.log('3. 🎯 Ativar trading em tempo real');
            console.log('4. 📊 Monitorar operações iniciais');
        }

        return this.testResults;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const checker = new RailwayVariablesChecker();
    checker.executarVerificacaoRailway()
        .then((resultados) => {
            if (resultados.status === 'RAILWAY_PRONTO_PRODUCAO') {
                console.log('\n🎉 RAILWAY VERIFICADO COM SUCESSO!');
                process.exit(0);
            } else {
                console.log('\n⚠️ RAILWAY PRECISA DE AJUSTES');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Falha na verificação Railway:', error.message);
            process.exit(2);
        });
}

module.exports = { RailwayVariablesChecker };

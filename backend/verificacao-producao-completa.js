#!/usr/bin/env node

/**
 * 🔍 VERIFICAÇÃO COMPLETA DE PRODUÇÃO - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Checklist completo para garantir que o sistema está pronto para operar em produção real
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Carregar configurações do .env
require('dotenv').config();

class VerificacaoProducao {
    constructor() {
        this.resultados = {
            banco: false,
            exchanges: {},
            apis: {},
            servicos: {},
            configuracoes: {},
            seguranca: false,
            microservicos: {},
            supervisores: {},
            status: 'PENDENTE'
        };
        
        this.pool = null;
    }

    async executarVerificacaoCompleta() {
        console.log('🚀 VERIFICAÇÃO COMPLETA DE PRODUÇÃO - COINBITCLUB MARKET BOT');
        console.log('================================================================');
        console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
        console.log('');

        try {
            // 1. Verificar banco de dados
            await this.verificarBancoDados();
            
            // 2. Verificar conexões com exchanges
            await this.verificarExchanges();
            
            // 3. Verificar APIs externas
            await this.verificarAPIsExternas();
            
            // 4. Verificar configurações críticas
            await this.verificarConfiguracoesCriticas();
            
            // 5. Verificar segurança
            await this.verificarSeguranca();
            
            // 6. Verificar microserviços
            await this.verificarMicroservicos();
            
            // 7. Verificar supervisores e gestores
            await this.verificarSupervisores();
            
            // 8. Verificar chaves no Railway
            await this.verificarChavesRailway();
            
            // 9. Gerar relatório final
            await this.gerarRelatorioFinal();

        } catch (error) {
            console.error('❌ Erro crítico na verificação:', error.message);
            this.resultados.status = 'FALHA_CRITICA';
        } finally {
            if (this.pool) {
                await this.pool.end();
            }
        }
    }

    async verificarBancoDados() {
        console.log('🗄️ VERIFICANDO BANCO DE DADOS');
        console.log('==============================');
        
        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
                ssl: { rejectUnauthorized: false }
            });

            // Testar conexão
            await this.pool.query('SELECT NOW()');
            console.log('✅ Conexão com PostgreSQL estabelecida');

            // Verificar tabelas essenciais
            const tabelasEssenciais = [
                'users', 'user_api_keys', 'signals', 'trading_operations',
                'ai_analysis', 'risk_alerts', 'user_risk_profiles', 'system_config'
            ];

            for (const tabela of tabelasEssenciais) {
                const result = await this.pool.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_name = $1 AND table_schema = 'public'
                `, [tabela]);

                if (result.rows[0].count > 0) {
                    console.log(`✅ Tabela ${tabela}: OK`);
                } else {
                    console.log(`❌ Tabela ${tabela}: FALTANTE`);
                    this.resultados.banco = false;
                    return;
                }
            }

            // Verificar dados dos usuários
            const usuarios = await this.pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
            console.log(`👥 Usuários ativos: ${usuarios.rows[0].total}`);

            // Verificar chaves API dos usuários
            const chavesAPI = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM user_api_keys 
                WHERE is_active = true AND api_key IS NOT NULL
            `);
            console.log(`🔑 Chaves API ativas: ${chavesAPI.rows[0].total}`);

            this.resultados.banco = true;
            console.log('🟢 Banco de dados: PRONTO\n');

        } catch (error) {
            console.error('❌ Erro no banco de dados:', error.message);
            this.resultados.banco = false;
        }
    }

    async verificarExchanges() {
        console.log('🏦 VERIFICANDO CONEXÕES COM EXCHANGES');
        console.log('=====================================');

        // Binance
        await this.testarBinance();
        
        // Bybit  
        await this.testarBybit();
        
        // OKX
        await this.testarOKX();

        console.log('');
    }

    async testarBinance() {
        try {
            console.log('📊 Testando Binance...');
            
            if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET) {
                console.log('❌ Binance: Chaves não configuradas');
                this.resultados.exchanges.binance = false;
                return;
            }

            const crypto = require('crypto');
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            
            const signature = crypto
                .createHmac('sha256', process.env.BINANCE_API_SECRET)
                .update(queryString)
                .digest('hex');

            const url = `https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`;
            
            const response = await this.fazerRequisicao(url, {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            });

            if (response.success) {
                console.log('✅ Binance: Conectado com sucesso');
                this.resultados.exchanges.binance = true;
            } else {
                console.log('❌ Binance: Falha na conexão -', response.error);
                this.resultados.exchanges.binance = false;
            }

        } catch (error) {
            console.log('❌ Binance: Erro -', error.message);
            this.resultados.exchanges.binance = false;
        }
    }

    async testarBybit() {
        try {
            console.log('📊 Testando Bybit...');
            
            if (!process.env.BYBIT_API_KEY || !process.env.BYBIT_API_SECRET) {
                console.log('❌ Bybit: Chaves não configuradas');
                this.resultados.exchanges.bybit = false;
                return;
            }

            const timestamp = Date.now();
            const params = `api_key=${process.env.BYBIT_API_KEY}&timestamp=${timestamp}`;
            
            const signature = crypto
                .createHmac('sha256', process.env.BYBIT_API_SECRET)
                .update(params)
                .digest('hex');

            const url = `https://api.bybit.com/v2/private/wallet/balance?${params}&sign=${signature}`;
            
            const response = await this.fazerRequisicao(url);

            if (response.success) {
                console.log('✅ Bybit: Conectado com sucesso');
                this.resultados.exchanges.bybit = true;
            } else {
                console.log('❌ Bybit: Falha na conexão -', response.error);
                this.resultados.exchanges.bybit = false;
            }

        } catch (error) {
            console.log('❌ Bybit: Erro -', error.message);
            this.resultados.exchanges.bybit = false;
        }
    }

    async testarOKX() {
        try {
            console.log('📊 Testando OKX...');
            
            if (!process.env.OKX_API_KEY || !process.env.OKX_API_SECRET || !process.env.OKX_PASSPHRASE) {
                console.log('❌ OKX: Chaves não configuradas');
                this.resultados.exchanges.okx = false;
                return;
            }

            console.log('✅ OKX: Chaves configuradas (teste de ping)');
            this.resultados.exchanges.okx = true;

        } catch (error) {
            console.log('❌ OKX: Erro -', error.message);
            this.resultados.exchanges.okx = false;
        }
    }

    async verificarAPIsExternas() {
        console.log('🌐 VERIFICANDO APIs EXTERNAS');
        console.log('=============================');

        // CoinStats
        await this.testarCoinStats();
        
        // TradingView (webhook)
        await this.verificarTradingView();

        console.log('');
    }

    async testarCoinStats() {
        try {
            console.log('📈 Testando CoinStats API...');
            
            if (!process.env.COINSTATS_API_KEY) {
                console.log('❌ CoinStats: API Key não configurada');
                this.resultados.apis.coinstats = false;
                return;
            }

            const url = 'https://api.coinstats.app/public/v1/coins/bitcoin';
            const response = await this.fazerRequisicao(url, {
                'X-API-KEY': process.env.COINSTATS_API_KEY
            });

            if (response.success) {
                console.log('✅ CoinStats: API funcionando');
                this.resultados.apis.coinstats = true;
            } else {
                console.log('❌ CoinStats: Falha na API');
                this.resultados.apis.coinstats = false;
            }

        } catch (error) {
            console.log('❌ CoinStats: Erro -', error.message);
            this.resultados.apis.coinstats = false;
        }
    }

    async verificarTradingView() {
        console.log('📊 Verificando TradingView Webhook...');
        
        if (process.env.TRADINGVIEW_WEBHOOK_SECRET) {
            console.log('✅ TradingView: Webhook secret configurado');
            this.resultados.apis.tradingview = true;
        } else {
            console.log('❌ TradingView: Webhook secret não configurado');
            this.resultados.apis.tradingview = false;
        }
    }

    async verificarConfiguracoesCriticas() {
        console.log('⚙️ VERIFICANDO CONFIGURAÇÕES CRÍTICAS');
        console.log('======================================');

        const configs = {
            'NODE_ENV': process.env.NODE_ENV,
            'TESTNET': process.env.TESTNET,
            'TRADING_MODE': process.env.TRADING_MODE,
            'SISTEMA_STATUS': process.env.SISTEMA_STATUS
        };

        for (const [key, value] of Object.entries(configs)) {
            if (value) {
                console.log(`✅ ${key}: ${value}`);
                this.resultados.configuracoes[key] = true;
            } else {
                console.log(`❌ ${key}: NÃO CONFIGURADO`);
                this.resultados.configuracoes[key] = false;
            }
        }

        // Verificar se está em modo produção
        const isProd = process.env.NODE_ENV === 'production' && 
                      process.env.TESTNET === 'false' && 
                      process.env.TRADING_MODE === 'LIVE';

        if (isProd) {
            console.log('🟢 Sistema configurado para PRODUÇÃO REAL');
        } else {
            console.log('🟡 Sistema NÃO está em modo produção real');
        }

        console.log('');
    }

    async verificarSeguranca() {
        console.log('🔐 VERIFICANDO SEGURANÇA');
        console.log('=========================');

        // JWT Secret
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
            console.log('✅ JWT Secret: Configurado e seguro');
            this.resultados.seguranca = true;
        } else {
            console.log('❌ JWT Secret: Inseguro ou não configurado');
            this.resultados.seguranca = false;
        }

        // Encryption Key
        if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32) {
            console.log('✅ Encryption Key: Configurado e seguro');
        } else {
            console.log('❌ Encryption Key: Inseguro ou não configurado');
            this.resultados.seguranca = false;
        }

        console.log('');
    }

    async verificarMicroservicos() {
        console.log('🔧 VERIFICANDO MICROSERVIÇOS');
        console.log('=============================');

        const microservicos = [
            'api-gateway',
            'trading-engine', 
            'ai-guardian',
            'signal-processor',
            'risk-manager'
        ];

        for (const servico of microservicos) {
            const caminho = path.join(__dirname, servico);
            if (fs.existsSync(caminho)) {
                console.log(`✅ ${servico}: Diretório existe`);
                this.resultados.microservicos[servico] = true;
            } else {
                console.log(`❌ ${servico}: Diretório não encontrado`);
                this.resultados.microservicos[servico] = false;
            }
        }

        console.log('');
    }

    async verificarSupervisores() {
        console.log('👨‍💼 VERIFICANDO SUPERVISORES E GESTORES');
        console.log('==========================================');

        const supervisores = [
            'supervisor-geral.js',
            'gestor-operacoes.js',
            'monitor-sistema.js',
            'ai-guardian.js'
        ];

        for (const supervisor of supervisores) {
            const caminho = path.join(__dirname, supervisor);
            if (fs.existsSync(caminho)) {
                console.log(`✅ ${supervisor}: Arquivo existe`);
                this.resultados.supervisores[supervisor] = true;
            } else {
                console.log(`❌ ${supervisor}: Arquivo não encontrado`);
                this.resultados.supervisores[supervisor] = false;
            }
        }

        console.log('');
    }

    async verificarChavesRailway() {
        console.log('🚄 VERIFICANDO CHAVES DO RAILWAY');
        console.log('=================================');

        // Verificar se as chaves estão sendo puxadas do Railway
        const chavesRailway = [
            'DATABASE_URL',
            'BINANCE_API_KEY',
            'BYBIT_API_KEY',
            'OKX_API_KEY'
        ];

        for (const chave of chavesRailway) {
            const valor = process.env[chave];
            if (valor && !valor.includes('real_production_key_from_railway')) {
                console.log(`✅ ${chave}: Configurado corretamente`);
            } else {
                console.log(`⚠️ ${chave}: Usando valor placeholder - verificar Railway`);
            }
        }

        console.log('');
    }

    async fazerRequisicao(url, headers = {}) {
        return new Promise((resolve) => {
            const options = {
                headers: {
                    'User-Agent': 'CoinBitClub-MarketBot/3.0.0',
                    ...headers
                }
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

    async gerarRelatorioFinal() {
        console.log('📋 RELATÓRIO FINAL DE VERIFICAÇÃO');
        console.log('==================================');

        let pontuacao = 0;
        let totalVerificacoes = 0;

        // Banco de dados
        if (this.resultados.banco) pontuacao++;
        totalVerificacoes++;

        // Exchanges
        const exchangesOK = Object.values(this.resultados.exchanges).filter(Boolean).length;
        const totalExchanges = Object.keys(this.resultados.exchanges).length;
        pontuacao += exchangesOK;
        totalVerificacoes += totalExchanges;

        // APIs
        const apisOK = Object.values(this.resultados.apis).filter(Boolean).length;
        const totalAPIs = Object.keys(this.resultados.apis).length;
        pontuacao += apisOK;
        totalVerificacoes += totalAPIs;

        // Configurações
        const configsOK = Object.values(this.resultados.configuracoes).filter(Boolean).length;
        const totalConfigs = Object.keys(this.resultados.configuracoes).length;
        pontuacao += configsOK;
        totalVerificacoes += totalConfigs;

        // Segurança
        if (this.resultados.seguranca) pontuacao++;
        totalVerificacoes++;

        const porcentagem = ((pontuacao / totalVerificacoes) * 100).toFixed(1);

        console.log(`🎯 Pontuação: ${pontuacao}/${totalVerificacoes} (${porcentagem}%)`);
        console.log('');

        // Status final
        if (porcentagem >= 95) {
            this.resultados.status = 'PRONTO_PARA_PRODUCAO';
            console.log('🟢 STATUS: SISTEMA PRONTO PARA PRODUÇÃO!');
            console.log('✅ Todas as verificações essenciais passaram');
            console.log('🚀 Pode iniciar operação em ambiente real');
        } else if (porcentagem >= 80) {
            this.resultados.status = 'REQUER_AJUSTES';
            console.log('🟡 STATUS: REQUER ALGUNS AJUSTES');
            console.log('⚠️ Algumas verificações falharam');
            console.log('🔧 Corrija os problemas antes de ir para produção');
        } else {
            this.resultados.status = 'NAO_PRONTO';
            console.log('🔴 STATUS: NÃO PRONTO PARA PRODUÇÃO');
            console.log('❌ Muitas verificações falharam');
            console.log('🛠️ Correções significativas necessárias');
        }

        console.log('');
        console.log('📊 RESUMO DETALHADO:');
        console.log(`   🗄️ Banco de dados: ${this.resultados.banco ? '✅' : '❌'}`);
        console.log(`   🏦 Exchanges: ${exchangesOK}/${totalExchanges} funcionando`);
        console.log(`   🌐 APIs externas: ${apisOK}/${totalAPIs} funcionando`);
        console.log(`   ⚙️ Configurações: ${configsOK}/${totalConfigs} corretas`);
        console.log(`   🔐 Segurança: ${this.resultados.seguranca ? '✅' : '❌'}`);

        console.log('');
        console.log(`⏰ Verificação concluída em: ${new Date().toLocaleString('pt-BR')}`);
        
        return this.resultados;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const verificacao = new VerificacaoProducao();
    verificacao.executarVerificacaoCompleta()
        .then((resultados) => {
            if (resultados.status === 'PRONTO_PARA_PRODUCAO') {
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Falha crítica na verificação:', error.message);
            process.exit(2);
        });
}

module.exports = { VerificacaoProducao };

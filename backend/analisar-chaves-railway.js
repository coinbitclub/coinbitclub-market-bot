#!/usr/bin/env node

/**
 * 🔍 ANÁLISE COMPLETA DAS CHAVES API RAILWAY
 * 
 * Script para mapear, analisar e testar todas as chaves API
 * configuradas no Railway do projeto CoinBitClub Market Bot
 */

const crypto = require('crypto');

class RailwayKeysAnalyzer {
    constructor() {
        this.foundKeys = new Map();
        this.keyStats = {
            total: 0,
            trading: 0,
            ai: 0,
            payment: 0,
            communication: 0,
            security: 0,
            database: 0,
            configuration: 0
        };
    }

    // Mapear todas as variáveis de ambiente Railway
    mapearVariaveisRailway() {
        console.log('\n🔍 MAPEANDO VARIÁVEIS DE AMBIENTE RAILWAY...\n');

        // Lista completa das variáveis vistas nas screenshots
        const railwayVariables = [
            // Trading APIs
            'BYBIT_API_KEY',
            'BYBIT_SECRET_KEY',
            'BINANCE_API_KEY', 
            'BINANCE_SECRET_KEY',
            'COINSTATS_API_KEY',

            // AI e Machine Learning
            'AI_GUARDIAN_ENABLED',
            'OPENAI_API_KEY',
            'FEAR_GREED_API_URL',

            // Payment Processing
            'STRIPE_PUBLISHABLE_KEY',
            'STRIPE_SECRET_KEY',

            // Communication
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_PHONE_NUMBER',

            // Database
            'DATABASE_URL',
            'DB_POOL_MAX',
            'DB_POOL_MIN',
            'DB_SSL',

            // Security & Auth
            'JWT_SECRET',
            'JWT_EXPIRES_IN',
            'SESSION_SECRET',
            'ENCRYPTION_KEY',
            'WEBHOOK_TOKEN',

            // Application Config
            'NODE_ENV',
            'PORT',
            'BACKEND_URL',
            'FRONTEND_URL',
            'CORS_ORIGIN',
            'HEALTH_CHECK_PATH',

            // Trading Config
            'DEFAULT_LEVERAGE',
            'DEFAULT_RISK_PERCENTAGE',
            'MAX_CONCURRENT_TRADES',
            'RATE_LIMIT_MAX_REQUESTS',
            'RATE_LIMIT_WINDOW_MS',

            // System Config
            'LOG_LEVEL',
            'LOG_FORMAT',
            'METRICS_PATH',
            'MODO_HIBRIDO',
            'SISTEMA_MULTIUSUARIO'
        ];

        // Categorizar e analisar cada variável
        railwayVariables.forEach(varName => {
            const value = process.env[varName];
            const category = this.categorizarVariavel(varName);
            
            this.foundKeys.set(varName, {
                name: varName,
                value: value || 'NÃO CONFIGURADA',
                hasValue: !!value,
                category: category,
                length: value ? value.length : 0,
                masked: value ? this.maskearChave(value) : 'N/A'
            });

            this.keyStats.total++;
            this.keyStats[category]++;
        });

        this.exibirMapeamento();
    }

    categorizarVariavel(varName) {
        if (varName.includes('BYBIT') || varName.includes('BINANCE') || varName.includes('COINSTATS') || 
            varName.includes('LEVERAGE') || varName.includes('RISK') || varName.includes('TRADES')) {
            return 'trading';
        }
        if (varName.includes('OPENAI') || varName.includes('AI_') || varName.includes('FEAR_GREED')) {
            return 'ai';
        }
        if (varName.includes('STRIPE')) {
            return 'payment';
        }
        if (varName.includes('TWILIO')) {
            return 'communication';
        }
        if (varName.includes('JWT') || varName.includes('SECRET') || varName.includes('ENCRYPTION') || varName.includes('WEBHOOK')) {
            return 'security';
        }
        if (varName.includes('DATABASE') || varName.includes('DB_')) {
            return 'database';
        }
        return 'configuration';
    }

    maskearChave(value) {
        if (!value || value.length < 8) return value;
        const start = value.substring(0, 4);
        const end = value.substring(value.length - 4);
        const middle = '*'.repeat(Math.min(value.length - 8, 20));
        return `${start}${middle}${end}`;
    }

    exibirMapeamento() {
        console.log('📊 ESTATÍSTICAS DAS VARIÁVEIS RAILWAY:');
        console.log(`   Total de variáveis: ${this.keyStats.total}`);
        console.log(`   🔄 Trading: ${this.keyStats.trading}`);
        console.log(`   🤖 AI/ML: ${this.keyStats.ai}`);
        console.log(`   💳 Payment: ${this.keyStats.payment}`);
        console.log(`   📱 Communication: ${this.keyStats.communication}`);
        console.log(`   🔒 Security: ${this.keyStats.security}`);
        console.log(`   🗄️ Database: ${this.keyStats.database}`);
        console.log(`   ⚙️ Configuration: ${this.keyStats.configuration}`);

        console.log('\n🔑 DETALHAMENTO POR CATEGORIA:\n');

        // Agrupar por categoria
        const categorizedKeys = {};
        this.foundKeys.forEach((keyInfo, keyName) => {
            if (!categorizedKeys[keyInfo.category]) {
                categorizedKeys[keyInfo.category] = [];
            }
            categorizedKeys[keyInfo.category].push(keyInfo);
        });

        // Exibir cada categoria
        Object.entries(categorizedKeys).forEach(([category, keys]) => {
            console.log(`\n📁 ${category.toUpperCase()}:`);
            keys.forEach(key => {
                const status = key.hasValue ? '✅' : '❌';
                const length = key.hasValue ? `(${key.length} chars)` : '';
                console.log(`   ${status} ${key.name}: ${key.masked} ${length}`);
            });
        });
    }

    // Testar conectividade das APIs críticas
    async testarConectividadeAPIs() {
        console.log('\n🔗 TESTANDO CONECTIVIDADE DAS APIs...\n');

        const testes = [
            this.testarBybit(),
            this.testarBinance(),
            this.testarOpenAI(),
            this.testarStripe(),
            this.testarTwilio()
        ];

        const resultados = await Promise.allSettled(testes);
        
        resultados.forEach((resultado, index) => {
            const nomes = ['Bybit', 'Binance', 'OpenAI', 'Stripe', 'Twilio'];
            if (resultado.status === 'fulfilled') {
                console.log(`✅ ${nomes[index]}: ${resultado.value}`);
            } else {
                console.log(`❌ ${nomes[index]}: ${resultado.reason}`);
            }
        });
    }

    async testarBybit() {
        const apiKey = process.env.BYBIT_API_KEY;
        const secretKey = process.env.BYBIT_SECRET_KEY;

        if (!apiKey || !secretKey) {
            return 'Chaves não configuradas';
        }

        try {
            const timestamp = Date.now().toString();
            const params = `api_key=${apiKey}&recv_window=5000&timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey).update(params).digest('hex');
            
            const response = await fetch(`https://api.bybit.com/v5/market/time?${params}&sign=${signature}`, {
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': '5000',
                    'X-BAPI-SIGN': signature
                }
            });

            const data = await response.json();
            return data.retCode === 0 ? 'Conectado com sucesso' : `Erro: ${data.retMsg}`;
        } catch (error) {
            return `Erro de conexão: ${error.message}`;
        }
    }

    async testarBinance() {
        const apiKey = process.env.BINANCE_API_KEY;
        
        if (!apiKey) {
            return 'Chave não configurada';
        }

        try {
            const response = await fetch('https://api.binance.com/api/v3/ping', {
                headers: { 'X-MBX-APIKEY': apiKey }
            });
            
            return response.ok ? 'Conectado com sucesso' : 'Erro na conexão';
        } catch (error) {
            return `Erro de conexão: ${error.message}`;
        }
    }

    async testarOpenAI() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return 'Chave não configurada';
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.ok ? 'Conectado com sucesso' : `Erro HTTP: ${response.status}`;
        } catch (error) {
            return `Erro de conexão: ${error.message}`;
        }
    }

    async testarStripe() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        
        if (!secretKey) {
            return 'Chave não configurada';
        }

        try {
            const response = await fetch('https://api.stripe.com/v1/balance', {
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            return response.ok ? 'Conectado com sucesso' : `Erro HTTP: ${response.status}`;
        } catch (error) {
            return `Erro de conexão: ${error.message}`;
        }
    }

    async testarTwilio() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        
        if (!accountSid || !authToken) {
            return 'Credenciais não configuradas';
        }

        try {
            const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });
            
            return response.ok ? 'Conectado com sucesso' : `Erro HTTP: ${response.status}`;
        } catch (error) {
            return `Erro de conexão: ${error.message}`;
        }
    }

    // Gerar relatório de configuração
    gerarRelatorioConfiguracao() {
        console.log('\n📋 RELATÓRIO DE CONFIGURAÇÃO RAILWAY:\n');

        const configuradas = Array.from(this.foundKeys.values()).filter(key => key.hasValue);
        const naoConfiguradas = Array.from(this.foundKeys.values()).filter(key => !key.hasValue);

        console.log(`✅ CONFIGURADAS (${configuradas.length}):`);
        configuradas.forEach(key => {
            console.log(`   🔑 ${key.name} [${key.category}] - ${key.length} chars`);
        });

        console.log(`\n❌ NÃO CONFIGURADAS (${naoConfiguradas.length}):`);
        naoConfiguradas.forEach(key => {
            console.log(`   ⚠️ ${key.name} [${key.category}] - MISSING`);
        });

        // Prioridades de configuração
        console.log('\n🚨 PRIORIDADES DE CONFIGURAÇÃO:');
        console.log('   1. CRÍTICA: BYBIT_API_KEY, BYBIT_SECRET_KEY (Trading)');
        console.log('   2. ALTA: DATABASE_URL, JWT_SECRET (Core)');
        console.log('   3. MÉDIA: OPENAI_API_KEY (AI Features)');
        console.log('   4. BAIXA: STRIPE_*, TWILIO_* (Payment/SMS)');

        const percentualConfiguracao = (configuradas.length / this.keyStats.total * 100).toFixed(1);
        console.log(`\n📊 TAXA DE CONFIGURAÇÃO: ${percentualConfiguracao}%`);
    }

    async executarAnaliseCompleta() {
        console.log('🚀 INICIANDO ANÁLISE COMPLETA DAS CHAVES RAILWAY...');
        console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

        // 1. Mapear variáveis
        this.mapearVariaveisRailway();

        // 2. Testar conectividade
        await this.testarConectividadeAPIs();

        // 3. Gerar relatório
        this.gerarRelatorioConfiguracao();

        console.log('\n✅ ANÁLISE CONCLUÍDA!');
    }
}

// Executar análise se chamado diretamente
if (require.main === module) {
    const analyzer = new RailwayKeysAnalyzer();
    analyzer.executarAnaliseCompleta().catch(console.error);
}

module.exports = RailwayKeysAnalyzer;

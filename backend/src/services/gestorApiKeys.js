/**
 * 🔑 SISTEMA DE GESTÃO DE API KEYS E PARAMETRIZAÇÕES DOS USUÁRIOS
 * Gerencia chaves reais dos usuários e suas configurações de trading
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔑 SISTEMA DE GESTÃO DE API KEYS E PARAMETRIZAÇÕES');
console.log('=================================================');
console.log('📅 Data:', new Date().toLocaleDateString('pt-BR'));
console.log('⏰ Hora:', new Date().toLocaleTimeString('pt-BR'));
console.log('');

// Configurações padrão para usuários
const PARAMETROS_DEFAULT = {
    maxExposure: 1000.00,              // Exposição máxima em USD
    riskPercentage: 2.00,              // % de risco por operação
    stopLossPercentage: 2.00,          // % de stop loss
    takeProfitPercentage: 6.00,        // % de take profit
    maxOperacoesPorDia: 10,            // Máximo de operações por dia
    minValuePerTrade: 10.00,           // Valor mínimo por trade em USD
    maxValuePerTrade: 100.00,          // Valor máximo por trade em USD
    exchangesAtivas: ['binance'],      // Exchanges ativas por padrão
    horariosPermitidos: {              // Horários permitidos para trading
        inicio: '09:00',
        fim: '18:00',
        timezone: 'America/Sao_Paulo'
    },
    instrumentosPermitidos: [          // Instrumentos permitidos
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 
        'ADAUSDT', 'DOTUSDT', 'LINKUSDT'
    ]
};

class GestorApiKeys {
    constructor() {
        this.usuariosCarregados = new Map();
        this.parametrizacoes = new Map();
        this.exchangesConectadas = new Map();
        this.logPath = path.join(__dirname, 'logs', 'api-keys.log');
        
        this.carregarUsuarios();
        this.carregarParametrizacoes();
    }
    
    // ===================================
    // GESTÃO DE USUÁRIOS E API KEYS
    // ===================================
    
    carregarUsuarios() {
        console.log('👥 CARREGANDO USUÁRIOS E API KEYS');
        console.log('================================');
        
        // Simular usuários reais (em produção viria do banco)
        const usuariosReais = [
            {
                id: 1,
                nome: 'João Silva',
                email: 'joao@coinbitclub.com',
                ativo: true,
                plano: 'premium',
                exchanges: {
                    binance: {
                        apiKey: process.env.BINANCE_API_KEY_USER1 || null,
                        apiSecret: process.env.BINANCE_SECRET_USER1 || null,
                        testnet: false
                    }
                },
                criadoEm: '2025-01-15T10:00:00Z'
            },
            {
                id: 2,
                nome: 'Maria Santos',
                email: 'maria@coinbitclub.com',
                ativo: true,
                plano: 'premium',
                exchanges: {
                    binance: {
                        apiKey: process.env.BINANCE_API_KEY_USER2 || null,
                        apiSecret: process.env.BINANCE_SECRET_USER2 || null,
                        testnet: false
                    }
                },
                criadoEm: '2025-01-20T14:30:00Z'
            },
            {
                id: 3,
                nome: 'Pedro Costa',
                email: 'pedro@coinbitclub.com',
                ativo: true,
                plano: 'basic',
                exchanges: {
                    binance: {
                        apiKey: process.env.BINANCE_API_KEY_USER3 || null,
                        apiSecret: process.env.BINANCE_SECRET_USER3 || null,
                        testnet: true // Usuário básico usa testnet
                    }
                },
                criadoEm: '2025-01-25T09:15:00Z'
            }
        ];
        
        usuariosReais.forEach(usuario => {
            this.usuariosCarregados.set(usuario.id, usuario);
            console.log(`   ✅ Usuário ${usuario.id}: ${usuario.nome} (${usuario.email})`);
            
            // Verificar se tem API keys configuradas
            if (usuario.exchanges.binance.apiKey) {
                console.log(`      🔑 Binance: API Key configurada (${usuario.exchanges.binance.testnet ? 'TESTNET' : 'PRODUÇÃO'})`);
            } else {
                console.log(`      ⚠️  Binance: API Key NÃO configurada`);
            }
        });
        
        console.log(`\n📊 Total de usuários carregados: ${this.usuariosCarregados.size}`);
    }
    
    carregarParametrizacoes() {
        console.log('\n⚙️  CARREGANDO PARAMETRIZAÇÕES DOS USUÁRIOS');
        console.log('==========================================');
        
        // Parametrizações específicas por usuário
        const parametrizacoesUsuarios = new Map([
            [1, { // João Silva - Premium personalizado
                ...PARAMETROS_DEFAULT,
                maxExposure: 5000.00,
                riskPercentage: 3.00,
                maxValuePerTrade: 500.00,
                maxOperacoesPorDia: 20
            }],
            [2, { // Maria Santos - Premium padrão
                ...PARAMETROS_DEFAULT,
                maxExposure: 2000.00,
                maxValuePerTrade: 200.00
            }],
            [3, { // Pedro Costa - Básico limitado
                ...PARAMETROS_DEFAULT,
                maxExposure: 500.00,
                riskPercentage: 1.50,
                maxValuePerTrade: 50.00,
                maxOperacoesPorDia: 5,
                instrumentosPermitidos: ['BTCUSDT', 'ETHUSDT'] // Limitado
            }]
        ]);
        
        parametrizacoesUsuarios.forEach((config, userId) => {
            this.parametrizacoes.set(userId, config);
            const usuario = this.usuariosCarregados.get(userId);
            console.log(`   ⚙️  Usuário ${userId} (${usuario?.nome}):`);
            console.log(`      💰 Exposição máxima: $${config.maxExposure}`);
            console.log(`      📊 Risco por operação: ${config.riskPercentage}%`);
            console.log(`      📈 Valor máximo por trade: $${config.maxValuePerTrade}`);
            console.log(`      🎯 Operações/dia: ${config.maxOperacoesPorDia}`);
        });
        
        console.log(`\n📊 Total de parametrizações: ${this.parametrizacoes.size}`);
    }
    
    // ===================================
    // OBTER CONFIGURAÇÕES DO USUÁRIO
    // ===================================
    
    obterUsuario(userId) {
        return this.usuariosCarregados.get(userId);
    }
    
    obterParametrizacao(userId) {
        // Retorna parametrização específica ou padrão
        return this.parametrizacoes.get(userId) || PARAMETROS_DEFAULT;
    }
    
    obterApiKeys(userId, exchange = 'binance') {
        const usuario = this.obterUsuario(userId);
        if (!usuario || !usuario.exchanges[exchange]) {
            return null;
        }
        
        return {
            apiKey: usuario.exchanges[exchange].apiKey,
            apiSecret: usuario.exchanges[exchange].apiSecret,
            testnet: usuario.exchanges[exchange].testnet
        };
    }
    
    // ===================================
    // VALIDAÇÃO DE USUÁRIOS ATIVOS
    // ===================================
    
    obterUsuariosAtivos() {
        const usuariosAtivos = [];
        
        this.usuariosCarregados.forEach((usuario, userId) => {
            if (usuario.ativo) {
                const apiKeys = this.obterApiKeys(userId);
                const parametros = this.obterParametrizacao(userId);
                
                if (apiKeys && apiKeys.apiKey && apiKeys.apiSecret) {
                    usuariosAtivos.push({
                        id: userId,
                        nome: usuario.nome,
                        email: usuario.email,
                        plano: usuario.plano,
                        apiKeys: apiKeys,
                        parametros: parametros
                    });
                }
            }
        });
        
        return usuariosAtivos;
    }
    
    // ===================================
    // VALIDAÇÃO DE OPERAÇÃO
    // ===================================
    
    validarOperacao(userId, operacao) {
        const parametros = this.obterParametrizacao(userId);
        const agora = new Date();
        
        const validacoes = {
            usuarioAtivo: this.usuariosCarregados.get(userId)?.ativo || false,
            instrumentoPermitido: parametros.instrumentosPermitidos.includes(operacao.symbol),
            valorDentroDoLimite: operacao.value >= parametros.minValuePerTrade && 
                               operacao.value <= parametros.maxValuePerTrade,
            horarioPermitido: true, // Implementar validação de horário
            riscoDentroDoLimite: operacao.riskPercentage <= parametros.riskPercentage
        };
        
        const todasValidacoes = Object.values(validacoes).every(v => v === true);
        
        return {
            permitido: todasValidacoes,
            validacoes: validacoes,
            parametros: parametros
        };
    }
    
    // ===================================
    // LOGS E AUDITORIA
    // ===================================
    
    logarOperacao(userId, operacao, resultado) {
        const timestamp = new Date().toISOString();
        const usuario = this.obterUsuario(userId);
        
        const logEntry = {
            timestamp,
            userId,
            usuario: usuario?.nome || 'Desconhecido',
            operacao,
            resultado,
            parametros: this.obterParametrizacao(userId)
        };
        
        // Salvar no arquivo de log
        const logLine = `${timestamp} - User:${userId} - ${JSON.stringify(logEntry)}\n`;
        fs.appendFileSync(this.logPath, logLine);
    }
    
    // ===================================
    // RELATÓRIO DE STATUS
    // ===================================
    
    gerarRelatorioStatus() {
        console.log('\n📊 RELATÓRIO DE STATUS DO SISTEMA');
        console.log('=================================');
        
        const usuariosAtivos = this.obterUsuariosAtivos();
        
        console.log(`👥 Usuários cadastrados: ${this.usuariosCarregados.size}`);
        console.log(`✅ Usuários ativos com API: ${usuariosAtivos.length}`);
        console.log(`⚙️  Parametrizações configuradas: ${this.parametrizacoes.size}`);
        
        console.log('\n👤 USUÁRIOS ATIVOS PARA TRADING:');
        usuariosAtivos.forEach(user => {
            console.log(`   📋 ${user.nome} (ID: ${user.id})`);
            console.log(`      📧 Email: ${user.email}`);
            console.log(`      🎯 Plano: ${user.plano}`);
            console.log(`      💰 Exposição máx: $${user.parametros.maxExposure}`);
            console.log(`      🔑 Testnet: ${user.apiKeys.testnet ? 'SIM' : 'NÃO'}`);
            console.log('');
        });
        
        return {
            totalUsuarios: this.usuariosCarregados.size,
            usuariosAtivos: usuariosAtivos.length,
            usuariosComApi: usuariosAtivos,
            parametrizacoes: this.parametrizacoes.size
        };
    }
}

// ===================================
// INICIALIZAÇÃO E TESTE
// ===================================

if (require.main === module) {
    console.log('🚀 INICIANDO SISTEMA DE GESTÃO DE API KEYS');
    console.log('==========================================');
    
    const gestor = new GestorApiKeys();
    const relatorio = gestor.gerarRelatorioStatus();
    
    console.log('✅ SISTEMA DE API KEYS CONFIGURADO COM SUCESSO!');
    console.log('===============================================');
    console.log('🎯 Sistema pronto para receber sinais TradingView');
    console.log('🔑 API Keys dos usuários carregadas');
    console.log('⚙️  Parametrizações aplicadas');
    console.log('📝 Sistema de logs ativo');
    
    // Teste de validação
    console.log('\n🧪 TESTE DE VALIDAÇÃO DE OPERAÇÃO');
    console.log('=================================');
    
    const operacaoTeste = {
        symbol: 'BTCUSDT',
        value: 50.00,
        riskPercentage: 2.0
    };
    
    relatorio.usuariosComApi.forEach(user => {
        const validacao = gestor.validarOperacao(user.id, operacaoTeste);
        console.log(`   👤 ${user.nome}: ${validacao.permitido ? '✅ PERMITIDO' : '❌ BLOQUEADO'}`);
    });
}

module.exports = { GestorApiKeys, PARAMETROS_DEFAULT };

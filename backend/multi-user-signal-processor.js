const { Pool } = require('pg');
const axios = require('axios');
const OpenAI = require('openai');

// IMPORTAR EXECUTORES REAIS
const EnhancedSignalProcessorWithExecution = require('./enhanced-signal-processor-with-execution.js');

// STUBS TEMPORÁRIOS PARA DEPLOY
const SignalHistoryAnalyzer = class { constructor() {} };
const OrderManager = class { constructor() {} };
const MarketDirectionMonitor = class { constructor() {} };
const SignalMetricsMonitor = class { constructor() {} };
const ExchangeKeyValidator = class { constructor() {} };
const BTCDominanceAnalyzer = class { constructor() {} };
const RSIOverheatedMonitor = class { constructor() {} };
const DetailedSignalTracker = class { constructor() {} };

class MultiUserSignalProcessor {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/database',
            ssl: { rejectUnauthorized: false }
        });

        // Configurar OpenAI - SEMPRE usar variável de ambiente
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'your-openai-key-here'
        });

        // INTEGRAR EXECUTOR REAL
        this.realExecutor = new EnhancedSignalProcessorWithExecution();

        console.log('🚀 Multi-User Signal Processor iniciado com EXECUTORES REAIS INTEGRADOS');
        console.log('🔥 Enhanced Signal Processor: ATIVO');
        console.log(`⚡ Trading Real: ${process.env.ENABLE_REAL_TRADING === 'true' ? 'HABILITADO' : 'SIMULAÇÃO'}`);
    }

    async processSignal(signalData) {
        try {
            console.log('📊 Processando sinal com EXECUTOR REAL:', signalData);
            
            // USAR O EXECUTOR REAL PARA PROCESSAR O SINAL
            const resultado = await this.realExecutor.processSignal(signalData);
            
            console.log('✅ Sinal processado pelo executor real:', resultado);
            return { 
                success: true, 
                message: 'Signal processed by real executor',
                executionResult: resultado,
                executorUsed: 'EnhancedSignalProcessorWithExecution',
                tradingMode: process.env.ENABLE_REAL_TRADING === 'true' ? 'REAL' : 'SIMULATION'
            };
            
        } catch (error) {
            console.error('❌ Erro ao processar sinal com executor real:', error.message);
            return { 
                success: false, 
                error: error.message,
                executorUsed: 'EnhancedSignalProcessorWithExecution'
            };
        }
    }
}

module.exports = MultiUserSignalProcessor;

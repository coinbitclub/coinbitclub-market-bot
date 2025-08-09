/**
 * 🎯 MAPEAMENTO COMPLETO DOS SINAIS COINBITCLUB
 * 
 * Baseado no Pine Script "CoinBitClub – Sinal Completo v2"
 * Este arquivo documenta todos os sinais possíveis e suas estruturas
 */

console.log('📊 MAPEAMENTO DOS SINAIS COINBITCLUB TRADINGVIEW');
console.log('===============================================');

// === TIPOS DE SINAIS IDENTIFICADOS ===
const SIGNAL_TYPES = {
    // SINAIS DE ENTRADA
    ENTRY: {
        LONG: 'SINAL LONG',              // Entrada LONG nível médio (0.5%)
        SHORT: 'SINAL SHORT',            // Entrada SHORT nível médio (0.5%)
        LONG_STRONG: 'SINAL LONG FORTE', // Entrada LONG forte (0.8%)
        SHORT_STRONG: 'SINAL SHORT FORTE' // Entrada SHORT forte (0.8%)
    },
    
    // SINAIS DE SAÍDA
    EXIT: {
        CLOSE_LONG: 'FECHE LONG',        // Fechar posição LONG
        CLOSE_SHORT: 'FECHE SHORT'       // Fechar posição SHORT
    },
    
    // SINAIS DE CONFIRMAÇÃO
    CONFIRMATION: {
        CONFIRM_LONG: 'CONFIRMAÇÃO LONG',   // Confirmação de LONG
        CONFIRM_SHORT: 'CONFIRMAÇÃO SHORT'  // Confirmação de SHORT
    }
};

// === ESTRUTURA COMPLETA DO JSON RECEBIDO ===
const EXPECTED_PAYLOAD_STRUCTURE = {
    // Identificação
    ticker: "string",           // Ex: "BTCUSDT"
    time: "string",            // Ex: "2025-07-30 15:30:00"
    
    // Preços e EMAs
    close: "string",           // Preço de fechamento atual
    ema9_30: "string",         // EMA 9 no timeframe 30min
    
    // RSI em diferentes timeframes
    rsi_4h: "string",          // RSI 14 no timeframe 4h
    rsi_15: "string",          // RSI 14 no timeframe 15min
    
    // Momentum e ATR
    momentum_15: "string",     // Momentum 14 no timeframe 15min
    atr_30: "string",          // ATR 14 no timeframe 30min
    atr_pct_30: "string",      // ATR como percentual do preço
    
    // Volume
    vol_30: "string",          // Volume atual
    vol_ma_30: "string",       // Média móvel do volume (14 períodos)
    
    // Diferença BTC vs EMA7 (indicador principal)
    diff_btc_ema7: "string",   // Diferença percentual: ((close - ema7) / ema7) * 100
    
    // Cruzamentos de preço
    cruzou_acima_ema9: "string",  // "1" se cruzou para cima, "0" se não
    cruzou_abaixo_ema9: "string", // "1" se cruzou para baixo, "0" se não
    
    // Cruzamentos de EMAs (Golden/Death Cross)
    golden_cross_30: "string",    // "1" se EMA50 cruzou EMA200 para cima, "0" se não
    death_cross_30: "string",     // "1" se EMA50 cruzou EMA200 para baixo, "0" se não
    
    // Tipo do sinal
    signal: "string"           // Um dos valores de SIGNAL_TYPES
};

// === CONDIÇÕES DE CADA SINAL ===
const SIGNAL_CONDITIONS = {
    "SINAL LONG": {
        description: "Entrada LONG com nível médio de confiança (0.5%)",
        conditions: [
            "Preço cruzou acima da EMA9 E diff_btc_ema7 > 0.5%",
            "OU Golden Cross (EMA50 > EMA200) E diff_btc_ema7 > 0.5%"
        ]
    },
    
    "SINAL SHORT": {
        description: "Entrada SHORT com nível médio de confiança (0.5%)",
        conditions: [
            "Preço cruzou abaixo da EMA9 E diff_btc_ema7 < -0.5%",
            "OU Death Cross (EMA50 < EMA200) E diff_btc_ema7 < -0.5%"
        ]
    },
    
    "SINAL LONG FORTE": {
        description: "Entrada LONG com alta confiança (0.8%)",
        conditions: [
            "Preço cruzou acima da EMA9 E diff_btc_ema7 > 0.8%",
            "OU Golden Cross E diff_btc_ema7 > 0.8%"
        ]
    },
    
    "SINAL SHORT FORTE": {
        description: "Entrada SHORT com alta confiança (0.8%)",
        conditions: [
            "Preço cruzou abaixo da EMA9 E diff_btc_ema7 < -0.8%",
            "OU Death Cross E diff_btc_ema7 < -0.8%"
        ]
    },
    
    "FECHE LONG": {
        description: "Sair de posição LONG",
        conditions: [
            "diff_btc_ema7 < 0.1% (sinal fraco)",
            "OU diff_btc_ema7 < -0.2% (reversão)",
            "OU diff_btc_ema7 > 1.5% (muito forte)",
            "OU preço cruzou abaixo da EMA9",
            "OU Death Cross"
        ]
    },
    
    "FECHE SHORT": {
        description: "Sair de posição SHORT",
        conditions: [
            "diff_btc_ema7 > -0.1% (sinal fraco)",
            "OU diff_btc_ema7 > 0.2% (reversão)",
            "OU diff_btc_ema7 < -1.5% (muito forte)",
            "OU preço cruzou acima da EMA9",
            "OU Golden Cross"
        ]
    },
    
    "CONFIRMAÇÃO LONG": {
        description: "Confirmação de entrada LONG",
        conditions: [
            "Barra anterior: preço cruzou acima EMA9",
            "E diff anterior < 0.5%",
            "E diff atual > 0.5%"
        ]
    },
    
    "CONFIRMAÇÃO SHORT": {
        description: "Confirmação de entrada SHORT",
        conditions: [
            "Barra anterior: preço cruzou abaixo EMA9",
            "E diff anterior > -0.5%",
            "E diff atual < -0.5%"
        ]
    }
};

// === PARÂMETROS IMPORTANTES ===
const PARAMETERS = {
    // Níveis de entrada
    ENTRY_WEAK: 0.3,     // Entrada fraca - mais sinais, maior risco
    ENTRY_MEDIUM: 0.5,   // Entrada média - balanceada (PADRÃO)
    ENTRY_STRONG: 0.8,   // Entrada forte - menos sinais, maior confiança
    
    // Níveis de saída
    EXIT_WEAK: 0.1,      // Saída quando sinal fica fraco
    EXIT_REVERSAL: 0.2,  // Saída quando há reversão
    EXIT_STRONG: 1.5,    // Saída quando sinal fica muito forte
    
    // Timeframes utilizados
    TIMEFRAMES: {
        MAIN: "30min",     // Timeframe principal
        RSI_LONG: "4h",    // RSI de longo prazo
        RSI_SHORT: "15min", // RSI de curto prazo
        MOMENTUM: "15min"   // Momentum
    }
};

// === EXEMPLO DE PAYLOAD REAL ===
const EXAMPLE_PAYLOAD = {
    ticker: "BTCUSDT",
    time: "2025-07-30 15:30:00",
    close: "45123.45",
    ema9_30: "44987.12",
    rsi_4h: "68.54",
    rsi_15: "72.18",
    momentum_15: "234.67",
    atr_30: "1256.78",
    atr_pct_30: "2.78",
    vol_30: "15678.45",
    vol_ma_30: "12456.78",
    diff_btc_ema7: "0.67", // Indicador PRINCIPAL - diff entre preço e EMA7
    cruzou_acima_ema9: "1",
    cruzou_abaixo_ema9: "0",
    golden_cross_30: "0",
    death_cross_30: "0",
    signal: "SINAL LONG"
};

// === PRIORIDADES DOS SINAIS ===
const SIGNAL_PRIORITIES = {
    // ALTA PRIORIDADE - Ação imediata
    HIGH: [
        "SINAL LONG FORTE",
        "SINAL SHORT FORTE",
        "FECHE LONG",
        "FECHE SHORT"
    ],
    
    // MÉDIA PRIORIDADE - Análise recomendada
    MEDIUM: [
        "SINAL LONG",
        "SINAL SHORT"
    ],
    
    // BAIXA PRIORIDADE - Informativo
    LOW: [
        "CONFIRMAÇÃO LONG",
        "CONFIRMAÇÃO SHORT"
    ]
};

// === FUNÇÕES DE VALIDAÇÃO ===
function validateCoinBitClubSignal(payload) {
    const errors = [];
    
    // Validar campos obrigatórios
    const required = ['ticker', 'signal', 'diff_btc_ema7', 'close'];
    required.forEach(field => {
        if (!payload[field]) {
            errors.push(`Campo obrigatório ausente: ${field}`);
        }
    });
    
    // Validar tipo de sinal
    const allSignals = Object.values(SIGNAL_TYPES).flat();
    if (payload.signal && !allSignals.includes(payload.signal)) {
        errors.push(`Tipo de sinal inválido: ${payload.signal}`);
    }
    
    // Validar diff_btc_ema7 (indicador principal)
    if (payload.diff_btc_ema7) {
        const diff = parseFloat(payload.diff_btc_ema7);
        if (isNaN(diff)) {
            errors.push('diff_btc_ema7 deve ser um número');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

function getSignalAction(signal) {
    switch(signal) {
        case 'SINAL LONG':
        case 'SINAL LONG FORTE':
        case 'CONFIRMAÇÃO LONG':
            return 'BUY';
            
        case 'SINAL SHORT':
        case 'SINAL SHORT FORTE':
        case 'CONFIRMAÇÃO SHORT':
            return 'SELL';
            
        case 'FECHE LONG':
            return 'CLOSE_LONG';
            
        case 'FECHE SHORT':
            return 'CLOSE_SHORT';
            
        default:
            return 'UNKNOWN';
    }
}

function getSignalStrength(signal) {
    if (signal.includes('FORTE')) return 'STRONG';
    if (signal.includes('CONFIRMAÇÃO')) return 'CONFIRMATION';
    if (signal.includes('FECHE')) return 'EXIT';
    return 'MEDIUM';
}

// === EXPORTAR CONFIGURAÇÕES ===
module.exports = {
    SIGNAL_TYPES,
    EXPECTED_PAYLOAD_STRUCTURE,
    SIGNAL_CONDITIONS,
    PARAMETERS,
    EXAMPLE_PAYLOAD,
    SIGNAL_PRIORITIES,
    validateCoinBitClubSignal,
    getSignalAction,
    getSignalStrength
};

console.log('\n✅ MAPEAMENTO COMPLETO REALIZADO');
console.log('================================');
console.log(`📊 Total de tipos de sinais: ${Object.values(SIGNAL_TYPES).flat().length}`);
console.log(`🔧 Parâmetros configurados: ${Object.keys(PARAMETERS).length}`);
console.log(`📋 Estrutura com ${Object.keys(EXPECTED_PAYLOAD_STRUCTURE).length} campos mapeados`);
console.log('\n🎯 INDICADOR PRINCIPAL: diff_btc_ema7');
console.log('   • Valores > 0.5%: Sinais de LONG');
console.log('   • Valores < -0.5%: Sinais de SHORT');
console.log('   • Valores > 0.8%: Sinais FORTES');
console.log('   • Base para todas as decisões de entrada/saída');

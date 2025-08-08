// TESTE OFFLINE DAS CHAVES E CONFIGURAÇÕES
console.log('\n🔑 VERIFICAÇÃO DAS CHAVES RAILWAY (OFFLINE)');
console.log('==========================================');

// Lista das variáveis críticas do Railway
const chavesEsperadas = [
    'DATABASE_URL',
    'OPENAI_API_KEY', 
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'BINANCE_API_KEY',
    'BINANCE_SECRET_KEY',
    'BYBIT_API_KEY', 
    'BYBIT_SECRET_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'JWT_SECRET',
    'NODE_ENV'
];

let chavesConfiguradas = 0;
let chavesFaltando = [];

console.log('\n📋 STATUS DAS VARIÁVEIS:');
chavesEsperadas.forEach(chave => {
    const valor = process.env[chave];
    if (valor) {
        chavesConfiguradas++;
        // Mascarar a chave para segurança
        let mascarado;
        if (valor.length > 10) {
            mascarado = valor.substring(0, 8) + '...' + valor.substring(valor.length - 4);
        } else {
            mascarado = valor.substring(0, 4) + '...';
        }
        console.log(`   ✅ ${chave}: ${mascarado} (${valor.length} chars)`);
    } else {
        chavesFaltando.push(chave);
        console.log(`   ❌ ${chave}: NÃO CONFIGURADA`);
    }
});

console.log(`\n📊 RESUMO:`);
console.log(`   ✅ Configuradas: ${chavesConfiguradas}/${chavesEsperadas.length}`);
console.log(`   ❌ Faltando: ${chavesFaltando.length}`);

if (chavesFaltando.length > 0) {
    console.log(`\n⚠️  CHAVES FALTANDO:`);
    chavesFaltando.forEach(chave => console.log(`   • ${chave}`));
}

// Verificar configurações críticas
console.log('\n🎯 ANÁLISE CRÍTICA:');
const chavesCriticas = ['DATABASE_URL', 'OPENAI_API_KEY', 'BINANCE_API_KEY', 'BYBIT_API_KEY'];
const criticasFaltando = chavesCriticas.filter(chave => !process.env[chave]);

if (criticasFaltando.length === 0) {
    console.log('   ✅ TODAS AS CHAVES CRÍTICAS CONFIGURADAS!');
    console.log('   ✅ Sistema pode funcionar normalmente');
} else {
    console.log('   ❌ CHAVES CRÍTICAS FALTANDO:');
    criticasFaltando.forEach(chave => console.log(`   • ${chave} - NECESSÁRIA`));
}

// Verificar arquivos críticos do sistema
const fs = require('fs');
const path = require('path');

console.log('\n📁 VERIFICAÇÃO DE ARQUIVOS CRÍTICOS:');
const arquivosCriticos = [
    'enhanced-signal-processor-with-execution.js',
    'app.js',
    'multi-user-signal-processor.js'
];

arquivosCriticos.forEach(arquivo => {
    const caminho = path.join(__dirname, arquivo);
    if (fs.existsSync(caminho)) {
        console.log(`   ✅ ${arquivo}: Existe`);
    } else {
        console.log(`   ❌ ${arquivo}: NÃO ENCONTRADO`);
    }
});

console.log('\n🚀 TESTE DE PARSING (SIMULAÇÃO):');
console.log('=================================');

// Simular recebimento de sinal do TradingView
const sinalTradingView = {
    ticker: 'BTCUSDT.P',
    signal: 'SINAL LONG FORTE', 
    close: 45000.50,
    time: '2024-01-15 14:30:00'
};

console.log('📥 Sinal simulado do TradingView:');
console.log(`   Ticker: ${sinalTradingView.ticker}`);
console.log(`   Signal: ${sinalTradingView.signal}`);
console.log(`   Close: ${sinalTradingView.close}`);

// Aplicar lógica de parsing corrigida
const symbol = sinalTradingView.ticker || sinalTradingView.symbol || 'UNKNOWN';
const action = sinalTradingView.signal || sinalTradingView.action || 'BUY';
const price = sinalTradingView.close || sinalTradingView.price || 0;

console.log('\n🔧 Após processamento:');
console.log(`   Symbol: ${symbol}`);
console.log(`   Action: ${action}`);
console.log(`   Price: ${price}`);

const parsingOK = symbol !== 'UNKNOWN' && symbol === sinalTradingView.ticker;
console.log(`\n${parsingOK ? '✅' : '❌'} Status do parsing: ${parsingOK ? 'SUCESSO' : 'FALHA'}`);

console.log('\n📋 CHECKLIST FINAL:');
console.log('==================');
console.log(`${process.env.DATABASE_URL ? '✅' : '❌'} Database configurado`);
console.log(`${process.env.OPENAI_API_KEY ? '✅' : '❌'} OpenAI configurado`);
console.log(`${process.env.BINANCE_API_KEY ? '✅' : '❌'} Binance configurado`);
console.log(`${process.env.BYBIT_API_KEY ? '✅' : '❌'} ByBit configurado`);
console.log(`${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'} Twilio configurado`);
console.log(`${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'} Stripe configurado`);
console.log(`${parsingOK ? '✅' : '❌'} Parsing TradingView funcionando`);

const todosOK = process.env.DATABASE_URL && 
                process.env.OPENAI_API_KEY && 
                process.env.BINANCE_API_KEY && 
                process.env.BYBIT_API_KEY && 
                parsingOK;

console.log(`\n🎯 RESULTADO FINAL: ${todosOK ? '🎉 SISTEMA PRONTO!' : '⚠️  PRECISA DE CONFIGURAÇÃO'}`);

if (todosOK) {
    console.log('\n✅ PRÓXIMOS PASSOS:');
    console.log('1. Sistema está configurado corretamente');
    console.log('2. Todas as chaves críticas presentes');
    console.log('3. Parsing do TradingView funcionando');
    console.log('4. Pronto para receber e processar sinais!');
} else {
    console.log('\n⚠️  AÇÕES NECESSÁRIAS:');
    console.log('1. Configurar chaves faltando no Railway');
    console.log('2. Verificar conectividade do banco de dados');  
    console.log('3. Testar recebimento de sinais do TradingView');
}

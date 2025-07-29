/**
 * 🔧 DEBUG - VERIFICAR CHAVES DE PRODUÇÃO
 * Diagnóstico detalhado das chaves reais de produção
 */

require('dotenv').config({ path: '.env.test-mauro-completo' });

console.log('🔧 DEBUG - VERIFICAÇÃO DE CHAVES DE PRODUÇÃO');
console.log('=============================================\n');

// Verificar configurações carregadas
console.log('📋 CONFIGURAÇÕES CARREGADAS:');
console.log('─'.repeat(30));
console.log(`BINANCE_API_KEY: ${process.env.BINANCE_API_KEY ? process.env.BINANCE_API_KEY.substring(0, 8) + '...' : 'NÃO ENCONTRADA'}`);
console.log(`BINANCE_API_SECRET: ${process.env.BINANCE_API_SECRET ? process.env.BINANCE_API_SECRET.substring(0, 8) + '...' : 'NÃO ENCONTRADA'}`);
console.log(`BINANCE_TESTNET: ${process.env.BINANCE_TESTNET}`);
console.log('');
console.log(`BYBIT_API_KEY: ${process.env.BYBIT_API_KEY ? process.env.BYBIT_API_KEY.substring(0, 8) + '...' : 'NÃO ENCONTRADA'}`);
console.log(`BYBIT_API_SECRET: ${process.env.BYBIT_API_SECRET ? process.env.BYBIT_API_SECRET.substring(0, 8) + '...' : 'NÃO ENCONTRADA'}`);
console.log(`BYBIT_TESTNET: ${process.env.BYBIT_TESTNET}`);
console.log('');

console.log('❓ DIAGNÓSTICO:');
console.log('─'.repeat(15));

if (process.env.BINANCE_TESTNET === 'true') {
    console.log('⚠️  BINANCE: Ainda configurado como TESTNET');
    console.log('   Para produção, altere BINANCE_TESTNET=false');
} else {
    console.log('✅ BINANCE: Configurado para PRODUÇÃO');
}

if (process.env.BYBIT_TESTNET === 'true') {
    console.log('⚠️  BYBIT: Ainda configurado como TESTNET');
    console.log('   Para produção, altere BYBIT_TESTNET=false');
} else {
    console.log('✅ BYBIT: Configurado para PRODUÇÃO');
}

console.log('');
console.log('🎯 AÇÕES NECESSÁRIAS:');
console.log('─'.repeat(20));

if (process.env.BINANCE_TESTNET === 'true' || process.env.BYBIT_TESTNET === 'true') {
    console.log('1. ⚙️  Se você tem chaves de PRODUÇÃO:');
    console.log('   - Altere BINANCE_TESTNET=false');
    console.log('   - Altere BYBIT_TESTNET=false');
    console.log('   - Use chaves da conta real das exchanges');
    console.log('');
    console.log('2. ⚙️  Se você quer continuar no TESTNET:');
    console.log('   - Mantenha as configurações atuais');
    console.log('   - Use apenas para testes');
    console.log('');
} else {
    console.log('✅ Configuração parece estar correta para produção');
    console.log('   Verificar se as chaves são realmente de produção');
}

console.log('💡 LEMBRETES IMPORTANTES:');
console.log('─'.repeat(25));
console.log('• Chaves de TESTNET não funcionam em PRODUÇÃO');
console.log('• Chaves de PRODUÇÃO não funcionam em TESTNET');
console.log('• Binance: testnet.binancefuture.com vs fapi.binance.com');
console.log('• Bybit: api-testnet.bybit.com vs api.bybit.com');
console.log('• Sempre verifique restrições de IP nas exchanges');

console.log('\n✅ DEBUG COMPLETO!');
